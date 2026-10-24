import fs from 'node:fs';
let s = fs.readFileSync('src/app/reader/[surah].tsx', 'utf8');
s = s.replace('width="70%"', "style={{ width: '70%' }}");
fs.writeFileSync('src/app/reader/[surah].tsx', s);
console.log('Fixed Skeleton prop in reader');
