/**
 * سجل القراءة — what the user read (ayahs on screen in the reader) and listened to each day, per
 * surah, with the time spent. Saved on the device and synced to the user's own account.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { EmptyState, Skeleton } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { surah } from '@/data/quran';
import { useMinuteClock } from '@/features/prayer/usePrayer';
import { ayahRanges, dayTotals, durationLabel, mergeAyahs, readingStreak } from '@/features/quran/log';
import { hijriLabel, toHijri } from '@/services/hijri';
import { useApp } from '@/state/app-store';
import { useConfig } from '@/state/config-store';
import { useTheme } from '@/theme/theme';
import { dayKey, lastDays } from '@/utils/date';

const RANGES = [7, 30, 90] as const;

export default function QuranLogScreen() {
  const { t, pc, r, dark } = useTheme();
  const router = useRouter();
  const now = useMinuteClock();
  const log = useApp((s) => s.quranLog);
  const hijriAdj = useConfig((s) => s.prayer.hijriAdj);
  const [range, setRange] = useState<(typeof RANGES)[number]>(7);

  if (!now) {
    return (
      <Screen gap={14}>
        <BackLink label="القرآن الكريم" href="/quran" />
        <Title>سجل القراءة</Title>
        <Skeleton height={320} />
      </Screen>
    );
  }

  const today = dayKey(now);
  const days = lastDays(range, now).filter((k) => dayTotals(log, k).ayahs > 0);
  const week = lastDays(7, now).map((k) => dayTotals(log, k));
  const td = dayTotals(log, today);
  const stats = [
    { label: 'آيات اليوم', value: String(td.ayahs) },
    { label: 'آيات آخر 7 أيام', value: String(week.reduce((n, d) => n + d.ayahs, 0)) },
    { label: 'أيام متتالية', value: String(readingStreak(log, now)) },
  ];
  const fmtDate = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d, 12);
    const g = date.toLocaleDateString('ar-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' });
    return { g: key === today ? `اليوم · ${g}` : g, h: hijriLabel(toHijri(date, hijriAdj)) };
  };

  return (
    <Screen gap={14}>
      <BackLink label="القرآن الكريم" href="/quran" />
      <Title>سجل القراءة</Title>
      <Lead size={14}>تُسجَّل تلقائيًا الآيات التي تقرؤها في صفحة السورة والآيات التي تستمع إليها، مع وقت القراءة. يُحفظ السجل على جهازك وفي حسابك إن كانت المزامنة مفعّلة.</Lead>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {stats.map((s) => (
          <Card key={s.label} variant="app" radius={16} pad={12} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
            <Txt size={22} weight={700} color={t.primary} ltr>
              {s.value}
            </Txt>
            <Txt size={12} color={t.muted} align="center">
              {s.label}
            </Txt>
          </Card>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="tablist">
        {RANGES.map((n) => (
          <Press
            key={n}
            onPress={() => setRange(n)}
            label={`آخر ${n} يومًا`}
            accessibilityRole="tab"
            accessibilityState={{ selected: range === n }}
            style={{ flex: 1, minHeight: 40, borderRadius: r(12), alignItems: 'center', justifyContent: 'center', backgroundColor: range === n ? pc : t.soft }}>
            <Txt size={14} weight={600} color={range === n ? (dark ? '#0E2A25' : '#FFFFFF') : t.primary}>
              {`آخر ${n} يومًا`}
            </Txt>
          </Press>
        ))}
      </View>

      {days.length === 0 && <EmptyState>لا قراءة مسجّلة في هذه الفترة بعد. افتح أي سورة واقرأ، وستظهر قراءتك هنا.</EmptyState>}

      {days.map((key) => {
        const { g, h } = fmtDate(key);
        const tot = dayTotals(log, key);
        const surahs = Object.entries(log[key] ?? {})
          .map(([n, v]) => ({ n: Number(n), v }))
          .filter((x) => mergeAyahs(x.v.a, x.v.l).length > 0)
          .sort((a, b) => b.v.at - a.v.at);
        return (
          <Card key={key} variant="app" radius={16} pad={12} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <View style={{ flexShrink: 1 }}>
                <Txt size={15} weight={700}>
                  {g}
                </Txt>
                <Txt size={12} color={t.muted}>
                  {h}
                </Txt>
              </View>
              <Txt size={13} weight={600} color={t.muted}>
                {`${tot.ayahs} آية · ${durationLabel(tot.seconds)}`}
              </Txt>
            </View>
            {surahs.map(({ n, v }) => {
              const s = surah(n);
              const all = mergeAyahs(v.a, v.l);
              const last = all[all.length - 1];
              return (
                <Press
                  key={n}
                  onPress={() => router.push({ pathname: '/reader/[surah]', params: { surah: String(n), ayah: String(last) } })}
                  label={`سورة ${s.name} · متابعة من الآية ${last}`}
                  style={{ borderRadius: r(12), backgroundColor: t.soft, padding: 10, gap: 2 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <Txt size={15} weight={700} color={t.primary}>
                      سورة {s.name}
                    </Txt>
                    <Txt size={12} color={t.muted}>
                      {`${all.length} من ${s.ayas} آية`}
                    </Txt>
                  </View>
                  {v.a.length > 0 && (
                    <Txt size={13} color={t.muted}>
                      {`قراءة: الآيات ${ayahRanges(v.a)}`}
                    </Txt>
                  )}
                  {v.l.length > 0 && (
                    <Txt size={13} color={t.muted}>
                      {`استماع: الآيات ${ayahRanges(v.l)}`}
                    </Txt>
                  )}
                </Press>
              );
            })}
          </Card>
        );
      })}
    </Screen>
  );
}
