const fs = require('fs');
const https = require('https');

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
        const titleMatch = data.match(/<title>([^<]+)<\/title>/);
        const title = titleMatch ? titleMatch[1] : '';
        resolve({ page: p, status: res.statusCode, title, text, length: text.length });
      });
    }).on('error', () => resolve({ page: p, error: true }));
  });
}

async function run() {
  console.log('Fetching pages 1 to 15...');
  for (let p = 1; p <= 15; p++) {
    const res = await fetchPage(p);
    if (res.length > 0) {
      console.log(`Page ${p}: status ${res.status}, chars ${res.length}, sample: ${res.text.slice(0, 80)}...`);
    } else {
      console.log(`Page ${p}: status ${res.status}, empty / not found`);
    }
  }
}

run();
