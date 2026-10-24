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

const adminEmail = process.env.ADMIN_EMAIL || 'mahmoudteirbusiness@gmail.com';
const adminPass = process.env.ADMIN_PASSWORD || 'M!a@h#m1o2u3d4';
const scholarEmail = process.env.SCHOLAR_EMAIL || 'scholar.baseerah@gmail.com';
const scholarPass = process.env.SCHOLAR_PASSWORD || 'S!c@h#o1l2a3r4';

async function seed() {
  const { DEFAULT_ISLAMIC_TERMS } = await import('../src/data/islamicTermsData.ts');
  console.log(`[Terms Seeder] Connecting to Supabase at: ${url}`);
  console.log(`[Terms Seeder] Seeding ${DEFAULT_ISLAMIC_TERMS.length} classical Islamic terms...`);

  const adminClient = createClient(url, anonKey);
  const scholarClient = createClient(url, anonKey);

  const { error: aErr } = await adminClient.auth.signInWithPassword({ email: adminEmail, password: adminPass });
  if (aErr) throw new Error(`Admin sign in failed: ${aErr.message}`);

  const { error: sErr } = await scholarClient.auth.signInWithPassword({ email: scholarEmail, password: scholarPass });
  if (sErr) throw new Error(`Scholar sign in failed: ${sErr.message}`);

  console.log('✓ Successfully authenticated Admin & Scholar staff accounts.');

  // Format as classical dictionary book in CMS
  const bookPayload = {
    id: 'islamic-terms-glossary',
    title: 'معجم المصطلحات الشرعية (لغةً واصطلاحاً)',
    author: 'الشريف الجرجاني ونخبة من أئمة الإسلام',
    source: 'كتاب التعريفات للجرجاني / لسان العرب / مجموع الفتاوى لابن تيمية',
    category: 'المصطلحات والمعاجم الشرعية',
    url: 'https://baseerah.app/terms',
    pages: DEFAULT_ISLAMIC_TERMS.length,
    chapters: DEFAULT_ISLAMIC_TERMS.map((t) => ({
      title: t.term,
      paragraphs: [
        `لغةً: ${t.linguisticDef} [المرجع: ${t.linguisticSource}]`,
        `اصطلاحاً: ${t.terminologicalDef} [المرجع: ${t.scholarlySource}]`,
        t.distinctionNote ? `الضابط والفائدة: ${t.distinctionNote}` : '',
      ].filter(Boolean),
    })),
    terms: DEFAULT_ISLAMIC_TERMS, // embed the structured items
    updatedAt: new Date().toISOString(),
  };

  console.log('Saving draft with p_kind: book, p_slot: islamic-terms-glossary...');
  const { data: draftId, error: draftErr } = await adminClient.rpc('admin_save_draft', {
    p_kind: 'book',
    p_slot: 'islamic-terms-glossary',
    p_data: bookPayload,
  });

  if (draftErr) {
    console.error('Draft error:', draftErr.message);
    process.exit(1);
  }

  console.log(`✓ Draft saved. ID: ${draftId}. Sending to review...`);
  await adminClient.rpc('admin_transition', { p_kind: 'ct', p_id: draftId, p_action: 'send' });

  console.log('Approving as admin...');
  const { data: status1, error: app1Err } = await adminClient.rpc('admin_transition', {
    p_kind: 'ct',
    p_id: draftId,
    p_action: 'approve',
  });

  if (app1Err) console.error('Admin approval error:', app1Err.message);

  if (status1 !== 'published') {
    console.log(`Status after admin approval: ${status1}. Approving as scholar...`);
    const { data: status2, error: app2Err } = await scholarClient.rpc('admin_transition', {
      p_kind: 'ct',
      p_id: draftId,
      p_action: 'approve',
    });
    if (app2Err) console.error('Scholar approval error:', app2Err.message);
    console.log(`✓ Status after scholar approval: ${status2}`);
  } else {
    console.log(`✓ Status: ${status1}`);
  }

  // Verify by reading published_content with anon client
  console.log('\nVerifying published_content view with anonymous public client...');
  const anonClient = createClient(url, anonKey);
  const { data: pubData, error: pubErr } = await anonClient
    .from('published_content')
    .select('*')
    .eq('slot', 'islamic-terms-glossary')
    .maybeSingle();

  if (pubErr) {
    console.error('Public read error:', pubErr.message);
  } else if (pubData) {
    const termsCount = pubData.data?.terms?.length || 0;
    console.log(`🎉 SUCCESS! Verified from Supabase server! Found ${termsCount} terms published live in published_content!`);
  } else {
    console.log('Slot islamic-terms-glossary not found in published_content.');
  }
}

seed().catch(console.error);
