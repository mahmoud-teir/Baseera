import fs from 'node:fs';

const path = 'src/services/tafsir.ts';
let s = fs.readFileSync(path, 'utf8');

const oldBlock = `    if (MEM_CACHE[cacheKey]) {
      setData({ key: cacheKey, map: MEM_CACHE[cacheKey], loading: false, error: false });
      return;
    }`;

const newBlock = `    if (MEM_CACHE[cacheKey]) return;`;

const norm = (str) => str.replace(/\r?\n/g, '\n');
const isCRLF = s.includes('\r\n');
const toFileEnding = (str) => isCRLF ? str.replace(/\n/g, '\r\n') : str.replace(/\r\n/g, '\n');

s = toFileEnding(norm(s).replace(norm(oldBlock), norm(newBlock)));
fs.writeFileSync(path, s);
console.log('Removed synchronous setData from effect in tafsir.ts');
