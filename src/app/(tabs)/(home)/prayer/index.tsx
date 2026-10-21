/** الصلاة والأذكار — `s.prayer`: next prayer, six times with «أديتها», Qibla compass, adhkar, today's lesson. */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { IconTile } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { Hero } from '@/components/layout/Hero';
import { BackLink, Screen } from '@/components/layout/Screen';
import { ADHKAR } from '@/data/structural';
import { useContent } from '@/state/content-store';
import { useAcademy } from '@/features/academy/useAcademy';
import { CityPickerSheet, NeedLocationCard, useLocateAction } from '@/features/prayer/LocationPicker';
import { usePrayer } from '@/features/prayer/usePrayer';
import { QiblaCompassCard } from '@/features/qibla/Compass';
import { TodayLesson } from '@/features/prayer/TodayLesson';
import { useApp } from '@/state/app-store';
import { useTheme } from '@/theme/theme';
import { dayKey } from '@/utils/date';

export default function Prayer() {
  const { t, pc, gc, r, dark } = useTheme();
  const router = useRouter();
  const pr = usePrayer();
  const ac = useAcademy();
  const togglePrayed = useApp((s) => s.togglePrayed);
  const setting = useApp((s) => s.setting);
  const adC = useApp((s) => s.adC[dayKey()]) ?? {};
  const adhkar = useContent((s) => s.adhkar);
  const [pick, setPick] = useState(false);
  const { locate, busy } = useLocateAction();

  return (
    <Screen gap={14} overlay={<CityPickerSheet visible={pick} onClose={() => setPick(false)} />}>
      <BackLink label="الرئيسية" href="/" />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
        <Txt font="display" size={32} weight={700} accessibilityRole="header">
          الصلاة والأذكار
        </Txt>
        <Txt size={14} color={t.muted}>
          {pr.hijriToday}
        </Txt>
      </View>

      {!pr.hasLocation || !pr.next || !pr.times ? (
        <NeedLocationCard onPickCity={() => setPick(true)} />
      ) : (
        <>
          <Hero radius={24} pad={20} gap={6} diamond={{ size: 140, left: -40, top: -40, color: 'rgba(196,166,106,.5)' }} lattice={false}>
            <Txt size={14} weight={600} color={gc}>
              الصلاة القادمة
            </Txt>
            <Txt font="display" size={41} weight={700} lh={1.3} color="#FFFFFF">
              {pr.next.name}
            </Txt>
            <Txt size={24} color="#FFFFFF" ltr style={{ alignSelf: 'flex-start' }}>
              {pr.next.time}
            </Txt>
            <Txt size={14} color="#CFE0DA">
              {pr.next.left}
            </Txt>
          </Hero>
          <View style={{ gap: 8 }}>
            {pr.times.map((p) => {
              const sun = p.name === 'الشروق';
              const on = !!pr.prayed[p.name];
              const nx = p.name === pr.next!.name;
              return (
                <Card key={p.name} variant="app" radius={16} pad={0} style={{ minHeight: 54, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Txt size={18} weight={nx ? 700 : 500} color={nx ? t.primary : t.ink} style={{ flex: 1 }}>
                    {p.name}
                  </Txt>
                  <Txt size={17} color={t.body} ltr>
                    {p.time}
                  </Txt>
                  {!sun && (
                    <Press
                      onPress={() => togglePrayed(p.name)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      label={`أديتها · ${p.name}`}
                      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: on ? t.primary : t.soft, alignItems: 'center', justifyContent: 'center' }}>
                      <Txt size={18} color={on ? (dark ? '#0E2A25' : '#FFFFFF') : t.primary}>
                        ✓
                      </Txt>
                    </Press>
                  )}
                </Card>
              );
            })}
          </View>
          <Txt size={13} color={t.muted} lh={1.8}>
            حسب {pr.loc?.label ?? 'موقعك'} · {setting('calc')} · العصر: {setting('asr')}
            {setting('adj') !== '0' ? ` · تعديل ${setting('adj')} د` : ''}. تُحسب على جهازك.
          </Txt>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Press onPress={locate} disabled={busy} label="تحديث الموقع" style={{ minHeight: 40, justifyContent: 'center' }}>
              <Txt size={14} weight={600} color={t.primary}>
                {busy ? 'جارٍ التحديد…' : 'تحديث موقعي'}
              </Txt>
            </Press>
            <Press onPress={() => setPick(true)} label="اختيار مدينة" style={{ minHeight: 40, justifyContent: 'center' }}>
              <Txt size={14} weight={600} color={t.primary}>
                اختيار مدينة
              </Txt>
            </Press>
            <Press onPress={() => router.navigate('/account/settings')} label="إعدادات الصلاة" style={{ minHeight: 40, justifyContent: 'center' }}>
              <Txt size={14} weight={600} color={t.goldInk}>
                طريقة الحساب
              </Txt>
            </Press>
          </View>
        </>
      )}

      <QiblaCompassCard />

      <Txt size={19} weight={600} style={{ marginTop: 4 }} accessibilityRole="header">
        الأذكار
      </Txt>
      <View style={{ gap: 8 }}>
        {ADHKAR.map((a) => {
          const list = adhkar[a.id]?.items ?? [];
          const done = list.filter((x) => (adC[`${a.id}:${x.id}`] ?? 0) >= x.count).length;
          return (
            <Card key={a.id} variant="app" radius={16} pad={0} onPress={() => router.navigate(`/prayer/adhkar/${a.id}`)} label={list.length ? `${a.name} · ${done} من ${list.length}` : `${a.name} · بانتظار التوثيق`} style={{ minHeight: 54, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconTile d={a.icon} size={36} iconSize={20} bg={t.soft} color={t.primary} radius={11} sw={1.9} />
              <Txt size={17} weight={600} style={{ flex: 1 }}>
                {a.name}
              </Txt>
              <Txt size={14} color={t.muted} ltr>
                {list.length ? `${done}/${list.length}` : '—'}
              </Txt>
            </Card>
          );
        })}
      </View>

      <TodayLesson pc={pc} gc={gc} r={r} ac={ac} />
    </Screen>
  );
}
