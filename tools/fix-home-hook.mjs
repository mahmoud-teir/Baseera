import fs from 'fs';
import path from 'path';

const p = path.resolve('src/app/(tabs)/(home)/index.tsx');
let c = fs.readFileSync(p, 'utf8');

// Regex match homeQuotes
const hookRegex = /\s*const homeQuotes: Quote\[\] = useMemo\(\(\) => \{[\s\S]*?\n\s*\}, \[quotes, minuteTick\]\);/;
const match = c.match(hookRegex);

if (!match) {
  console.error('homeQuotes regex not matched');
  process.exit(1);
}

const matchedText = match[0].trim();
// Remove it
c = c.replace(match[0], '');

// Insert it before `const map = mapMastery`
const mapIdx = c.indexOf('const map = mapMastery');
if (mapIdx === -1) {
  console.error('mapMastery not found');
  process.exit(1);
}

// Find line start before mapIdx
c = c.slice(0, mapIdx) + matchedText + '\n\n  ' + c.slice(mapIdx);

fs.writeFileSync(p, c, 'utf8');
console.log('Successfully moved homeQuotes before mapMastery!');
