/**
 * راجع ما أخطأت فيه — `s.srs` (Missing Ideas 1b). Real spaced review: questions answered wrongly
 * in quizzes come back when due; «غدًا / 3 أيام / أسبوع» reschedules them (HANDOFF §7).
 */
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Card } from '@/components/core/Card';
import { Txt } from '@/components/core/Txt';
import { BackLink, Screen, Title } from '@/components/layout/Screen';
import { lessonByCode } from '@/data/content';
import { dueSrsCards, useApp } from '@/state/app-store';
import { useContent } from '@/state/content-store';
import { useTheme } from '@/theme/theme';

export default function Review() {
  const { t, r } = useTheme();
  const srs = useApp((s) => s.srs);
  const rate = useApp((s) => s.rateSrs);
  const lessons = useContent((s) => s.lessons);
  // Freeze the session's card list so rated cards stay countable until the session ends.
  const [session, setSession] = useState(() => dueSrsCards(srs).map((c) => c.id));
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const total = Object.keys(srs).length;

  const card = session[i] ? srs[session[i]] : undefined;
  const qa = useMemo(() => {
    if (!card) return null;
    const lesson = lessonByCode(lessons, card.code);
    const q = lesson?.quiz.questions.find((x) => x.id === card.qid);
    if (!q) return null;
    return { q: q.q, a: `${q.options[q.answer]}${q.explain ? ` — ${q.explain}` : ''}`, code: card.code };
  }, [card, lessons]);

  const onRate = (days: 1 | 3 | 7) => {
    if (!card) return;
    rate(card.id, days);
    setShow(false);
    setI(i + 1);
  };

  const done = i >= session.length || !qa;
  return (
    <Screen gap={16} padBottom={28}>
      <BackLink label="الرئيسية" href="/" />
      <Title>راجع ما أخطأت فيه</Title>
      {done ? (
        <Card variant="app" radius={24} pad={0} style={{ paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center', gap: 12 }}>
          <Txt font="display" size={28} weight={700} align="center">
            {total === 0 ? 'لا توجد بطاقات بعد' : 'أتممت مراجعة اليوم'}
          </Txt>
          <Txt size={16} color={t.muted} lh={1.8} align="center">
            {total === 0
              ? 'الأسئلة التي تخطئ فيها في الاختبارات تعود إليك هنا بعد يوم ثم أسبوع لتثبيتها.'
              : 'ستعود لك البطاقات الصعبة في الموعد الذي اخترته.'}
          </Txt>
          {session.length > 0 && (
            <Button
              variant="secondary"
              onPress={() => {
                setSession([...session]);
                setI(0);
                setShow(false);
              }}>
              أعد المراجعة
            </Button>
          )}
        </Card>
      ) : (
        <View style={{ gap: 14 }}>
          <Txt size={15} color={t.muted}>
            بطاقة {i + 1} من {session.length} · <Txt size={15} color={t.muted} ltr>{qa.code}</Txt>
          </Txt>
          <Card
            variant="app"
            radius={26}
            pad={22}
            onPress={() => setShow(!show)}
            label={show ? 'إخفاء الجواب' : 'إظهار الجواب'}
            style={{ minHeight: 280, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <Txt font="display" size={26} weight={700} lh={1.9} align="center">
              {qa.q}
            </Txt>
            {show ? (
              <View style={{ borderTopWidth: 1, borderColor: t.line, paddingTop: 14, alignSelf: 'stretch' }}>
                <Txt size={18} weight={600} color={t.primary} lh={1.8} align="center" accessibilityLiveRegion="polite">
                  {qa.a}
                </Txt>
              </View>
            ) : (
              <Txt size={14} color={t.muted}>
                اضغط لإظهار الجواب
              </Txt>
            )}
          </Card>
          {show && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button variant="secondary" onPress={() => onRate(1)} radius={r(14)} style={{ flex: 1, minHeight: 56, borderColor: t.errInk }}>
                <Txt size={16} weight={600} color={t.errInk}>
                  غدًا
                </Txt>
              </Button>
              <Button variant="secondary" onPress={() => onRate(3)} radius={r(14)} style={{ flex: 1, minHeight: 56, borderColor: t.goldInk }}>
                <Txt size={16} weight={600} color={t.goldInk}>
                  3 أيام
                </Txt>
              </Button>
              <Button onPress={() => onRate(7)} radius={r(14)} style={{ flex: 1, minHeight: 56 }}>
                أسبوع
              </Button>
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}
