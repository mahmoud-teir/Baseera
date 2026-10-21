import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { lessonsFor, type Lesson } from '@/data/content';
import { MAP_NODES, SUBJECTS } from '@/data/structural';
import { doneCount, lessonStates, totalPassed, useApp, type AppState } from '@/state/app-store';
import { plannedCount, stage1Total, useConfig } from '@/state/config-store';
import { useContent } from '@/state/content-store';

export const AQ = SUBJECTS[0];

/** Knowledge-map mastery: التوحيد lights after passing the first AQ lesson, العقيدة after all of them, the rest by self-marking. */
export function mapMastery(passed: AppState['passed'], mast: AppState['mast'], lessons: Lesson[]) {
  const aq = lessonsFor(lessons, 'AQ');
  const done = doneCount(aq, passed);
  const mastered = (id: string): boolean => (id === 'tawheed' ? done >= 1 : id === 'aqeedah' ? done >= aq.length && aq.length > 0 : !!mast[id]);
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
  return useMemo(() => lessonsFor(lessons, prefix), [lessons, prefix]);
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
      const s = SUBJECTS.find((x) => x.prefix === prefix)!;
      const planned = plannedCount(curriculum, s.id);
      return planned ? Math.round((lessonsFor(all, prefix).filter((l) => passed[l.code]).length / planned) * 100) : 0;
    };
    const subjectComplete = (prefix: string) => {
      const ls = lessonsFor(all, prefix);
      const s = SUBJECTS.find((x) => x.prefix === prefix)!;
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
