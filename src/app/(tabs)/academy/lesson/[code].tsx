/** الدرس — `s.lesson`: objectives, sections, evidence (verified / pending), audio, summary, quiz CTA. */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Card } from '@/components/core/Card';
import { EvidenceBlock } from '@/components/core/EvidenceBlock';
import { LockIcon } from '@/components/core/Icon';
import { EvidenceActions, Pill, ReportLink } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { BackLink, Screen, Title } from '@/components/layout/Screen';
import { LESSON_CODES } from '@/data/structural';
import { LessonUnavailable, useLesson } from '@/features/academy/useLesson';
import { isCurrent, playQueue, toggle, useAudio } from '@/services/audio';
import { lessonStates, useApp } from '@/state/app-store';
import { useTheme } from '@/theme/theme';
import { mmss } from '@/utils/date';

export function generateStaticParams() {
  return LESSON_CODES.map((code) => ({ code }));
}

function LessonAudio({ code, title, uri }: { code: string; title: string; uri?: string }) {
  const { pc, gc, r } = useTheme();
  const playing = useAudio((s) => s.playing && s.queue[s.index]?.id === `lesson:${code}`);
  const pos = useAudio((s) => (s.queue[s.index]?.id === `lesson:${code}` ? s.position : 0));
  const dur = useAudio((s) => (s.queue[s.index]?.id === `lesson:${code}` ? s.duration : 0));
  const onPlay = () => {
    if (!uri) return;
    if (isCurrent(`lesson:${code}`)) toggle();
    else playQueue([{ id: `lesson:${code}`, title, uri, artist: 'الشرح الصوتي' }]);
  };
  return (
    <View style={{ backgroundColor: pc, borderRadius: r(20), paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Press
        onPress={onPlay}
        disabled={!uri}
        label={!uri ? 'الشرح الصوتي غير متاح بعد' : playing ? 'إيقاف مؤقت' : 'تشغيل الشرح الصوتي'}
        style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#FAF8F2', alignItems: 'center', justifyContent: 'center', opacity: uri ? 1 : 0.55 }}>
        <Txt size={16} color={pc}>
          {playing ? '❚❚' : '▶'}
        </Txt>
      </Press>
      <View style={{ flex: 1, gap: 6 }}>
        <Txt size={15} weight={600} color="#FFFFFF">
          الشرح الصوتي
        </Txt>
        <ProgressBar value={dur ? (pos / dur) * 100 : 0} light height={4} />
      </View>
      <Txt size={14} color={uri ? '#FFFFFF' : gc} ltr={!!uri}>
        {uri ? `${mmss(pos)} / ${mmss(dur)}` : 'يُدرج بعد التوثيق'}
      </Txt>
    </View>
  );
}

export default function LessonScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { lesson, siblings, subject, loading } = useLesson(code);
  const router = useRouter();
  const passed = useApp((s) => s.passed);
  const { t, lhBody, r } = useTheme();

  if (!lesson) return <LessonUnavailable subject={subject} loading={loading} />;
  const state = lessonStates(siblings, passed).find((x) => x.lesson.code === lesson.code)?.state ?? 'locked';
  const back = <BackLink label={subject.name} href={`/academy/subject/${subject.id}`} />;

  if (state === 'locked') {
    return (
      <Screen>
        {back}
        <View style={{ alignSelf: 'center', width: 88, height: 88, borderRadius: 44, backgroundColor: t.lockBg, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
          <LockIcon size={42} color={t.muted} sw={1.6} />
        </View>
        <Title align="center">هذا الدرس مقفل</Title>
        <Txt size={16} color={t.muted} lh={1.9} align="center">
          يُفتح الدرس بعد اجتياز اختبار الدرس الذي قبله بنسبة {lesson.quiz.passPct}% فأكثر.
        </Txt>
        <Button size="lg" onPress={() => router.dismissTo(`/academy/subject/${subject.id}`)}>
          العودة إلى المادة
        </Button>
      </Screen>
    );
  }

  const nQ = lesson.quiz.questions.length;
  return (
    <Screen
      footer={
        <View style={{ backgroundColor: t.card, borderTopWidth: 1, borderColor: t.line, paddingVertical: 12, paddingHorizontal: 20, gap: 10 }}>
          <Button variant="secondary" radius={16} onPress={() => router.push({ pathname: '/khushu/[code]', params: { code: lesson.code } })}>
            وضع الخشوع · استمع بلا مشتّتات
          </Button>
          <Button size="lg" onPress={() => router.push({ pathname: '/lesson/[code]/quiz', params: { code: lesson.code } })}>
            {`ابدأ الاختبار · ${nQ} أسئلة`}
          </Button>
        </View>
      }>
      {back}
      <View>
        <Pill label={lesson.code} bg={t.goldSoft} fg={t.goldInk} ltr />
        <View style={{ marginTop: 8 }}>
          <Title size={33}>{lesson.title}</Title>
        </View>
      </View>
      <LessonAudio code={lesson.code} title={lesson.title} uri={lesson.audio} />

      <Card variant="app" style={{ gap: 8 }}>
        <Txt size={17} weight={700} color={t.primary}>
          أهداف الدرس
        </Txt>
        <View style={{ gap: 4 }}>
          {lesson.objectives.map((o, i) => (
            <Txt key={i} size={16} lh={1.8}>
              ◆ {o}
            </Txt>
          ))}
        </View>
      </Card>

      {lesson.sections.map((sec, i) => (
        <View key={i}>
          <Txt size={19} weight={700} style={{ marginBottom: 6 }}>
            {sec.heading}
          </Txt>
          <Txt size={17} lh={lhBody} color={t.body}>
            {sec.body}
          </Txt>
          <EvidenceActions where={`الدرس ${lesson.code} · ${sec.heading}`} data={sec} />
        </View>
      ))}

      <View style={{ backgroundColor: t.goldSoft, borderRadius: r(20), padding: 16, gap: 10 }}>
        <Txt size={17} weight={700} color={t.goldInk}>
          الأدلة الشرعية والمراجع
        </Txt>
        {lesson.evidence.map((e, i) => (
          <View key={i}>
            <EvidenceBlock label={e.label} text={e.text} source={e.source} reference={e.ref} />
            <EvidenceActions where={`الدرس ${lesson.code} · ${e.label}`} data={e} />
          </View>
        ))}
      </View>

      <Txt size={19} weight={700}>
        ملخص الدرس
      </Txt>
      <View style={{ gap: 4 }}>
        {lesson.summary.map((s, i) => (
          <Txt key={i} size={16} lh={1.9} color={t.body}>
            ◆ {s}
          </Txt>
        ))}
        <ReportLink where={`الدرس ${lesson.code} · الملخص`} />
      </View>
    </Screen>
  );
}
