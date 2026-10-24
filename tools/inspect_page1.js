const fs = require('fs');

const html = fs.readFileSync('shamela_page1.html', 'utf8');

// Find page text inside <div class="nass ...">
const nassMatch = html.match(/<div class="nass[^>]*>([\s\S]*?)<\/div>/);
if (nassMatch) {
  const text = nassMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  console.log('Page 1 Text Sample:\n', text.slice(0, 500));
}

// Find pagination or total pages
const pageSelect = html.match(/<select[^>]*id="fld_goto_page"[^>]*>([\s\S]*?)<\/select>/);
if (pageSelect) {
  const options = [...pageSelect[1].matchAll(/value="(\d+)"/g)].map(m => m[1]);
  console.log('Total pages in select dropdown:', options.length, 'Max page:', Math.max(...options.map(Number)));
} else {
  // Look for any pattern indicating page numbers or last page link
  const pageMatches = [...html.matchAll(/\/book\/11126\/(\d+)/g)].map(m => Number(m[1]));
  console.log('Found page numbers in links:', [...new Set(pageMatches)].sort((a,b) => a-b));
}

// Look for TOC (الفهرس)
const tocMatch = html.match(/<div class="toc[^>]*>([\s\S]*?)<\/div>/) || html.match(/class="[^"]*toc[^"]*"[^>]*>([\s\S]*?)<\/div>/);
if (tocMatch) {
  console.log('TOC found:', tocMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500));
}
