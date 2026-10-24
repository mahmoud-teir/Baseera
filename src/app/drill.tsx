/**
 * تدريب بالاستماع — `s.drill`: listen to a verified clip, pick the tajweed rule you heard, feedback
 * and a score. Clips and answers are published from the console (kind drill).
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { PlayGlyph } from '@/components/core/PlayGlyph';
import { Button } from '@/components/core/Button';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { EmptyState } from '@/components/core/parts';
import { BackLink, Screen } from '@/components/layout/Screen';
import { isCurrent, playQueue, toggle, useAudio } from '@/services/audio';
import { useContent } from '@/state/content-store';
import { useTheme } from '@/theme/theme';

export default function Drill() {
  const { t, pc, r } = useTheme();
  const router = useRouter();
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const drill = useContent((s) => s.drill);
  const Qs = drill?.questions ?? [];
  const q = Qs[i];
  const last = i === Qs.length - 1;
  const clipId = q ? `drill:${q.id}` : '';
  const playing = useAudio((s) => s.playing && s.queue[s.index]?.id === clipId);
  if (!q) {
    return (
      <Screen gap={14}>
        <BackLink label="دروس التجويد" href="/quran/tajweed" />
        <Txt font="display" size={30} weight={700} accessibilityRole="header">
          تدريب بالاستماع
        </Txt>
        <EmptyState>مقاطع التدريب تُضاف بتلاوات موثّقة بعد المراجعة العلمية.</EmptyState>
      </Screen>
    );
  }
  const play = () => (isCurrent(clipId) ? toggle() : playQueue([{ id: clipId, title: 'تدريب التجويد', uri: q.audio, artist: q.source }]));

  return (
    <Screen gap={14}>
      <BackLink label="دروس التجويد" href="/quran/tajweed" />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Txt font="display" size={30} weight={700} accessibilityRole="header">
          تدريب بالاستماع
        </Txt>
        <Txt size={15} color={t.muted}>
          {i + 1} من {Qs.length}
        </Txt>
      </View>
      <View style={{ height: 150, borderRadius: r(22), backgroundColor: pc, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Press onPress={play} label={playing ? 'إيقاف المقطع' : 'تشغيل المقطع'} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FAF8F2', alignItems: 'center', justifyContent: 'center' }}>
          <PlayGlyph playing={playing} size={15} color={pc} />
        </Press>
        <Txt size={14} color="#CFE0DA" align="center" style={{ paddingHorizontal: 16 }}>
          {q.source}
        </Txt>
      </View>
      <Txt size={18} weight={600}>
        {q.q || 'ما الحكم الذي سمعته؟'}
      </Txt>
      <View style={{ gap: 10 }} accessibilityRole="radiogroup">
        {q.options.map((o, k) => {
          const right = k === q.answer;
          const on = pick === k;
          const showRight = pick !== null && right;
          return (
            <Press
              key={o}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled: pick !== null }}
              label={o}
              onPress={() => {
                if (pick !== null) return;
                setPick(k);
                if (right) setScore(score + 1);
              }}
              style={{
                backgroundColor: showRight ? t.soft : on ? t.errBg : t.card,
                borderWidth: showRight || on ? 2 : 1.5,
                borderColor: showRight ? t.primary : on ? '#B8412F' : t.line,
                borderRadius: r(16),
                minHeight: 54,
                paddingHorizontal: 16,
                justifyContent: 'center',
              }}>
              <Txt size={18}>{o}</Txt>
            </Press>
          );
        })}
      </View>
      {pick !== null && (
        <>
          <View style={{ backgroundColor: t.goldSoft, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 }} accessibilityLiveRegion="polite">
            <Txt size={15} color={t.goldInk} lh={1.8}>
              {pick === q.answer ? 'إجابة صحيحة.' : `الإجابة الصحيحة: ${q.options[q.answer]}.`}
            </Txt>
          </View>
          <Button
            size="lg"
            onPress={() => {
              if (!last) {
                setI(i + 1);
                setPick(null);
              } else router.dismissTo('/quran/tajweed');
            }}>
            {last ? `إنهاء · ${score} من ${Qs.length}` : 'التالي'}
          </Button>
        </>
      )}
    </Screen>
  );
}
