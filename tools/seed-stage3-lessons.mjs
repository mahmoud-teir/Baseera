/**
 * Seed and Publish Stage 3 Curriculum (15 lessons + evidences) into Supabase
 * Dual-scholar approval workflow triggers status = 'published' and populates 'lesson_keys'.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { DEFAULT_STAGE3_LESSONS } from '../src/data/stage3Lessons.ts';

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
const scholarEmail = 'scholar.baseerah@gmail.com';
const scholarPass = 'S!c@h#o1l2a3r4';

async function main() {
  console.log('Connecting to Supabase at:', url);
  const adminClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const scholarClient = createClient(url, anonKey, { auth: { persistSession: false } });

  const { error: adminAuthErr } = await adminClient.auth.signInWithPassword({ email: adminEmail, password: adminPass });
  if (adminAuthErr) throw new Error('Admin auth failed: ' + adminAuthErr.message);

  const { error: scholarAuthErr } = await scholarClient.auth.signInWithPassword({ email: scholarEmail, password: scholarPass });
  if (scholarAuthErr) throw new Error('Scholar auth failed: ' + scholarAuthErr.message);

  console.log('Authenticated both Admin and Scholar successfully!');
  console.log(`Processing ${DEFAULT_STAGE3_LESSONS.length} Stage 3 lessons...`);

  for (const l of DEFAULT_STAGE3_LESSONS) {
    const lessonData = {
      title: l.title,
      minutes: l.minutes,
      objectives: l.objectives,
      sections: l.sections,
      summary: l.summary,
      quiz: l.quiz,
    };

    console.log(`\n--- Seeding [${l.code}]: ${l.title} ---`);

    // 1. Save draft
    const { data: lessonId, error: draftErr } = await adminClient.rpc('admin_save_draft', {
      p_kind: 'lesson',
      p_slot: l.code,
      p_data: lessonData,
    });

    if (draftErr) {
      console.error(`  [!] Error drafting ${l.code}:`, draftErr.message);
      continue;
    }

    // 2. Transition: draft -> review
    await adminClient.rpc('admin_transition', { p_kind: 'ct', p_id: lessonId, p_action: 'send' });

    // 3. Approval 1 (Admin)
    const { error: app1Err } = await adminClient.rpc('admin_transition', { p_kind: 'ct', p_id: lessonId, p_action: 'approve' });
    if (app1Err) {
      console.error(`  [!] Approval 1 failed for ${l.code}:`, app1Err.message);
      continue;
    }

    // 4. Approval 2 (Scholar) -> Sets status = 'published' and updates lesson_keys
    const { data: status, error: app2Err } = await scholarClient.rpc('admin_transition', { p_kind: 'ct', p_id: lessonId, p_action: 'approve' });
    if (app2Err) {
      console.error(`  [!] Approval 2 failed for ${l.code}:`, app2Err.message);
    } else {
      console.log(`  ✓ Published lesson [${l.code}]! Status: ${status}`);
    }

    // 5. Evidence cards
    for (let i = 0; i < l.evidence.length; i++) {
      const ev = l.evidence[i];
      const evSlot = `${l.code}/e${i + 1}`;
      const { data: evId, error: evDraftErr } = await adminClient.rpc('admin_save_draft', {
        p_kind: 'evidence',
        p_slot: evSlot,
        p_data: ev,
      });

      if (evDraftErr) {
        console.warn(`    [!] Evidence draft error ${evSlot}:`, evDraftErr.message);
        continue;
      }

      await adminClient.rpc('admin_transition', { p_kind: 'ct', p_id: evId, p_action: 'send' });
      await adminClient.rpc('admin_transition', { p_kind: 'ct', p_id: evId, p_action: 'approve' });
      console.log(`    ✓ Published evidence [${evSlot}]`);
    }
  }

  // Verification
  const { data: publishedLessons } = await adminClient.from('published_content').select('slot').eq('kind', 'lesson');
  const { data: lessonKeys } = await adminClient.from('lesson_keys').select('code, stage');

  console.log('\n=============================================');
  console.log(`🎉 LIVE STAGE 3 SUMMARY:`);
  console.log(`- Total Published Lessons: ${publishedLessons?.length || 0}`);
  console.log(`- Total Registered Lesson Keys: ${lessonKeys?.length || 0}`);
  const stage3Keys = lessonKeys?.filter((k) => k.stage === 3);
  console.log(`- Stage 3 Lesson Keys: ${stage3Keys?.length || 0}`);
  console.log('=============================================');
}

main().catch(console.error);
