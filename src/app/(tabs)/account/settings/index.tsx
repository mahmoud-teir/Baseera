import { getMuadhinInfo } from '@/services/muadhin';
/**
 * الإعدادات — `s.settings`: profile name, 4 quick tiles and 8 collapsible sections.
 * Every row does something real: appearance, prayer calculation, Quran audio, learning,
 * notifications, privacy (export / permissions / delete), account & security, about.
 */
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Platform, TextInput, View } from 'react-native';

import { Icon } from '@/components/core/Icon';
import { ChoiceChips, IconTile, Segmented, Toggle } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { Hero } from '@/components/layout/Hero';
import { RoundBackHeader, Screen } from '@/components/layout/Screen';
import { reciterName } from '@/data/quran';
import { ICON } from '@/data/structural';
import { DevicesSheet } from '@/features/account/DevicesSheet';
import { CityPickerSheet, useLocateAction } from '@/features/prayer/LocationPicker';
import { deleteAccount, signOut, useSession } from '@/services/auth';
import { exportData, wipeLocal } from '@/services/export';
import { notificationsSupported } from '@/services/notifications';
import { METHOD_OPTIONS } from '@/services/prayer';
import { useApp, type SettingKey, type SettingsValues } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

type Row =
  | { kind: 'toggle'; label: string; sub?: string; on: boolean; tap: () => void }
  | { kind: 'choice'; label: string; sub?: string; opts: string[]; value: string; pick: (v: string) => void }
  | { kind: 'link'; label: string; sub?: string; tap: () => void }
  | { kind: 'danger'; key: string; label: string; sub?: string; run: () => void }
  | { kind: 'info'; label: string; val: string };

const SECTIONS = [
  { title: 'الملف والمظهر', sum: 'لغة، مظهر، خط، قراءة، وصول', icon: ICON.palette },
  { title: 'الصلاة والمواقيت', sum: 'موقع، طريقة حساب، تنبيهات', icon: ICON.moon },
  { title: 'القرآن والصوتيات', sum: 'قارئ، سرعة، تنزيل', icon: ICON.headphones },
  { title: 'التعلّم', sum: 'هدف يومي، تذكير، تقدّم', icon: ICON.cap },
  { title: 'الإشعارات', sum: 'درس، اختبارات، مواسم', icon: ICON.bell },
  { title: 'الخصوصية والبيانات', sum: 'مزامنة، أذونات، بياناتي', icon: ICON.shield },
  { title: 'الحساب والأمان', sum: 'دخول، أمان، أجهزة', icon: ICON.user },
  { title: 'عن بصيرة', sum: 'إشراف، تمويل، تواصل', icon: ICON.info },
];

export default function Settings() {
  const { t, pc, gc, r, dark, font } = useTheme();
  const router = useRouter();
  const st = useApp();
  const flash = useUi((s) => s.flash);
  const openReport = useUi((s) => s.openReport);
  const { session } = useSession();
  const { locate } = useLocateAction();
  const [open, setOpen] = useState<number | null>(0);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [pick, setPick] = useState(false);
  const [devicesOpen, setDevicesOpen] = useState(false);

  useEffect(() => {
    const metaName = (session?.user?.user_metadata?.display_name as string | undefined)?.trim();
    const currentName = useApp.getState().pname;
    if (metaName && (!currentName || currentName === 'طالب العلم') && metaName !== currentName) {
      useApp.getState().set({ pname: metaName });
    }
  }, [session?.user?.id, session?.user?.user_metadata?.display_name]);
  const gv = st.setting;
  const sv = <K extends SettingKey>(k: K, v: SettingsValues[K]) => st.setSetting(k, v);
  const tg = (k: 'prayNotif' | 'adhkarRem' | 'autoNext' | 'wifi' | 'dailyRem' | 'nDaily' | 'nQuiz' | 'nSeason' | 'nContent' | 'sync' | 'quranRem', label: string, sub?: string): Row => ({
    kind: 'toggle',
    label,
    sub,
    on: !!gv(k),
    tap: () => sv(k, !gv(k)),
  });
  const notifSub = notificationsSupported ? undefined : 'التنبيهات متاحة في تطبيق الجوال';
  const FS = ['عادي', 'كبير', 'أكبر'];
  const LS = ['مريح', 'متوسط', 'واسع'];
  const GOAL: Record<string, 5 | 15 | 30> = { '5 دقائق': 5, '15 دقيقة': 15, '30 دقيقة': 30 };

  const sections: Row[][] = [
    [
      {
        kind: 'choice',
        label: 'اللغة',
        sub: 'العربية الآن، والإنجليزية لاحقًا',
        opts: ['العربية', 'English'],
        value: 'العربية',
        pick: (v) => v === 'English' && flash('الواجهة الإنجليزية قيد الإعداد وستتوفر لاحقًا.'),
      },
      { kind: 'choice', label: 'المظهر', opts: ['نهاري', 'ليلي'], value: dark ? 'ليلي' : 'نهاري', pick: (v) => st.set({ dark: v === 'ليلي' }) },
      { kind: 'choice', label: 'حجم الخط', opts: FS, value: FS[st.fs], pick: (v) => st.set({ fs: FS.indexOf(v) as 0 | 1 | 2 }) },
      { kind: 'choice', label: 'تباعد الأسطر', opts: LS, value: LS[st.ls], pick: (v) => st.set({ ls: LS.indexOf(v) as 0 | 1 | 2 }) },
      { kind: 'choice', label: 'خلفية القراءة', sub: 'للقرآن والكتب', opts: ['افتراضي', 'ورقي'], value: st.rt === 'sepia' ? 'ورقي' : 'افتراضي', pick: (v) => st.set({ rt: v === 'ورقي' ? 'sepia' : 'default' }) },
      { kind: 'choice', label: 'نمط قراءة القرآن', sub: 'صفحات المصحف أو آيات مجزأة', opts: ['صفحات المصحف', 'آيات مجزأة'], value: gv('quranMode'), pick: (v) => sv('quranMode', v as any) },
      { kind: 'choice', label: 'التفسير المعتمد', sub: 'تفسير الآيات في المصحف', opts: ['تفسير السعدي', 'التفسير الميسر', 'تفسير ابن كثير', 'تفسير البغوي', 'تفسير القرطبي', 'تفسير الطبري'], value: gv('tafsir'), pick: (v) => sv('tafsir', v as any) },
      { kind: 'toggle', label: 'تباين عالٍ', sub: 'نصوص وحدود أوضح', on: st.hc, tap: () => st.set({ hc: !st.hc }) },
      { kind: 'toggle', label: 'تقليل الحركة', sub: st.rm === null ? 'يتبع إعداد الجهاز الآن' : 'إيقاف الحركات والانتقالات', on: !!st.rm, tap: () => st.set({ rm: !st.rm }) },
    ],
    [
      {
        kind: 'choice',
        label: 'الموقع',
        sub: st.location ? `يُستخدم لحساب المواقيت والقبلة بإذنك · الحالي: ${st.location.label ?? 'موقعي'}` : 'يُستخدم لحساب المواقيت والقبلة بإذنك',
        opts: ['تلقائي', 'يدوي'],
        value: gv('loc'),
        pick: (v) => (v === 'تلقائي' ? locate() : setPick(true)),
      },
      { kind: 'choice', label: 'طريقة الحساب', sub: 'التلقائي يختار الطريقة المعتمدة في بلد موقعك', opts: METHOD_OPTIONS, value: gv('calc'), pick: (v) => sv('calc', v) },
      { kind: 'choice', label: 'نظام الوقت', opts: ['12 ساعة', '24 ساعة'], value: gv('clock'), pick: (v) => sv('clock', v) },
      { kind: 'choice', label: 'وقت العصر', opts: ['الجمهور', 'الحنفي'], value: gv('asr'), pick: (v) => sv('asr', v) },
      { kind: 'choice', label: 'تعديل المواقيت (دقائق)', opts: ['−2', '−1', '0', '+1', '+2'], value: gv('adj'), pick: (v) => sv('adj', v) },
      tg('prayNotif', 'تنبيهات الصلاة', notifSub),
      tg('adhkarRem', 'تذكير الأذكار', notifSub ?? 'الصباح والمساء بعد الفجر والعصر'),
      { kind: 'link', label: 'المؤذن وصوت الأذان', sub: getMuadhinInfo(gv('muadhin')).name, tap: () => router.push('/account/settings/muadhin' as any) },
    ],
    [
      { kind: 'link', label: 'القارئ الافتراضي', sub: reciterName(gv('reciter')), tap: () => router.push('/account/settings/reciter') },
      { kind: 'choice', label: 'نمط قراءة القرآن', sub: 'صفحات المصحف الشريف أو بطاقات الآيات', opts: ['صفحات المصحف', 'آيات مجزأة'], value: gv('quranMode'), pick: (v) => sv('quranMode', v as any) },
      { kind: 'choice', label: 'التفسير المعتمد', sub: 'أمهات كتب التفسير الموثوقة لأهل السنة والجماعة', opts: ['تفسير السعدي', 'التفسير الميسر', 'تفسير ابن كثير', 'تفسير البغوي', 'تفسير القرطبي', 'تفسير الطبري'], value: gv('tafsir'), pick: (v) => sv('tafsir', v as any) },
      { kind: 'choice', label: 'سرعة التشغيل', opts: ['0.75×', '1×', '1.25×', '1.5×'], value: gv('speed'), pick: (v) => sv('speed', v) },
      tg('quranRem', 'تذكير الورد القرآني اليومي', notifSub ?? 'مساء كل يوم مع تذكير بآخر آية قرأتها'),
      tg('autoNext', 'الانتقال التلقائي إلى الآية التالية'),
      tg('wifi', 'التنزيل عبر الواي فاي فقط'),
      { kind: 'choice', label: 'جودة الصوت', sub: '«توفير» يستخدم ملفات أصغر حين تتوفر للقارئ', opts: ['توفير', 'عالية'], value: gv('quality'), pick: (v) => sv('quality', v) },
    ],
    [
      {
        kind: 'choice',
        label: 'الهدف اليومي',
        opts: ['5 دقائق', '15 دقيقة', '30 دقيقة'],
        value: gv('goal'),
        pick: (v) => {
          sv('goal', v);
          st.set({ planMin: GOAL[v] ?? 15 });
        },
      },
      tg('dailyRem', 'تذكير الدرس اليومي', notifSub ?? 'نرتّب لك «درسك اليوم» في الثامنة مساءً'),
      { kind: 'info', label: 'نسبة النجاح في الاختبارات', val: '85%' },
      {
        kind: 'danger',
        key: 'reset',
        label: 'إعادة ضبط التقدم',
        sub: 'يحذف الدروس المكتملة والإضاءات',
        run: () => {
          st.resetProgress();
          flash('أُعيد ضبط التقدم');
        },
      },
    ],
    [tg('nDaily', 'الدرس اليومي', notifSub), tg('nQuiz', 'نتائج الاختبارات', notifSub ?? 'تذكير بإعادة الاختبار غير المجتاز في اليوم التالي'), tg('nSeason', 'المواسم والمناسبات', notifSub ?? 'رمضان والحج والأشهر الحرم'), tg('nContent', 'تحديثات المحتوى والتصحيحات', notifSub ?? 'تصل عند نشر محتوى موثّق جديد')],
    [
      tg('sync', 'مزامنة التقدم مع حسابي', session ? 'لمتابعة الدراسة على أي جهاز' : 'تعمل بعد تسجيل الدخول'),
      {
        kind: 'link',
        label: 'الأذونات',
        sub: 'الموقع والإشعارات',
        tap: () => (Platform.OS === 'web' ? flash('تُدار الأذونات من إعدادات المتصفح لهذا الموقع.') : Linking.openSettings()),
      },
      {
        kind: 'link',
        label: 'تصدير بياناتي',
        sub: 'ملف JSON بكل ما يحفظه التطبيق',
        tap: async () => {
          const res = await exportData();
          flash(res === 'unavailable' ? 'المشاركة غير متاحة على هذا الجهاز' : 'جُهّز ملف بياناتك');
        },
      },
      { kind: 'info', label: 'نلتزم بـ', val: 'بلا إعلانات ولا بيع بيانات' },
      { kind: 'link', label: 'سياسة الخصوصية', tap: () => router.push('/account/settings/privacy') },
      {
        kind: 'danger',
        key: 'del',
        label: 'حذف حسابي وبياناتي',
        sub: 'لا يمكن التراجع عنه',
        run: async () => {
          if (session) {
            const res = await deleteAccount();
            if (!res.ok) {
              flash(res.error);
              return;
            }
          }
          wipeLocal();
          flash('حُذفت بياناتك');
          router.replace('/welcome');
        },
      },
    ],
    [
      { kind: 'link', label: session ? 'الحساب' : 'طرق تسجيل الدخول', sub: session ? session.user.email : 'البريد وكلمة المرور أو رابط دخول', tap: () => router.push('/auth/sign-in') },
      { kind: 'link', label: 'تغيير كلمة المرور', sub: session ? undefined : 'بعد تسجيل الدخول', tap: () => (session ? router.push('/auth/password') : router.push('/auth/sign-in')) },
      {
        kind: 'link',
        label: 'الأجهزة المرتبطة',
        sub: 'عرض تفاصيل الجهاز وإدارة الجلسات',
        tap: () => setDevicesOpen(true),
      },
      {
        kind: 'danger',
        key: 'out',
        label: 'تسجيل الخروج',
        run: async () => {
          if (session) await signOut('local');
          st.set({ onboarded: false });
          router.replace('/welcome');
        },
      },
    ],
    [
      { kind: 'link', label: 'الإشراف العلمي', sub: 'من يراجع المحتوى ومنهجه', tap: () => router.push('/account/settings/supervision') },
      { kind: 'link', label: 'كيف يُموَّل المشروع', sub: 'شفافية المصادر والمصروفات', tap: () => router.push('/account/settings/funding') },
      { kind: 'link', label: 'تواصل معنا واقتراحاتك', tap: () => router.push('/account/settings/contact') },
      { kind: 'link', label: 'لوحة الإدارة والتحكم', sub: 'إدارة المتون والاعتماد وتحديثات التطبيق', tap: () => router.push('/admin') },
      { kind: 'link', label: 'أبلغ عن خطأ في المحتوى', tap: () => openReport('عام · الإعدادات') },
    ],
  ];

  const renderRow = (row: Row, i: number): ReactNode => {
    const bt = i === 0 ? 0 : 1;
    const head = (label: string, sub?: string, color?: string) => (
      <View style={{ flex: 1, gap: 3 }}>
        <Txt size={17} weight={600} color={color}>
          {label}
        </Txt>
        {!!sub && (
          <Txt size={13} color={t.muted} lh={1.7}>
            {sub}
          </Txt>
        )}
      </View>
    );
    const wrap = (children: ReactNode) => (
      <View key={row.label} style={{ paddingVertical: 14, borderTopWidth: bt, borderColor: t.line, gap: 12 }}>
        {children}
      </View>
    );
    switch (row.kind) {
      case 'toggle':
        return wrap(
          <Press onPress={row.tap} accessibilityRole="switch" accessibilityState={{ checked: row.on }} label={row.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 30 }}>
            {head(row.label, row.sub)}
            <Toggle on={row.on} />
          </Press>,
        );
      case 'choice':
        return wrap(
          <>
            {head(row.label, row.sub)}
            {row.opts.length <= 3 ? (
              <Segmented options={row.opts.map((o) => ({ value: o, label: o }))} value={row.value} onChange={row.pick} height={44} fontSize={15} label={row.label} />
            ) : (
              <ChoiceChips options={row.opts.map((o) => ({ value: o, label: o }))} value={row.value} onChange={row.pick} />
            )}
          </>,
        );
      case 'link':
        return wrap(
          <Press onPress={row.tap} accessibilityRole="link" label={row.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 30 }}>
            {head(row.label, row.sub)}
            <Icon d={ICON.forward} size={18} color={t.muted} sw={2.2} directional />
          </Press>,
        );
      case 'danger':
        return wrap(
          <Press
            onPress={() => {
              if (confirm === row.key) {
                setConfirm(null);
                row.run();
              } else setConfirm(row.key);
            }}
            label={confirm === row.key ? `${row.label} — اضغط مرة أخرى للتأكيد` : row.label}
            style={{ minHeight: 30 }}>
            {head(row.label, confirm === row.key ? 'اضغط مرة أخرى للتأكيد' : row.sub, '#B8412F')}
          </Press>,
        );
      case 'info':
        return wrap(
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 30 }}>
            {head(row.label)}
            <Txt size={14} color={t.muted}>
              {row.val}
            </Txt>
          </View>,
        );
    }
  };

  const tile = (label: string, val: string, d: string, on: boolean, tap: () => void) => (
    <Press
      key={label}
      onPress={tap}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      label={`${label}: ${val}`}
      style={{ width: '47%', flexGrow: 1, minHeight: 104, padding: 14, gap: 12, borderRadius: r(20), borderWidth: 1, borderColor: on ? t.primary : t.line, backgroundColor: on ? t.primary : t.card }}>
      <IconTile d={d} size={40} iconSize={22} radius={12} sw={1.9} bg={on ? 'rgba(255,255,255,.2)' : t.soft} color={on ? t.onPrimary : t.primary} />
      <View style={{ gap: 2 }}>
        <Txt size={16} weight={700} color={on ? t.onPrimary : t.ink}>
          {label}
        </Txt>
        <Txt size={13} color={on ? t.onPrimary : t.ink} style={{ opacity: 0.85 }}>
          {val}
        </Txt>
      </View>
    </Press>
  );

  return (
    <Screen
      gap={18}
      padBottom={32}
      overlay={
        <>
          <CityPickerSheet visible={pick} onClose={() => setPick(false)} />
          <DevicesSheet visible={devicesOpen} onClose={() => setDevicesOpen(false)} isSignedIn={!!session} />
        </>
      }>
      <RoundBackHeader title="الإعدادات" href="/account" />
      <Hero radius={26} pad={18} diamond={{ size: 140, left: -40, top: -40, color: 'rgba(196,166,106,.5)' }} lattice={false} style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: '#FAF8F2', borderWidth: 3, borderColor: gc, alignItems: 'center', justifyContent: 'center' }}>
          <Txt font="display" size={32} weight={700} color={pc}>
            {((st.pname || session?.user?.user_metadata?.display_name || session?.user?.email || 'ط').trim().charAt(0) || 'ط').toUpperCase()}
          </Txt>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <TextInput
            value={st.pname}
            onChangeText={(v) => st.set({ pname: v.slice(0, 60) })}
            placeholder={session?.user?.user_metadata?.display_name || 'اسم الحساب / الطالب'}
            placeholderTextColor="rgba(255,255,255,.65)"
            accessibilityLabel="الاسم"
            style={{ height: 44, borderBottomWidth: 1.5, borderColor: 'rgba(255,255,255,.4)', color: '#FFFFFF', fontFamily: font('display', 700), fontSize: 24, padding: 0, textAlign: 'right' }}
          />
          {session?.user.email ? (
            <Txt size={13} color="#CFE0DA" ltr numberOfLines={1} style={{ alignSelf: 'flex-start' }}>
              {session.user.email}
            </Txt>
          ) : null}
          <Txt size={14} color="#CFE0DA">
            المرحلة الأولى · {Object.keys(st.passed).length} دروس مكتملة
          </Txt>
        </View>
      </Hero>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {tile('المظهر', dark ? 'ليلي' : 'نهاري', ICON.moon, dark, () => st.set({ dark: !dark }))}
        {tile('حجم الخط', FS[st.fs], ICON.fontSize, st.fs > 0, () => st.set({ fs: ((st.fs + 1) % 3) as 0 | 1 | 2 }))}
        {tile('تنبيهات الصلاة', gv('prayNotif') ? 'مفعّلة' : 'متوقفة', ICON.bell, !!gv('prayNotif'), () => sv('prayNotif', !gv('prayNotif')))}
        {tile('المزامنة', gv('sync') ? 'مفعّلة' : 'متوقفة', ICON.sync, !!gv('sync'), () => sv('sync', !gv('sync')))}
      </View>
      <View style={{ gap: 10 }}>
        {SECTIONS.map((sec, i) => (
          <View key={sec.title} style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: r(22), overflow: 'hidden' }}>
            <Press
              onPress={() => setOpen(open === i ? null : i)}
              accessibilityState={{ expanded: open === i }}
              label={`${sec.title} · ${sec.sum}`}
              style={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <IconTile d={sec.icon} bg={t.soft} color={t.primary} iconSize={22} sw={1.9} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt size={18} weight={700}>
                  {sec.title}
                </Txt>
                <Txt size={13} color={t.muted}>
                  {sec.sum}
                </Txt>
              </View>
              <View style={{ transform: [{ rotate: open === i ? '180deg' : '0deg' }] }}>
                <Icon d={ICON.chevronDown} size={22} color={t.muted} sw={2.2} />
              </View>
            </Press>
            {open === i && <View style={{ borderTopWidth: 1, borderColor: t.line, paddingTop: 4, paddingHorizontal: 16, paddingBottom: 8 }}>{sections[i].map(renderRow)}</View>}
          </View>
        ))}
      </View>
      <Txt size={13} color={t.muted} lh={1.9} align="center" style={{ marginTop: 4 }}>
        بصيرة · مشروع تعليمي مجاني غير ربحي{'\n'}الإصدار {Constants.expoConfig?.version ?? '1.0.0'}
      </Txt>
    </Screen>
  );
}
