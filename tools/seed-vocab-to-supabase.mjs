/**
 * Seeds DEFAULT_VOCAB items into Supabase `content_items` as published content.
 * Supports two authentication modes:
 * 1. Service Role Key:
 *      $env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
 *      node tools/seed-vocab-to-supabase.mjs
 * 2. Staff Credentials:
 *      $env:ADMIN_EMAIL = "admin@example.com"
 *      $env:ADMIN_PASSWORD = "password"
 *      node tools/seed-vocab-to-supabase.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read .env.local for URL if not in process.env
let url = process.env.EXPO_PUBLIC_SUPABASE_URL;
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
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

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

async function seed() {
  if (!url) {
    console.error('Error: EXPO_PUBLIC_SUPABASE_URL is required.');
    process.exit(1);
  }

  const { DEFAULT_VOCAB } = await import('../src/data/defaults.ts');
  console.log(`Connecting to Supabase at: ${url}`);
  console.log(`Found ${DEFAULT_VOCAB.length} vocabulary items to seed.`);

  if (serviceKey) {
    console.log('Using Service Role Key authentication...');
    const sb = createClient(url, serviceKey);
    for (const item of DEFAULT_VOCAB) {
      const row = {
        kind: 'vocab',
        slot: item.id,
        title: item.word,
        category: item.category,
        source: item.ayahs[0]?.source || 'القرآن الكريم وأمهات التفاسير',
        data: item,
        published_data: item,
        published_at: new Date().toISOString(),
        status: 'published',
        approvals: [],
        approver_names: ['هيئة التدقيق العلمي'],
      };
      const { error } = await sb.from('content_items').upsert(row, { onConflict: 'kind,slot' });
      if (error) {
        console.warn(`Failed to seed ${item.word} (${item.id}):`, error.message);
      } else {
        console.log(`✓ Seeded & Published: ${item.word} [${item.id}]`);
      }
    }
  } else if (email && password) {
    console.log(`Authenticating with staff user: ${email}...`);
    const sb = createClient(url, anonKey || '');
    const { data: auth, error: authErr } = await sb.auth.signInWithPassword({ email, password });
    if (authErr) {
      console.error('Authentication failed:', authErr.message);
      process.exit(1);
    }
    console.log('Authenticated successfully.');

    for (const item of DEFAULT_VOCAB) {
      // 1. Save draft
      const { data: id, error: draftErr } = await sb.rpc('admin_save_draft', {
        p_kind: 'vocab',
        p_slot: item.id,
        p_data: item,
      });
      if (draftErr) {
        console.warn(`Draft error for ${item.word}:`, draftErr.message);
        continue;
      }

      // 2. Send for review
      await sb.rpc('admin_transition', { p_kind: 'ct', p_id: id, p_action: 'send' });

      // 3. Approve & publish
      const { data: status, error: appErr } = await sb.rpc('admin_transition', {
        p_kind: 'ct',
        p_id: id,
        p_action: 'approve',
      });
      if (appErr) {
        console.warn(`Approval error for ${item.word}:`, appErr.message);
      } else {
        console.log(`✓ Published via CMS RPC: ${item.word} [status: ${status}]`);
      }
    }
  } else {
    console.log('\n[INFO] To seed/publish directly to Supabase server:');
    console.log('Option 1: Provide SUPABASE_SERVICE_ROLE_KEY');
    console.log('   $env:SUPABASE_SERVICE_ROLE_KEY="..."; node tools/seed-vocab-to-supabase.mjs\n');
    console.log('Option 2: Provide Admin/Staff credentials');
    console.log('   $env:ADMIN_EMAIL="..."; $env:ADMIN_PASSWORD="..."; node tools/seed-vocab-to-supabase.mjs\n');
  }

  console.log('Done.');
}

seed().catch(console.error);
