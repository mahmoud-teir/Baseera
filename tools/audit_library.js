const fs = require('fs');

async function audit() {
  const libContent = fs.readFileSync('src/data/libraryData.ts', 'utf8');

  // Load FULL_LIBRARY from tools/generate-full-library-and-publish.mjs
  const { FULL_LIBRARY } = await import('./generate-full-library-and-publish.mjs');

  console.log(`================================================================`);
  console.log(`📚 COMPREHENSIVE AUDIT OF ALL BOOKS (${FULL_LIBRARY.length} Textbooks)`);
  console.log(`================================================================`);

  FULL_LIBRARY.forEach((book, index) => {
    let totalChars = 0;
    let totalParagraphs = 0;
    book.chapters.forEach(ch => {
      totalParagraphs += ch.paragraphs.length;
      totalChars += ch.paragraphs.reduce((a, b) => a + b.length, 0);
    });

    console.log(`\n${index + 1}. [${book.id}] «${book.title}»`);
    console.log(`   المؤلف: ${book.author}`);
    console.log(`   التصنيف: ${book.category}`);
    console.log(`   الصفحات المعلنة: ${book.pages} صفحة | الفصول: ${book.chapters.length} أبواب | الفقرات: ${totalParagraphs} | عدد الحروف: ${totalChars.toLocaleString()} حرف`);
    console.log(`   الفصول:`);
    book.chapters.forEach((ch, ci) => {
      const chLen = ch.paragraphs.reduce((a, b) => a + b.length, 0);
      console.log(`     - الباب ${ci + 1}: "${ch.title}" (${ch.paragraphs.length} فقرة، ${chLen} حرف)`);
    });
  });
}

audit().catch(console.error);
