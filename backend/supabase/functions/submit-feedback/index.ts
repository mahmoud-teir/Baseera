// «تواصل معنا» — validates and stores a message for the team. Direct table inserts are closed;
// rate limits: 5 messages per client per 10 minutes, and 200 per hour in total.
import { admin, callerUser, clientKey, handle, json, readJson } from '../_shared/common.ts';

handle(async (req) => {
  const body = await readJson(req);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const contact = typeof body?.contact === 'string' ? body.contact.trim() : '';
  if (message.length < 5 || message.length > 4000 || contact.length > 200) return json({ error: 'invalid' }, 400);

  const user = await callerUser(req);
  const clientHash = await clientKey(req, user?.id);
  const db = admin();
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await db.from('feedback').select('id', { count: 'exact', head: true }).eq('client_hash', clientHash).gte('created_at', since);
  if ((count ?? 0) >= 5) return json({ error: 'rate_limited' }, 429);
  const hour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: total } = await db.from('feedback').select('id', { count: 'exact', head: true }).gte('created_at', hour);
  if ((total ?? 0) >= 200) return json({ error: 'rate_limited' }, 429);

  const { error } = await db.from('feedback').insert({ message, contact: contact || null, user_id: user?.id ?? null, client_hash: clientHash });
  if (error) throw error;
  return json({ ok: true });
});
