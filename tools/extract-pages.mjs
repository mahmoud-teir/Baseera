import fs from 'node:fs';

async function run() {
  const res = await fetch('https://tanzil.net/res/text/metadata/quran-data.xml');
  const xml = await res.text();
  
  // Parse pages
  const pageRegex = /<page\s+index="(\d+)"\s+sura="(\d+)"\s+aya="(\d+)"/g;
  const pages = [];
  let m;
  while ((m = pageRegex.exec(xml)) !== null) {
    pages.push({
      page: Number(m[1]),
      sura: Number(m[2]),
      aya: Number(m[3]),
    });
  }

  // Parse juzs
  const juzRegex = /<juz\s+index="(\d+)"\s+sura="(\d+)"\s+aya="(\d+)"/g;
  const juzs = [];
  while ((m = juzRegex.exec(xml)) !== null) {
    juzs.push({
      juz: Number(m[1]),
      sura: Number(m[2]),
      aya: Number(m[3]),
    });
  }

  console.log('Pages count:', pages.length);
  console.log('Juzs count:', juzs.length);

  // Read meta.json to know total ayahs per surah
  const meta = JSON.parse(fs.readFileSync('src/data/quran/meta.json', 'utf8'));
  const surahs = meta.sura;

  // Let's compute for each surah: which pages does it appear on?
  // Also for each page: which surahs and ayahs are on that page?
  const pageDetails = [];
  for (let i = 0; i < pages.length; i++) {
    const cur = pages[i];
    const nxt = pages[i + 1]; // could be null for page 604
    
    // Find juz for this page: last juz whose start is <= this page's start
    let curJuz = 1;
    for (const j of juzs) {
      if (j.sura < cur.sura || (j.sura === cur.sura && j.aya <= cur.aya)) {
        curJuz = j.juz;
      }
    }

    pageDetails.push({
      page: cur.page,
      sura: cur.sura,
      startAya: cur.aya,
      endSura: nxt ? (nxt.aya > 1 ? nxt.sura : (nxt.sura > cur.sura ? nxt.sura - 1 : cur.sura)) : 114,
      endAya: nxt ? (nxt.sura === cur.sura ? nxt.aya - 1 : (nxt.aya === 1 ? surahs[cur.sura - 1].ayas : nxt.aya - 1)) : 6,
      juz: curJuz,
    });
  }

  console.log('Page 1:', pageDetails[0]);
  console.log('Page 2:', pageDetails[1]);
  console.log('Page 3:', pageDetails[2]);
  console.log('Page 50:', pageDetails[49]);
  console.log('Page 604:', pageDetails[603]);
}

run().catch(console.error);
