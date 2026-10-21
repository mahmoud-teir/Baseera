// «أبلغ عن خطأ» — validates and stores an error report for the review team.
// Rate limits: 10 reports per client per 10 minutes (client = user id or hashed IP), and at most
// 300 reports per hour in total as a ceiling against distributed floods.
import { admin, callerUser, clientKey, handle, json, readJson } from '../_shared/common.ts';

const REASONS = ['خطأ في النص', 'مصدر أو تخريج غير صحيح', 'خطأ إملائي أو لغوي', 'محتوى غير مناسب', 'أخرى'];

handle(async (req) => {
  const body = await readJson(req);
  const where = typeof body?.where === 'string' ? body.where.trim() : '';
  const reason = typeof body?.reason === 'string' ? body.reason : '';
  const note = typeof body?.note === 'string' ? body.note.trim() : '';
  if (!where || where.length > 300 || !REASONS.includes(reason) || note.length > 2000) return json({ error: 'invalid' }, 400);

  const user = await callerUser(req);
  const clientHash = await clientKey(req, user?.id);
  const db = admin();
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await db.from('reports').select('id', { count: 'exact', head: true }).eq('client_hash', clientHash).gte('created_at', since);
  if ((count ?? 0) >= 10) return json({ error: 'rate_limited' }, 429);
  const hour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: total } = await db.from('reports').select('id', { count: 'exact', head: true }).gte('created_at', hour);
  if ((total ?? 0) >= 300) return json({ error: 'rate_limited' }, 429);

  const { data, error } = await db
    .from('reports')
    .insert({ where_text: where, reason, note, user_id: user?.id ?? null, client_hash: clientHash })
    .select('id')
    .single();
  if (error) throw error;
  return json({ id: data.id });
});
