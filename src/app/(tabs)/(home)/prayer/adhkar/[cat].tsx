/** الأذكار — `s.adhkar`: published adhkar of a category (text, count, source), with counters saved per day. */
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { EvidenceActions, PendingSlot, Ring } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { ADHKAR } from '@/data/structural';
import { useAcademy } from '@/features/academy/useAcademy';
import { TodayLesson } from '@/features/prayer/TodayLesson';
import { useApp } from '@/state/app-store';
import { useContent } from '@/state/content-store';
import { useTheme } from '@/theme/theme';
import { dayKey } from '@/utils/date';

export function generateStaticParams() {
  return ADHKAR.map((a) => ({ cat: a.id }));
}

export default function Adhkar() {
  const { cat } = useLocalSearchParams<{ cat: string }>();
  const c = ADHKAR.find((a) => a.id === cat) ?? ADHKAR[0];
  const { t, pc, gc, r } = useTheme();
  const ac = useAcademy();
  const counts = useApp((s) => s.adC[dayKey()]) ?? {};
  const tap = useApp((s) => s.tapDhikr);
  const published = useContent((s) => s.adhkar[c.id]?.items) ?? [];
  const items = published.map((x) => ({ ...x, n: counts[`${c.id}:${x.id}`] ?? 0 }));
  const allDone = items.length > 0 && items.every((x) => x.n >= x.count);

  return (
    <Screen gap={14}>
      <BackLink label="الصلاة والأذكار" href="/prayer" />
      <Title size={30}>{c.name}</Title>
      {items.length ? (
        <Lead size={14}>اضغط الدائرة لعدّ التكرار. يُحفظ العدّ لليوم على جهازك.</Lead>
      ) : (
        <PendingSlot>نصوص {c.name} وأعدادها تُدرج هنا من مصدر موثّق مع تخريجها بعد المراجعة العلمية.</PendingSlot>
      )}
      {items.map((x, i) => (
        <Card key={x.id} variant="app" style={{ gap: 10 }} pad={14}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Txt font="display" size={20} lh={2}>
                {x.text}
              </Txt>
              <Txt size={13} color={t.muted}>
                {x.source}
                {x.ref ? ` · ${x.ref}` : ''}
              </Txt>
            </View>
            <Press
              onPress={() => x.n < x.count && tap(c.id, x.id)}
              label={`عدّ الذكر ${i + 1}: ${Math.min(x.n, x.count)} من ${x.count}`}
              accessibilityRole="button"
              style={{ borderRadius: 36 }}>
              <Ring pct={(Math.min(x.n, x.count) / x.count) * 100} color={pc} track={t.line}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt size={16} weight={700} ltr>
                    {`${Math.min(x.n, x.count)}/${x.count}`}
                  </Txt>
                </View>
              </Ring>
            </Press>
          </View>
          {x.virtue ? (
            <Txt size={14} color={t.goldInk} lh={1.8}>
              {x.virtue}
            </Txt>
          ) : null}
          <EvidenceActions where={`${c.name} · الذكر ${i + 1}`} data={{ text: x.text, source: x.source, ref: x.ref }} />
        </Card>
      ))}
      {allDone && (
        <>
          <View style={{ backgroundColor: t.soft, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 }} accessibilityLiveRegion="polite">
            <Txt size={16} weight={600} color={t.primary}>
              أتممت هذه الأذكار. تقبّل الله منك.
            </Txt>
          </View>
          <TodayLesson pc={pc} gc={gc} r={r} ac={ac} />
        </>
      )}
    </Screen>
  );
}
