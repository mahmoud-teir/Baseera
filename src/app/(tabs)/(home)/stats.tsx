/**
 * لوحة الإحصائيات الشاملة — Comprehensive Islamic Analytics & Insights Dashboard.
 * Aggregates prayers, prophetic Sunan, Quran reading, Tasbeeh tally, Adhkar, and Academy progress.
 */
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Icon } from '@/components/core/Icon';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { Hero } from '@/components/layout/Hero';
import { RoundBackHeader, Screen } from '@/components/layout/Screen';
import { ICON } from '@/data/structural';
import { mapMastery } from '@/features/academy/useAcademy';
import { dayTotals } from '@/features/quran/log';
import { useApp } from '@/state/app-store';
import { useContent } from '@/state/content-store';
import { useTheme } from '@/theme/theme';
import { DAY, dayKey } from '@/utils/date';

export default function StatsScreen() {
  const { t, gc, r } = useTheme();
  const router = useRouter();
  const [now] = useState(() => Date.now());

  // Stores
  const prayed = useApp((s) => s.prayed);
  const sunanDone = useApp((s) => s.sunanDone);
  const tasbeeh = useApp((s) => s.tasbeeh);
  const adC = useApp((s) => s.adC);
  const quranLog = useApp((s) => s.quranLog);
  const khatmah = useApp((s) => s.khatmah);
  const passed = useApp((s) => s.passed);
  const mast = useApp((s) => s.mast);
  const lessons = useContent((s) => s.lessons);

  const today = dayKey();

  // 1. Calculations: Prayers
  const { totalPrayers, last7DaysPrayers, todayPrayersCount } = useMemo(() => {
    let tot = 0;
    let l7 = 0;

    Object.entries(prayed).forEach(([dk, dayObj]) => {
      const count = Object.values(dayObj).filter(Boolean).length;
      tot += count;

      // Check if within last 7 days
      const diffDays = Math.round((now - new Date(dk).getTime()) / DAY);
      if (diffDays >= 0 && diffDays < 7) {
        l7 += count;
      }
    });

    const todayCount = Object.values(prayed[today] ?? {}).filter(Boolean).length;
    return {
      totalPrayers: tot,
      last7DaysPrayers: l7,
      todayPrayersCount: todayCount,
    };
  }, [prayed, today, now]);

  // 2. Calculations: Quran
  const { totalAyahs, totalMinutes, todayAyahs } = useMemo(() => {
    let ayahs = 0;
    let sec = 0;

    Object.values(quranLog).forEach((surahsMap) => {
      Object.values(surahsMap).forEach((dayEntry) => {
        ayahs += (dayEntry.a?.length ?? 0);
        sec += (dayEntry.s ?? 0);
      });
    });

    const tTotals = dayTotals(quranLog, today);
    return {
      totalAyahs: ayahs,
      totalMinutes: Math.round(sec / 60),
      todayAyahs: tTotals.ayahs,
    };
  }, [quranLog, today]);

  // 3. Calculations: Tasbeeh & Adhkar
  const todayTasbeeh = (tasbeeh?.daily ?? {})[today] ?? 0;
  const totalTasbeeh = tasbeeh?.total ?? 0;

  const totalAdhkarTapped = useMemo(() => {
    let tot = 0;
    Object.values(adC).forEach((dayMap) => {
      Object.values(dayMap).forEach((cnt) => {
        tot += cnt;
      });
    });
    return tot;
  }, [adC]);

  // 4. Calculations: Academy
  const passedLessonsCount = Object.keys(passed).length;
  const academyMap = useMemo(() => mapMastery(passed, mast, lessons), [passed, mast, lessons]);

  // 5. Active Streak calculation (consecutive days with any activity)
  const streak = useMemo(() => {
    let current = 0;
    const todayDate = new Date(now);

    for (let i = 0; i < 365; i++) {
      const d = new Date(todayDate.getTime() - i * DAY);
      const k = dayKey(d);
      const hasPrayer = Object.values(prayed[k] ?? {}).some(Boolean);
      const hasQuran = (dayTotals(quranLog, k).ayahs > 0);
      const hasSunan = Object.values(sunanDone?.[k] ?? {}).some(Boolean);
      const hasTasbeeh = ((tasbeeh?.daily ?? {})[k] ?? 0) > 0;

      if (hasPrayer || hasQuran || hasSunan || hasTasbeeh) {
        current++;
      } else if (i > 0) {
        // Break on the first inactive past day
        break;
      }
    }
    return current;
  }, [prayed, quranLog, sunanDone, tasbeeh, now]);

  // Today's Rawatib
  const todaySunanCount = Object.values(sunanDone?.[today] ?? {}).filter(Boolean).length;

  return (
    <Screen gap={16}>
      <RoundBackHeader title="الإحصائيات الشاملة" href="/" size={28} />

      {/* Hero Streak & High-level Achievements */}
      <Hero radius={26} pad={20} gap={14} diamond={{ size: 140, left: -36, top: -36, color: 'rgba(196,166,106,.5)' }} lattice={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ gap: 2 }}>
            <Txt size={13} weight={600} color={gc}>
              مؤشر الاستمرارية والمداومة
            </Txt>
            <Txt font="display" size={32} weight={700} color="#FFFFFF">
              {streak} {streak === 1 ? 'يوم نشط' : 'أيام متتالية'}
            </Txt>
          </View>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Txt font="display" size={28} color={gc}>
              ★
            </Txt>
          </View>
        </View>
        <Txt size={14} color="#CFE0DA" lh={1.7}>
          «أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ» · تقبل الله طاعتكم وبارك في سعيكم.
        </Txt>
      </Hero>

      {/* 1. الصلاة المفروضة */}
      <Card variant="app" radius={20} pad={16} style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={ICON.check} size={20} color={t.primary} sw={2.2} />
            </View>
            <Txt size={18} weight={700}>
              الصلوات المكتوبة
            </Txt>
          </View>
          <Press onPress={() => router.navigate('/prayer/log')} label="سجل الصلاة" style={{ minHeight: 32, justifyContent: 'center' }}>
            <Txt size={13} weight={600} color={t.primary}>
              سجل الصلوات ‹
            </Txt>
          </Press>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: t.soft, borderRadius: r(12), padding: 12, gap: 2 }}>
            <Txt size={12} color={t.muted}>
              اليوم
            </Txt>
            <Txt size={22} weight={700} color={t.primary} ltr style={{ alignSelf: 'flex-start' }}>
              {todayPrayersCount}/5
            </Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: t.soft, borderRadius: r(12), padding: 12, gap: 2 }}>
            <Txt size={12} color={t.muted}>
              آخر 7 أيام
            </Txt>
            <Txt size={22} weight={700} color={t.goldInk} ltr style={{ alignSelf: 'flex-start' }}>
              {last7DaysPrayers}/35
            </Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: t.soft, borderRadius: r(12), padding: 12, gap: 2 }}>
            <Txt size={12} color={t.muted}>
              المجموع الكلي
            </Txt>
            <Txt size={22} weight={700} color={t.ink} ltr style={{ alignSelf: 'flex-start' }}>
              {totalPrayers.toLocaleString('en-US')}
            </Txt>
          </View>
        </View>
      </Card>

      {/* 2. السنن النبوية */}
      <Card variant="app" radius={20} pad={16} style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={ICON.sunrise} size={20} color={t.goldInk} sw={2} />
            </View>
            <Txt size={18} weight={700}>
              السنن النبوية
            </Txt>
          </View>
          <Press onPress={() => router.navigate('/sunan' as any)} label="قسم السنن" style={{ minHeight: 32, justifyContent: 'center' }}>
            <Txt size={13} weight={600} color={t.goldInk}>
              قائمة السنن ‹
            </Txt>
          </Press>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: t.soft, borderRadius: r(12), padding: 12, gap: 2 }}>
            <Txt size={12} color={t.muted}>
              سنن مؤداة اليوم
            </Txt>
            <Txt size={22} weight={700} color={t.primary} ltr style={{ alignSelf: 'flex-start' }}>
              {todaySunanCount}
            </Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: t.soft, borderRadius: r(12), padding: 12, gap: 2 }}>
            <Txt size={12} color={t.muted}>
              السنن الرواتب
            </Txt>
            <Txt size={14} weight={600} color={t.goldInk} style={{ marginTop: 4 }}>
              12 ركعة يومياً
            </Txt>
          </View>
        </View>
      </Card>

      {/* 3. القرآن الكريم والختمة */}
      <Card variant="app" radius={20} pad={16} style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={ICON.book} size={20} color={t.primary} sw={2} />
            </View>
            <Txt size={18} weight={700}>
              القرآن الكريم والختمة
            </Txt>
          </View>
          <Press onPress={() => router.navigate('/quran/khatmah' as any)} label="الختمة" style={{ minHeight: 32, justifyContent: 'center' }}>
            <Txt size={13} weight={600} color={t.primary}>
              متابعة الختمة ‹
            </Txt>
          </Press>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: t.soft, borderRadius: r(12), padding: 12, gap: 2 }}>
            <Txt size={12} color={t.muted}>
              آيات اليوم
            </Txt>
            <Txt size={22} weight={700} color={t.primary} ltr style={{ alignSelf: 'flex-start' }}>
              {todayAyahs.toLocaleString('en-US')}
            </Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: t.soft, borderRadius: r(12), padding: 12, gap: 2 }}>
            <Txt size={12} color={t.muted}>
              إجمالي الآيات
            </Txt>
            <Txt size={22} weight={700} color={t.goldInk} ltr style={{ alignSelf: 'flex-start' }}>
              {totalAyahs.toLocaleString('en-US')}
            </Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: t.soft, borderRadius: r(12), padding: 12, gap: 2 }}>
            <Txt size={12} color={t.muted}>
              دقائق التلاوة
            </Txt>
            <Txt size={22} weight={700} color={t.ink} ltr style={{ alignSelf: 'flex-start' }}>
              {totalMinutes} د
            </Txt>
          </View>
        </View>

        {khatmah?.active ? (
          <View style={{ backgroundColor: t.goldSoft, borderRadius: r(12), padding: 12, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt size={13} weight={700} color={t.goldInk}>
                الختمة النشطة: {khatmah.active.title}
              </Txt>
              <Txt size={13} weight={700} color={t.goldInk} ltr>
                {Math.min(100, Math.round((khatmah.active.currentPage / 604) * 100))}%
              </Txt>
            </View>
            <ProgressBar value={(khatmah.active.currentPage / 604) * 100} height={5} />
          </View>
        ) : null}
      </Card>

      {/* 4. التسبيح والأذكار */}
      <Card variant="app" radius={20} pad={16} style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={ICON.sparkle} size={20} color={t.primary} sw={2} />
            </View>
            <Txt size={18} weight={700}>
              المسبحة والأذكار
            </Txt>
          </View>
          <Press onPress={() => router.navigate('/tasbeeh' as any)} label="المسبحة" style={{ minHeight: 32, justifyContent: 'center' }}>
            <Txt size={13} weight={600} color={t.primary}>
              فتح المسبحة ‹
            </Txt>
          </Press>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: t.soft, borderRadius: r(12), padding: 12, gap: 2 }}>
            <Txt size={12} color={t.muted}>
              تسبيحات اليوم
            </Txt>
            <Txt size={22} weight={700} color={t.primary} ltr style={{ alignSelf: 'flex-start' }}>
              {todayTasbeeh.toLocaleString('en-US')}
            </Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: t.soft, borderRadius: r(12), padding: 12, gap: 2 }}>
            <Txt size={12} color={t.muted}>
              الأوراد المكتملة
            </Txt>
            <Txt size={22} weight={700} color={t.goldInk} ltr style={{ alignSelf: 'flex-start' }}>
              {totalAdhkarTapped.toLocaleString('en-US')}
            </Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: t.soft, borderRadius: r(12), padding: 12, gap: 2 }}>
            <Txt size={12} color={t.muted}>
              إجمالي التسبيح
            </Txt>
            <Txt size={22} weight={700} color={t.ink} ltr style={{ alignSelf: 'flex-start' }}>
              {totalTasbeeh.toLocaleString('en-US')}
            </Txt>
          </View>
        </View>
      </Card>

      {/* 5. الأكاديمية الشرعية */}
      <Card variant="app" radius={20} pad={16} style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={ICON.tabAcademy} size={20} color={t.primary} sw={2} />
            </View>
            <Txt size={18} weight={700}>
              الأكاديمية وطلب العلم
            </Txt>
          </View>
          <Press onPress={() => router.navigate('/academy/map')} label="خريطة العلم" style={{ minHeight: 32, justifyContent: 'center' }}>
            <Txt size={13} weight={600} color={t.primary}>
              خريطة العلم ‹
            </Txt>
          </Press>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: t.soft, borderRadius: r(12), padding: 12, gap: 2 }}>
            <Txt size={12} color={t.muted}>
              الدروس المجتازة
            </Txt>
            <Txt size={22} weight={700} color={t.primary} ltr style={{ alignSelf: 'flex-start' }}>
              {passedLessonsCount} درسًا
            </Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: t.soft, borderRadius: r(12), padding: 12, gap: 2 }}>
            <Txt size={12} color={t.muted}>
              المفاهيم المضاءة
            </Txt>
            <Txt size={22} weight={700} color={t.goldInk} ltr style={{ alignSelf: 'flex-start' }}>
              {academyMap.lit} من {academyMap.total}
            </Txt>
          </View>
        </View>
      </Card>
    </Screen>
  );
}
