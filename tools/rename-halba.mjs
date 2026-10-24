import fs from 'fs';

const files = [
  'src/app/(tabs)/(home)/index.tsx',
  'src/app/(tabs)/(home)/more.tsx',
  'src/app/tawheed/index.tsx',
  'src/app/tawheed/intro.tsx',
  'src/app/tawheed/[id].tsx',
  'src/data/tawheedGatewaysData.ts',
  'src/state/tawheed-store.ts',
  'tests/unit/tawheed.test.ts',
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, 'utf8');

  // Replace various occurrences of 'حلبة'
  text = text.replaceAll('بوابات التوحيد وحلبة البراهين', 'بوابات التوحيد واليقين');
  text = text.replaceAll('وحلبة براهين الطائفة المنصورة', 'وبراهين المنهج الحق والطائفة المنصورة');
  text = text.replaceAll('دخول بوابات التوحيد وحلبة البراهين', 'دخول بوابات التوحيد واليقين');
  text = text.replaceAll('حلبة التثبيت', 'تثبيت المعرفة');
  text = text.replaceAll('دخول حلبة التثبيت وفك القفل', 'الانتقال إلى اختبار التثبيت وفك القفل');
  text = text.replaceAll('حلبة التثبيت وبراهين النجاة', 'اختبار التثبيت وبراهين النجاة');
  text = text.replaceAll('اختبارات الحلبة والبراهين', 'اختبارات التثبيت وبراهين النجاة');
  text = text.replaceAll('حلبات وبوابات', 'بوابات ومسارات');
  text = text.replaceAll('حلبة البراهين', 'براهين اليقين');
  text = text.replaceAll('حلبة', 'محطة');

  fs.writeFileSync(file, text, 'utf8');
  console.log(`Updated: ${file}`);
}
