const fs = require('fs');

async function run() {
  const shamelaPages = JSON.parse(fs.readFileSync('shamela_11126_full.json', 'utf8'));

  // Import FULL_LIBRARY from generate-full-library-and-publish.mjs
  const { FULL_LIBRARY } = await import('./generate-full-library-and-publish.mjs');
  const ourBook = FULL_LIBRARY.find(b => b.id === 'usul-ath-thalatha');

  console.log('=== Our Book in App ===');
  console.log('ID:', ourBook.id);
  console.log('Title:', ourBook.title);
  console.log('Author:', ourBook.author);
  console.log('Pages metadata in app:', ourBook.pages);
  console.log('Declared Chapters count:', ourBook.chapters.length);

  let ourTotalChars = 0;
  let ourTotalParagraphs = 0;
  ourBook.chapters.forEach((ch, idx) => {
    const chChars = ch.paragraphs.reduce((a, b) => a + b.length, 0);
    ourTotalChars += chChars;
    ourTotalParagraphs += ch.paragraphs.length;
    console.log(`Chapter ${idx + 1}: "${ch.title}" (${ch.paragraphs.length} paragraphs, ${chChars} chars)`);
  });
  console.log('Our total characters in text:', ourTotalChars);
  console.log('Our total paragraphs:', ourTotalParagraphs);

  // Compare Shamela text vs Our Book text
  const shamelaCombined = shamelaPages.map(p => p.text).join('\n\n');
  console.log('\n=== Shamela 11126 ===');
  console.log('Total Pages in Shamela 11126:', shamelaPages.length);
  console.log('Total Characters in Shamela 11126:', shamelaCombined.length);

  // Check key sections in text
  const checkMilestones = [
    'اعلم رحمك الله أنه يجب علينا تعلم أربع مسائل',
    'العلم. وهو معرفة الله، ومعرفة نبيه',
    'اعلم رحمك الله أنه يجب على كل مسلم ومسلمة تعلم ثلاث هذه المسائل',
    'أن الله خلقنا ورزقنا ولم يتركنا هملا',
    'أن الله لا يرضى أن يشرك معه أحد في عبادته',
    'أن من أطاع الرسول ووحد الله لا يجوز له موالاة من حاد الله ورسوله',
    'فإذا قيل لك: ما الأصول الثلاثة',
    'الأصل الأول: معرفة العبد ربه',
    'أنواع العبادة التي أمر الله بها',
    'ودليل الاستعانة',
    'ودليل الاستعاذة',
    'ودليل الاستغاثة',
    'ودليل الذبح',
    'ودليل النذر',
    'الأصل الثاني: معرفة دين الإسلام بالأدلة',
    'مراتب: الإسلام، والإيمان، والإحسان',
    'المرتبة الأولى: الإسلام',
    'المرتبة الثانية: الإيمان',
    'أركان الإيمان ستة',
    'المرتبة الثالثة: الإحسان',
    'حديث جبرائيل',
    'الأصل الثالث: معرفة نبيكم محمد ﷺ',
    'نبئ باقرأ وأرسل بالمدثر',
    'الهجرة إلى المدينة',
    'فلما استقر بالمدينة أمر ببقية شرائع الإسلام',
    'توفي صلوات الله وسلامه عليه ودينه باق',
    'البعث بعد الموت',
    'رأس الطواغيت خمسة',
    'إبليس لعنه الله',
    'ومن عبد وهو راض',
    'ومن ادعى شيئا من علم الغيب',
    'ومن حكم بغير ما أنزل الله'
  ];

  console.log('\n=== Content Milestone Comparison ===');
  let missing = [];
  checkMilestones.forEach(m => {
    // Normalizing text for match
    const norm = s => s.replace(/[\u064B-\u065F\u0670]/g, '').replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
    const mNorm = norm(m);
    const inShamela = norm(shamelaCombined).includes(mNorm);
    const inOur = ourBook.chapters.some(ch => ch.paragraphs.some(p => norm(p).includes(mNorm)));
    console.log(`[${inOur ? '✓ في تطبيقنا' : '✗ ناقص لدينا'}] [${inShamela ? '✓ في الشاملة' : '✗ في الشاملة'}] ${m}`);
    if (inShamela && !inOur) {
      missing.push(m);
    }
  });

  console.log('\n=== Missing Items Summary ===');
  console.log('Count of missing milestones:', missing.length);
  if (missing.length > 0) {
    console.log('Missing items:', missing);
  }
}

run();
