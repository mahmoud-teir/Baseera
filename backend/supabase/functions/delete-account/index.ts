// «حذف حسابي وبياناتي» — deletes the caller's auth user; all owned rows cascade (profiles,
// user_state, quiz_attempts, certificates, push_tokens). Reports/feedback keep the text but lose the link.
import { admin, callerUser, handle, json } from '../_shared/common.ts';

handle(async (req) => {
  const user = await callerUser(req);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const { error } = await admin().auth.admin.deleteUser(user.id);
  if (error) throw error;
  return json({ deleted: true });
});
