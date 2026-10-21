// Public certificate lookup by verification code (returns only what is printed on the certificate).
import { admin, handle, json, readJson } from '../_shared/common.ts';

handle(async (req) => {
  const body = await readJson(req);
  const c = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!/^BSR-[1-3]-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c)) return json({ valid: false });
  const { data } = await admin().from('certificates').select('name, stage, issued_at').eq('code', c).maybeSingle();
  return json(data ? { valid: true, ...data } : { valid: false });
});
