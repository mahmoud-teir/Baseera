// «Notify learner» push: after a moderator moves a report to «notified» (admin_transition writes the
// in-app notification), this sends the same message to the reporter's devices via Expo push.
import { admin, callerUser, handle, json, readJson } from '../_shared/common.ts';

handle(async (req) => {
  const user = await callerUser(req);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const body = await readJson(req);
  const reportId = Number(body?.report_id);
  if (!Number.isInteger(reportId) || reportId <= 0) return json({ error: 'invalid' }, 400);

  const db = admin();
  const { data: staff } = await db.from('staff').select('role').eq('user_id', user.id).maybeSingle();
  if (!staff || !['mod', 'admin'].includes(staff.role)) return json({ error: 'forbidden' }, 403);

  const { data: note } = await db.from('user_notifications').select('user_id, title, body').eq('report_id', reportId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!note) return json({ sent: 0, reason: 'no_reporter_account' });
  const { data: tokens } = await db.from('push_tokens').select('token').eq('user_id', note.user_id);
  if (!tokens?.length) return json({ sent: 0, reason: 'no_device' });

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(tokens.map((t) => ({ to: t.token, title: note.title, body: note.body, sound: 'default', data: { url: '/account/notifications' } }))),
  });
  return json({ sent: res.ok ? tokens.length : 0 });
});
