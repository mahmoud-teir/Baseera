/** التقويم الهجري والمواسم — `s.hijri`: real Umm al-Qura month grid, sacred months, white days, events, seasons → paths. */
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Icon } from '@/components/core/Icon';
import { Skeleton } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Screen, Title } from '@/components/layout/Screen';
import { HIJRI_EVENTS, HIJRI_MONTHS, ICON, SACRED_MONTHS, SEASONS, WEEKDAYS_SAT_FIRST, WHITE_DAYS } from '@/data/structural';
import { useMinuteClock } from '@/features/prayer/usePrayer';
import { hijriMonth, shiftMonth, toHijri } from '@/services/hijri';
import { useConfig } from '@/state/config-store';
import { useTheme } from '@/theme/theme';

export default function Hijri() {
  const { t, gc, r } = useTheme();
  const router = useRouter();
  const now = useMinuteClock();
  const adj = useConfig((s) => s.prayer.hijriAdj);
  const today = useMemo(() => (now ? toHijri(now, adj) : null), [now, adj]);
  const [picked, setYm] = useState<{ hy: number; hm: number } | null>(null);
  const ym = picked ?? (today ? { hy: today.hy, hm: today.hm } : { hy: 1448, hm: 1 });
  const month = useMemo(() => (now ? hijriMonth(ym.hy, ym.hm, now, adj) : null), [ym.hy, ym.hm, now, adj]);
  const mi = ym.hm - 1;
  const events = HIJRI_EVENTS[mi] ?? [];
  if (!month || !today) {
    return (
      <Screen gap={14}>
        <BackLink label="الرئيسية" href="/" />
        <Title>التقويم الهجري</Title>
        <Skeleton height={320} />
      </Screen>
    );
  }
  const cells: (number | null)[] = [...Array.from({ length: month.offset }, () => null), ...Array.from({ length: month.days }, (_, k) => k + 1)];

  const navBtn = (dir: -1 | 1) => (
    <Press
      onPress={() => setYm(shiftMonth(ym.hy, ym.hm, dir))}
      label={dir < 0 ? 'الشهر السابق' : 'الشهر التالي'}
      style={{ width: 44, height: 44, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
      <Icon d={dir < 0 ? ICON.back : ICON.forward} size={20} color={t.ink} sw={2.2} directional />
    </Press>
  );

  return (
    <Screen gap={14}>
      <BackLink label="الرئيسية" href="/" />
      <Title>التقويم الهجري</Title>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {navBtn(-1)}
        <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
          <Txt font="display" size={26} weight={700} accessibilityLiveRegion="polite">
            {HIJRI_MONTHS[mi]} {ym.hy}
          </Txt>
          {SACRED_MONTHS.includes(mi) && (
            <Txt size={14} weight={600} color={t.goldInk}>
              من الأشهر الحرم
            </Txt>
          )}
        </View>
        {navBtn(1)}
      </View>
      <Card variant="app" pad={12}>
        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
          {WEEKDAYS_SAT_FIRST.map((w) => (
            <Txt key={w} size={13} color={t.muted} align="center" style={{ flex: 1 }}>
              {w}
            </Txt>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 }}>
          {cells.map((d, i) => {
            const isToday = d != null && ym.hy === today.hy && ym.hm === today.hm && d === today.hd;
            const white = d != null && WHITE_DAYS.includes(d);
            const dot = d != null && events.some((e) => e.day === d);
            return (
              <View key={i} style={{ width: `${100 / 7}%`, paddingHorizontal: 2 }}>
                <View
                  accessibilityLabel={d != null ? `${d} ${HIJRI_MONTHS[mi]}${isToday ? '، اليوم' : ''}${white ? '، من الأيام البيض' : ''}${dot ? '، مناسبة' : ''}` : undefined}
                  style={{ height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isToday ? t.primary : white ? t.goldSoft : 'transparent' }}>
                  <Txt size={16} weight={isToday ? 700 : 400} color={isToday ? t.onPrimary : t.ink}>
                    {d ?? ''}
                  </Txt>
                  {dot && <View style={{ position: 'absolute', bottom: 4, width: 5, height: 5, borderRadius: 3, backgroundColor: gc }} />}
                </View>
              </View>
            );
          })}
        </View>
      </Card>
      <Txt size={13} color={t.muted} lh={1.8}>
        حسب تقويم أم القرى المحسوب، وقد تختلف بداية الشهر بالرؤية المعتمدة في بلدك. النقطة الذهبية: يوم له فضل أو مناسبة.
      </Txt>
      {events.length > 0 && (
        <Card variant="app" radius={18} pad={0} style={{ paddingVertical: 12, paddingHorizontal: 14, gap: 6 }}>
          <Txt size={16} weight={700}>
            مناسبات هذا الشهر
          </Txt>
          {events.map((e) => (
            <Txt key={e.label} size={15} color={t.body}>
              ◆ {e.label}
            </Txt>
          ))}
        </Card>
      )}
      <Txt size={19} weight={600} style={{ marginTop: 4 }} accessibilityRole="header">
        المواسم
      </Txt>
      {SEASONS.map((s) => (
        <Press
          key={s.name}
          onPress={() => router.navigate(`/paths/${s.path}`)}
          label={`${s.name} · المسار`}
          style={{ backgroundColor: t.goldSoft, borderRadius: r(18), padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt size={18} weight={700}>
              {s.name}
            </Txt>
            <Txt size={14} color={t.goldInk}>
              {s.when}
            </Txt>
          </View>
          <Txt size={14} weight={700} color={t.primary}>
            المسار
          </Txt>
          <Icon d={ICON.forward} size={16} color={t.primary} sw={2.2} directional />
        </Press>
      ))}
    </Screen>
  );
}
