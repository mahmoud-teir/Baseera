import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let url = process.env.EXPO_PUBLIC_SUPABASE_URL;
let anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url) {
  try {
    const envFile = readFileSync(resolve('.env.local'), 'utf8');
    for (const line of envFile.split('\n')) {
      const [k, v] = line.split('=');
      if (k?.trim() === 'EXPO_PUBLIC_SUPABASE_URL') url = v?.trim();
      if (k?.trim() === 'EXPO_PUBLIC_SUPABASE_ANON_KEY') anonKey = v?.trim();
    }
  } catch {}
}

const adminEmail = 'mahmoudteirbusiness@gmail.com';
const adminPass = 'M!a@h#m1o2u3d4';

const client = createClient(url, anonKey);

async function testMediaUpload() {
  await client.auth.signInWithPassword({ email: adminEmail, password: adminPass });
  const testBuffer = Buffer.from('test apk file');
  const { data, error } = await client.storage
    .from('media')
    .upload('test.txt', testBuffer, { upsert: true });

  console.log('Upload to media bucket:', { data, error });
}

testMediaUpload().catch(console.error);
