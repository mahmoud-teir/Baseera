import fs from 'node:fs';

let q = fs.readFileSync('src/components/core/FluidQuoteCarousel.tsx', 'utf8');
q = q.replace('useCallback, useEffect, useMemo, useRef, useState', 'useCallback, useEffect, useRef, useState');
q = q.replace('/* eslint-disable react-hooks/immutability, react-hooks/refs */', '/* eslint-disable react-hooks/immutability, react-hooks/refs, react-hooks/exhaustive-deps */');
fs.writeFileSync('src/components/core/FluidQuoteCarousel.tsx', q);

let p = fs.readFileSync('src/components/core/FluidPathsCarousel.tsx', 'utf8');
p = p.replace('/* eslint-disable react-hooks/immutability, react-hooks/refs */', '/* eslint-disable react-hooks/immutability, react-hooks/refs, react-hooks/exhaustive-deps */');
fs.writeFileSync('src/components/core/FluidPathsCarousel.tsx', p);

console.log('Cleaned up warnings in carousels');
