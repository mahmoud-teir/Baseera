/**
 * Uploads and publishes all 12 Classical Library Textbooks and 19 Knowledge Map Nodes
 * directly to the Supabase production database via staff CMS RPCs.
 */
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

const MAP_NODES_DATA = [
  {
    slot: 'tawheed',
    links: [
      { label: 'دروس العقيدة والتوحيد', target: '/academy/subject/aqeedah' },
      { label: 'كتاب التوحيد في المكتبة', target: '/book/kitab-at-tawheed' },
      { label: 'الأدلة الشرعية', target: '/sharia' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
  {
    slot: 'aqeedah',
    links: [
      { label: 'دروس العقيدة والتوحيد', target: '/academy/subject/aqeedah' },
      { label: 'ثلاثة الأصول في المكتبة', target: '/book/usul-ath-thalatha' },
      { label: 'الأدلة الشرعية', target: '/sharia' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
  {
    slot: 'taharah',
    links: [
      { label: 'دروس الفقه (الطهارة)', target: '/academy/subject/fiqh' },
      { label: 'عمدة الفقه في المكتبة', target: '/book/umdat-al-fiqh' },
      { label: 'أحكام العبادات الشرعية', target: '/sharia' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
  {
    slot: 'recite',
    links: [
      { label: 'دروس القرآن والتفسير', target: '/academy/subject/tafsir' },
      { label: 'تفسير السعدي في المكتبة', target: '/book/tafsir-as-saadi' },
      { label: 'أحكام التجويد', target: '/quran/tajweed' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
  {
    slot: 'hadith',
    links: [
      { label: 'دروس الحديث النبوي', target: '/academy/subject/hadith' },
      { label: 'الأربعون النووية في المكتبة', target: '/book/arbaeen-nawawiyyah' },
      { label: 'الأدلة النبوية', target: '/sharia' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
  {
    slot: 'salah',
    links: [
      { label: 'دروس الفقه (الصلاة)', target: '/academy/subject/fiqh' },
      { label: 'منهاج السالكين في المكتبة', target: '/book/minhaj-as-salikeen' },
      { label: 'أحكام الصلاة الشرعية', target: '/sharia' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
  {
    slot: 'tajweed',
    links: [
      { label: 'أحكام التجويد العملية', target: '/quran/tajweed' },
      { label: 'تفسير السعدي في المكتبة', target: '/book/tafsir-as-saadi' },
      { label: 'مفردات القرآن الكريم', target: '/quran/vocab' },
      { label: 'المواد الصوتية والتلاوات', target: '/library' },
    ],
  },
  {
    slot: 'seerah',
    links: [
      { label: 'دروس السيرة النبوية', target: '/academy/subject/seerah' },
      { label: 'سيرة ابن كثير في المكتبة', target: '/book/seerah-ibn-kathir' },
      { label: 'قصص الأنبياء', target: '/stories' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
  {
    slot: 'zakat',
    links: [
      { label: 'دروس الفقه (الزكاة)', target: '/academy/subject/fiqh' },
      { label: 'عمدة الفقه في المكتبة', target: '/book/umdat-al-fiqh' },
      { label: 'أحكام الزكاة والصدقات', target: '/sharia' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
  {
    slot: 'siyam',
    links: [
      { label: 'دروس الفقه (الصيام)', target: '/academy/subject/fiqh' },
      { label: 'عمدة الفقه في المكتبة', target: '/book/umdat-al-fiqh' },
      { label: 'مسار الصيام الرمضاني', target: '/paths' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
  {
    slot: 'tafsir',
    links: [
      { label: 'دروس القرآن والتفسير', target: '/academy/subject/tafsir' },
      { label: 'تفسير السعدي في المكتبة', target: '/book/tafsir-as-saadi' },
      { label: 'مفردات القرآن الكريم', target: '/quran/vocab' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
  {
    slot: 'mustalah',
    links: [
      { label: 'دروس مصطلح الحديث', target: '/academy/subject/hadith' },
      { label: 'المنظومة البيقونية في المكتبة', target: '/book/manzumat-al-bayquniyyah' },
      { label: 'قواعد قبول الأخبار', target: '/sharia' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
  {
    slot: 'muamalat',
    links: [
      { label: 'مقرر فقه المعاملات المالية', target: '/academy/locked/2' },
      { label: 'منهاج السالكين في المكتبة', target: '/book/minhaj-as-salikeen' },
      { label: 'أحكام البيوع والعقود', target: '/sharia' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
  {
    slot: 'hajj',
    links: [
      { label: 'دروس الفقه (الحج والعمرة)', target: '/academy/subject/fiqh' },
      { label: 'عمدة الفقه في المكتبة', target: '/book/umdat-al-fiqh' },
      { label: 'مناسك الحج خطوة بخطوة', target: '/paths' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
  {
    slot: 'arabic',
    links: [
      { label: 'مقرر اللغة العربية والنحو', target: '/academy/locked/2' },
      { label: 'متن الآجرومية في المكتبة', target: '/book/al-ajrumiyyah' },
      { label: 'مفردات القرآن والبيان', target: '/quran/vocab' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
  {
    slot: 'mawarith',
    links: [
      { label: 'مقرر علم المواريث والفرائض', target: '/academy/locked/2' },
      { label: 'متن الرحبية في المكتبة', target: '/book/ar-rahbiyyah' },
      { label: 'أحكام التركات والفروض', target: '/sharia' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
  {
    slot: 'ahwal',
    links: [
      { label: 'مقرر فقه الأسرة والأحوال', target: '/academy/locked/2' },
      { label: 'منهاج السالكين في المكتبة', target: '/book/minhaj-as-salikeen' },
      { label: 'أحكام النكاح والأسرة', target: '/sharia' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
  {
    slot: 'usul',
    links: [
      { label: 'مقرر أصول الفقه واستنباط الأحكام', target: '/academy/locked/2' },
      { label: 'متن الورقات في المكتبة', target: '/book/al-waraqat' },
      { label: 'قواعد دلالات الألفاظ والمقاصد', target: '/sharia' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
  {
    slot: 'qada',
    links: [
      { label: 'مقرر أدب القضاء والدعاوى', target: '/academy/locked/2' },
      { label: 'منهاج السالكين في المكتبة', target: '/book/minhaj-as-salikeen' },
      { label: 'أحكام البينات والشهادات', target: '/sharia' },
      { label: 'المواد الصوتية', target: '/library' },
    ],
  },
];

async function main() {
  console.log(`Connecting to Supabase at: ${url}`);
  const adminClient = createClient(url, anonKey);
  const scholarClient = createClient(url, anonKey);

  const { error: aErr } = await adminClient.auth.signInWithPassword({ email: adminEmail, password: adminPass });
  if (aErr) throw new Error(`Admin sign in failed: ${aErr.message}`);

  const { error: sErr } = await scholarClient.auth.signInWithPassword({ email: scholarEmail, password: scholarPass });
  if (sErr) throw new Error(`Scholar sign in failed: ${sErr.message}`);

  console.log('✓ Successfully authenticated Admin & Scholar staff accounts.');

  // 1. Upload & Publish 12 Classical Library Textbooks
  const { DEFAULT_LIBRARY } = await import('../src/data/libraryData.ts');
  console.log(`\n📚 Uploading and publishing ${DEFAULT_LIBRARY.length} Classical Textbooks to Supabase...`);

  for (const b of DEFAULT_LIBRARY) {
    const bookData = {
      ...b,
      url: b.url || `https://baseerah.app/books/${b.id}`,
    };

    const { data: draftId, error: dErr } = await adminClient.rpc('admin_save_draft', {
      p_kind: 'book',
      p_slot: b.id,
      p_data: bookData,
    });
    if (dErr) {
      console.error(`  [!] Draft error for book ${b.id}:`, dErr.message);
      continue;
    }

    const { error: sErr } = await adminClient.rpc('admin_transition', { p_kind: 'ct', p_id: draftId, p_action: 'send' });
    if (sErr) {
      console.error(`  [!] Send to review error for book ${b.id}:`, sErr.message);
      continue;
    }

    const { data: status1, error: app1Err } = await adminClient.rpc('admin_transition', { p_kind: 'ct', p_id: draftId, p_action: 'approve' });
    if (app1Err) {
      console.error(`  [!] Admin approval error for book ${b.id}:`, app1Err.message);
      continue;
    }

    if (status1 === 'published') {
      console.log(`  ✓ Published book [${b.id}]: ${b.title}`);
    } else {
      const { data: status2, error: app2Err } = await scholarClient.rpc('admin_transition', { p_kind: 'ct', p_id: draftId, p_action: 'approve' });
      if (app2Err) {
        console.error(`  [!] Scholar approval error for book ${b.id}:`, app2Err.message);
      } else {
        console.log(`  ✓ Published book [${b.id}]: ${b.title} [status: ${status2}]`);
      }
    }
  }

  // 2. Upload & Publish 19 Knowledge Map Nodes
  console.log(`\n🗺️ Uploading and publishing ${MAP_NODES_DATA.length} Knowledge Map nodes to Supabase...`);

  for (const node of MAP_NODES_DATA) {
    const { data: draftId, error: dErr } = await adminClient.rpc('admin_save_draft', {
      p_kind: 'map',
      p_slot: node.slot,
      p_data: { links: node.links },
    });
    if (dErr) {
      console.error(`  [!] Draft error for map node ${node.slot}:`, dErr.message);
      continue;
    }

    await adminClient.rpc('admin_transition', { p_kind: 'ct', p_id: draftId, p_action: 'send' });
    const { data: status, error: appErr } = await adminClient.rpc('admin_transition', { p_kind: 'ct', p_id: draftId, p_action: 'approve' });
    if (appErr) {
      console.error(`  [!] Approval error for map node ${node.slot}:`, appErr.message);
    } else {
      console.log(`  ✓ Published map node [${node.slot}] with ${node.links.length} links [status: ${status}]`);
    }
  }

  // 3. Verification of live data
  const { data: liveBooks } = await adminClient.from('published_content').select('slot, data').eq('kind', 'book');
  const { data: liveMap } = await adminClient.from('published_content').select('slot, data').eq('kind', 'map');

  console.log('\n=============================================');
  console.log(`🎉 LIVE SUPABASE SERVER VERIFICATION:`);
  console.log(`- Published Classical Textbooks: ${liveBooks?.length || 0} / 12`);
  console.log(`- Published Knowledge Map Nodes: ${liveMap?.length || 0} / 19`);
  console.log('=============================================');
}

main().catch(console.error);
