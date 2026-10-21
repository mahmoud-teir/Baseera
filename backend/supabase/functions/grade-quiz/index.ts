// Server-side quiz grading. The answer keys live only in `lesson_keys` (no client access), so
// passed lessons recorded here are trustworthy for certificate issuance.
import { admin, callerUser, handle, json, readJson } from '../_shared/common.ts';

handle(async (req) => {
  const user = await callerUser(req);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const body = await readJson(req);
  const code = typeof body?.code === 'string' ? body.code : '';
  const answers = Array.isArray(body?.answers) ? body!.answers : null;
  if (!/^[A-Z]{2}-\d{2}$/.test(code) || !answers || answers.length > 100 || !answers.every((a) => a === null || (Number.isInteger(a) && a >= 0 && a < 10))) {
    return json({ error: 'invalid' }, 400);
  }
  const db = admin();
  const { data: key, error } = await db.from('lesson_keys').select('answers, pass_pct').eq('code', code).maybeSingle();
  if (error) throw error;
  if (!key) return json({ error: 'unknown_lesson' }, 404);
  const total = key.answers.length;
  const right = key.answers.filter((a: number, i: number) => answers[i] === a).length;
  const pct = Math.round((right / total) * 100);
  const passed = pct >= key.pass_pct;
  const { error: insErr } = await db.from('quiz_attempts').insert({ user_id: user.id, code, answers: answers.map((a) => (a === null ? -1 : a)), pct, passed });
  if (insErr) throw insErr;
  return json({ pct, passed, right, total });
});
