import fs from 'node:fs';

const path = 'tests/unit/domain.test.ts';
let content = fs.readFileSync(path, 'utf8');

const importTarget = `import { mix, oklch } from '@/utils/color';`;
const newImport = `import { mix, oklch } from '@/utils/color';\r\nimport { getPageForAyah, getPagesForSurah, juzName, toArabicDigits } from '@/data/quran';`;

const newTestBlock = `\r\ndescribe('quran pages mapping (Madinah 604 pages)', () => {
  it('maps pages and ayahs accurately across boundaries', () => {
    expect(getPageForAyah(1, 1)).toBe(1);
    expect(getPageForAyah(1, 7)).toBe(1);
    expect(getPageForAyah(2, 1)).toBe(2);
    expect(getPageForAyah(2, 5)).toBe(2);
    expect(getPageForAyah(2, 6)).toBe(3);
    expect(getPageForAyah(114, 6)).toBe(604);
  });

  it('segments surahs into valid contiguous page ranges', () => {
    const fatiha = getPagesForSurah(1);
    expect(fatiha).toHaveLength(1);
    expect(fatiha[0]).toEqual({ page: 1, juz: 1, startAyah: 1, endAyah: 7, hasBasmala: false });

    const baqarah = getPagesForSurah(2);
    expect(baqarah[0]).toEqual({ page: 2, juz: 1, startAyah: 1, endAyah: 5, hasBasmala: true });
    expect(baqarah[1]).toEqual({ page: 3, juz: 1, startAyah: 6, endAyah: 16, hasBasmala: false });
    expect(baqarah[baqarah.length - 1].page).toBe(49);
    expect(baqarah[baqarah.length - 1].endAyah).toBe(286);
  });

  it('formats arabic digits and juz titles', () => {
    expect(toArabicDigits(1)).toBe('١');
    expect(toArabicDigits(604)).toBe('٦٠٤');
    expect(juzName(1)).toBe('الجزء الأول');
    expect(juzName(30)).toBe('الجزء الثلاثون');
  });
});
`;

content = content.replace(importTarget, newImport) + newTestBlock;
fs.writeFileSync(path, content);
console.log('Test file updated successfully');
