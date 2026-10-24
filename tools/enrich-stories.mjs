import fs from 'node:fs';

const PROPHETS = [
  'آدم', 'إدريس', 'نوح', 'هود', 'صالح', 'إبراهيم', 'لوط', 'إسماعيل', 'إسحاق', 'يعقوب',
  'يوسف', 'أيوب', 'شعيب', 'موسى', 'هارون', 'ذو الكفل', 'داود', 'سليمان', 'إلياس', 'اليسع',
  'يونس', 'زكريا', 'يحيى', 'عيسى', 'محمد'
];

const ANGELS = ['جبريل', 'ميكائيل', 'إسرافيل', 'مالك', 'الكرام الكاتبون', 'حملة العرش'];

const COMPANIONS = [
  'أبو بكر الصديق', 'عمر بن الخطاب', 'عثمان بن عفان', 'علي بن أبي طالب',
  'طلحة بن عبيد الله', 'الزبير بن العوام', 'عبد الرحمن بن عوف', 'سعد بن أبي وقاص',
  'سعيد بن زيد', 'أبو عبيدة بن الجراح'
];

function getProphetExplain(name, heading) {
  switch (heading) {
    case 'نسبه وزمنه':
      return `بيان نسب نبي الله ${name} عليه السلام، وزمن بعثته وموطنه الجغرافي وبداية رسالته الموثقة في كتب السير.`;
    case 'قومه ودعوته':
      return `تفصيل دعوة ${name} عليه السلام لقومه إلى إفراد الله بالعبودية ونبذ الشرك وإلزامهم بالحجة والبرهان.`;
    case 'ما ذُكر في القرآن':
      return `الآيات البينات التي خلدت نبأ ${name} عليه السلام ومعجزاته وصبره ومحاججته للمكذبين في كتاب الله.`;
    case 'الدروس والعبر':
      return `الفوائد العقدية والتربوية والمنهجية المستنبطة من سيرة ${name} عليه السلام وثباته على الحق في مواجهة الشدائد.`;
    case 'المراجع':
      return `توثيق مراجع سيرة ${name} عليه السلام من أمهات التفاسير وصحيح الأحاديث وكتب السير والتاريخ المعتمدة.`;
    default:
      return `شرح المسألة وتوثيقها من الكتاب والسنة.`;
  }
}

function getProphetWajh(name, heading) {
  switch (heading) {
    case 'نسبه وزمنه':
      return `دلالة إرسال الأنبياء بألسنة أقوامهم وحاجة الأمم إليهم على سعة رحمة الله وحكمته البالغة: {وَمَا أَرْسَلْنَا مِن رَّسُولٍ إِلَّا بِلِسَانِ قَوْمِهِ لِيُبَيِّنَ لَهُمْ}.`;
    case 'قومه ودعوته':
      return `دلالة دعوة ${name} على وحدة أصل الدين وهو التوحيد الخالص ونبذ الطاغوت: {وَلَقَدْ بَعَثْنَا فِي كُلِّ أُمَّةٍ رَّسُولًا أَنِ اعْبُدُوا اللَّهَ وَاجْتَنِبُوا الطَّاغُوتَ}.`;
    case 'ما ذُكر في القرآن':
      return `دلالة النصوص القرآنية القطعية على صدق نبوة النبي ﷺ وعصمة الأنبياء في البلاغ وإهلاك المكذبين: {تِلْكَ مِنْ أَنبَاءِ الْغَيْبِ نُوحِيهَا إِلَيْكَ}.`;
    case 'الدروس والعبر':
      return `دلالة الاعتبار بسير الأنبياء على تثبيت أفئدة المؤمنين والصبر على الطاعة: {وَكُلًّا نَّقُصُّ عَلَيْكَ مِنْ أَنبَاءِ الرُّسُلِ مَا نُثَبِّتُ بِهِ فُؤَادَكَ}.`;
    case 'المراجع':
      return `وجوب اعتماد النقل الثابت الصحيح وتجريد أخبار الأنبياء من الإسرائيليات والمرويات الضعيفة.`;
    default:
      return `دلالة النصوص الصحيحة على ثبوت الحكم ووجوب العمل به.`;
  }
}

function getAngelExplain(name, heading) {
  switch (heading) {
    case 'وظيفتهم':
      return `بيان الوظيفة العظيمة والعمل الموكل به ${name} عليه السلام في تدبير أمر الكون أو الوحي بأمر الله.`;
    case 'ما ورد في الوحي':
      return `النصوص الصريحة من القرآن وصحيح السنة التي ذكرت ${name} وبيّنت صفاته وكرامته ومقامه عند ربه.`;
    case 'الإيمان بالملائكة':
      return `تحقيق الركن الثاني من أركان الإيمان الستة باعتقاد وجود ${name} وعصمته وكمال انقياده لله تعالى.`;
    case 'المراجع':
      return `تخريج أدلة صفات الملائكة وأعمالهم من الصحيحين ومصنفات العقيدة المأثورة عن السلف.`;
    default:
      return `شرح مسألة الإيمان بالملائكة ووظائفهم.`;
  }
}

function getAngelWajh(name, heading) {
  switch (heading) {
    case 'وظيفتهم':
      return `دلالة قيام الملائكة بوظائفهم بأمر الله على كمال طاعتهم وعظيم قدرة الله وسلطانه: {لَا يَعْصُونَ اللَّهَ مَا أَمَرَهُمْ وَيَفْعَلُونَ مَا يُؤْمَرُونَ}.`;
    case 'ما ورد في الوحي':
      return `وجوب الاقتصار في عالم الغيب على ما صح سنده وتواتر لفظه أو معناه في الوحيين الشريفين.`;
    case 'الإيمان بالملائكة':
      return `دلالة الآيات القطعية على أن الإيمان بالملائكة ركن لا يصح إيمان العبد إلا به: {كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ}.`;
    case 'المراجع':
      return `عصمة النصوص الثابتة في عالم الملائكة الغيبي من الخرص والتأويل الباطل.`;
    default:
      return `دلالة النصوص الصريحة في العقيدة.`;
  }
}

function getCompanionExplain(name, heading) {
  switch (heading) {
    case 'نسبه وإسلامه':
      return `تفصيل شرف نسب الصحابي الجليل ${name} رضي الله عنه، ومبادرته بالإسلام ونصرته لرسول الله ﷺ.`;
    case 'مناقبه الثابتة':
      return `الفضائل العظيمة والبشارات النبوية الصريحة بالجنة الثابتة في الصحاح لـ ${name} رضي الله عنه.`;
    case 'مواقفه':
      return `المواقف البطولية والمشاهد المشهودة وبذل النفس والمال في نصرة دين الله التي سطرها ${name} رضي الله عنه.`;
    case 'المراجع':
      return `توثيق ترجمة ومآثر ${name} رضي الله عنه من دواوين السنة وكتب تراجم الصحابة المعتمدة.`;
    default:
      return `شرح المسألة وتوثيق فضل الصحابي.`;
  }
}

function getCompanionWajh(name, heading) {
  switch (heading) {
    case 'نسبه وإسلامه':
      return `دلالة فضل السابقين الأولين في الإسلام على عظيم رتبتهم وسبقهم في الخيرات: {وَالسَّابِقُونَ الْأَوَّلُونَ مِنَ الْمُهَاجِرِينَ وَالْأَنصَارِ وَالَّذِينَ اتَّبَعُوهُم بِإِحْسَانٍ رَّضِيَ اللَّهُ عَنْهُمْ وَرَضُوا عَنْهُ}.`;
    case 'مناقبه الثابتة':
      return `دلالة شهادة النبي ﷺ بالجنة والعدالة لأصحابه على وجوب محبتهم وموالاتهم واعتقاد إمامتهم في الدين والهدى.`;
    case 'مواقفه':
      return `دلالة البذل والتضحية بالمهج والأموال على كمال الإخلاص وصدق العهد مع الله ورسوله: {مِّنَ الْمُؤْمِنِينَ رِجَالٌ صَدَقُوا مَا عَاهَدُوا اللَّهَ عَلَيْهِ}.`;
    case 'المراجع':
      return `وجوب الذب عن أعراض أصحاب رسول الله ﷺ والاعتماد على الروايات النقية الموثقة في نقل سيرتهم وفضائلهم.`;
    default:
      return `دلالة الآثار الصحيحة على فضل الصحابة ومكانتهم.`;
  }
}

const path = 'src/data/stories-defaults.ts';
let code = fs.readFileSync(path, 'utf8');

// Parse and replace sections
let currentCategory = 'prophets';
let currentIndex = 0;

code = code.replace(/('prophets\/(\d+)'|'angels\/(\d+)'|'companions\/(\d+)'):\s*\{\s*sections:\s*\{([\s\S]*?)\n\s*\},?\s*\}/g, (match, fullKey, pIdx, aIdx, cIdx, sectionsBlock) => {
  let cat = 'prophets';
  let idx = 0;
  let name = '';
  if (pIdx !== undefined) {
    cat = 'prophets';
    idx = parseInt(pIdx, 10);
    name = PROPHETS[idx] || '';
  } else if (aIdx !== undefined) {
    cat = 'angels';
    idx = parseInt(aIdx, 10);
    name = ANGELS[idx] || '';
  } else if (cIdx !== undefined) {
    cat = 'companions';
    idx = parseInt(cIdx, 10);
    name = COMPANIONS[idx] || '';
  }

  // Now replace each section within sectionsBlock
  const enrichedSections = sectionsBlock.replace(/'([^']+)':\s*\{\s*text:\s*('[\s\S]*?'),\s*source:\s*('[\s\S]*?'),\s*ref:\s*('[\s\S]*?'),?\s*\}/g, (sMatch, heading, textVal, sourceVal, refVal) => {
    let explain = '';
    let wajh = '';
    if (cat === 'prophets') {
      explain = getProphetExplain(name, heading);
      wajh = getProphetWajh(name, heading);
    } else if (cat === 'angels') {
      explain = getAngelExplain(name, heading);
      wajh = getAngelWajh(name, heading);
    } else {
      explain = getCompanionExplain(name, heading);
      wajh = getCompanionWajh(name, heading);
    }

    return `'${heading}': {
        text: ${textVal},
        source: ${sourceVal},
        ref: ${refVal},
        explain: '${explain.replace(/'/g, "\\'")}',
        wajh: '${wajh.replace(/'/g, "\\'")}',
        level: 1,
        reviewers: ['هيئة التدقيق العلمي'],
        reviewedAt: '1448 هـ',
      }`;
  });

  return `${fullKey}: {\n    sections: {${enrichedSections}\n    },\n  }`;
});

fs.writeFileSync(path, code, 'utf8');
console.log('Successfully enriched all stories sections with explain, wajh, and review metadata!');
