/**
 * سجل الصلاة — every prayer the user ticked, with the time it was recorded. Saved on the device and
 * synced to the account when signed in. Past days can be corrected by tapping a prayer.
 */
import { useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { EmptyState, Skeleton } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { doneOn, doneOver, fullDayStreak, LOG_PRAYERS } from '@/features/prayer/log';
import { useMinuteClock } from '@/features/prayer/usePrayer';
import { hijriLabel, toHijri } from '@/services/hijri';
import { formatPrayerTime } from '@/services/prayer';
import { useApp } from '@/state/app-store';
import { useConfig } from '@/state/config-store';
import { useTheme } from '@/theme/theme';
import { dayKey, lastDays } from '@/utils/date';

const RANGES = [7, 30, 90] as const;

export default function PrayerLog() {
  const { t, pc, r, dark } = useTheme();
  const now = useMinuteClock();
  const prayed = useApp((s) => s.prayed);
  const prayedAt = useApp((s) => s.prayedAt);
  const toggle = useApp((s) => s.togglePrayed);
  const setting = useApp((s) => s.setting);
  const hijriAdj = useConfig((s) => s.prayer.hijriAdj);
  const [range, setRange] = useState<(typeof RANGES)[number]>(7);
  const h12 = setting('clock') === '12 ساعة';

  if (!now) {
    return (
      <Screen gap={14}>
        <BackLink label="الصلاة والأذكار" href="/prayer" />
        <Title>سجل الصلاة</Title>
        <Skeleton height={320} />
      </Screen>
    );
  }

  const days = lastDays(range, now);
  const week = lastDays(7, now);
  const today = dayKey(now);
  const total = LOG_PRAYERS.length;
  const stats = [
    { label: 'اليوم', value: `${doneOn(prayed, today)}/${total}` },
    { label: 'آخر 7 أيام', value: `${doneOver(prayed, week)}/${total * 7}` },
    { label: 'أيام مكتملة متتالية', value: String(fullDayStreak(prayed, now)) },
  ];
  const fmtDate = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d, 12);
    const g = date.toLocaleDateString('ar-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' });
    return { g, h: hijriLabel(toHijri(date, hijriAdj)) };
  };

  return (
    <Screen gap={14}>
      <BackLink label="الصلاة والأذكار" href="/prayer" />
      <Title>سجل الصلاة</Title>
      <Lead size={14}>كل صلاة تضع عليها ✓ تُسجَّل هنا مع وقت تسجيلها، وتُحفظ على جهازك وفي حسابك إن كانت المزامنة مفعّلة. اضغط أي صلاة لتصحيح يوم سابق.</Lead>

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

      {doneOver(prayed, days) === 0 && <EmptyState>لا صلوات مسجّلة في هذه الفترة بعد. ضع ✓ على الصلاة بعد أدائها في صفحة الصلاة.</EmptyState>}

      {days.map((key) => {
        const { g, h } = fmtDate(key);
        const n = doneOn(prayed, key);
        return (
          <Card key={key} variant="app" radius={16} pad={12} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <View style={{ flexShrink: 1 }}>
                <Txt size={15} weight={700}>
                  {key === today ? `اليوم · ${g}` : g}
                </Txt>
                <Txt size={12} color={t.muted}>
                  {h}
                </Txt>
              </View>
              <Txt size={14} weight={600} color={n === total ? t.primary : t.muted} ltr>
                {`${n}/${total}`}
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {LOG_PRAYERS.map((p) => {
                const on = !!prayed[key]?.[p];
                const at = prayedAt[key]?.[p];
                const later = at != null && dayKey(new Date(at)) !== key;
                return (
                  <Press
                    key={p}
                    onPress={() => toggle(p, key)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    label={`${p} · ${on ? 'مؤدّاة' : 'غير مسجّلة'}`}
                    style={{ flex: 1, minHeight: 64, borderRadius: r(12), alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 6, backgroundColor: on ? pc : t.soft }}>
                    <Txt size={12} weight={600} color={on ? (dark ? '#0E2A25' : '#FFFFFF') : t.primary}>
                      {p}
                    </Txt>
                    <Txt size={14} weight={700} color={on ? (dark ? '#0E2A25' : '#FFFFFF') : t.muted}>
                      {on ? '✓' : '—'}
                    </Txt>
                    {on && at != null ? (
                      <Txt size={10} color={dark ? '#0E2A25' : '#CFE0DA'} ltr={!h12}>
                        {later ? 'سُجّلت لاحقًا' : formatPrayerTime(new Date(at), undefined, h12)}
                      </Txt>
                    ) : null}
                  </Press>
                );
              })}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
