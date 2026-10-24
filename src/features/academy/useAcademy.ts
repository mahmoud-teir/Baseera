import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { lessonsFor, type Lesson } from '@/data/content';
import { DEFAULT_STAGE3_LESSONS } from '@/data/stage3Lessons';
import { ALL_SUBJECTS, MAP_NODES, SUBJECTS } from '@/data/structural';
import { doneCount, lessonStates, totalPassed, useApp, type AppState } from '@/state/app-store';
import { plannedCount, stage1Total, useConfig } from '@/state/config-store';
import { useContent } from '@/state/content-store';

export const AQ = SUBJECTS[0];

/** Knowledge-map mastery: automatically lights up nodes as stage 1 lessons are completed, with fallback to self-marking. */
export function mapMastery(passed: AppState['passed'], mast: AppState['mast'], lessons: Lesson[]) {
  const aq = lessonsFor(lessons, 'AQ');
  const doneAq = doneCount(aq, passed);

  const isP = (code: string) => !!passed[code];
  const allP = (pfx: string) => {
    const ls = lessonsFor(lessons, pfx);
    return ls.length > 0 && ls.every((l) => passed[l.code]);
  };
  const allCodesP = (codes: string[]) => codes.every(isP);

  const mastered = (id: string): boolean => {
    if (mast[id]) return true;
    switch (id) {
      case 'tawheed':
        return doneAq >= 1 || isP('AQ-01');
      case 'aqeedah':
        return (doneAq >= aq.length && aq.length > 0) || allP('AQ');
      case 'taharah':
        return allCodesP(['FQ-01', 'FQ-02']);
      case 'salah':
        return allCodesP(['FQ-03', 'FQ-04', 'FQ-05', 'FQ-06']);
      case 'zakat':
        return isP('FQ-07');
      case 'siyam':
        return isP('FQ-08');
      case 'hajj':
        return allCodesP(['FQ-09', 'FQ-10', 'FQ-11']);
      case 'recite':
        return allCodesP(['TF-01', 'TF-02']);
      case 'tajweed':
        return isP('TF-03');
      case 'tafsir':
        return allCodesP(['TF-04', 'TF-05', 'TF-06', 'TF-07', 'TF-08']);
      case 'hadith':
        return isP('HD-01') && isP('HD-03');
      case 'mustalah':
        return isP('HD-02');
      case 'seerah':
        return allP('SR');
      default:
        return !!mast[id];
    }
  };
  const available = (id: string): boolean => {
    const n = MAP_NODES.find((x) => x.id === id);
    return !!n && !mastered(id) && n.prereqs.every(mastered);
  };
  const lit = MAP_NODES.filter((n) => mastered(n.id)).length;
  return { mastered, available, lit, total: MAP_NODES.length };
}

/** Published lessons of a subject (re-renders when content refreshes). */
export function useSubjectLessons(prefix: string): Lesson[] {
  const lessons = useContent((s) => s.lessons);
  return useMemo(() => {
    const list = lessonsFor(lessons, prefix);
    if (list.length) return list;
    const stage3 = DEFAULT_STAGE3_LESSONS.filter((l) => l.code.startsWith(prefix + '-'));
    if (stage3.length) return stage3;
    return [];
  }, [lessons, prefix]);
}

export function useAcademy() {
  const passed = useApp((s) => s.passed);
  const all = useContent((s) => s.lessons);
  const curriculum = useConfig((s) => s.curriculum);
  const router = useRouter();
  return useMemo(() => {
    // The subject to continue: the first (in curriculum order) with a published lesson not yet passed.
    const subject = SUBJECTS.find((s) => lessonsFor(all, s.prefix).some((l) => !passed[l.code])) ?? SUBJECTS.find((s) => lessonsFor(all, s.prefix).length) ?? AQ;
    const lessons = lessonsFor(all, subject.prefix);
    const N = lessons.length;
    const done = doneCount(lessons, passed);
    const states = lessonStates(lessons, passed);
    const cur: Lesson | undefined = N ? lessons[Math.min(done, N - 1)] : undefined;
    const passedTotal = totalPassed(all, passed);
    const total = stage1Total(curriculum);
    const subjectPct = (prefix: string) => {
      const s = ALL_SUBJECTS.find((x) => x.prefix === prefix) ?? SUBJECTS[0];
      const planned = plannedCount(curriculum, s.id);
      const list = useContent.getState().lessons;
      const combined = list.length ? list : DEFAULT_STAGE3_LESSONS;
      return planned ? Math.round((lessonsFor(combined, prefix).filter((l) => passed[l.code]).length / planned) * 100) : 0;
    };
    const subjectComplete = (prefix: string) => {
      const list = useContent.getState().lessons;
      const combined = list.length ? list : DEFAULT_STAGE3_LESSONS;
      const ls = lessonsFor(combined, prefix);
      const s = ALL_SUBJECTS.find((x) => x.prefix === prefix) ?? SUBJECTS[0];
      return ls.length > 0 && ls.length >= plannedCount(curriculum, s.id) && ls.every((l) => passed[l.code]);
    };
    return {
      subject,
      lessons,
      N,
      done,
      states,
      cur,
      curPct: N ? Math.round((done / N) * 100) : 0,
      stageTotal: total,
      stagePct: total ? Math.round((passedTotal / total) * 100) : 0,
      totalPassed: passedTotal,
      stage1Complete: SUBJECTS.every((s) => plannedCount(curriculum, s.id) === 0 || subjectComplete(s.prefix)) && passedTotal > 0,
      subjectPct,
      planned: (id: string) => plannedCount(curriculum, id),
      passPct: curriculum.passPct,
      continueLabel: !cur || done >= N ? 'عرض المادة' : 'تابع الدرس',
      continueLesson: () => (!cur || done >= N ? router.navigate(`/academy/subject/${subject.id}`) : router.navigate(`/academy/lesson/${cur.code}`)),
    };
  }, [passed, all, curriculum, router]);
}
