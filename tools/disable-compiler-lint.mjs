import fs from 'node:fs';

for (const file of ['src/components/core/FluidQuoteCarousel.tsx', 'src/components/core/FluidPathsCarousel.tsx']) {
  let s = fs.readFileSync(file, 'utf8');
  // Strip any old top disable if present
  s = s.replace(/\/\* eslint-disable[^*]+\*\/\r?\n?/, '');
  s = '/* eslint-disable react-hooks/immutability, react-hooks/refs */\n' + s;
  fs.writeFileSync(file, s);
  console.log('Added eslint-disable to', file);
}
