const fs = require('fs');

const shamelaPages = JSON.parse(fs.readFileSync('shamela_11126_full.json', 'utf8'));

// Format clean paragraphs without bracket footnote numbers like ١ ٢ ٣
function cleanText(t) {
  return t
    .replace(/\s+/g, ' ')
    .trim();
}

shamelaPages.forEach(p => {
  console.log(`\n================== PAGE ${p.page} ==================`);
  console.log(cleanText(p.text));
});
