/** تعليم التجويد — `s.tajweed`. Topic texts and examples are published from the console after scholarly review. */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { DiamondBullet, EvidenceActions, PendingSlot } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { TAJWEED_TOPICS } from '@/data/structural';
import { DEFAULT_TAJWEED } from '@/data/defaults';
import { useContent } from '@/state/content-store';
import { useTheme } from '@/theme/theme';

export default function Tajweed() {
  const { t, pc, gc, r, lhBody } = useTheme();
  const router = useRouter();
  const topics = useContent((s) => s.tajweed);
  const drill = useContent((s) => s.drill);
  const [open, setOpen] = useState<number | null>(0);
  const nClips = drill?.questions.length ?? 0;
  return (
    <Screen gap={14}>
      <BackLink label="القرآن الكريم" href="/quran" />
      <Title>تعليم التجويد</Title>
      <Lead>دروس قصيرة تبدأ من الأحكام الأساسية، بالاستماع والتطبيق. مفتوحة للجميع.</Lead>
      <Press
        onPress={() => router.push('/drill')}
        disabled={!nClips}
        label={nClips ? `تدريب بالاستماع · ${nClips} مقاطع` : 'تدريب بالاستماع · يُضاف بعد توثيق المقاطع'}
        style={{ backgroundColor: nClips ? t.btn : t.lockBg, borderRadius: r(18), minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Txt size={17} weight={700} color={nClips ? t.btnText : t.muted} style={{ flex: 1 }}>
          تدريب بالاستماع
        </Txt>
        <Txt size={14} weight={500} color={nClips ? t.btnText : t.muted}>
          {nClips ? `${nClips} مقاطع` : 'بانتظار التوثيق'}
        </Txt>
      </Press>
      {TAJWEED_TOPICS.map((x, i) => {
        const d = topics[String(i)] ?? DEFAULT_TAJWEED[String(i)];
        const on = open === i;
        return (
          <Card key={x} variant="app" radius={18} pad={14} style={{ gap: 10, ...(i === 0 ? { borderColor: pc } : null) }}>
            <Press onPress={() => setOpen(on ? null : i)} label={x} accessibilityState={{ expanded: on }} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 32 }}>
              <DiamondBullet color={gc} />
              <Txt size={17} weight={600} style={{ flex: 1 }}>
                {x}
              </Txt>
              <Txt size={13} color={d ? t.primary : t.muted}>
                {d ? 'متاح' : 'بانتظار التوثيق'}
              </Txt>
            </Press>
            {on &&
              (d ? (
                <View style={{ gap: 8 }}>
                  <Txt size={17} lh={lhBody}>
                    {d.text}
                  </Txt>
                  {d.examples.map((e) => (
                    <Txt key={e} font="quran" size={22} lh={2} color={t.primary}>
                      {e}
                    </Txt>
                  ))}
                  <Txt size={13} color={t.muted}>
                    {d.source}
                  </Txt>
                  <EvidenceActions where={`التجويد · ${x}`} data={{ text: d.text, source: d.source }} />
                </View>
              ) : (
                <PendingSlot>نص الدرس والأمثلة تُدرج بعد المراجعة العلمية.</PendingSlot>
              ))}
          </Card>
        );
      })}
    </Screen>
  );
}
