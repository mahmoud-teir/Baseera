/** مدرب الحفظ — `s.coach`: hide/reveal ayahs, self-rating ✓/↻, repetition counter, review schedule. */
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Card } from '@/components/core/Card';
import { Diamond, Skeleton } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Screen, Title } from '@/components/layout/Screen';
import { surah, SURAHS, useAyahs } from '@/data/quran';
import { useApp } from '@/state/app-store';
import { useTheme } from '@/theme/theme';

export function generateStaticParams() {
  return SURAHS.map((s) => ({ surah: String(s.n) }));
}

export default function Coach() {
  const { surah: sp } = useLocalSearchParams<{ surah: string }>();
  const n = Math.max(1, Math.min(114, Number(sp) || 1));
  const s = surah(n);
  const ayahs = useAyahs(n).ayahs ?? [];
  const { t, gc, r, dark } = useTheme();
  const coach = useApp((st) => st.coach[n]) ?? { rate: {}, reps: 0, updatedAt: 0 };
  const rateCoach = useApp((st) => st.rateCoach);
  const bump = useApp((st) => st.bumpCoachReps);
  const hifz = useApp((st) => st.hifz);
  const set = useApp((st) => st.set);
  const [reveal, setReveal] = useState<Record<number, boolean>>({});

  const nOk = Object.values(coach.rate).filter((v) => v === 'ok').length;
  const nAg = Object.values(coach.rate).filter((v) => v === 'again').length;
  const allOk = ayahs.length > 0 && nOk === ayahs.length;
  const schedule = [
    { when: 'اليوم', what: nAg ? `${nAg} آيات تحتاج إعادة الآن` : 'لا آيات تحتاج إعادة الآن' },
    { when: 'غدًا', what: `مراجعة قصيرة لما حفظته (${nOk} آيات)` },
    { when: 'بعد 3 أيام', what: 'اختبار ذاتي للسورة كاملة' },
    { when: 'بعد أسبوع', what: 'مراجعة تثبيت' },
  ];

  return (
    <Screen gap={12}>
      <BackLink label="القرآن الكريم" href="/quran" />
      <Title>مدرب الحفظ</Title>
      <Txt size={15} color={t.muted}>
        سورة {s.name} · {s.ayas} آيات — حاول التذكّر أولًا ثم اكشف الآية.
      </Txt>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button variant="secondary" radius={r(14)} style={{ flex: 1, minHeight: 44 }} onPress={() => setReveal({})}>
          إخفاء الكل
        </Button>
        <Button variant="secondary" radius={r(14)} style={{ flex: 1, minHeight: 44 }} onPress={() => setReveal(Object.fromEntries(ayahs.map((_, i) => [i + 1, true])))}>
          إظهار الكل
        </Button>
      </View>
      <Card variant="app" pad={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={16} weight={700}>
            عدّاد التكرار
          </Txt>
          <Txt size={14} color={t.muted} accessibilityLiveRegion="polite">
            {coach.reps} من 10 تكرارات
          </Txt>
        </View>
        <Button radius={r(14)} style={{ minHeight: 46 }} onPress={() => bump(n)} label="تكرار إضافي">
          +1
        </Button>
      </Card>
      {!ayahs.length && [1, 2, 3].map((k) => <Skeleton key={k} height={60} />)}
      {ayahs.map((text, i) => {
        const a = i + 1;
        const shown = !!reveal[a];
        const rate = coach.rate[a];
        return (
          <Card key={a} variant="app" radius={18} pad={12} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Diamond n={a} size={32} color={gc} fontSize={14} />
            <Press onPress={() => setReveal({ ...reveal, [a]: !shown })} label={shown ? `إخفاء الآية ${a}` : `كشف الآية ${a}`} style={{ flex: 1, minHeight: 44, justifyContent: 'center' }}>
              {shown ? (
                <Txt font="quran" size={21} lh={2}>
                  {text}
                </Txt>
              ) : (
                <View style={{ height: 30, borderRadius: 10, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt size={14} color={t.primary}>
                    مخفية — اضغط للكشف
                  </Txt>
                </View>
              )}
            </Press>
            {shown && (
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Press
                  onPress={() => rateCoach(n, a, 'ok')}
                  accessibilityState={{ selected: rate === 'ok' }}
                  label="حفظتها"
                  style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: rate === 'ok' ? t.primary : t.soft, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt size={19} color={rate === 'ok' ? (dark ? '#0E2A25' : '#FFFFFF') : t.primary}>
                    ✓
                  </Txt>
                </Press>
                <Press
                  onPress={() => rateCoach(n, a, 'again')}
                  accessibilityState={{ selected: rate === 'again' }}
                  label="أعيدها"
                  style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: rate === 'again' ? '#B8412F' : t.errBg, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt size={19} color={rate === 'again' ? '#FFFFFF' : t.errInk}>
                    ↻
                  </Txt>
                </Press>
              </View>
            )}
          </Card>
        );
      })}
      {allOk && (hifz[n] ?? 0) !== 2 && (
        <Button onPress={() => set({ hifz: { ...hifz, [n]: 2 } })} size="lg">
          {`علّم سورة ${s.name} محفوظة`}
        </Button>
      )}
      <Txt size={17} weight={700} style={{ marginTop: 6 }} accessibilityRole="header">
        جدول المراجعة
      </Txt>
      {schedule.map((x) => (
        <Card key={x.when} variant="app" radius={16} pad={0} style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Txt size={15} weight={700} color={t.primary} style={{ width: 76 }}>
            {x.when}
          </Txt>
          <Txt size={15} color={t.body} style={{ flex: 1 }}>
            {x.what}
          </Txt>
        </Card>
      ))}
    </Screen>
  );
}
