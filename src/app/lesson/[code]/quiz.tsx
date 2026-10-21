/** الاختبار — `s.quiz`: segmented progress, options أ–د, previous/next, finish → result. */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Icon } from '@/components/core/Icon';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { Screen } from '@/components/layout/Screen';
import { type Lesson } from '@/data/content';
import { LESSON_CODES, type Subject } from '@/data/structural';
import { LessonUnavailable, useLesson } from '@/features/academy/useLesson';
import { ICON, LETTERS } from '@/data/structural';
import { remindQuizRetry } from '@/services/notifications';
import { gradeOnServer } from '@/services/quizServer';
import { useApp } from '@/state/app-store';
import { useTheme } from '@/theme/theme';

export function generateStaticParams() {
  return LESSON_CODES.map((code) => ({ code }));
}

export default function Quiz() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { lesson, siblings, subject, loading } = useLesson(code);
  if (!lesson) return <LessonUnavailable subject={subject} loading={loading} />;
  return <QuizBody lesson={lesson} siblings={siblings} subject={subject} />;
}

function QuizBody({ lesson }: { lesson: Lesson; siblings: Lesson[]; subject: Subject }) {
  const router = useRouter();
  const recordQuiz = useApp((s) => s.recordQuiz);
  const { t, gc, r } = useTheme();
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const Qs = lesson.quiz.questions;
  const q = Qs[qi];
  const sel = answers[qi];
  const answered = sel !== undefined;
  const last = qi === Qs.length - 1;

  const next = () => {
    if (!answered) return;
    if (!last) {
      setQi(qi + 1);
      return;
    }
    const res = recordQuiz(lesson, answers);
    if (!res.pass) remindQuizRetry(lesson.code).catch(() => {});
    gradeOnServer(lesson.code, answers).catch(() => {});
    router.replace({ pathname: '/lesson/[code]/result', params: { code: lesson.code } });
  };

  return (
    <Screen
      gap={18}
      padBottom={16}
      footer={
        <View style={{ flexDirection: 'row', gap: 10, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 28 }}>
          <Button variant="secondary" radius={r(16)} onPress={() => qi > 0 && setQi(qi - 1)} style={{ width: 100, minHeight: 52, opacity: qi > 0 ? 1 : 0.4 }} disabled={false}>
            السابق
          </Button>
          <Button size="lg" disabled={!answered} onPress={next} style={{ flex: 1 }}>
            {last ? 'إنهاء الاختبار' : 'التالي'}
          </Button>
        </View>
      }>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Press onPress={() => router.dismissTo(`/academy/lesson/${lesson.code}`)} label="إنهاء الاختبار والعودة للدرس" style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon d={ICON.close} size={16} color={t.muted} sw={2.2} />
          <Txt size={15} color={t.muted}>
            إنهاء
          </Txt>
        </Press>
        <Txt size={16} weight={600} accessibilityLiveRegion="polite">
          السؤال {qi + 1} من {Qs.length}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 5 }} accessibilityElementsHidden>
        {Qs.map((_, i) => (
          <View key={i} style={{ flex: 1, height: 6, borderRadius: 9, backgroundColor: i < qi ? t.primary : i === qi ? gc : t.line }} />
        ))}
      </View>
      <Txt font="display" size={27} weight={700} lh={1.7} style={{ marginTop: 8 }} accessibilityRole="header">
        {q.q}
      </Txt>
      <View style={{ gap: 10 }} accessibilityRole="radiogroup">
        {q.options.map((op, o) => {
          const on = sel === o;
          return (
            <Press
              key={o}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, selected: on }}
              label={`${LETTERS[o]}: ${op}`}
              onPress={() => {
                const a = answers.slice();
                a[qi] = o;
                setAnswers(a);
              }}
              style={{
                backgroundColor: on ? t.soft : t.card,
                borderWidth: on ? 2 : 1.5,
                borderColor: on ? t.primary : t.line,
                borderRadius: r(18),
                padding: 15,
                flexDirection: 'row',
                gap: 12,
                alignItems: 'center',
              }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: on ? t.primary : t.muted,
                  backgroundColor: on ? t.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Txt size={15} color={on ? t.onPrimary : t.muted}>
                  {LETTERS[o]}
                </Txt>
              </View>
              <Txt size={18} weight={on ? 600 : 400} color={on ? t.primary : t.ink} style={{ flex: 1 }}>
                {op}
              </Txt>
            </Press>
          );
        })}
      </View>
    </Screen>
  );
}
