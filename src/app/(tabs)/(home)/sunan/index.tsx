/**
 * السنن النبوية اليومية — Prophetic Sunan, 12 Rawatib tracker, and daily habits checklist.
 */
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Icon } from '@/components/core/Icon';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { Hero } from '@/components/layout/Hero';
import { RoundBackHeader, Screen } from '@/components/layout/Screen';
import { SUNAN_CATEGORIES, SUNAN_LIST } from '@/data/sunanData';
import { ICON } from '@/data/structural';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';
import { dayKey } from '@/utils/date';

export default function SunanScreen() {
  const { t, pc, gc, r, dark } = useTheme();
  const flash = useUi((s) => s.flash);
  const sunanDoneToday = useApp((s) => s.sunanDone?.[dayKey()]) ?? {};
  const toggleSunan = useApp((s) => s.toggleSunan);

  const [activeCategory, setActiveCategory] = useState<string>('all');

  const rawatibList = useMemo(() => SUNAN_LIST.filter((s) => s.category === 'rawatib'), []);
  const rawatibDoneCount = rawatibList.filter((s) => sunanDoneToday[s.id]).reduce((sum, s) => sum + (s.rakats ?? 0), 0);

  const filteredSunan = useMemo(() => {
    if (activeCategory === 'all') return SUNAN_LIST;
    return SUNAN_LIST.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  const pctRawatib = Math.min(100, Math.round((rawatibDoneCount / 12) * 100));

  return (
    <Screen gap={16}>
      <RoundBackHeader
        title="السنن النبوية"
        href="/more"
        size={28}
        right={
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICON.sunan} size={24} color={t.goldInk} sw={2} />
          </View>
        }
      />

      {/* Hero Hadith */}
      <Hero radius={22} pad={18} gap={8} diamond={{ size: 110, left: -26, top: -26, color: 'rgba(196,166,106,.4)' }} lattice={false}>
        <Txt size={13} weight={600} color={gc}>
          فضل إحياء السنن النبوية
        </Txt>
        <Txt font="display" size={20} weight={700} color="#FFFFFF" lh={1.6}>
          «مَنْ صَلَّى فِي يَوْمٍ وَلَيْلَةٍ ثِنْتَيْ عَشْرَةَ رَكْعَةً بُنِيَ لَهُ بَيْتٌ فِي الْجَنَّةِ»
        </Txt>
        <Txt size={13} color="#CFE0DA">
          صحيح مسلم · ركعتان قبل الفجر، وأربع قبل الظهر وركعتان بعدها، وركعتان بعد المغرب، وركعتان بعد العشاء.
        </Txt>
      </Hero>

      {/* Rawatib 12 Tracker Spotlight Card */}
      <Card variant="app" radius={20} pad={16} style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ gap: 2 }}>
            <Txt size={14} weight={600} color={t.goldInk}>
              مؤشر السنن الرواتب اليوم
            </Txt>
            <Txt size={20} weight={700} color={t.primary}>
              {rawatibDoneCount} من 12 ركعة
            </Txt>
          </View>
          <View style={{ backgroundColor: pctRawatib === 100 ? pc : t.soft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: r(10) }}>
            <Txt size={14} weight={700} color={pctRawatib === 100 ? '#FFFFFF' : t.primary}>
              {pctRawatib === 100 ? 'بيت في الجنة ✓' : `${pctRawatib}%`}
            </Txt>
          </View>
        </View>

        <ProgressBar value={pctRawatib} height={7} />

        {/* Quick check pill buttons for 12 Rawatib */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
          {rawatibList.map((item) => {
            const on = !!sunanDoneToday[item.id];
            return (
              <Press
                key={item.id}
                onPress={() => {
                  toggleSunan(item.id);
                  flash(on ? `أُلغي تسجيل ${item.title}` : `سُجّلت ${item.title} في سننك اليوم`);
                }}
                label={item.title}
                style={{
                  flexGrow: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: r(10),
                  backgroundColor: on ? pc : t.soft,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}>
                <Txt size={13} weight={600} color={on ? '#FFFFFF' : t.ink}>
                  {item.title.split(' ')[1]} ({item.rakats})
                </Txt>
                <Txt size={13} color={on ? '#FFFFFF' : t.muted}>
                  {on ? '✓' : '○'}
                </Txt>
              </Press>
            );
          })}
        </View>
      </Card>

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {SUNAN_CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <Press
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              label={cat.name}
              style={{
                paddingHorizontal: 14,
                height: 36,
                borderRadius: r(12),
                backgroundColor: active ? pc : t.soft,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Txt size={13} weight={active ? 700 : 500} color={active ? '#FFFFFF' : t.ink}>
                {cat.name}
              </Txt>
            </Press>
          );
        })}
      </ScrollView>

      {/* Sunan Checklist */}
      <View style={{ gap: 10 }}>
        {filteredSunan.map((item) => {
          const done = !!sunanDoneToday[item.id];
          return (
            <Card
              key={item.id}
              variant="app"
              radius={18}
              pad={14}
              style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Txt size={17} weight={700} color={done ? t.primary : t.ink}>
                      {item.title}
                    </Txt>
                    {item.time ? (
                      <View style={{ backgroundColor: t.soft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: r(6) }}>
                        <Txt size={11} color={t.muted}>
                          {item.time}
                        </Txt>
                      </View>
                    ) : null}
                  </View>
                  <Txt size={14} color={t.body} lh={1.7}>
                    {item.desc}
                  </Txt>
                </View>

                {/* Big Checkbox Button */}
                <Press
                  onPress={() => {
                    toggleSunan(item.id);
                    flash(done ? `أُلغي تسجيل ${item.title}` : `أحسنت! سُجّلت ${item.title} في ميزان حسناتك`);
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: done }}
                  label={`أديت ${item.title}`}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: done ? pc : t.soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Txt size={18} color={done ? (dark ? '#0E2A25' : '#FFFFFF') : t.primary}>
                    ✓
                  </Txt>
                </Press>
              </View>

              {/* Hadith Quote */}
              <View style={{ backgroundColor: t.goldSoft, borderRadius: r(12), padding: 10, gap: 4 }}>
                <Txt font="display" size={15} color={t.goldInk} lh={1.8}>
                  {item.hadith}
                </Txt>
                <Txt size={12} color={t.muted} ltr style={{ alignSelf: 'flex-start' }}>
                  {item.ref}
                </Txt>
              </View>

              {/* Virtue */}
              <Txt size={13} color={t.muted} lh={1.7}>
                <Txt size={13} weight={700} color={t.primary}>
                  الفضل والأثر:{' '}
                </Txt>
                {item.virtue}
              </Txt>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
