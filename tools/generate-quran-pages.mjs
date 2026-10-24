import fs from 'node:fs';

async function main() {
  console.log('Fetching Tanzil quran-data.xml...');
  const res = await fetch('https://tanzil.net/res/text/metadata/quran-data.xml');
  const xml = await res.text();

  // Parse pages
  const pageRegex = /<page\s+index="(\d+)"\s+sura="(\d+)"\s+aya="(\d+)"/g;
  const rawPages = [];
  let m;
  while ((m = pageRegex.exec(xml)) !== null) {
    rawPages.push({
      page: Number(m[1]),
      sura: Number(m[2]),
      aya: Number(m[3]),
    });
  }

  // Parse juzs
  const juzRegex = /<juz\s+index="(\d+)"\s+sura="(\d+)"\s+aya="(\d+)"/g;
  const rawJuzs = [];
  while ((m = juzRegex.exec(xml)) !== null) {
    rawJuzs.push({
      juz: Number(m[1]),
      sura: Number(m[2]),
      aya: Number(m[3]),
    });
  }

  const meta = JSON.parse(fs.readFileSync('src/data/quran/meta.json', 'utf8'));
  const surahs = meta.sura;

  if (rawPages.length !== 604) {
    throw new Error(`Expected 604 pages, got ${rawPages.length}`);
  }

  // Build compact page list: [sura, aya, juz] for each of the 604 pages (index 0 is page 1)
  const pages = rawPages.map((p, idx) => {
    let curJuz = 1;
    for (const j of rawJuzs) {
      if (j.sura < p.sura || (j.sura === p.sura && j.aya <= p.aya)) {
        curJuz = j.juz;
      }
    }
    return {
      p: p.page,
      s: p.sura,
      a: p.aya,
      j: curJuz,
    };
  });

  fs.writeFileSync('src/data/quran/pages.json', JSON.stringify(pages));
  console.log('Saved src/data/quran/pages.json successfully (' + pages.length + ' pages).');

  // Let's verify surah coverage
  for (const s of surahs) {
    // Find all pages that contain ayahs of surah s.n
    // A page contains ayahs of surah s.n if:
    // (page.sura == s.n) or (page.sura < s.n and nextPage.sura >= s.n)
    let found = 0;
    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      const p = pages[pIdx];
      const nextP = pages[pIdx + 1];
      
      // Compute range of ayahs of surah s.n on this page
      let startA = 0;
      let endA = 0;

      if (p.s === s.n) {
        startA = p.a;
      } else if (p.s < s.n && (!nextP || nextP.s > s.n || (nextP.s === s.n && nextP.a > 1))) {
        // This page started before surah s.n, but extends into or ends at s.n
        // Actually, does any page start in surah X and continue into surah Y?
        // Yes, if p.s < s.n and (nextP is after s.n or nextP.s == s.n and nextP.a > 1)
      }
    }
  }
}

main().catch(console.error);
