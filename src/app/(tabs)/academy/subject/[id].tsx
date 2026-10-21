/** صفحة المادة — `s.subject` (and `s.stub` for subjects whose lessons are not published yet). */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { LessonRow } from '@/components/core/LessonRow';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { Hero } from '@/components/layout/Hero';
import { BackLink, Lead, Screen, Title, useTopPad } from '@/components/layout/Screen';
import { useSubjectLessons } from '@/features/academy/useAcademy';
import { plannedCount, useConfig } from '@/state/config-store';
import { SUBJECTS } from '@/data/structural';
import { lessonStates, useApp } from '@/state/app-store';
import { useTheme } from '@/theme/theme';

export function generateStaticParams() {
  return SUBJECTS.map((s) => ({ id: s.id }));
}

export default function Subject() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const subject = SUBJECTS.find((s) => s.id === id) ?? SUBJECTS[0];
  const lessons = useSubjectLessons(subject.prefix);
  const planned = useConfig((s) => plannedCount(s.curriculum, subject.id));
  const passed = useApp((s) => s.passed);
  const router = useRouter();
  const { t, gc, r } = useTheme();
  const top = useTopPad(0);

  if (!lessons.length) {
    return (
      <Screen>
        <BackLink label="الأكاديمية" href="/academy" />
        <Title>{subject.name}</Title>
        <Lead size={16}>تُنشر دروس هذه المادة هنا بعد إعدادها ومراجعتها من الإشراف العلمي.</Lead>
        <View
          style={{
            height: 260,
            borderRadius: r(20),
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: t.line,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Txt size={13} color={t.muted}>
            لم يُنشر درس بعد · {planned} دروس في الخطة
          </Txt>
        </View>
      </Screen>
    );
  }

  const states = lessonStates(lessons, passed);
  const doneN = states.filter((s) => s.state === 'done').length;
  const pct = Math.round((doneN / lessons.length) * 100);
  const passPct = lessons[0].quiz.passPct;

  return (
    <Screen
      noTopPad
      gap={8}
      header={
        <Hero radius={0} pad={0} diamond={{ size: 150, left: -40, top: -20 }} style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingTop: top, paddingBottom: 20, paddingHorizontal: 20, gap: 8 }}>
          <BackLink label="الأكاديمية · المرحلة الأولى" href="/academy" color={gc} />
          <Txt font="display" size={32} weight={700} color="#FFFFFF" accessibilityRole="header">
            {subject.name}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <ProgressBar value={pct} light />
            </View>
            <Txt size={14} color="#FFFFFF">
              {doneN} من {lessons.length} دروس
            </Txt>
          </View>
          <Txt size={14} color="#CFE0DA">
            النجاح المطلوب في كل اختبار: {passPct}%
          </Txt>
        </Hero>
      }>
      {states.map(({ lesson, state }) => (
        <LessonRow key={lesson.code} code={lesson.code} title={lesson.title} state={state} onPress={() => router.navigate(`/academy/lesson/${lesson.code}`)} />
      ))}
    </Screen>
  );
}
