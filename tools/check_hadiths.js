const fs = require('fs');
const lib = fs.readFileSync('src/data/libraryData.ts', 'utf8');

const start = lib.indexOf('"id": "arbaeen-nawawiyyah"');
const end = lib.indexOf('"id": "manzumat-al-bayquniyyah"');
const block = lib.slice(start, end);

// Count how many hadiths are in the paragraphs
const paragraphs = [...block.matchAll(/"([^"]*الحديث[^"]*)"/g)];
console.log('Paragraphs mentioning Hadith:', paragraphs.length);

const allPars = [...block.matchAll(/"paragraphs":\s*\[([\s\S]*?)\]/g)];
let totalP = 0;
allPars.forEach((ap, i) => {
  const items = ap[1].split('",\n').length;
  totalP += items;
  console.log(`Chapter ${i + 1} has ~${items} paragraphs`);
});
console.log('Total paragraphs in Arbaeen:', totalP);
