const fs = require('fs');

const shamelaPages = JSON.parse(fs.readFileSync('shamela_11126_full.json', 'utf8'));

let out = '';
shamelaPages.forEach(p => {
  out += `\n================== PAGE ${p.page} ==================\n`;
  out += p.text.replace(/\s+/g, ' ').trim() + '\n';
});

fs.writeFileSync('shamela_clean.txt', out, 'utf8');
console.log('Written to shamela_clean.txt, bytes:', Buffer.byteLength(out, 'utf8'));
