import fs from 'node:fs';

// 1. vocab.tsx
let vocab = fs.readFileSync('src/app/(tabs)/quran/vocab.tsx', 'utf8');
vocab = vocab.replace('const { t, pc, gc, r } = useTheme();', 'const { t, r } = useTheme();');
fs.writeFileSync('src/app/(tabs)/quran/vocab.tsx', vocab);
console.log('Updated vocab.tsx');

// 2. FluidQuoteCarousel.tsx
let quote = fs.readFileSync('src/components/core/FluidQuoteCarousel.tsx', 'utf8');
// remove [progress] from finishTransition
quote = quote.replace('}, [progress]);', '}, []);');
// remove progress from transitionTo deps
quote = quote.replace('[count, currentIndex, finishTransition, progress]', '[count, currentIndex, finishTransition]');

// replace panResponder with ref-based
const oldQuotePan = `  // Gesture handling (drag & tap)
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12,
        onPanResponderGrant: () => {
          isPausedRef.current = true;
        },
        onPanResponderRelease: (_, g) => {
          isPausedRef.current = false;
          // في اللغة العربية (RTL):
          // السحب لليسار (dx < -35) ينتقل للقول التالي (حركة من اليمين لليسار)
          if (g.dx < -35) {
            goToNext();
          } else if (g.dx > 35) {
            goToPrev();
          } else if (Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8) {
            if (currentQuote && onPressQuote) {
              onPressQuote(currentQuote);
            }
          }
        },
        onPanResponderTerminate: () => {
          isPausedRef.current = false;
        },
      }),
    [currentQuote, goToNext, goToPrev, onPressQuote]
  );`;

const newQuotePan = `  const quoteRef = useRef(currentQuote);
  quoteRef.current = currentQuote;
  const nextRef = useRef(goToNext);
  nextRef.current = goToNext;
  const prevRef = useRef(goToPrev);
  prevRef.current = goToPrev;
  const pressRef = useRef(onPressQuote);
  pressRef.current = onPressQuote;

  // Gesture handling (drag & tap)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12,
      onPanResponderGrant: () => {
        isPausedRef.current = true;
      },
      onPanResponderRelease: (_, g) => {
        isPausedRef.current = false;
        // في اللغة العربية (RTL):
        // السحب لليسار (dx < -35) ينتقل للقول التالي (حركة من اليمين لليسار)
        if (g.dx < -35) {
          nextRef.current();
        } else if (g.dx > 35) {
          prevRef.current();
        } else if (Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8) {
          if (quoteRef.current && pressRef.current) {
            pressRef.current(quoteRef.current);
          }
        }
      },
      onPanResponderTerminate: () => {
        isPausedRef.current = false;
      },
    })
  ).current;`;

quote = quote.replace(oldQuotePan.replace(/\r?\n/g, '\r\n'), newQuotePan.replace(/\r?\n/g, '\r\n'));
// If line endings are LF:
if (quote.includes(oldQuotePan.replace(/\r?\n/g, '\n'))) {
  quote = quote.replace(oldQuotePan.replace(/\r?\n/g, '\n'), newQuotePan.replace(/\r?\n/g, '\n'));
}
fs.writeFileSync('src/components/core/FluidQuoteCarousel.tsx', quote);
console.log('Updated FluidQuoteCarousel.tsx');

// 3. FluidPathsCarousel.tsx
let paths = fs.readFileSync('src/components/core/FluidPathsCarousel.tsx', 'utf8');
paths = paths.replace('}, [progress]);', '}, []);');
paths = paths.replace('[count, currentIndex, finishTransition, progress]', '[count, currentIndex, finishTransition]');

const oldPathsPan = `  // Gesture handling (drag & tap)
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12,
        onPanResponderGrant: () => {
          isPausedRef.current = true;
        },
        onPanResponderRelease: (_, g) => {
          isPausedRef.current = false;
          if (g.dx < -35) {
            goToNext();
          } else if (g.dx > 35) {
            goToPrev();
          } else if (Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8) {
            if (currentPath && onPressPath) {
              onPressPath(currentPath);
            }
          }
        },
        onPanResponderTerminate: () => {
          isPausedRef.current = false;
        },
      }),
    [currentPath, goToNext, goToPrev, onPressPath]
  );`;

const newPathsPan = `  const pathRef = useRef(currentPath);
  pathRef.current = currentPath;
  const nextRef = useRef(goToNext);
  nextRef.current = goToNext;
  const prevRef = useRef(goToPrev);
  prevRef.current = goToPrev;
  const pressRef = useRef(onPressPath);
  pressRef.current = onPressPath;

  // Gesture handling (drag & tap)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12,
      onPanResponderGrant: () => {
        isPausedRef.current = true;
      },
      onPanResponderRelease: (_, g) => {
        isPausedRef.current = false;
        if (g.dx < -35) {
          nextRef.current();
        } else if (g.dx > 35) {
          prevRef.current();
        } else if (Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8) {
          if (pathRef.current && pressRef.current) {
            pressRef.current(pathRef.current);
          }
        }
      },
      onPanResponderTerminate: () => {
        isPausedRef.current = false;
      },
    })
  ).current;`;

paths = paths.replace(oldPathsPan.replace(/\r?\n/g, '\r\n'), newPathsPan.replace(/\r?\n/g, '\r\n'));
if (paths.includes(oldPathsPan.replace(/\r?\n/g, '\n'))) {
  paths = paths.replace(oldPathsPan.replace(/\r?\n/g, '\n'), newPathsPan.replace(/\r?\n/g, '\n'));
}
fs.writeFileSync('src/components/core/FluidPathsCarousel.tsx', paths);
console.log('Updated FluidPathsCarousel.tsx');
