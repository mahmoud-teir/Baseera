/** Lesson lookup for the lesson / quiz / result / answers / khushu screens (published lessons only). */
import { View } from 'react-native';

import { Skeleton, EmptyState } from '@/components/core/parts';
import { BackLink, Screen, Title } from '@/components/layout/Screen';
import { lessonByCode, lessonsFor, type Lesson } from '@/data/content';
import { SUBJECTS, type Subject } from '@/data/structural';
import { useContent } from '@/state/content-store';

export function useLesson(code: string | undefined): { lesson: Lesson | undefined; siblings: Lesson[]; subject: Subject; loading: boolean } {
  const lessons = useContent((s) => s.lessons);
  const status = useContent((s) => s.status);
  const subject = SUBJECTS.find((s) => (code ?? '').startsWith(s.prefix + '-')) ?? SUBJECTS[0];
  return {
    lesson: lessonByCode(lessons, code ?? ''),
    siblings: lessonsFor(lessons, subject.prefix),
    subject,
    loading: !lessons.length && (status === 'idle' || status === 'loading'),
  };
}

/** Shown while content loads, or when the lesson has not been published yet. */
export function LessonUnavailable({ subject, loading }: { subject: Subject; loading: boolean }) {
  return (
    <Screen gap={14}>
      <BackLink label={subject.name} href={`/academy/subject/${subject.id}`} />
      {loading ? (
        <View style={{ gap: 12 }}>
          <Skeleton height={40} />
          <Skeleton height={220} />
        </View>
      ) : (
        <>
          <Title>الدرس لم يُنشر بعد</Title>
          <EmptyState>يظهر هذا الدرس هنا بعد إعداده ومراجعته من فريق المحتوى والإشراف العلمي.</EmptyState>
        </>
      )}
    </Screen>
  );
}
