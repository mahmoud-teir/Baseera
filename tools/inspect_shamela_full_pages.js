const fs = require('fs');

const shamelaPages = JSON.parse(fs.readFileSync('shamela_11126_full.json', 'utf8'));

console.log('=== SHAMELA 11126 PAGE-BY-PAGE BREAKDOWN ===');
shamelaPages.forEach(p => {
  console.log(`\n-----------------------------------------`);
  console.log(`📄 صفحة ${p.page} (${p.text.length} حرف):`);
  console.log(`-----------------------------------------`);
  console.log(p.text);
});
