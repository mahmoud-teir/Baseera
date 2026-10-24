const fs = require('fs');

const shamelaPages = JSON.parse(fs.readFileSync('shamela_11126_full.json', 'utf8'));

console.log('=== Shamela 11126 Content Structure ===');
shamelaPages.forEach(p => {
  console.log(`\nPage ${p.page} headers & text:`);
  const lines = p.text.split(/(?<=[.!?؟:])\s+/);
  console.log('First 3 sentences:');
  lines.slice(0, 3).forEach(l => console.log('  -', l));
});
