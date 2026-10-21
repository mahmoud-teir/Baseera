/** وضع الخشوع — `s.khushu` (Missing Ideas 1d): lesson text alone, large, dark and calm, with the audio player. */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { Column, useTopPad } from '@/components/layout/Screen';
import { type Lesson } from '@/data/content';
import { LESSON_CODES, type Subject } from '@/data/structural';
import { LessonUnavailable, useLesson } from '@/features/academy/useLesson';
import { isCurrent, pause, playQueue, seekBy, toggle, useAudio } from '@/services/audio';

export function generateStaticParams() {
  return LESSON_CODES.map((code) => ({ code }));
}

const TITLE = [34, 40, 48];
const BODY = [22, 26, 30];

export default function Khushu() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { lesson, siblings, subject, loading } = useLesson(code);
  if (!lesson) return <LessonUnavailable subject={subject} loading={loading} />;
  return <KhushuBody lesson={lesson} siblings={siblings} subject={subject} />;
}

function KhushuBody({ lesson }: { lesson: Lesson; siblings: Lesson[]; subject: Subject }) {
  const router = useRouter();
  const top = useTopPad(4);
  const [k, setK] = useState(0);
  const id = `lesson:${lesson.code}`;
  const playing = useAudio((s) => s.playing && s.queue[s.index]?.id === id);
  const pos = useAudio((s) => (s.queue[s.index]?.id === id ? s.position : 0));
  const dur = useAudio((s) => (s.queue[s.index]?.id === id ? s.duration : 0));
  const hasAudio = !!lesson.audio;

  const exit = () => {
    pause();
    router.dismissTo(`/academy/lesson/${lesson.code}`);
  };
  const play = () => {
    if (!lesson.audio) return;
    if (isCurrent(id)) toggle();
    else playQueue([{ id, title: lesson.title, uri: lesson.audio, artist: 'الشرح الصوتي' }]);
  };

  const ghost = { minHeight: 44, minWidth: 56, borderWidth: 1, borderColor: 'rgba(255,255,255,.3)', borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const };

  return (
    <Column bg="#0B201C">
      <StatusBar style="light" />
      <View style={{ flex: 1, paddingTop: top + 8, paddingHorizontal: 26, paddingBottom: 30, gap: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt size={14} color="#C4A66A">
            وضع الخشوع
          </Txt>
          <Press onPress={exit} label="خروج من وضع الخشوع" style={{ minHeight: 44, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.4)', borderRadius: 99, justifyContent: 'center' }}>
            <Txt size={15} color="#F1EEE4">
              خروج
            </Txt>
          </Press>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: 22 }}>
          <Txt font="display" size={TITLE[k]} weight={700} lh={2.2} color="#F1EEE4" align="center" accessibilityRole="header">
            {lesson.title}
          </Txt>
          {lesson.sections.map((s, i) => (
            <Txt key={i} size={BODY[k]} lh={2.3} color="#CFE0DA" align="center">
              {s.body}
            </Txt>
          ))}
        </ScrollView>
        <View style={{ gap: 12 }}>
          <ProgressBar value={dur ? (pos / dur) * 100 : 0} height={5} color="#C4A66A" track="rgba(255,255,255,.18)" />
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30 }}>
            <Press onPress={() => seekBy(-15)} disabled={!playing} label="رجوع 15 ثانية" style={{ minHeight: 44, justifyContent: 'center' }}>
              <Txt size={15} color="#9DB3AD">
                −15ث
              </Txt>
            </Press>
            <Press
              onPress={play}
              disabled={!hasAudio}
              label={!hasAudio ? 'الشرح الصوتي غير متاح بعد' : playing ? 'إيقاف مؤقت' : 'تشغيل'}
              style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#C4A66A', alignItems: 'center', justifyContent: 'center', opacity: hasAudio ? 1 : 0.5 }}>
              <Txt size={22} color="#182D29">
                {playing ? '❚❚' : '▶'}
              </Txt>
            </Press>
            <Press onPress={() => seekBy(15)} disabled={!playing} label="تقديم 15 ثانية" style={{ minHeight: 44, justifyContent: 'center' }}>
              <Txt size={15} color="#9DB3AD">
                +15ث
              </Txt>
            </Press>
          </View>
          {!hasAudio && (
            <Txt size={13} color="#9DB3AD" align="center">
              الشرح الصوتي لهذا الدرس يُدرج بعد التوثيق.
            </Txt>
          )}
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
            <Press onPress={() => setK(Math.max(0, k - 1))} label="تصغير الخط" style={ghost}>
              <Txt size={15} color="#F1EEE4" fixed>
                أ−
              </Txt>
            </Press>
            <Press onPress={() => setK(Math.min(2, k + 1))} label="تكبير الخط" style={ghost}>
              <Txt size={20} color="#F1EEE4" fixed>
                أ+
              </Txt>
            </Press>
          </View>
        </View>
      </View>
    </Column>
  );
}
