import fs from 'node:fs';

const path = 'src/app/(tabs)/account/settings/index.tsx';
let s = fs.readFileSync(path, 'utf8');

const target1 = `{ kind: 'choice', label: 'خلفية القراءة', sub: 'للقرآن والكتب', opts: ['افتراضي', 'ورقي'], value: st.rt === 'sepia' ? 'ورقي' : 'افتراضي', pick: (v) => st.set({ rt: v === 'ورقي' ? 'sepia' : 'default' }) },`;
const addition1 = `\r\n      { kind: 'choice', label: 'نمط قراءة القرآن', sub: 'صفحات المصحف أو آيات مجزأة', opts: ['صفحات المصحف', 'آيات مجزأة'], value: gv('quranMode'), pick: (v) => sv('quranMode', v as any) },`;

const target2 = `{ kind: 'link', label: 'القارئ الافتراضي', sub: reciterName(gv('reciter')), tap: () => router.push('/account/settings/reciter') },`;
const addition2 = `\r\n      { kind: 'choice', label: 'نمط قراءة القرآن', sub: 'صفحات المصحف الشريف أو بطاقات الآيات', opts: ['صفحات المصحف', 'آيات مجزأة'], value: gv('quranMode'), pick: (v) => sv('quranMode', v as any) },`;

if (s.includes(target1) && s.includes(target2)) {
  s = s.replace(target1, target1 + addition1).replace(target2, target2 + addition2);
  fs.writeFileSync(path, s);
  console.log('Settings patched successfully!');
} else {
  console.error('Could not find targets in Settings!');
}
