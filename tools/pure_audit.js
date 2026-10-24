const fs = require('fs');

const libText = fs.readFileSync('src/data/libraryData.ts', 'utf8');

// Match each book definition inside DEFAULT_LIBRARY
const books = [];
const bookRegex = /\{\s*"id":\s*"([^"]+)"[\s\S]*?"title":\s*"([^"]+)"[\s\S]*?"author":\s*"([^"]+)"[\s\S]*?"pages":\s*(\d+)[\s\S]*?"chapters":\s*(\[[\s\S]*?\])\s*\}/g;

// Instead of regex for chapters, let's find objects safely
const startMarker = 'export const DEFAULT_LIBRARY: LibraryItem[] = [';
const jsonStart = libText.indexOf(startMarker) + startMarker.length - 1;
const jsonEnd = libText.lastIndexOf('];') + 1;
const rawJson = libText.slice(jsonStart, jsonEnd);

let parsedBooks;
try {
  parsedBooks = JSON.parse(rawJson);
} catch (e) {
  console.log('Direct JSON parse failed at:', e.message);
  // Alternative: use eval or function wrapper
  const wrapped = 'const LibraryItem = null;\nreturn ' + rawJson;
  parsedBooks = new Function(wrapped)();
}

console.log(`================================================================`);
console.log(`📚 AUDIT RESULTS FOR ALL ${parsedBooks.length} BOOKS IN libraryData.ts`);
console.log(`================================================================\n`);

parsedBooks.forEach((book, i) => {
  let chars = 0;
  let pars = 0;
  book.chapters.forEach(c => {
    pars += c.paragraphs.length;
    chars += c.paragraphs.reduce((a, b) => a + b.length, 0);
  });

  console.log(`${i + 1}. [${book.id}] «${book.title}»`);
  console.log(`   المؤلف: ${book.author}`);
  console.log(`   التصنيف: ${book.category}`);
  console.log(`   الصفحات المكتوبة: ${book.pages} | الأبواب: ${book.chapters.length} | الفقرات: ${pars} | مجموع الحروف: ${chars.toLocaleString()} حرف`);
  console.log(`   الأبواب:`);
  book.chapters.forEach((c, ci) => {
    const chLen = c.paragraphs.reduce((a, b) => a + b.length, 0);
    console.log(`     (${ci + 1}) ${c.title} [${c.paragraphs.length} فقرات, ${chLen} حرف]`);
  });
  console.log('----------------------------------------------------------------');
});
