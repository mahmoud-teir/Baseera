/** النتيجة — `s.result`: pass ≥ lesson.quiz.passPct opens the next lesson; fail → retry. */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Txt } from '@/components/core/Txt';
import { Column, useTopPad } from '@/components/layout/Screen';
import { CornerDiamond, Lattice } from '@/components/layout/Ornament';
import { type Lesson } from '@/data/content';
import { LESSON_CODES, type Subject } from '@/data/structural';
import { LessonUnavailable, useLesson } from '@/features/academy/useLesson';
import { scoreQuiz, useApp } from '@/state/app-store';
import { useTheme } from '@/theme/theme';

export function generateStaticParams() {
  return LESSON_CODES.map((code) => ({ code }));
}

export default function Result() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { lesson, siblings, subject, loading } = useLesson(code);
  if (!lesson) return <LessonUnavailable subject={subject} loading={loading} />;
  return <ResultBody lesson={lesson} siblings={siblings} subject={subject} />;
}

function ResultBody({ lesson, siblings, subject }: { lesson: Lesson; siblings: Lesson[]; subject: Subject }) {
  const router = useRouter();
  const answers = useApp((s) => s.lastAnswers[lesson.code]) ?? [];
  const { pc, gc } = useTheme();
  const top = useTopPad(0);
  const score = scoreQuiz(lesson, answers);
  const next = siblings[siblings.findIndex((l) => l.code === lesson.code) + 1];

  const bg = score.pass ? pc : '#8A3A2E';
  const primaryLabel = score.pass ? (next ? `فتح الدرس التالي · ${next.code}` : 'العودة إلى المادة') : 'أعد الاختبار';
  const primary = () => {
    if (!score.pass) router.replace({ pathname: '/lesson/[code]/quiz', params: { code: lesson.code } });
    else if (next) router.dismissTo(`/academy/lesson/${next.code}`);
    else router.dismissTo(`/academy/subject/${subject.id}`);
  };

  return (
    <Column bg={bg}>
      <StatusBar style="light" />
      <View style={{ flex: 1, alignItems: 'center', overflow: 'hidden' }}>
        <CornerDiamond size={420} top={-100} right={-100} color="rgba(196,166,106,.3)" />
        <Lattice />
        <View
          accessibilityRole="summary"
          accessibilityLabel={`النتيجة ${score.pct}% · ${score.right} من ${lesson.quiz.questions.length}`}
          style={{
            marginTop: Math.max(top + 60, 100),
            width: 190,
            height: 190,
            borderRadius: 95,
            borderWidth: 6,
            borderColor: score.pass ? gc : '#F0C9C2',
            backgroundColor: 'rgba(0,0,0,.18)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Txt size={56} weight={700} color="#FFFFFF" ltr style={{ lineHeight: 64 }}>
            {score.pct}%
          </Txt>
          <Txt size={16} color="#E4EEEA" ltr style={{ marginTop: 6 }}>
            {score.right} / {lesson.quiz.questions.length}
          </Txt>
        </View>
        <Txt font="display" size={37} weight={700} color="#FFFFFF" style={{ marginTop: 26 }} accessibilityRole="header">
          {score.pass ? 'أحسنت، لقد نجحت' : 'لم تبلغ النسبة المطلوبة'}
        </Txt>
        <Txt size={16} color="#E4EEEA" lh={1.7} align="center" style={{ marginTop: 6, paddingHorizontal: 40 }}>
          {score.pass ? `النسبة المطلوبة ${lesson.quiz.passPct}% أو أكثر` : `تحتاج ${lesson.quiz.passPct}% على الأقل. راجع الدرس ثم أعد المحاولة.`}
        </Txt>
        <View style={{ marginTop: 'auto', width: '100%', paddingHorizontal: 20, paddingBottom: 36, gap: 10 }}>
          <Button size="xl" tone="ivory" textColor={bg} onPress={primary}>
            {primaryLabel}
          </Button>
          <Button tone="outlineLight" radius={16} style={{ minHeight: 50 }} onPress={() => router.push({ pathname: '/lesson/[code]/answers', params: { code: lesson.code } })}>
            مراجعة الإجابات
          </Button>
        </View>
      </View>
    </Column>
  );
}
