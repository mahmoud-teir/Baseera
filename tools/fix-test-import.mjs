import fs from 'node:fs';
let s = fs.readFileSync('tests/unit/domain.test.ts', 'utf8');
s = s.replace(`from '@/data/quran';`, `from '@/data/quran/pages';`);
fs.writeFileSync('tests/unit/domain.test.ts', s);
console.log('Fixed test import');
