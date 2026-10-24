/** صفحة المادة — `s.subject` (and `s.stub` for subjects whose lessons are not published yet). */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { LessonRow } from '@/components/core/LessonRow';
import { Pill } from '@/components/core/parts';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { Hero } from '@/components/layout/Hero';
import { BackLink, Lead, Screen, Title, useTopPad } from '@/components/layout/Screen';
import { STAGE2_SUBJECTS } from '@/data/stage2Data';
import { STAGE3_SUBJECTS } from '@/data/stage3Data';
import { ALL_SUBJECTS, STAGE2_SUBJECTS_LIST, STAGE3_SUBJECTS_LIST, SUBJECTS } from '@/data/structural';
import { useSubjectLessons } from '@/features/academy/useAcademy';
import { lessonStates, useApp } from '@/state/app-store';
import { plannedCount, useConfig } from '@/state/config-store';
import { useTheme } from '@/theme/theme';

export function generateStaticParams() {
  return ALL_SUBJECTS.map((s) => ({ id: s.id }));
}

export default function Subject() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const subject = ALL_SUBJECTS.find((s) => s.id === id) ?? SUBJECTS[0];
  const lessons = useSubjectLessons(subject.prefix);
  const planned = useConfig((s) => plannedCount(s.curriculum, subject.id));
  const passed = useApp((s) => s.passed);
  const router = useRouter();
  const { t, gc, r } = useTheme();
  const top = useTopPad(0);

  const stageNum = STAGE3_SUBJECTS_LIST.some((s) => s.id === subject.id)
    ? 3
    : STAGE2_SUBJECTS_LIST.some((s) => s.id === subject.id)
      ? 2
      : 1;

  const stageLabel =
    stageNum === 3
      ? 'الأكاديمية · المرحلة الثالثة'
      : stageNum === 2
        ? 'الأكاديمية · المرحلة الثانية'
        : 'الأكاديمية · المرحلة الأولى';

  const s3Info = STAGE3_SUBJECTS.find((s) => s.id === subject.id);
  const s2Info = STAGE2_SUBJECTS.find((s) => s.id === subject.id);

  if (!lessons.length) {
    return (
      <Screen>
        <BackLink label={stageLabel} href="/academy" />
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
      gap={10}
      header={
        <Hero radius={0} pad={0} diamond={{ size: 150, left: -40, top: -20 }} style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingTop: top, paddingBottom: 20, paddingHorizontal: 20, gap: 8 }}>
          <BackLink label={stageLabel} href="/academy" color={gc} />
          <Txt font="display" size={30} weight={700} color="#FFFFFF" accessibilityRole="header">
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
      {s3Info && (
        <Card variant="app" radius={18} pad={14} style={{ gap: 8, marginBottom: 4, borderWidth: 1, borderColor: t.line }}>
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <Txt size={12} weight={700} color={gc} style={{ flex: 1, minWidth: 0 }}>
                المرحلة الثالثة · المستوى التخصصي العالي
              </Txt>
              <View style={{ flexShrink: 0 }}>
                <Pill label={`${lessons.length} من ${s3Info.lessonsCount} دروس`} bg={t.soft} fg={t.primary} size={11} />
              </View>
            </View>
            <Txt size={16} weight={700} color={t.primary} lh={1.4}>
              📖 المرجع المعتمد: {s3Info.bookTitle}
            </Txt>
          </View>
          <View style={{ backgroundColor: t.soft, borderRadius: 10, padding: 8, gap: 2 }}>
            <Txt size={13} color={t.muted}>
              المؤلف: {s3Info.author} ({s3Info.era})
            </Txt>
            <Txt size={13} color={t.goldInk}>
              المرجع والشرح: {s3Info.referenceCommentary}
            </Txt>
          </View>
          <Txt size={13} color={t.body} lh={1.7}>
            {s3Info.description}
          </Txt>
          <View style={{ gap: 6, marginTop: 4 }}>
            {s3Info.keyTopics.map((top) => (
              <View
                key={top}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 8,
                  backgroundColor: t.soft,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}>
                <Txt size={14} color={gc} weight={700}>
                  •
                </Txt>
                <Txt size={12} color={t.ink} lh={1.6} style={{ flex: 1 }}>
                  {top}
                </Txt>
              </View>
            ))}
          </View>
        </Card>
      )}

      {s2Info && !s3Info && (
        <Card variant="app" radius={18} pad={14} style={{ gap: 8, marginBottom: 4, borderWidth: 1, borderColor: t.line }}>
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <Txt size={12} weight={700} color={gc} style={{ flex: 1, minWidth: 0 }}>
                المرحلة الثانية · المستوى التأصيلي والعلوم الآلية
              </Txt>
              <View style={{ flexShrink: 0 }}>
                <Pill label={`${lessons.length} من ${s2Info.lessonsCount} دروس`} bg={t.soft} fg={t.primary} size={11} />
              </View>
            </View>
            <Txt size={16} weight={700} color={t.primary} lh={1.4}>
              📖 المتن المعتمد: {s2Info.bookTitle}
            </Txt>
          </View>
          <View style={{ backgroundColor: t.soft, borderRadius: 10, padding: 8, gap: 2 }}>
            <Txt size={13} color={t.muted}>
              المؤلف: {s2Info.author} ({s2Info.era})
            </Txt>
            <Txt size={13} color={t.goldInk}>
              المرجع والشرح: {s2Info.referenceCommentary}
            </Txt>
          </View>
          <Txt size={13} color={t.body} lh={1.7}>
            {s2Info.description}
          </Txt>
          <View style={{ gap: 6, marginTop: 4 }}>
            {s2Info.keyTopics.map((top) => (
              <View
                key={top}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 8,
                  backgroundColor: t.soft,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}>
                <Txt size={14} color={gc} weight={700}>
                  •
                </Txt>
                <Txt size={12} color={t.ink} lh={1.6} style={{ flex: 1 }}>
                  {top}
                </Txt>
              </View>
            ))}
          </View>
        </Card>
      )}

      <Txt size={18} weight={700} style={{ marginTop: 4 }}>
        دروس المادة المعتمدة
      </Txt>

      {states.map(({ lesson, state }) => (
        <LessonRow key={lesson.code} code={lesson.code} title={lesson.title} state={state} onPress={() => router.navigate(`/academy/lesson/${lesson.code}`)} />
      ))}
    </Screen>
  );
}
