import fs from 'node:fs';

const path = 'src/app/(tabs)/account/settings/index.tsx';
let s = fs.readFileSync(path, 'utf8');

const t1 = "{ kind: 'choice', label: 'نمط قراءة القرآن', sub: 'صفحات المصحف أو آيات مجزأة', opts: ['صفحات المصحف', 'آيات مجزأة'], value: gv('quranMode'), pick: (v) => sv('quranMode', v as any) },";
const a1 = "\r\n      { kind: 'choice', label: 'التفسير المعتمد', sub: 'تفسير الآيات في المصحف', opts: ['تفسير السعدي', 'التفسير الميسر', 'تفسير ابن كثير', 'تفسير البغوي', 'تفسير القرطبي', 'تفسير الطبري'], value: gv('tafsir'), pick: (v) => sv('tafsir', v as any) },";

const t2 = "{ kind: 'choice', label: 'نمط قراءة القرآن', sub: 'صفحات المصحف الشريف أو بطاقات الآيات', opts: ['صفحات المصحف', 'آيات مجزأة'], value: gv('quranMode'), pick: (v) => sv('quranMode', v as any) },";
const a2 = "\r\n      { kind: 'choice', label: 'التفسير المعتمد', sub: 'أمهات كتب التفسير الموثوقة لأهل السنة والجماعة', opts: ['تفسير السعدي', 'التفسير الميسر', 'تفسير ابن كثير', 'تفسير البغوي', 'تفسير القرطبي', 'تفسير الطبري'], value: gv('tafsir'), pick: (v) => sv('tafsir', v as any) },";

if (s.includes(t1) && s.includes(t2)) {
  s = s.replace(t1, t1 + a1).replace(t2, t2 + a2);
  fs.writeFileSync(path, s);
  console.log('Added Tafsir options to Settings successfully!');
} else {
  console.error('Targets not found in settings');
}
