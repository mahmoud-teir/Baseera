import { readFileSync } from 'fs';

const shamelaPages = JSON.parse(readFileSync('shamela_11126_full.json', 'utf8'));
const shamelaCombined = shamelaPages.map(p => p.text).join('\n\n');

// Read libraryData.ts
const libContent = readFileSync('src/data/libraryData.ts', 'utf8');

const checkMilestones = [
  'اعلم رحمك الله أنه يجب علينا تعلم أربع مسائل',
  'العلم. وهو معرفة الله، ومعرفة نبيه',
  'اعلم رحمك الله أنه يجب على كل مسلم ومسلمة تعلم ثلاث هذه المسائل',
  'أن الله خلقنا ورزقنا ولم يتركنا هملا',
  'أن الله لا يرضى أن يشرك معه أحد في عبادته',
  'أن من أطاع الرسول ووحد الله لا يجوز له موالاة من حاد الله ورسوله',
  'فإذا قيل لك: ما الأصول الثلاثة',
  'ودليل الاستعانة',
  'ودليل الاستعاذة',
  'ودليل الاستغاثة',
  'ودليل الذبح',
  'ودليل النذر',
  'الأصل الثاني: معرفة دين الإسلام بالأدلة',
  'مراتب: الإسلام، والإيمان، والإحسان',
  'المرتبة الثانية: الإيمان',
  'المرتبة الثالثة: الإحسان',
  'حديث جبرائيل',
  'الهجرة إلى المدينة',
  'فلما استقر بالمدينة أمر ببقية شرائع الإسلام',
  'إبليس لعنه الله',
  'ومن عبد وهو راض',
  'ومن ادعى شيئا من علم الغيب',
  'ومن حكم بغير ما أنزل الله'
];

console.log('=== Final Verification of Usul Ath-Thalatha in libraryData.ts ===');
const norm = s => s.replace(/[\u064B-\u065F\u0670]/g, '').replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^\u0621-\u064A]/g, '');

let allMatch = true;
checkMilestones.forEach(m => {
  const mNorm = norm(m);
  const inLib = norm(libContent).includes(mNorm);
  console.log(`[${inLib ? '✓ موجود بالكامل' : '✗ ناقص'}] ${m}`);
  if (!inLib) allMatch = false;
});

console.log('Result:', allMatch ? '🎉 100% MATCH! ALL MILESTONES VERIFIED!' : 'Some milestones missing');
