/** الصلاة والأذكار — `s.prayer`: next prayer, six times with «أديتها», Qibla compass, adhkar, today's lesson. */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Icon } from '@/components/core/Icon';
import { IconTile } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { Hero } from '@/components/layout/Hero';
import { BackLink, Screen } from '@/components/layout/Screen';
import { ADHKAR, ICON } from '@/data/structural';
import { DEFAULT_ADHKAR } from '@/data/defaults';
import { AUTO_METHOD, isLtrTime } from '@/services/prayer';
import { useContent } from '@/state/content-store';
import { useAcademy } from '@/features/academy/useAcademy';
import { CityPickerSheet, NeedLocationCard, useLocateAction } from '@/features/prayer/LocationPicker';
import { usePrayer } from '@/features/prayer/usePrayer';
import { QiblaCompassCard } from '@/features/qibla/Compass';
import { TodayLesson } from '@/features/prayer/TodayLesson';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';
import { dayKey } from '@/utils/date';

export default function Prayer() {
  const { t, pc, gc, r, dark } = useTheme();
  const router = useRouter();
  const pr = usePrayer();
  const ac = useAcademy();
  const togglePrayed = useApp((s) => s.togglePrayed);
  const flash = useUi((s) => s.flash);
  const setting = useApp((s) => s.setting);
  const adC = useApp((s) => s.adC[dayKey()]) ?? {};
  const adhkar = useContent((s) => s.adhkar);
  const [pick, setPick] = useState(false);
  const { locate, busy } = useLocateAction();

  return (
    <Screen gap={14} overlay={<CityPickerSheet visible={pick} onClose={() => setPick(false)} />}>
      <BackLink label="الرئيسية" href="/" />
      <View style={{ gap: 4, paddingTop: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Txt font="display" size={32} weight={700} lh={1.4} style={{ paddingTop: 4 }} accessibilityRole="header">
            الصلاة والأذكار
          </Txt>
          <Txt size={14} color={t.muted}>
            {pr.hijriToday}
          </Txt>
        </View>
      </View>

      {pr.loc && (
        <Card variant="app" radius={16} pad={0} style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconTile d={ICON.pin} size={38} iconSize={20} bg={t.soft} color={t.primary} radius={12} sw={1.9} />
          <View style={{ flex: 1, gap: 2 }} accessible accessibilityLabel={`الموقع: ${pr.loc.label ?? 'موقعي'}${pr.loc.country ? '، ' + pr.loc.country : ''}`}>
            <Txt size={16} weight={700}>
              {pr.loc.label ?? (pr.loc.source === 'gps' ? 'موقعي الحالي' : 'مدينة مختارة')}
              {pr.loc.country ? ` · ${pr.loc.country}` : ''}
            </Txt>
            <Txt size={13} color={t.muted}>
              {pr.loc.source === 'gps' ? 'من GPS' : 'مدينة مختارة'}
            </Txt>
            {/* Latin coordinates and zone on their own line, so the bidi algorithm cannot reorder them into the Arabic. */}
            <Txt size={12} color={t.muted} ltr style={{ alignSelf: 'flex-start' }}>
              {`${pr.loc.lat.toFixed(4)}, ${pr.loc.lon.toFixed(4)}${pr.tz ? '  ·  ' + pr.tz : ''}`}
            </Txt>
          </View>
          <Press onPress={() => setPick(true)} label="تغيير الموقع" style={{ minHeight: 40, paddingHorizontal: 6, justifyContent: 'center' }}>
            <Txt size={14} weight={600} color={t.primary}>
              تغيير
            </Txt>
          </Press>
        </Card>
      )}

      {!pr.hasLocation || !pr.next || !pr.times ? (
        <NeedLocationCard onPickCity={() => setPick(true)} />
      ) : (
        <>
          <Hero radius={24} pad={20} gap={8} diamond={{ size: 140, left: -40, top: -40, color: 'rgba(196,166,106,.5)' }} lattice={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt size={14} weight={600} color={gc}>
                الصلاة القادمة
              </Txt>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  borderWidth: 1,
                  borderColor: gc,
                  borderRadius: 12,
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                }}>
                <Icon d={ICON.clock} size={13} color={gc} sw={2} />
                <Txt size={15} weight={700} color="#FFFFFF" ltr style={{ letterSpacing: 1.2 }}>
                  {pr.next.countdown.formatted}
                </Txt>
              </View>
            </View>

            <Txt font="display" size={38} weight={700} lh={1.4} style={{ paddingTop: 4 }} color="#FFFFFF">
              {pr.next.name}
            </Txt>
            <Txt size={24} color="#FFFFFF" ltr={isLtrTime(pr.next.time)} style={{ alignSelf: 'flex-start' }}>
              {pr.next.time}
            </Txt>
            <Txt size={14} color="#CFE0DA">
              متبقٍ: {pr.next.countdown.arabic}
            </Txt>

            {/* Progress Bar inside Hero */}
            <View style={{ width: '100%', marginTop: 8, gap: 4 }}>
              <View
                style={{
                  height: 4,
                  width: '100%',
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  overflow: 'hidden',
                }}>
                <View
                  style={{
                    height: '100%',
                    width: `${pr.next.countdown.progressPct}%`,
                    backgroundColor: gc,
                    borderRadius: 2,
                  }}
                />
              </View>
            </View>
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
                  <Txt size={17} color={t.body} ltr={isLtrTime(p.time)}>
                    {p.time}
                  </Txt>
                  {!sun && (
                    <Press
                      onPress={() => {
                        togglePrayed(p.name);
                        flash(on ? `أُلغي تسجيل ${p.name}` : `سُجّلت صلاة ${p.name} في سجلّك`);
                      }}
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
            طريقة الحساب: {pr.method}
            {setting('calc') === AUTO_METHOD ? ' (تلقائي حسب البلد)' : ''} · العصر: {setting('asr')}
            {setting('adj') !== '0' ? ` · تعديل ${setting('adj')} د` : ''}. تُحسب على جهازك.
          </Txt>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Press onPress={locate} disabled={busy} label="تحديث الموقع" style={{ minHeight: 40, justifyContent: 'center' }}>
              <Txt size={14} weight={600} color={t.primary}>
                {busy ? 'جارٍ التحديد…' : 'تحديث موقعي'}
              </Txt>
            </Press>
            <Press onPress={() => router.navigate('/prayer/log')} label="سجل الصلاة" style={{ minHeight: 40, justifyContent: 'center' }}>
              <Txt size={14} weight={600} color={t.primary}>
                سجل الصلاة
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

      <Press
        onPress={() => router.navigate('/tasbeeh' as any)}
        label="المسبحة الإلكترونية"
        style={{
          backgroundColor: t.goldSoft,
          borderRadius: r(18),
          paddingHorizontal: 16,
          minHeight: 58,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
        <IconTile d={ICON.sparkle} size={38} iconSize={20} bg={pc} color="#FFFFFF" radius={12} sw={1.8} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={17} weight={700} color={t.goldInk}>
            المسبحة الإلكترونية
          </Txt>
          <Txt size={13} color={t.goldInk} style={{ opacity: 0.85 }}>
            تسبيح تفاعلي بالاهتزاز وحفظ العداد اليومي
          </Txt>
        </View>
        <Icon d={ICON.forward} size={18} color={t.goldInk} sw={2.2} directional />
      </Press>

      <Txt size={19} weight={600} style={{ marginTop: 4 }} accessibilityRole="header">
        الأذكار
      </Txt>
      <View style={{ gap: 8 }}>
        {ADHKAR.map((a) => {
          const published = adhkar[a.id]?.items;
          const list = published && published.length ? published : (DEFAULT_ADHKAR[a.id]?.items ?? []);
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
