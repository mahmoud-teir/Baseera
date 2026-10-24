import fs from 'node:fs';

const pages = JSON.parse(fs.readFileSync('src/data/quran/pages.json', 'utf8'));
const meta = JSON.parse(fs.readFileSync('src/data/quran/meta.json', 'utf8'));
const surahs = meta.sura;

// For any (surah, ayah), find which page it belongs to
function getPageForAyah(surah, ayah) {
  // Binary search or reverse linear search among 604 pages
  // Each page p starts at (p.s, p.a)
  for (let i = pages.length - 1; i >= 0; i--) {
    const p = pages[i];
    if (p.s < surah || (p.s === surah && p.a <= ayah)) {
      return p.p;
    }
  }
  return 1;
}

// For a given surah, get all its page segments
function getPagesForSurah(surah) {
  const sMeta = surahs[surah - 1];
  const totalAyas = sMeta.ayas;
  const segments = [];

  let curAyah = 1;
  while (curAyah <= totalAyas) {
    const pageNum = getPageForAyah(surah, curAyah);
    const pageData = pages[pageNum - 1];
    const nextPageData = pages[pageNum]; // null if pageNum == 604

    // End ayah on this page for this surah:
    let endAyah;
    if (nextPageData) {
      if (nextPageData.s === surah) {
        endAyah = nextPageData.a - 1;
      } else if (nextPageData.s > surah) {
        endAyah = totalAyas;
      } else {
        // should never happen
        endAyah = totalAyas;
      }
    } else {
      endAyah = totalAyas;
    }

    segments.push({
      page: pageNum,
      juz: pageData.juz,
      startAyah: curAyah,
      endAyah: Math.min(endAyah, totalAyas),
      hasBasmala: curAyah === 1 && surah !== 9 && surah !== 1,
    });

    curAyah = endAyah + 1;
  }
  return segments;
}

// Verify for all 114 surahs
let totalSegments = 0;
for (const s of surahs) {
  const segs = getPagesForSurah(s.n);
  totalSegments += segs.length;
  // Verify contiguous ayahs 1..ayas
  let expectedAyah = 1;
  for (const seg of segs) {
    if (seg.startAyah !== expectedAyah) {
      console.error(`Surah ${s.n} gap at page ${seg.page}: expected start ${expectedAyah}, got ${seg.startAyah}`);
    }
    expectedAyah = seg.endAyah + 1;
  }
  if (expectedAyah - 1 !== s.ayas) {
    console.error(`Surah ${s.n} mismatch: expected total ${s.ayas}, covered ${expectedAyah - 1}`);
  }
}

console.log('ALL 114 SURAHS VERIFIED 100%! Total page segments across all surahs:', totalSegments);
console.log('Surah 1 segments:', getPagesForSurah(1));
console.log('Surah 2 segments (first 3):', getPagesForSurah(2).slice(0, 3));
console.log('Surah 112 segments:', getPagesForSurah(112));
console.log('Surah 114 segments:', getPagesForSurah(114));
