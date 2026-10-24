const fs = require('fs');
const https = require('https');

// 1. Read our local library data
const libraryContent = fs.readFileSync('src/data/libraryData.ts', 'utf8');
const match = libraryContent.match(/\{\s*"id":\s*"usul-ath-thalatha"[\s\S]*?\}\s*,\s*\{\s*"id":/);
let ourBook = null;
if (match) {
  const jsonStr = match[0].replace(/,\s*\{\s*"id":$/, '');
  try {
    ourBook = JSON.parse(jsonStr);
  } catch (e) {
    console.log('JSON parse error, attempting extraction via eval/regex');
  }
}

// 2. Fetch all 12 pages of Shamela 11126
function fetchPage(p) {
  return new Promise((resolve) => {
    https.get(`https://shamela.ws/book/11126/${p}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const nassMatch = data.match(/<div class="nass[^>]*>([\s\S]*?)<\/div>/);
        const text = nassMatch ? nassMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
        resolve({ page: p, text });
      });
    }).on('error', () => resolve({ page: p, text: '' }));
  });
}

async function run() {
  const shamelaPages = [];
  for (let p = 1; p <= 12; p++) {
    const res = await fetchPage(p);
    shamelaPages.push(res);
  }

  fs.writeFileSync('shamela_11126_full.json', JSON.stringify(shamelaPages, null, 2), 'utf8');
  console.log('Fetched 12 pages of Shamela 11126.');

  // Total characters in Shamela:
  const shamelaTotalChars = shamelaPages.reduce((acc, p) => acc + p.text.length, 0);
  console.log('Shamela total characters:', shamelaTotalChars);

  // Print summary of each shamela page
  shamelaPages.forEach(p => {
    console.log(`Page ${p.page} (${p.text.length} chars): ${p.text.slice(0, 100)}...`);
  });
}

run();
