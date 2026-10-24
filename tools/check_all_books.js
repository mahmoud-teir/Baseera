const fs = require('fs');
const lib = fs.readFileSync('src/data/libraryData.ts', 'utf8');

function checkBook(id, nextId) {
  const start = lib.indexOf(`"id": "${id}"`);
  const end = nextId ? lib.indexOf(`"id": "${nextId}"`) : lib.length;
  const block = lib.slice(start, end);
  
  const chMatches = [...block.matchAll(/"title":\s*"([^"]+)"/g)].map(m => m[1]);
  const bookTitle = chMatches[0];
  const chapters = chMatches.slice(1);
  
  let chars = 0;
  const pars = [...block.matchAll(/"paragraphs":\s*\[([\s\S]*?)\]\s*\}/g)];
  let parCount = 0;
  pars.forEach(p => {
    const list = p[1].split('",\n').filter(s => s.trim().length > 0);
    parCount += list.length;
    chars += p[1].length;
  });
  
  console.log(`\n📚 [${id}] «${bookTitle}»`);
  console.log(`   Chapters (${chapters.length}):`, chapters);
  console.log(`   Estimated Paragraphs: ${parCount}, Size: ${chars} chars`);
}

checkBook('al-waraqat', 'al-ajrumiyyah');
checkBook('al-ajrumiyyah', 'ar-rahbiyyah');
checkBook('manzumat-al-bayquniyyah', 'al-waraqat');
checkBook('aqeedah-wasitiyyah', 'arbaeen-nawawiyyah');
checkBook('kitab-at-tawheed', 'usul-ath-thalatha');
