import fs from 'node:fs';

const path = 'src/state/app-store.ts';
let s = fs.readFileSync(path, 'utf8');

if (!s.includes("tafsir: 'تفسير السعدي'")) {
  s = s.replace("quranMode: 'صفحات المصحف',", "quranMode: 'صفحات المصحف',\r\n  tafsir: 'تفسير السعدي',");
  fs.writeFileSync(path, s);
  console.log('Added tafsir to SETTINGS_DEFAULTS in app-store.ts');
} else {
  console.log('tafsir already exists');
}
