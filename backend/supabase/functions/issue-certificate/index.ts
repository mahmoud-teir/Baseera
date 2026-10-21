// Issues a stage certificate after re-checking, server-side, that every lesson of the stage has a
// passed attempt graded by `grade-quiz`, and that the stage's full lesson count is published.
import { admin, callerUser, handle, json, readJson } from '../_shared/common.ts';

function code(stage: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const s = [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
  return `BSR-${stage}-${s.slice(0, 4)}-${s.slice(4)}`;
}

handle(async (req) => {
  const user = await callerUser(req);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const body = await readJson(req);
  const stage = Number(body?.stage);
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 60) : '';
  if (![1, 2, 3].includes(stage) || !name) return json({ error: 'invalid' }, 400);

  const db = admin();
  const existing = await db.from('certificates').select('code, name, issued_at').eq('user_id', user.id).eq('stage', stage).maybeSingle();
  if (existing.data) return json(existing.data);

  const [{ data: req1 }, { data: keys }, { data: passed }] = await Promise.all([
    db.from('stage_requirements').select('lessons').eq('stage', stage).maybeSingle(),
    db.from('lesson_keys').select('code').eq('stage', stage),
    db.from('quiz_attempts').select('code').eq('user_id', user.id).eq('passed', true),
  ]);
  const required = req1?.lessons ?? 0;
  const codes = (keys ?? []).map((k) => k.code);
  const done = new Set((passed ?? []).map((p) => p.code));
  if (!required || codes.length < required || !codes.every((c) => done.has(c))) {
    return json({ error: 'not_complete', required, published: codes.length, passed: codes.filter((c) => done.has(c)).length }, 403);
  }

  for (let i = 0; i < 3; i++) {
    const c = code(stage);
    const { data, error } = await db.from('certificates').insert({ code: c, user_id: user.id, stage, name }).select('code, name, issued_at').single();
    if (!error) return json(data);
    if (!String(error.message).includes('duplicate')) throw error;
  }
  return json({ error: 'internal' }, 500);
});
