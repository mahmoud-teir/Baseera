const fs = require('fs');

const html = fs.readFileSync('shamela_11126.html', 'utf8');

// Search for card metadata
const lines = html.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('بطاقة الكتاب') || line.includes('الكتاب:') || line.includes('المؤلف:') || line.includes('عدد الصفحات') || line.includes('الجزء:')) {
    console.log(lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 5)).join('\n'));
    console.log('---');
  }
}

// Extract any links to pages or page count
const pageLinks = html.match(/href="https:\/\/shamela\.ws\/book\/11126\/(\d+)"/g) || [];
console.log('Found page links count:', pageLinks.length);
if (pageLinks.length > 0) {
  console.log('First 5 links:', pageLinks.slice(0, 5));
  console.log('Last 5 links:', pageLinks.slice(-5));
}
