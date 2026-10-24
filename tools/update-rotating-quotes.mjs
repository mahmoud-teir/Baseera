import fs from 'fs';
import path from 'path';

// 1. Update index.tsx
const homePath = path.resolve('src/app/(tabs)/(home)/index.tsx');
let homeContent = fs.readFileSync(homePath, 'utf8');

// Add imports
if (!homeContent.includes('DEFAULT_QUOTES')) {
  homeContent = homeContent.replace(
    "import { isVerifiedQuote, type Quote } from '@/data/content';",
    "import { isVerifiedQuote, type Quote } from '@/data/content';\nimport { DEFAULT_QUOTES } from '@/data/defaults';"
  );
}

if (!homeContent.includes('useState')) {
  homeContent = homeContent.replace(
    "import { ScrollView, View } from 'react-native';",
    "import { useEffect, useMemo, useState } from 'react';\nimport { ScrollView, View } from 'react-native';"
  );
}

// Update quotes logic
const oldQuotesLogic = "  const quotes = useContent((s) => s.quotes);\n  const pathsContent = useContent((s) => s.paths);";
const newQuotesLogic = `  const rawQuotes = useContent((s) => s.quotes);
  const quotes = rawQuotes.length ? rawQuotes : DEFAULT_QUOTES;
  const pathsContent = useContent((s) => s.paths);
  const [minuteTick, setMinuteTick] = useState(() => Math.floor(Date.now() / 60000));

  useEffect(() => {
    const timer = setInterval(() => {
      setMinuteTick(Math.floor(Date.now() / 60000));
    }, 60000);
    return () => clearInterval(timer);
  }, []);`;

if (homeContent.includes(oldQuotesLogic)) {
  homeContent = homeContent.replace(oldQuotesLogic, newQuotesLogic);
} else {
  // Try CRLF
  const oldCRLF = oldQuotesLogic.replace(/\n/g, '\r\n');
  const newCRLF = newQuotesLogic.replace(/\n/g, '\r\n');
  homeContent = homeContent.replace(oldCRLF, newCRLF);
}

// Update homeQuotes slice
const oldSlice = "  const homeQuotes: Quote[] = quotes.length ? quotes.slice(0, 3) : [{ id: 'pending', cat: '', text: null, scholar: null, source: null }];";
const newSlice = `  const homeQuotes: Quote[] = useMemo(() => {
    const verified = quotes.filter(isVerifiedQuote);
    if (!verified.length) {
      return [{ id: 'pending', cat: '', text: null, scholar: null, source: null }];
    }
    const startIndex = (minuteTick * 3) % verified.length;
    const selected: Quote[] = [];
    const count = Math.min(verified.length, 4);
    for (let i = 0; i < count; i++) {
      selected.push(verified[(startIndex + i) % verified.length]);
    }
    return selected;
  }, [quotes, minuteTick]);`;

if (homeContent.includes(oldSlice)) {
  homeContent = homeContent.replace(oldSlice, newSlice);
} else {
  const oldCRLF = oldSlice.replace(/\n/g, '\r\n');
  const newCRLF = newSlice.replace(/\n/g, '\r\n');
  homeContent = homeContent.replace(oldCRLF, newCRLF);
}

// Update SectionHeader
const oldHeader = "title=\"من أقوال العلماء\" actions={[{ label: 'عرض الكل', onPress: () => router.navigate('/quotes') }]}";
const newHeader = "title=\"من أقوال العلماء\" actions={[{ label: 'قول آخر ↻', onPress: () => setMinuteTick((prev) => prev + 1) }, { label: 'عرض الكل', onPress: () => router.navigate('/quotes') }]}";
homeContent = homeContent.replace(oldHeader, newHeader);

fs.writeFileSync(homePath, homeContent, 'utf8');
console.log('Updated index.tsx with rotating quotes successfully!');

// 2. Update quotes.tsx
const quotesPath = path.resolve('src/app/(tabs)/(home)/quotes.tsx');
let quotesContent = fs.readFileSync(quotesPath, 'utf8');

// Replace dayIndex with minuteTick
const oldDayIndex = "  const [dayIndex] = useState(() => Math.floor(Date.now() / 86400000));\n  const qotd = verified.length ? verified[dayIndex % verified.length] : null;";
const newDayIndex = `  const [minuteTick, setMinuteTick] = useState(() => Math.floor(Date.now() / 60000));
  useEffect(() => {
    const timer = setInterval(() => {
      setMinuteTick(Math.floor(Date.now() / 60000));
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  const qotd = verified.length ? verified[minuteTick % verified.length] : null;`;

if (quotesContent.includes(oldDayIndex)) {
  quotesContent = quotesContent.replace(oldDayIndex, newDayIndex);
} else {
  const oldCRLF = oldDayIndex.replace(/\n/g, '\r\n');
  const newCRLF = newDayIndex.replace(/\n/g, '\r\n');
  quotesContent = quotesContent.replace(oldCRLF, newCRLF);
}

// Ensure useEffect is imported in quotes.tsx
if (!quotesContent.includes('useEffect')) {
  quotesContent = quotesContent.replace(
    "import { type ComponentRef, useRef, useState } from 'react';",
    "import { type ComponentRef, useEffect, useRef, useState } from 'react';"
  );
}

// Replace قول اليوم header with rotating indicator and button
const oldTitleRow = `<Txt size={14} weight={600} color={gc}>
              قول اليوم
            </Txt>`;
const newTitleRow = `<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Txt size={14} weight={600} color={gc}>
                درر السلف (يتجدد كل دقيقة)
              </Txt>
              <Press
                onPress={() => setMinuteTick((prev) => prev + 1)}
                label="قول آخر"
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                }}>
                <Txt size={11} weight={700} color="#FFFFFF">
                  قول آخر ↻
                </Txt>
              </Press>
            </View>`;

if (quotesContent.includes(oldTitleRow)) {
  quotesContent = quotesContent.replace(oldTitleRow, newTitleRow);
} else {
  const oldCRLF = oldTitleRow.replace(/\n/g, '\r\n');
  const newCRLF = newTitleRow.replace(/\n/g, '\r\n');
  quotesContent = quotesContent.replace(oldCRLF, newCRLF);
}

fs.writeFileSync(quotesPath, quotesContent, 'utf8');
console.log('Updated quotes.tsx with rotating quotes successfully!');
