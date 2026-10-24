import { lessonsFor } from '@/data/content';
import { LESSON_CODES, MAP_NODES, PLAN_TEMPLATES, storySuffix, storyTitle } from '@/data/structural';
import { mapMastery } from '@/features/academy/useAcademy';
import { dayComplete, planStreak } from '@/features/plan/plan';
import { doneOn, doneOver, fullDayStreak, LOG_PRAYERS } from '@/features/prayer/log';
import { addToLog, ayahRanges, dayTotals, durationLabel, mergeQuranLogs, readingStreak, type QuranLog } from '@/features/quran/log';
import { mergeSnapshots, snapshot } from '@/services/sync';
import { doneCount, dueSrsCards, INITIAL_STATE, lessonStates, scoreQuiz, useApp } from '@/state/app-store';
import { buildContent, type Row } from '@/state/content-store';
import { addDays, dayKey, DAY, lastDays } from '@/utils/date';
import { mix, oklch } from '@/utils/color';
import { getPageForAyah, getPagesForSurah, juzName, toArabicDigits } from '@/data/quran/pages';

// Test fixture only: 8 published AQ lessons with 8 questions each (the app ships no lessons).
const KEY = [1, 0, 2, 1, 3, 0, 2, 1];
const fixtureRows: Row[] = Array.from({ length: 8 }, (_, n) => ({
  id: 'l' + n,
  kind: 'lesson',
  slot: `AQ-0${n + 1}`,
  data: {
    title: `درس اختبار ${n + 1}`,
    minutes: 10,
    objectives: ['هدف'],
    sections: [{ heading: 'الشرح', body: 'نص' }],
    summary: [],
    quiz: { passPct: 85, questions: KEY.map((answer, i) => ({ id: `q${i}`, q: 'سؤال', options: ['أ', 'ب', 'ج', 'د'], answer, explain: '' })) },
  },
}));
const LESSONS = buildContent(fixtureRows).lessons;
const aq = lessonsFor(LESSONS, 'AQ');
const all = (code: string) => LESSONS.find((l) => l.code === code)!.quiz.questions.map((q) => q.answer);

beforeEach(() => useApp.setState({ ...INITIAL_STATE }));

describe('published content model', () => {
  it('builds lessons from published rows in code order, with evidence attached by slot', () => {
    const c = buildContent([
      ...fixtureRows.slice(0, 2).reverse(),
      { id: 'e2', kind: 'evidence', slot: 'AQ-01/e2', data: { kind: 'hadith', label: 'حديث', text: 'نص', source: 'مصدر', ref: '' } },
      { id: 'e1', kind: 'evidence', slot: 'AQ-01/e1', data: { kind: 'quran', label: 'آية', text: 'نص', source: 'مصدر', ref: '1:1', level: 1 } },
    ]);
    expect(c.lessons.map((l) => l.code)).toEqual(['AQ-01', 'AQ-02']);
    expect(c.lessons[0].evidence.map((e) => e.kind)).toEqual(['quran', 'hadith']);
  });
  it('drops invalid rows instead of showing them', () => {
    const c = buildContent([
      { id: 'x', kind: 'lesson', slot: 'AQ-09', data: { title: 'بلا أسئلة', objectives: [], sections: [], quiz: { passPct: 85, questions: [] } } },
      { id: 'y', kind: 'quote', slot: 'q1', data: { cat: 'الفقه', text: 'نص', scholar: '', source: 'مصدر' } },
      { id: 'z', kind: 'adhkar', slot: 'morning', data: { items: [{ id: 'm1', text: 'نص', count: 3, source: '' }] } },
    ]);
    expect(c.lessons).toHaveLength(0);
    expect(c.quotes).toHaveLength(0);
    expect(c.adhkar.morning).toBeUndefined();
  });
  it('lesson routes cover the 53-lesson curriculum outline; the map has 19 nodes', () => {
    expect(LESSON_CODES).toHaveLength(53);
    expect(LESSON_CODES[0]).toBe('AQ-01');
    expect(MAP_NODES).toHaveLength(19);
  });
});

describe('lesson unlocking (HANDOFF §7)', () => {
  it('opens only the first lesson initially', () => {
    expect(lessonStates(aq, {}).map((s) => s.state)).toEqual(['current', 'locked', 'locked', 'locked', 'locked', 'locked', 'locked', 'locked']);
  });
  it('opens n+1 after passing n', () => {
    const passed = { 'AQ-01': { pct: 100, at: 1 } };
    expect(lessonStates(aq, passed).slice(0, 3).map((s) => s.state)).toEqual(['done', 'current', 'locked']);
    expect(doneCount(aq, passed)).toBe(1);
  });
});

describe('quiz scoring', () => {
  const lesson = aq[0];
  it('passes at ≥ 85%', () => {
    const ok = all('AQ-01');
    expect(scoreQuiz(lesson, ok)).toMatchObject({ right: 8, pct: 100, pass: true });
    const sevenRight = [...ok];
    sevenRight[0] = (ok[0] + 1) % 4;
    expect(scoreQuiz(lesson, sevenRight)).toMatchObject({ right: 7, pct: 88, pass: true });
    const sixRight = [...sevenRight];
    sixRight[1] = (ok[1] + 1) % 4;
    expect(scoreQuiz(lesson, sixRight)).toMatchObject({ right: 6, pct: 75, pass: false });
  });
  it('recordQuiz unlocks on pass and schedules wrong answers for spaced review', () => {
    const answers = [...all('AQ-01')];
    answers[2] = (answers[2] + 1) % 4;
    const res = useApp.getState().recordQuiz(lesson, answers);
    expect(res.pass).toBe(true);
    const st = useApp.getState();
    expect(st.passed['AQ-01']).toBeDefined();
    expect(Object.keys(st.srs)).toEqual(['AQ-01:q2']);
    expect(dueSrsCards(st.srs)).toHaveLength(0); // due tomorrow
    expect(dueSrsCards(st.srs, Date.now() + 2 * DAY)).toHaveLength(1);
  });
  it('a failed attempt does not unlock', () => {
    useApp.getState().recordQuiz(lesson, [0, 0, 0, 0, 0, 0, 0, 0]);
    expect(useApp.getState().passed['AQ-01']).toBeUndefined();
    expect(useApp.getState().attempts['AQ-01']).toBe(1);
  });
  it('rating a card reschedules it', () => {
    useApp.getState().recordQuiz(lesson, [0, 0, 0, 0, 0, 0, 0, 0]);
    const id = Object.keys(useApp.getState().srs)[0];
    useApp.getState().rateSrs(id, 7);
    expect(useApp.getState().srs[id].interval).toBe(7);
  });
});

describe('knowledge map', () => {
  it('lights التوحيد after AQ-01 and العقيدة after all AQ lessons', () => {
    let m = mapMastery({}, {}, LESSONS);
    expect(m.lit).toBe(0);
    expect(m.available('tawheed')).toBe(true);
    expect(m.available('aqeedah')).toBe(false);
    m = mapMastery({ 'AQ-01': { pct: 100, at: 1 } }, {}, LESSONS);
    expect(m.mastered('tawheed')).toBe(true);
    expect(m.available('aqeedah')).toBe(true);
    const allPassed = Object.fromEntries(aq.map((l) => [l.code, { pct: 100, at: 1 }]));
    expect(mapMastery(allPassed, {}, LESSONS).mastered('aqeedah')).toBe(true);
  });
  it('requires all prerequisites (أصول الفقه needs three)', () => {
    const m = mapMastery({ 'AQ-01': { pct: 100, at: 1 } }, { taharah: true, salah: true, zakat: true, muamalat: true, mawarith: true, ahwal: true }, LESSONS);
    expect(m.available('usul')).toBe(false);
  });
});

describe('daily plan streak', () => {
  it('counts consecutive completed days', () => {
    const full = Object.fromEntries(PLAN_TEMPLATES[15].map((_, i) => [`15:${i}`, true]));
    expect(dayComplete(full)).toBe(true);
    const now = new Date(2026, 9, 20, 12);
    const pd = { [dayKey(now)]: full, [dayKey(addDays(now, -1))]: full, [dayKey(addDays(now, -3))]: full };
    expect(planStreak(pd, now)).toBe(2);
  });
});

describe('sync merge', () => {
  it('keeps the union of passed lessons and notes', () => {
    const local = { ...snapshot({ ...INITIAL_STATE, passed: { 'AQ-01': { pct: 90, at: 5 } }, notes: [{ id: 'a', text: 'x', at: 2 }] }), updatedAt: 10 };
    const remote = snapshot({ ...INITIAL_STATE, passed: { 'AQ-02': { pct: 100, at: 7 }, 'AQ-01': { pct: 95, at: 9 } }, notes: [{ id: 'b', text: 'y', at: 3 }] });
    const m = mergeSnapshots(local, remote, 5);
    expect(Object.keys(m.passed!).sort()).toEqual(['AQ-01', 'AQ-02']);
    expect(m.passed!['AQ-01']).toEqual({ pct: 95, at: 5 });
    expect(m.notes!.map((n) => n.id)).toEqual(['b', 'a']);
  });
});

describe('prayer log', () => {
  const now = new Date(2026, 9, 21, 15);
  const all = Object.fromEntries(LOG_PRAYERS.map((p) => [p, true]));
  it('counts the five prayers per day and over a range', () => {
    const prayed = { [dayKey(now)]: { الفجر: true, الظهر: true, الشروق: true }, [dayKey(addDays(now, -1))]: all };
    expect(lastDays(3, now)).toEqual(['2026-10-21', '2026-10-20', '2026-10-19']);
    expect(doneOn(prayed, dayKey(now))).toBe(2);
    expect(doneOver(prayed, lastDays(7, now))).toBe(7);
  });
  it('counts full days in a row; an unfinished today does not break the streak', () => {
    const k = (i: number) => dayKey(addDays(now, -i));
    expect(fullDayStreak({ [k(0)]: { الفجر: true }, [k(1)]: all, [k(2)]: all, [k(4)]: all }, now)).toBe(2);
    expect(fullDayStreak({ [k(0)]: all, [k(1)]: all }, now)).toBe(2);
    expect(fullDayStreak({ [k(2)]: all }, now)).toBe(0);
  });
  it('records the tick time and clears it when unticked', () => {
    useApp.setState({ prayed: {}, prayedAt: {} });
    useApp.getState().togglePrayed('الظهر', '2026-10-20');
    expect(useApp.getState().prayed['2026-10-20']['الظهر']).toBe(true);
    expect(typeof useApp.getState().prayedAt['2026-10-20']['الظهر']).toBe('number');
    useApp.getState().togglePrayed('الظهر', '2026-10-20');
    expect(useApp.getState().prayed['2026-10-20']['الظهر']).toBe(false);
    expect(useApp.getState().prayedAt['2026-10-20']['الظهر']).toBeUndefined();
  });
});

describe('quran log', () => {
  const now = new Date(2026, 9, 21, 15);
  const today = dayKey(now);
  it('accumulates ayahs (deduplicated) and time per surah and day', () => {
    let log = addToLog({}, today, 2, { read: [3, 1, 2], seconds: 30 }, 1);
    log = addToLog(log, today, 2, { read: [2, 3, 4], heard: [10], seconds: 15 }, 2);
    log = addToLog(log, today, 1, { heard: [1, 2] }, 3);
    expect(log[today][2]).toEqual({ a: [1, 2, 3, 4], l: [10], s: 45, at: 2 });
    expect(dayTotals(log, today)).toEqual({ ayahs: 7, seconds: 45, surahs: 2 });
  });
  it('writes ranges compactly', () => {
    expect(ayahRanges([1, 2, 3, 7, 9, 10])).toBe('1–3، 7، 9–10');
    expect(ayahRanges([])).toBe('');
    expect(durationLabel(20)).toBe('أقل من دقيقة');
    expect(durationLabel(65 * 60)).toBe('1 س 5 د');
  });
  it('counts reading days in a row', () => {
    const k = (i: number) => dayKey(addDays(now, -i));
    const log = { [k(1)]: { 1: { a: [1], l: [], s: 5, at: 1 } }, [k(2)]: { 1: { a: [], l: [2], s: 5, at: 1 } } };
    expect(readingStreak(log, now)).toBe(2);
    expect(readingStreak({}, now)).toBe(0);
  });
  it('merges two devices without losing or double-counting', () => {
    const x: QuranLog = { [today]: { 2: { a: [1, 2], l: [], s: 60, at: 5 } } };
    const y: QuranLog = { [today]: { 2: { a: [2, 3], l: [4], s: 40, at: 9 }, 3: { a: [1], l: [], s: 5, at: 9 } }, '2026-10-01': { 1: { a: [1], l: [], s: 5, at: 1 } } };
    const m = mergeQuranLogs(x, y);
    expect(m[today][2]).toEqual({ a: [1, 2, 3], l: [4], s: 60, at: 9 });
    expect(Object.keys(m).sort()).toEqual(['2026-10-01', today]);
    const local = { ...snapshot({ ...INITIAL_STATE, quranLog: x }), updatedAt: 10 };
    expect(mergeSnapshots(local, snapshot({ ...INITIAL_STATE, quranLog: y }), 5).quranLog).toEqual(m);
  });
});

describe('stories honorifics', () => {
  it('uses the correct honorific per category', () => {
    expect(storySuffix('prophets', 'محمد')).toBe('صلى الله عليه وسلم');
    expect(storySuffix('angels', 'جبريل')).toBe('عليه السلام');
    expect(storySuffix('angels', 'حملة العرش')).toBe('عليهم السلام');
    expect(storyTitle('angels', 'مالك')).toBe('الملك مالك');
    expect(storyTitle('prophets', 'نوح')).toBe('النبي نوح');
  });
});

describe('colour helpers', () => {
  it('reproduces color-mix and oklch', () => {
    expect(mix('#145C4B', 12, '#FFFFFF')).toBe('#E3EBE9');
    expect(oklch(0.4, 0.08, 165)).toMatch(/^#[0-9A-F]{6}$/);
  });
});

describe('quran pages mapping (Madinah 604 pages)', () => {
  it('maps pages and ayahs accurately across boundaries', () => {
    expect(getPageForAyah(1, 1)).toBe(1);
    expect(getPageForAyah(1, 7)).toBe(1);
    expect(getPageForAyah(2, 1)).toBe(2);
    expect(getPageForAyah(2, 5)).toBe(2);
    expect(getPageForAyah(2, 6)).toBe(3);
    expect(getPageForAyah(114, 6)).toBe(604);
  });

  it('segments surahs into valid contiguous page ranges', () => {
    const fatiha = getPagesForSurah(1);
    expect(fatiha).toHaveLength(1);
    expect(fatiha[0]).toEqual({ page: 1, juz: 1, startAyah: 1, endAyah: 7, hasBasmala: false });

    const baqarah = getPagesForSurah(2);
    expect(baqarah[0]).toEqual({ page: 2, juz: 1, startAyah: 1, endAyah: 5, hasBasmala: true });
    expect(baqarah[1]).toEqual({ page: 3, juz: 1, startAyah: 6, endAyah: 16, hasBasmala: false });
    expect(baqarah[baqarah.length - 1].page).toBe(49);
    expect(baqarah[baqarah.length - 1].endAyah).toBe(286);
  });

  it('formats arabic digits and juz titles', () => {
    expect(toArabicDigits(1)).toBe('١');
    expect(toArabicDigits(604)).toBe('٦٠٤');
    expect(juzName(1)).toBe('الجزء الأول');
    expect(juzName(30)).toBe('الجزء الثلاثون');
  });
});

describe('adhkar counter & reset', () => {
  it('taps, resets single item, and resets category', () => {
    const today = dayKey();
    useApp.setState({ adC: {} });

    // Tap morning m12 3 times
    useApp.getState().tapDhikr('morning', 'm12');
    useApp.getState().tapDhikr('morning', 'm12');
    useApp.getState().tapDhikr('morning', 'm12');
    useApp.getState().tapDhikr('morning', 'm1');
    useApp.getState().tapDhikr('evening', 'e1');

    expect(useApp.getState().adC[today]['morning:m12']).toBe(3);
    expect(useApp.getState().adC[today]['morning:m1']).toBe(1);
    expect(useApp.getState().adC[today]['evening:e1']).toBe(1);

    // Reset single item
    useApp.getState().resetDhikr('morning', 'm12');
    expect(useApp.getState().adC[today]['morning:m12']).toBeUndefined();
    expect(useApp.getState().adC[today]['morning:m1']).toBe(1);

    // Reset whole morning category
    useApp.getState().resetCategoryAdhkar('morning');
    expect(useApp.getState().adC[today]['morning:m1']).toBeUndefined();
    expect(useApp.getState().adC[today]['evening:e1']).toBe(1);
  });
});
