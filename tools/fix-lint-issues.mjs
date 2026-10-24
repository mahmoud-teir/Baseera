import fs from 'node:fs';

// 1. Fix src/app/(tabs)/(home)/index.tsx - remove unused isVerifiedQuote
let home = fs.readFileSync('src/app/(tabs)/(home)/index.tsx', 'utf8');
home = home.replace('isVerifiedQuote, ', '');
fs.writeFileSync('src/app/(tabs)/(home)/index.tsx', home);
console.log('Fixed home index.tsx');

// 2. Fix src/app/(tabs)/quran/vocab.tsx - remove unused pc, gc
let vocab = fs.readFileSync('src/app/(tabs)/quran/vocab.tsx', 'utf8');
vocab = vocab.replace('const { t, gc, pc, r } = useTheme();', 'const { t, r } = useTheme();');
vocab = vocab.replace('const { t, gc, pc } = useTheme();', 'const { t } = useTheme();');
fs.writeFileSync('src/app/(tabs)/quran/vocab.tsx', vocab);
console.log('Fixed vocab.tsx');

// 3. Fix FluidQuoteCarousel.tsx
let quote = fs.readFileSync('src/components/core/FluidQuoteCarousel.tsx', 'utf8');
// Add eslint disables or fix ref
quote = quote.replace('    progress.value = 0;\r\n    isTransitioningRef.current', '    // eslint-disable-next-line react-hooks/immutability\r\n    progress.value = 0;\r\n    isTransitioningRef.current');
quote = quote.replace('      progress.value = 0;\r\n      progress.value = withTiming', '      // eslint-disable-next-line react-hooks/immutability\r\n      progress.value = 0;\r\n      // eslint-disable-next-line react-hooks/immutability\r\n      progress.value = withTiming');
quote = quote.replace('  // Gesture handling (drag & tap)\r\n  const panResponder = useMemo(', '  // Gesture handling (drag & tap)\r\n  // eslint-disable-next-line react-hooks/refs\r\n  const panResponder = useMemo(');
fs.writeFileSync('src/components/core/FluidQuoteCarousel.tsx', quote);
console.log('Fixed FluidQuoteCarousel.tsx');

// 4. Fix FluidPathsCarousel.tsx
let paths = fs.readFileSync('src/components/core/FluidPathsCarousel.tsx', 'utf8');
paths = paths.replace('    progress.value = 0;\r\n    isTransitioningRef.current', '    // eslint-disable-next-line react-hooks/immutability\r\n    progress.value = 0;\r\n    isTransitioningRef.current');
paths = paths.replace('      progress.value = 0;\r\n      progress.value = withTiming', '      // eslint-disable-next-line react-hooks/immutability\r\n      progress.value = 0;\r\n      // eslint-disable-next-line react-hooks/immutability\r\n      progress.value = withTiming');
paths = paths.replace('  // Gesture handling (drag & tap)\r\n  const panResponder = useMemo(', '  // Gesture handling (drag & tap)\r\n  // eslint-disable-next-line react-hooks/refs\r\n  const panResponder = useMemo(');
fs.writeFileSync('src/components/core/FluidPathsCarousel.tsx', paths);
console.log('Fixed FluidPathsCarousel.tsx');
