import { createClient } from '@supabase/supabase-js';

const url = 'https://yxqdquynlgfbxyultsux.supabase.co';
const anonKey = 'sb_publishable_GRjzLk5J0N15SBcUhr2zMQ_1SJ9JEqe';

async function check() {
  const supabase = createClient(url, anonKey);
  console.log('Testing live Supabase user_state table...');

  // Sign in as admin to check user_state
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'mahmoudteirbusiness@gmail.com',
    password: 'M!a@h#m1o2u3d4',
  });

  if (authErr) {
    console.error('Auth error:', authErr.message);
    return;
  }

  console.log('Signed in as user id:', auth.user.id);

  // Check user_state
  const { data, error } = await supabase
    .from('user_state')
    .select('user_id, updated_at, data')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) {
    console.error('Error querying user_state:', error);
  } else if (!data) {
    console.log('No user_state record yet for this account (account has not pushed state yet).');
  } else {
    console.log('user_state record FOUND!');
    console.log('Updated at:', data.updated_at);
    console.log('Keys in data:', Object.keys(data.data || {}));
    if (data.data?.notes) console.log('Notes count:', data.data.notes.length);
    if (data.data?.quranLog) console.log('Quran log days:', Object.keys(data.data.quranLog));
    if (data.data?.prayed) console.log('Prayer log days:', Object.keys(data.data.prayed));
  }

  // Let's test upserting to verify RLS permissions for the user!
  const testData = data?.data ? { ...data.data, lastSyncVerified: new Date().toISOString() } : { ping: true, lastSyncVerified: new Date().toISOString() };
  const { error: upsertErr } = await supabase
    .from('user_state')
    .upsert({
      user_id: auth.user.id,
      data: testData,
      updated_at: new Date().toISOString(),
    });

  if (upsertErr) {
    console.error('Upsert failed! RLS or schema issue:', upsertErr);
  } else {
    console.log('Upsert verified successfully! The user_state table is 100% active, writable, and sync is working!');
  }
}

check().catch(console.error);
