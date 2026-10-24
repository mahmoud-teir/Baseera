/** الرئيسية — `s.home` in Baseerah Prototype.dc.html. */
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Card } from '@/components/core/Card';
import { DayNightGlyph } from '@/components/core/DayNightGlyph';
import { Icon } from '@/components/core/Icon';
import { IconTile, SectionHeader } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { Hero } from '@/components/layout/Hero';
import { CornerDiamond } from '@/components/layout/Ornament';
import { Screen } from '@/components/layout/Screen';
import { isVerifiedQuote, type Quote } from '@/data/content';
import { DEFAULT_QUOTES } from '@/data/defaults';
import { useContent } from '@/state/content-store';
import { ICON, PATHS, PLAN_TEMPLATES, SUBJECTS } from '@/data/structural';
import { mapMastery, useAcademy } from '@/features/academy/useAcademy';
import { usePrayer } from '@/features/prayer/usePrayer';
import { dueSrsCards, useApp, useHydrated } from '@/state/app-store';
import { useTawheed } from '@/state/tawheed-store';
import { useTheme } from '@/theme/theme';
import { dayKey } from '@/utils/date';

export default function Home() {
  const { t, pc, gc, r, dark } = useTheme();
  const router = useRouter();
  const onboarded = useApp((s) => s.onboarded);
  const set = useApp((s) => s.set);
  const passed = useApp((s) => s.passed);
  const mast = useApp((s) => s.mast);
  const planMin = useApp((s) => s.planMin);
  const planDoneAll = useApp((s) => s.planDone);
  const srs = useApp((s) => s.srs);
  const pathDone = useApp((s) => s.pathDone);
  const hydrated = useHydrated();
  const completedTawheed = useTawheed((s) => Object.keys(s.completedGates).length);
  const ac = useAcademy();
  const pr = usePrayer();
  const lessons = useContent((s) => s.lessons);
  const rawQuotes = useContent((s) => s.quotes);
  const quotes = rawQuotes.length ? rawQuotes : DEFAULT_QUOTES;
  const pathsContent = useContent((s) => s.paths);
  const [minuteTick, setMinuteTick] = useState(() => Math.floor(Date.now() / 60000));

  useEffect(() => {
    const timer = setInterval(() => {
      setMinuteTick(Math.floor(Date.now() / 60000));
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  const homeQuotes: Quote[] = useMemo(() => {
    const verified = quotes.filter(isVerifiedQuote);
    if (!verified.length) {
      return [{ id: 'pending', cat: '', text: null, scholar: null, source: null }];
    }
    const startIndex = (minuteTick * 3) % verified.length;
    const selected: Quote[] = [];
    const count = Math.min(verified.length, 4);
    for (let i = 0; i < count; i++) {
      selected.push(verified[(startIndex + i) % verified.length]);
    }
    return selected;
  }, [quotes, minuteTick]);

  const map = mapMastery(passed, mast, lessons);

  if (hydrated && !onboarded) return <Redirect href="/welcome" />;

  const plan = PLAN_TEMPLATES[planMin];
  const today = planDoneAll[dayKey()] ?? {};
  const planDone = plan.filter((_, i) => today[`${planMin}:${i}`]).length;
  const due = dueSrsCards(srs).length;
  // Published (verified) quotes only; with none yet, one pending slot says so.
  const pathLabel = (id: string) => {
    const steps = pathsContent[id]?.steps ?? [];
    if (!steps.length) return 'بانتظار التوثيق';
    const dn = steps.filter((_, i) => pathDone[`${id}:${i}`]).length;
    return `${steps.length} خطوات${dn ? ` · ${dn} منجزة` : ''}`;
  };

  return (
    <Screen gap={18}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Txt size={15} color={t.muted}>
            السلام عليكم ورحمة الله
          </Txt>
          <Txt font="display" size={29} weight={700} lh={1.4} accessibilityRole="header">
            أهلًا بك يا طالب العلم
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Press
            onPress={() => set({ dark: !dark })}
            label={dark ? 'الوضع النهاري' : 'الوضع الليلي'}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
            <DayNightGlyph dark={dark} color={t.primary} background={t.soft} size={22} />
          </Press>
        </View>
      </View>

      {/* Rich Prayer Card with Live Seconds Countdown and Rich Details */}
      <Card
        variant="app"
        radius={22}
        pad={0}
        onPress={() => router.navigate('/prayer')}
        label="مواقيت الصلاة والعد التنازلي المباشر بالثواني"
        style={{
          borderWidth: 1.5,
          borderColor: dark ? '#1E3B32' : '#D1E6DD',
          overflow: 'hidden',
        }}>
        {/* Top Header: Location + Hijri Date */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: dark ? '#162F27' : '#E6EFEA',
            backgroundColor: dark ? '#0E231C' : '#F4F9F6',
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon d={ICON.pin} size={15} color={t.primary} sw={2} />
            <Txt size={13} weight={600} color={t.ink}>
              {pr.loc?.label ?? (pr.loc?.source === 'gps' ? 'موقعي الحالي' : 'حدّد موقعك')}
              {pr.loc?.country ? ` · ${pr.loc.country}` : ''}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Txt size={13} weight={600} color={t.goldInk}>
              🌙 {pr.hijriToday}
            </Txt>
          </View>
        </View>

        {/* Main Prayer Row: Next Prayer + Live Seconds Countdown */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Next Prayer info */}
            <View style={{ gap: 2 }}>
              <View
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: t.goldSoft,
                }}>
                <Txt size={11} weight={700} color={t.goldInk}>
                  الصلاة القادمة
                </Txt>
              </View>

              {pr.next ? (
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                  <Txt font="display" size={28} weight={700} lh={1.3}>
                    {pr.next.name}
                  </Txt>
                  <Txt size={22} weight={700} color={t.primary} ltr>
                    {pr.next.time}
                  </Txt>
                </View>
              ) : (
                <Txt size={15} color={t.muted} lh={1.7}>
                  حدّد موقعك لعرض المواقيت
                </Txt>
              )}
            </View>

            {/* Live Seconds Digital Countdown */}
            {pr.next && (
              <View
                style={{
                  alignItems: 'center',
                  backgroundColor: dark ? '#0A1C16' : '#EBF6F1',
                  borderWidth: 1.5,
                  borderColor: gc,
                  borderRadius: r(14),
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  gap: 2,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon d={ICON.clock} size={13} color={gc} sw={2} />
                  <Txt size={11} weight={600} color={t.goldInk}>
                    متبقٍ للأذان
                  </Txt>
                </View>
                <Txt
                  size={19}
                  weight={700}
                  color={dark ? '#34D399' : '#047857'}
                  ltr
                  style={{ letterSpacing: 1.2 }}>
                  {pr.next.countdown.formatted}
                </Txt>
              </View>
            )}
          </View>

          {/* Interval Progress Bar */}
          {pr.next && (
            <View style={{ marginTop: 12, gap: 6 }}>
              <View
                style={{
                  height: 5,
                  width: '100%',
                  borderRadius: 2.5,
                  backgroundColor: dark ? '#18362D' : '#E2EBE6',
                  overflow: 'hidden',
                }}>
                <View
                  style={{
                    height: '100%',
                    width: `${pr.next.countdown.progressPct}%`,
                    backgroundColor: gc,
                    borderRadius: 2.5,
                  }}
                />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt size={11} color={t.muted}>
                  {pr.prev ? `السابقة: ${pr.prev.name} (${pr.prev.time})` : 'الفجر'}
                </Txt>
                <Txt size={11} weight={600} color={t.goldInk}>
                  {pr.next.countdown.arabic}
                </Txt>
                <Txt size={11} color={t.muted}>
                  {`القادمة: ${pr.next.name}`}
                </Txt>
              </View>
            </View>
          )}

          {/* 5 Daily Prayers Pill Strip */}
          {pr.times && (
            <View
              style={{
                flexDirection: 'row',
                gap: 6,
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: dark ? '#162F27' : '#E6EFEA',
              }}>
              {pr.times
                .filter((p) => p.name !== 'الشروق')
                .map((p) => {
                  const isDone = !!pr.prayed[p.name];
                  const isNext = pr.next?.name === p.name;
                  return (
                    <View
                      key={p.name}
                      style={{
                        flex: 1,
                        paddingVertical: 6,
                        paddingHorizontal: 2,
                        borderRadius: r(10),
                        alignItems: 'center',
                        gap: 2,
                        backgroundColor: isNext
                          ? dark
                            ? '#173D32'
                            : '#D6EFE5'
                          : isDone
                            ? dark
                              ? '#0D261E'
                              : '#E8F5F0'
                            : t.soft,
                        borderWidth: isNext ? 1.5 : 1,
                        borderColor: isNext ? t.primary : isDone ? (dark ? '#1B473A' : '#C4E1D4') : t.line,
                      }}>
                      <Txt
                        size={12}
                        weight={isNext ? 700 : 600}
                        color={isNext ? t.primary : isDone ? (dark ? '#34D399' : '#059669') : t.ink}>
                        {p.name}
                      </Txt>
                      <Txt size={10} color={t.muted} ltr>
                        {p.time.replace(/\s[صم]/, '')}
                      </Txt>
                      <View
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: isDone ? '#10B981' : isNext ? gc : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: 2,
                        }}>
                        {isDone ? (
                          <Txt size={9} weight={700} color="#FFFFFF">
                            ✓
                          </Txt>
                        ) : isNext ? (
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' }} />
                        ) : (
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: dark ? '#2A4D41' : '#CBD5E1',
                            }}
                          />
                        )}
                      </View>
                    </View>
                  );
                })}
            </View>
          )}

          {/* Quick Shortcuts Footer */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 12,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: dark ? '#162F27' : '#E6EFEA',
            }}>
            <Press
              onPress={() => router.push('/prayer/qibla' as any)}
              label="بوصلة القبلة"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingVertical: 5,
                paddingHorizontal: 10,
                borderRadius: 8,
                backgroundColor: t.soft,
              }}>
              <Icon d={ICON.compass} size={14} color={t.primary} sw={2} />
              <Txt size={12} weight={600} color={t.primary}>
                بوصلة القبلة
              </Txt>
            </Press>

            <Press
              onPress={() => router.push('/prayer' as any)}
              label="الأذكار والمواقيت"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingVertical: 5,
                paddingHorizontal: 10,
                borderRadius: 8,
                backgroundColor: t.goldSoft,
              }}>
              <Icon d={ICON.sparkle} size={14} color={t.goldInk} sw={2} />
              <Txt size={12} weight={700} color={t.goldInk}>
                الأذكار والمواقيت
              </Txt>
              <Icon d={ICON.forward} size={12} color={t.goldInk} sw={2.2} directional />
            </Press>
          </View>
        </View>
      </Card>

      {/* Tawheed Gateways Banner */}
      <Card
        variant="app"
        pad={14}
        onPress={() => router.push('/tawheed' as any)}
        label="بوابات التوحيد واليقين"
        style={{
          borderWidth: 1.5,
          borderColor: gc,
          backgroundColor: dark ? '#132821' : '#F6FAF8',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: 'rgba(197, 155, 39, 0.18)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon d={ICON.star8} size={24} color={gc} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt size={12} weight={700} color={gc}>
                المنهج الحق وأدلة الطائفة المنصورة
              </Txt>
              <Txt size={11} weight={700} color={gc}>
                {completedTawheed}/7 بوابات
              </Txt>
            </View>
            <Txt size={16} weight={700} color={t.ink}>
              بوابات التوحيد واليقين
            </Txt>
            <Txt size={13} color={t.muted}>
              أصول العقيدة، التحاكم لشرع الله، ودحض الشبهات
            </Txt>
          </View>
          <Icon d={ICON.forward} size={18} color={gc} sw={2.2} directional />
        </View>
      </Card>

      {/* Quick Guide Card — كيف تستفيد من بصيرة */}
      <Card
        variant="app"
        pad={14}
        onPress={() => router.push('/guide' as any)}
        label="دليل بصيرة الإيماني"
        style={{
          borderWidth: 1,
          borderColor: t.line,
          backgroundColor: dark ? '#18241F' : '#F8FAF9',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: t.goldSoft,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
            <Icon d={ICON.compass} size={20} color={gc} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Txt size={11} weight={700} color={gc}>
                خريطة الطريق والرحلة
              </Txt>
              <Txt size={11} color={t.muted}>
                دليل تفاعلي
              </Txt>
            </View>
            <Txt size={15} weight={700} color={t.ink}>
              كيف تستفيد من تطبيق «بصيرة»؟
            </Txt>
            <Txt size={12} color={t.muted} numberOfLines={1}>
              تعرف على التدرج السليم بين تثبيت العقيدة، وطلب العلم، والعبادة اليومية
            </Txt>
          </View>
          <Icon d={ICON.forward} size={16} color={gc} sw={2.2} directional />
        </View>
      </Card>


      {/* Plan + review */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Card variant="app" pad={14} onPress={() => router.navigate('/plan')} label="خطتك اليوم" style={{ flex: 1, minHeight: 104, gap: 6 }}>
          <Txt size={14} weight={600} color={t.goldInk}>
            خطتك اليوم
          </Txt>
          <Txt size={18} weight={700}>
            {planDone} من {plan.length} مهام
          </Txt>
          <ProgressBar value={(planDone / plan.length) * 100} />
        </Card>
        <Card variant="app" pad={14} onPress={() => router.navigate('/review')} label="المراجعة" style={{ flex: 1, minHeight: 104, gap: 6 }}>
          <Txt size={14} weight={600} color={t.goldInk}>
            المراجعة
          </Txt>
          <Txt size={18} weight={700}>
            {due} بطاقات
          </Txt>
          <Txt size={14} color={t.muted}>
            تعود لك في موعدها
          </Txt>
        </Card>
      </View>

      {/* Knowledge map tile */}
      <Hero radius={22} pad={16} diamond={null} lattice={false} onPress={() => router.navigate('/academy/map')} label="خريطة العلم" style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 84, height: 64, direction: 'ltr' }}>
          <View style={{ position: 'absolute', left: 36, top: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: gc, boxShadow: `0px 0px 12px ${gc}` }} />
          <View style={{ position: 'absolute', left: 34, top: 16, width: 2, height: 16, backgroundColor: gc, transform: [{ rotate: '-30deg' }], transformOrigin: 'top' }} />
          <View style={{ position: 'absolute', left: 50, top: 16, width: 2, height: 16, backgroundColor: 'rgba(255,255,255,.35)', transform: [{ rotate: '30deg' }], transformOrigin: 'top' }} />
          <View style={{ position: 'absolute', left: 14, top: 34, width: 12, height: 12, borderRadius: 6, backgroundColor: gc, opacity: 0.8 }} />
          <View style={{ position: 'absolute', left: 60, top: 34, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,.5)' }} />
          <View style={{ position: 'absolute', left: 38, top: 46, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,.3)' }} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Txt size={14} weight={600} color={gc}>
            {map.lit} من {map.total} مفهومًا مضيء
          </Txt>
          <Txt font="display" size={24} weight={700} lh={1.3} color="#FFFFFF">
            خريطة العلم
          </Txt>
          <Txt size={14} color="#CFE0DA">
            شاهد ما تعلّمته وما ينقصك
          </Txt>
        </View>
        <Icon d={ICON.forward} size={18} color="#FFFFFF" sw={2.2} directional />
      </Hero>

      {/* Continue lesson */}
      <Hero>
        <Txt size={14} weight={600} color={gc}>
          {ac.cur ? (
            <Txt size={14} weight={600} color={gc} ltr>
              {ac.cur.code}
            </Txt>
          ) : null}
          {ac.cur ? ' · ' : ''}
          {ac.subject.name}
        </Txt>
        <Txt size={21} weight={600} color="#FFFFFF">
          {ac.cur?.title ?? 'الدروس قيد الإعداد والمراجعة العلمية'}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <ProgressBar value={ac.curPct} light label="تقدّم المادة" />
          </View>
          <Txt size={14} color="#FFFFFF">
            {ac.curPct}%
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Press onPress={ac.continueLesson} label={ac.continueLabel} style={{ backgroundColor: '#FAF8F2', borderRadius: r(12), paddingHorizontal: 18, height: 42, justifyContent: 'center' }}>
            <Txt size={16} weight={700} color={pc}>
              {ac.continueLabel}
            </Txt>
          </Press>
        </View>
      </Hero>

      {/* Stage + Quran */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Card variant="app" pad={14} style={{ flex: 1 }}>
          <Txt size={14} color={t.muted}>
            المرحلة الأولى
          </Txt>
          <Txt size={28} weight={700} color={t.primary}>
            {ac.stagePct}%
          </Txt>
          <Txt size={14} color={t.muted}>
            {ac.totalPassed} من {ac.stageTotal} درسًا
          </Txt>
        </Card>
        <Press
          onPress={() => router.navigate('/quran')}
          label="القرآن الكريم · أكمل القراءة"
          style={{ flex: 1, backgroundColor: t.goldSoft, borderRadius: r(20), padding: 14, justifyContent: 'space-between' }}>
          <Txt size={14} color={t.goldInk}>
            القرآن الكريم
          </Txt>
          <Txt font="display" size={22} weight={700} color={t.goldInk}>
            أكمل القراءة
          </Txt>
          <Txt size={14} color={t.goldInk}>
            114 سورة · متاح للجميع
          </Txt>
        </Press>
      </View>

      {/* Subjects */}
      <View>
        <SectionHeader title="العلوم الشرعية" actions={[{ label: 'عرض الكل', onPress: () => router.navigate('/academy') }]} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {SUBJECTS.map((s) => (
            <Card
              key={s.id}
              variant="app"
              radius={16}
              pad={0}
              label={s.name}
              onPress={() => router.navigate(`/academy/subject/${s.id}`)}
              style={{ width: '31%', flexGrow: 1, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center', gap: 8 }}>
              <IconTile d={s.icon} bg={t.soft} color={t.primary} />
              <Txt size={15} weight={600}>
                {s.short}
              </Txt>
            </Card>
          ))}
        </View>
      </View>

      {/* Paths */}
      <View>
        <SectionHeader
          title="مسارات موضوعية"
          actions={[
            { label: 'التقويم', gold: true, onPress: () => router.navigate('/hijri') },
            { label: 'عرض الكل', onPress: () => router.navigate('/paths') },
          ]}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4, gap: 12 }}>
          {PATHS.map((p) => (
            <Press
              key={p.id}
              onPress={() => router.navigate(`/paths/${p.id}`)}
              label={p.title}
              style={{ width: 200, backgroundColor: pc, borderRadius: r(20), padding: 16, gap: 6 }}>
              <Txt size={13} weight={600} color={gc}>
                {p.tag}
              </Txt>
              <Txt font="display" size={21} weight={700} lh={1.4} color="#FFFFFF">
                {p.title}
              </Txt>
              <Txt size={14} color="#CFE0DA">
                {pathLabel(p.id)}
              </Txt>
            </Press>
          ))}
        </ScrollView>
      </View>

      {/* Quotes */}
      <View>
        <SectionHeader title="من أقوال العلماء" actions={[{ label: 'قول آخر ↻', onPress: () => setMinuteTick((prev) => prev + 1) }, { label: 'عرض الكل', onPress: () => router.navigate('/quotes') }]} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4, gap: 12 }}>
          {homeQuotes.map((q) => {
            const ver = isVerifiedQuote(q);
            return (
              <Press
                key={q.id}
                onPress={() => router.navigate('/quotes')}
                label={ver ? `${q.text} — ${q.scholar}` : 'قول بانتظار التوثيق'}
                style={{ width: 270, backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: r(20), padding: 16, gap: 10 }}>
                <Txt font="display" size={43} color={gc} style={{ height: 22, lineHeight: 48 }}>
                  “
                </Txt>
                {ver ? (
                  <Txt font="display" size={20} lh={1.9}>
                    {q.text}
                  </Txt>
                ) : (
                  <View style={{ gap: 8 }}>
                    <View style={{ height: 11, borderRadius: 6, backgroundColor: t.line }} />
                    <View style={{ height: 11, width: '70%', borderRadius: 6, backgroundColor: t.line }} />
                  </View>
                )}
                <Txt size={14} weight={600} color={t.goldInk}>
                  {q.scholar ?? 'اسم العالم — يُدرج بعد التوثيق'}
                </Txt>
              </Press>
            );
          })}
        </ScrollView>
      </View>

      {/* Library shortcuts */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {[
          { label: 'المكتبة الإسلامية', tab: 'books' },
          { label: 'مكتبة الصوتيات', tab: 'audio' },
        ].map((x) => (
          <Press
            key={x.tab}
            onPress={() => router.navigate({ pathname: '/library', params: { tab: x.tab } })}
            label={x.label}
            style={{ flex: 1, backgroundColor: t.soft, borderRadius: r(16), padding: 14, alignItems: 'center' }}>
            <Txt size={16} weight={600} color={t.primary}>
              {x.label}
            </Txt>
          </Press>
        ))}
      </View>

      {/* Sharia encyclopedia */}
      <Press
        onPress={() => router.navigate('/sharia')}
        label="موسوعة الشريعة"
        style={{ backgroundColor: t.goldSoft, borderRadius: r(22), minHeight: 84, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden' }}>
        <CornerDiamond size={90} left={-26} bottom={-26} color={gc} opacity={0.45} />
        <IconTile d={ICON.scalesSharia} size={52} iconSize={28} bg={pc} color="#FFFFFF" radius={16} sw={1.7} />
        <View style={{ flex: 1, gap: 3 }}>
          <Txt font="display" size={23} weight={700} lh={1.3}>
            موسوعة الشريعة
          </Txt>
          <Txt size={14} color={t.goldInk}>
            العبادات · المعاملات · المواريث · أصول الفقه
          </Txt>
        </View>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center' }}>
          <Icon d={ICON.forward} size={18} color={t.primary} sw={2.2} directional />
        </View>
      </Press>

      {/* Stories */}
      <Press
        onPress={() => router.navigate('/stories')}
        label="الأنبياء والملائكة والصحابة"
        style={{ backgroundColor: pc, borderRadius: r(22), minHeight: 84, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: gc, alignItems: 'center', justifyContent: 'center' }}>
          <Txt font="calligraphy" size={28} color={pc} style={{ lineHeight: 34 }}>
            ﷲ
          </Txt>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Txt font="display" size={23} weight={700} lh={1.3} color="#FFFFFF">
            الأنبياء والملائكة والصحابة
          </Txt>
          <Txt size={14} color="#CFE0DA">
            بطاقة خطّية لكل نبي وملك وصحابي
          </Txt>
        </View>
        <Icon d={ICON.forward} size={18} color="#FFFFFF" sw={2.2} directional />
      </Press>
    </Screen>
  );
}
