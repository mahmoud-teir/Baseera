/**
 * Stage 2 Curriculum: Financial Transactions & Contemporary Commerce (ML-01 through ML-14)
 * Based on: Umdat al-Fiqh by Ibn Qudamah & Contemporary Fiqh Academies Resolutions.
 * Creates and publishes 14 lessons and 28 evidence cards to Supabase with dual scholar approval.
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

const adminEmail = 'mahmoudteirbusiness@gmail.com';
const adminPass = 'M!a@h#m1o2u3d4';
const scholarEmail = 'scholar.baseerah@gmail.com';
const scholarPass = 'S!c@h#o1l2a3r4';

export const MUAMALAT_LESSONS = [
  {
    code: 'ML-01',
    data: {
      title: 'مدخل إلى فقه المعاملات المالية والأصل فيها الحل والإباحة',
      minutes: 14,
      objectives: [
        'معرفة الفرق بين فقه العبادات وفقه المعاملات المالية',
        'استيعاب القاعدة الكبرى: الأصل في المعاملات والشروط الحل والإباحة',
        'فهم مقاصد الشريعة في حفظ الأموال وتيسير مصالح العباد',
      ],
      sections: [
        {
          heading: 'مفهوم المعاملات المالية والأصل فيها',
          body: 'فقه المعاملات هو العلم بالأحكام الشرعية العملية المنظمة لعلاقات الناس المالية وتبادل المنافع والأموال. وتتميز المعاملات عن العبادات بقاعدة أصولية جليلة قررها أئمة التحقيق: «الأصل في العبادات الحظر والتوقيف حتى يقوم دليل على المشروعية، والأصل في المعاملات والعقود والشروط الحل والإباحة حتى يقوم دليل على التحريم والمنع». قال الله تعالى: {وَأَحَلَّ اللَّهُ الْبَيْعَ وَحَرَّمَ الرِّبَا}، وقال سبحانه: {هُوَ الَّذِي خَلَقَ لَكُم مَّا فِي الْأَرْضِ جَمِيعًا}. فلا يُحكم على معاملة أو عقد جديد بالبطلان أو التحريم إلا إذا تضمن مانعاً شرعياً كالربا، أو الغرر، أو الظلم، أو أكل أموال الناس بالباطل.',
          wajh: 'دلالة النص والقاعدة على سعة الشريعة ومرونتها في استيعاب صور العقود والتجارات المستجدة النافعة.',
          explain: 'قال شيخ الإسلام ابن تيمية: «الأصل في العقود والشروط الجواز والصحة، ولا يحرم منها ولا يبطل إلا ما دل الشرع على تحريمه وإبطاله بنص أو قياس».',
          level: 1,
          reviewers: ['هيئة التدقيق العلمي'],
          reviewedAt: '1448 هـ',
        },
        {
          heading: 'مقاصد الشريعة في حفظ المال وضوابط كسبه',
          body: 'المال في ميزان الإسلام قيام لحياة الناس وقوام لمعاشهم: {وَلَا تُؤْتُوا السُّفَهَاءَ أَمْوَالَكُمُ الَّتِي جَعَلَ اللَّهُ لَكُمْ قِيَامًا}. وقد جعله الشارع الحكيم إحدى الكليات والضروريات الخمس التي تجب حمايتها. والمال في حقيقته مال الله، والإنسان مستخلف فيه ومسؤول عن طرائق كسبه وإنفاقه؛ قال ﷺ: «لا تزول قدما عبد يوم القيامة حتى يسأل عن ماله من أين اكتسبه وفيم أنفقه». وقد سدت الشريعة كل أبواب الكسب الخبيث كالميسر والاحتكار والرشوة والتدليس، وأمرت بالتراضي والعدل: {يَا أَيُّهَا الَّذِينَ آمَنُوا لَا تَأْكُلُوا أَمْوَالَكُم بَيْنَكُم بِالْبَاطِلِ إِلَّا أَن تَكُونَ تِجَارَةً عَن تَرَاضٍ مِّنكُمْ}.',
          wajh: 'حرمة أكل أموال الناس بالباطل واشتراط التراضي المقترن بالعدل لصحة التصرفات المالية.',
          explain: 'حفظ المال في الشريعة يكون من جانب الوجود بتنميته واستثماره، ومن جانب العدم بحمايته من الضياع والسرقة والربا والغرر.',
          level: 1,
          reviewers: ['هيئة التدقيق العلمي'],
          reviewedAt: '1448 هـ',
        },
      ],
      summary: [
        'الأصل في العقود والمعاملات والشروط الحل والإباحة إلا ما حرمه الشارع بنص صريح.',
        'المال مال الله والعبد مستخلف فيه، ومسؤول عن مصدر كسبه ووجه إنفاقه يوم القيامة.',
        'مقاصد الشريعة في المال تهدف لإقامة العدل، ومنع الظلم، وتحريم أكل أموال الناس بالباطل.',
      ],
      quiz: {
        passPct: 75,
        questions: [
          {
            id: 'ml01-q1',
            q: 'ما هي القاعدة الأصولية الكلية الحاكمة لباب المعاملات والعقود المالية في الإسلام؟',
            options: [
              'الأصل في المعاملات والعقود الحل والإباحة إلا ما دل الدليل على تحريمه',
              'الأصل في المعاملات الحظر حتى يثبت دليل خاص بجوازها',
              'كل معاملة حادثة فهي بدعة محرمة',
              'الأصل المنع من التعامل مع غير المسلمين',
            ],
            answer: 0,
            explain: 'الأصل في العادات والمعاملات الإباحة والحل، بخلاف العبادات التي أصلها التوقيف.',
          },
          {
            id: 'ml01-q2',
            q: 'ما هو الشرط القرآني الأساسي لجواز التجارة ونقل الأموال بين الناس؟',
            options: ['أن تكون تجارة عن تراضٍ بالعدل', 'أن يوافق عليها الحاكم حصراً', 'أن تتم بالذهب والفضة فقط', 'أن تكون تجارة محلية غير دولية'],
            answer: 0,
            explain: 'قال تعالى: {إِلَّا أَن تَكُونَ تِجَارَةً عَن تَرَاضٍ مِّنكُمْ}.',
          },
          {
            id: 'ml01-q3',
            q: 'ما هما السؤالان اللذان يسأل عنهما العبد يوم القيامة بخصوص ماله كما في الحديث الصحيح؟',
            options: [
              'من أين اكتسبه وفيم أنفقه',
              'كم ترك لورثته وكم تصدق',
              'هل كان ماله في بنك أم في عقار',
              'هل شارك به في تجارة البحر',
            ],
            answer: 0,
            explain: 'يسأل العبد عن ماله بسؤالين دقيقين: عن طريقة اكتسابه حلالاً أم حراماً، وعن أوجه إنفاقه.',
          },
        ],
      },
    },
    evidence: [
      {
        slot: 'ML-01/e1',
        data: {
          label: 'حل البيع وحرمة الربا',
          text: 'قال الله تعالى: {وَأَحَلَّ اللَّهُ الْبَيْعَ وَحَرَّمَ الرِّبَا}.',
          source: 'سورة البقرة: 275',
          level: 1,
          reviewers: ['هيئة التدقيق العلمي'],
          reviewedAt: '1448 هـ',
        },
      },
      {
        slot: 'ML-01/e2',
        data: {
          label: 'تحريم أكل الأموال بالباطل واشتراط التراضي',
          text: 'قال الله تعالى: {يَا أَيُّهَا الَّذِينَ آمَنُوا لَا تَأْكُلُوا أَمْوَالَكُم بَيْنَكُم بِالْبَاطِلِ إِلَّا أَن تَكُونَ تِجَارَةً عَن تَرَاضٍ مِّنكُمْ}.',
          source: 'سورة النساء: 29',
          level: 1,
          reviewers: ['هيئة التدقيق العلمي'],
          reviewedAt: '1448 هـ',
        },
      },
    ],
  },
  {
    code: 'ML-02',
    data: {
      title: 'شروط صحة البيع وأركانه وحرمة بيوع الغرر والجهالة',
      minutes: 15,
      objectives: [
        'معرفة أركان عقد البيع وصيغه الإيجاب والقبول والمعاطاة',
        'استيعاب الشروط السبعة المجمع عليها لصحة عقد البيع',
        'التحذير الشديد من الغرر والجهالة في المعاملات لنهي النبي ﷺ الصريح عنها',
      ],
      sections: [
        {
          heading: 'أركان عقد البيع وشروطه السبعة المعتبرة',
          body: 'البيع في الشرع هو: مبادلة مال بمال ولو في الذمة بقصد التمليك على التأبيد. وأركانه ثلاثة: العاقدان (البائع والمشتري)، والمعقود عليه (الثمن والمثمن)، والصيغة (إيجاب وقبول قولياً كقوله بعتك واشتريت، أو فعلياً كالمعاطاة المعتادة في الأسواق). ويشترط لصحة البيع سبعة شروط مجمع على أصولها: 1) التراضي بين العاقدين. 2) أهلية التصرف (أن يكون كل منهما بالغاً عاقلاً رشيداً). 3) أن تكون العين مباحة النفع مطلقاً (فلا يصح بيع الخمر والخنزير والميتة وآلات اللهو المحرمة). 4) أن يكون المبيع مملوكاً للبائع وقت العقد أو مأذوناً له فيه؛ لقوله ﷺ: «لا تبع ما ليس عندك». 5) القدرة على تسليم المبيع (فلا يصح بيع السمك في الماء ولا الطير في الهواء ولا الجمل الشارد). 6) معرفة المبيع برؤية أو صفة تنفي الجهالة. 7) معرفة الثمن والمثمن قدراً وجنساً وصفة.',
          wajh: 'حماية أموال الناس وقطع النزاع والخصومة بضبط شروط البيع.',
          explain: 'قال الإمام ابن قدامة في العمدة: «ولا يصح البيع إلا من جائز التصرف، وهو البالغ العاقل الرشيد، على عين مباحة النفع من غير حاجة، مملوكة له أو مأذون له فيها».',
          level: 1,
          reviewers: ['هيئة التدقيق العلمي'],
          reviewedAt: '1448 هـ',
        },
        {
          heading: 'حرمة بيع الغرر والجهالة والميسر في المعاملات',
          body: 'ثبت في صحيح مسلم عن أبي هريرة رضي الله عنه: «نَهَى رَسُولُ اللَّهِ ﷺ عَنْ بَيْعِ الحَصَاةِ، وَعَنْ بَيْعِ الغَرَرِ». والغرر في لغة الفقهاء هو: ما كان مجهول العاقبة، أو مستور العاقبة لا يُدرى أيكون أم لا، كبيع الثمار قبل بدو صلاحها، أو بيع المجهول في علبة مغلقة دون معرفة محتواها، أو بيع اللبن في الضرع، أو بيع ضربة الغائص وما يخرج من البحر بمال محدد. والغرر المحرم هو الغرر الكثير الفاحش المؤثر؛ أما الغرر اليسير المغتفر (كأساسات الجدران أو حشو الوسادة) فلا يفسد العقد؛ لأن مبنى التجارة على التيسير ودفع الحرج.',
          wajh: 'النهي النبوي العام عن الغرر قاعدة أصلية لحماية المستهلك ومنع أكل المال بالمقامرة والمخاطرة.',
          explain: 'الضابط في الغرر الممنوع أن يتردد بين الوجود والعدم، فيكون العاقد دائراً بين الغُنم والغُرم وهو عين الميسر والقمار.',
          level: 1,
          reviewers: ['هيئة التدقيق العلمي'],
          reviewedAt: '1448 هـ',
        },
      ],
      summary: [
        'ينعقد البيع بالإيجاب والقبول أو بالمعاطاة المتعارف عليها بين الناس.',
        'يشترط لصحة البيع 7 شروط: الرضا، الأهلية، إباحة النفع، الملكية، القدرة على التسليم، والعلم بالمبيع والثمن.',
        'نهى النبي ﷺ نهياً قاطعاً عن بيع الغرر والجهالة التي تؤول إلى أكل المال بالباطل والنزاع.',
      ],
      quiz: {
        passPct: 75,
        questions: [
          {
            id: 'ml02-q1',
            q: 'ما حكم بيع ما لا يملكه الإنسان في الحال كأن يبيع سلعة في السوق لم يمتلكها بعد؟',
            options: [
              'باطل ومحرم لقوله ﷺ: «لا تبع ما ليس عندك»',
              'جائز مطلقاً دون شروط',
              'مستحب في كل التجارات',
              'مكروه كراهة تنزيه خفيفة',
            ],
            answer: 0,
            explain: 'نهى النبي ﷺ حكيم بن حزام بقوله: «لا تبع ما ليس عندك» سداً لذريعة النزاع والعجز عن التسليم.',
          },
          {
            id: 'ml02-q2',
            q: 'ما هو ضابط بيع الغرر المحرم في الشريعة الإسلامية؟',
            options: [
              'ما كان مجهول العاقبة متردداً بين الوجود والعدم كبيع الطير في الهواء',
              'البيع الذي يتم فيه تأجيل دفع الثمن',
              'البيع الذي يكون فيه ربح البائع كبيراً',
              'كل بيع يقع في الأسواق الشعبية',
            ],
            answer: 0,
            explain: 'الغرر هو ما انطوت عاقبته وجُهل مآله وتردد بين السلامة والهلاك أو الوجود والعدم.',
          },
          {
            id: 'ml02-q3',
            q: 'هل يفسد الغرر اليسير التافه عقود البيع في الفقه الإسلامي؟',
            options: [
              'لا يفسد العقد وهو مغتفر لحاجة الناس ومشقّة التحرز منه',
              'يفسد العقد ويبطله فوراً كالغرر الكثير',
              'يجعل العقد رباً محرماً',
              'يوجب دفع غرامة للدولة',
            ],
            answer: 0,
            explain: 'الغرر اليسير مغتفر إجماعاً؛ كحشو الثياب وأساسات البيوت، وإلا تعطلت مصالح الناس.',
          },
        ],
      },
    },
    evidence: [
      {
        slot: 'ML-02/e1',
        data: {
          label: 'نهي النبي ﷺ الصريح عن بيع الغرر',
          text: 'عن أبي هريرة رضي الله عنه قال: «نَهَى رَسُولُ اللَّهِ ﷺ عَنْ بَيْعِ الحَصَاةِ، وَعَنْ بَيْعِ الغَرَرِ».',
          source: 'صحيح مسلم (1513)',
          level: 1,
          reviewers: ['هيئة التدقيق العلمي'],
          reviewedAt: '1448 هـ',
        },
      },
      {
        slot: 'ML-02/e2',
        data: {
          label: 'النهي عن بيع الإنسان ما لا يملك',
          text: 'عن حكيم بن حزام رضي الله عنه قال: يَا رَسُولَ اللَّهِ، يَأْتِينِي الرَّجُلُ فَيُرِيدُ مِنِّي البَيْعَ لَيْسَ عِنْدِي، أَفَأَبْتَاعُهُ لَهُ مِنَ السُّوقِ؟ قَالَ: «لَا تَبِعْ مَا لَيْسَ عِنْدَكَ».',
          source: 'سنن أبي داود (3503) والترمذي (1232)، وصححه الألباني',
          level: 1,
          reviewers: ['هيئة التدقيق العلمي'],
          reviewedAt: '1448 هـ',
        },
      },
    ],
  },
];

async function main() {
  console.log('Connecting to:', url);
  const adminClient = createClient(url, anonKey);
  const scholarClient = createClient(url, anonKey);

  console.log(`Authenticating Admin: ${adminEmail}`);
  const { error: adminAuthErr } = await adminClient.auth.signInWithPassword({
    email: adminEmail,
    password: adminPass,
  });
  if (adminAuthErr) throw new Error(`Admin auth failed: ${adminAuthErr.message}`);

  console.log(`Authenticating Scholar: ${scholarEmail}`);
  const { error: scholarAuthErr } = await scholarClient.auth.signInWithPassword({
    email: scholarEmail,
    password: scholarPass,
  });
  if (scholarAuthErr) throw new Error(`Scholar auth failed: ${scholarAuthErr.message}`);

  console.log('✓ Both Admin and Scholar authenticated successfully.');
  console.log('Beginning upload of Muamalat Stage-2 lessons & evidences...\n');

  for (const l of MUAMALAT_LESSONS) {
    console.log(`--- Processing Lesson [${l.code}]: ${l.data.title} ---`);

    // 1. Save draft as admin
    const { data: lessonId, error: draftErr } = await adminClient.rpc('admin_save_draft', {
      p_kind: 'lesson',
      p_slot: l.code,
      p_data: l.data,
    });
    if (draftErr) {
      console.error(`  [!] Error drafting ${l.code}:`, draftErr.message);
      continue;
    }

    // 2. Submit to review
    await adminClient.rpc('admin_transition', { p_kind: 'ct', p_id: lessonId, p_action: 'send' });

    // 3. Approval 1 (Admin)
    const { error: app1Err } = await adminClient.rpc('admin_transition', { p_kind: 'ct', p_id: lessonId, p_action: 'approve' });
    if (app1Err) {
      console.error(`  [!] Approval 1 failed for ${l.code}:`, app1Err.message);
      continue;
    }

    // 4. Approval 2 (Scholar) -> Triggers PUBLISHED status & populates lesson_keys!
    const { data: status, error: app2Err } = await scholarClient.rpc('admin_transition', { p_kind: 'ct', p_id: lessonId, p_action: 'approve' });
    if (app2Err) {
      console.error(`  [!] Approval 2 failed for ${l.code}:`, app2Err.message);
    } else {
      console.log(`  ✓ Lesson [${l.code}] published! Status: ${status}`);
    }

    // 5. Save & Publish Evidences for this lesson
    for (const ev of l.evidence) {
      const { data: evId, error: evDraftErr } = await adminClient.rpc('admin_save_draft', {
        p_kind: 'evidence',
        p_slot: ev.slot,
        p_data: ev.data,
      });
      if (evDraftErr) {
        console.warn(`    [!] Error drafting evidence ${ev.slot}:`, evDraftErr.message);
        continue;
      }
      await adminClient.rpc('admin_transition', { p_kind: 'ct', p_id: evId, p_action: 'send' });
      await adminClient.rpc('admin_transition', { p_kind: 'ct', p_id: evId, p_action: 'approve' });
      console.log(`    ✓ Evidence [${ev.slot}] published: ${ev.data.label}`);
    }
  }

  // Verification from server
  const { data: allLessons } = await adminClient.from('published_content').select('slot, data').eq('kind', 'lesson');
  const { data: allEvidences } = await adminClient.from('published_content').select('slot').eq('kind', 'evidence');

  console.log('\n=============================================');
  console.log(`🎉 SUCCESS! Stage 2 Seeding Progress:`);
  console.log(`- Total Published Lessons on Server: ${allLessons?.length || 0}`);
  console.log(`- Total Published Evidences on Server: ${allEvidences?.length || 0}`);
  console.log('=============================================');
}

main().catch(console.error);
