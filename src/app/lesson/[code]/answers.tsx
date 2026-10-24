/** مراجعة الإجابات — `s.review`: ✓/✕ per question, your answer, the correct one and the explanation. */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Pill } from '@/components/core/parts';
import { Txt } from '@/components/core/Txt';
import { BackLink, Screen, Title } from '@/components/layout/Screen';
import { type Lesson } from '@/data/content';
import { ALL_LESSON_CODES, type Subject } from '@/data/structural';
import { LessonUnavailable, useLesson } from '@/features/academy/useLesson';
import { scoreQuiz, useApp } from '@/state/app-store';
import { useTheme } from '@/theme/theme';

export function generateStaticParams() {
  return ALL_LESSON_CODES.map((code) => ({ code }));
}

export default function Answers() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { lesson, siblings, subject, loading } = useLesson(code);
  if (!lesson) return <LessonUnavailable subject={subject} loading={loading} />;
  return <AnswersBody lesson={lesson} siblings={siblings} subject={subject} />;
}

function AnswersBody({ lesson, siblings, subject }: { lesson: Lesson; siblings: Lesson[]; subject: Subject }) {
  const router = useRouter();
  const answers = useApp((s) => s.lastAnswers[lesson.code]) ?? [];
  const { t, pc, r, dark } = useTheme();
  const score = scoreQuiz(lesson, answers);
  const next = siblings[siblings.findIndex((l) => l.code === lesson.code) + 1];
  const label = score.pass ? (next ? `فتح الدرس التالي · ${next.code}` : 'العودة إلى المادة') : 'أعد الاختبار';
  const primary = () => {
    if (!score.pass) router.replace({ pathname: '/lesson/[code]/quiz', params: { code: lesson.code } });
    else if (next) router.dismissTo(`/academy/lesson/${next.code}`);
    else router.dismissTo(`/academy/subject/${subject.id}`);
  };

  return (
    <Screen
      gap={10}
      padBottom={16}
      footer={
        <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 28 }}>
          <Button size="lg" onPress={primary}>
            {label}
          </Button>
        </View>
      }>
      <BackLink label="النتيجة" href={`/lesson/${lesson.code}/result`} />
      <Title size={30}>مراجعة الإجابات</Title>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pill label={`${score.right} صحيحة`} bg={t.soft} fg={t.primary} />
        <Pill label={`${score.wrong} خاطئة`} bg={t.errBg} fg={t.errInk} />
      </View>
      {lesson.quiz.questions.map((q, i) => {
        const ok = answers[i] === q.answer;
        const markBg = ok ? (dark ? '#2F8F76' : pc) : '#B8412F';
        return (
          <View
            key={i}
            style={{
              backgroundColor: ok ? t.card : dark ? '#3A1F1B' : '#FDF3F1',
              borderWidth: 1,
              borderColor: ok ? t.line : '#E7B4AB',
              borderRadius: r(18),
              padding: 14,
              gap: 6,
            }}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: markBg, alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={15} color="#FFFFFF">
                  {ok ? '✓' : '✕'}
                </Txt>
              </View>
              <Txt size={16} weight={600} style={{ flex: 1 }}>
                {i + 1} · {q.q}
              </Txt>
              <Txt size={14} weight={600} color={markBg}>
                {ok ? 'صحيح' : 'خاطئ'}
              </Txt>
            </View>
            {!ok && (
              <Txt size={15} lh={1.8} color={t.body}>
                إجابتك: {q.options[answers[i]] ?? '—'}
                {'\n'}الصحيحة: {q.options[q.answer]}
                {q.explain ? (
                  <Txt size={15} lh={1.8} color={t.goldInk}>
                    {'\n'}
                    {q.explain}
                  </Txt>
                ) : null}
              </Txt>
            )}
          </View>
        );
      })}
    </Screen>
  );
}
