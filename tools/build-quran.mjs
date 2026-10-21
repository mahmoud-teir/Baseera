// Builds src/data/quran/meta.json from the Tanzil metadata and validates the Uthmani text in
// assets/quran/ (6236 ayahs, aligned with the surah table). The text itself is shipped verbatim
// as an asset and parsed at runtime (Tanzil terms forbid changes; the copyright block is kept).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const txt = readFileSync(join(root, 'assets/quran/quran-uthmani.txt'), 'utf8');
const lines = txt.split(/\r?\n/);
const ayahs = [];
const copyright = [];
for (const line of lines) {
  if (line.startsWith('#')) { copyright.push(line); continue; }
  if (!line.trim()) continue;
  const [s, a, ...rest] = line.split('|');
  ayahs.push({ s: Number(s), a: Number(a), t: rest.join('|') });
}
if (ayahs.length !== 6236) throw new Error(`expected 6236 ayahs, got ${ayahs.length}`);

const ctx = { QuranData: {} };
vm.runInNewContext(readFileSync(join(root, 'assets/quran/quran-data.js'), 'utf8').replace('var QuranData = {};', ''), ctx);
const sura = ctx.QuranData.Sura.slice(1, 115).map((x, i) => ({ n: i + 1, start: x[0], ayas: x[1], order: x[2], name: x[4], type: x[7] === 'Meccan' ? 'مكية' : 'مدنية' }));
sura.forEach((s) => {
  const first = ayahs[s.start];
  if (first.s !== s.n || first.a !== 1) throw new Error(`metadata mismatch for sura ${s.n}`);
});

const out = join(root, 'src/data/quran');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'meta.json'), JSON.stringify({ source: 'Tanzil Quran Text (Uthmani, Version 1.1) — tanzil.net — CC BY 3.0', sura }));
console.log(`ok: ${sura.length} surahs, ${ayahs.length} ayahs`);
