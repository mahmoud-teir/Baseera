/** خريطة العلم — `s.map`: 19 concepts, lit / available / locked, prerequisites and a details sheet. */
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/core/Button';
import { LockIcon } from '@/components/core/Icon';
import { Pill } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { BottomSheet } from '@/components/overlays/BottomSheet';
import { BackLink, Column, useTopPad } from '@/components/layout/Screen';
import { STAGE2_SUBJECTS } from '@/data/stage2Data';
import { MAP_NODES } from '@/data/structural';
import { mapMastery } from '@/features/academy/useAcademy';
import { useApp } from '@/state/app-store';
import { useContent } from '@/state/content-store';
import { useTheme } from '@/theme/theme';

const NODE_TARGETS: Record<string, { label: string; href: Href }> = {
  tawheed: { label: 'افتح دروس العقيدة والتوحيد', href: '/academy/subject/aqeedah' as Href },
  aqeedah: { label: 'افتح دروس العقيدة والتوحيد', href: '/academy/subject/aqeedah' as Href },
  taharah: { label: 'افتح دروس الفقه (الطهارة)', href: '/academy/subject/fiqh' as Href },
  salah: { label: 'افتح دروس الفقه (الصلاة)', href: '/academy/subject/fiqh' as Href },
  zakat: { label: 'افتح دروس الفقه (الزكاة)', href: '/academy/subject/fiqh' as Href },
  siyam: { label: 'افتح دروس الفقه (الصيام)', href: '/academy/subject/fiqh' as Href },
  hajj: { label: 'افتح دروس الفقه (الحج والعمرة)', href: '/academy/subject/fiqh' as Href },
  recite: { label: 'افتح دروس القرآن والتفسير', href: '/academy/subject/tafsir' as Href },
  tajweed: { label: 'افتح أحكام التجويد العملية', href: '/quran/tajweed' as Href },
  tafsir: { label: 'افتح دروس القرآن والتفسير', href: '/academy/subject/tafsir' as Href },
  hadith: { label: 'افتح دروس الحديث النبوي', href: '/academy/subject/hadith' as Href },
  mustalah: { label: 'افتح دروس مصطلح الحديث', href: '/academy/subject/hadith' as Href },
  seerah: { label: 'افتح دروس السيرة النبوية', href: '/academy/subject/seerah' as Href },
  muamalat: { label: 'استعرض مقرر المرحلة الثانية: المعاملات', href: '/academy/locked/2' as Href },
  arabic: { label: 'استعرض مقرر المرحلة الثانية: اللغة العربية', href: '/academy/locked/2' as Href },
  mawarith: { label: 'استعرض مقرر المرحلة الثانية: المواريث', href: '/academy/locked/2' as Href },
  ahwal: { label: 'استعرض مقرر المرحلة الثانية: الأحوال الشخصية', href: '/academy/locked/2' as Href },
  usul: { label: 'استعرض مقرر المرحلة الثانية: أصول الفقه', href: '/academy/locked/2' as Href },
  qada: { label: 'استعرض مقرر المرحلة الثانية: القضاء', href: '/academy/locked/2' as Href },
};

const DEFAULT_MAP_LINKS: Record<string, { label: string; target: Href; icon: string }[]> = {
  tawheed: [
    { label: 'دروس العقيدة والتوحيد', target: '/academy/subject/aqeedah' as Href, icon: '🎓' },
    { label: 'كتاب التوحيد في المكتبة', target: '/book/kitab-at-tawheed' as Href, icon: '📖' },
    { label: 'الأدلة الشرعية', target: '/sharia' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
  aqeedah: [
    { label: 'دروس العقيدة والتوحيد', target: '/academy/subject/aqeedah' as Href, icon: '🎓' },
    { label: 'ثلاثة الأصول في المكتبة', target: '/book/usul-ath-thalatha' as Href, icon: '📖' },
    { label: 'الأدلة الشرعية', target: '/sharia' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
  taharah: [
    { label: 'دروس الفقه (الطهارة)', target: '/academy/subject/fiqh' as Href, icon: '🎓' },
    { label: 'عمدة الفقه في المكتبة', target: '/book/umdat-al-fiqh' as Href, icon: '📖' },
    { label: 'أحكام العبادات الشرعية', target: '/sharia' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
  recite: [
    { label: 'دروس القرآن والتفسير', target: '/academy/subject/tafsir' as Href, icon: '🎓' },
    { label: 'تفسير السعدي في المكتبة', target: '/book/tafsir-as-saadi' as Href, icon: '📖' },
    { label: 'أحكام التجويد', target: '/quran/tajweed' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
  hadith: [
    { label: 'دروس الحديث النبوي', target: '/academy/subject/hadith' as Href, icon: '🎓' },
    { label: 'الأربعون النووية في المكتبة', target: '/book/arbaeen-nawawiyyah' as Href, icon: '📖' },
    { label: 'الأدلة النبوية', target: '/sharia' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
  salah: [
    { label: 'دروس الفقه (الصلاة)', target: '/academy/subject/fiqh' as Href, icon: '🎓' },
    { label: 'منهاج السالكين في المكتبة', target: '/book/minhaj-as-salikeen' as Href, icon: '📖' },
    { label: 'أحكام الصلاة الشرعية', target: '/sharia' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
  tajweed: [
    { label: 'أحكام التجويد العملية', target: '/quran/tajweed' as Href, icon: '🎓' },
    { label: 'تفسير السعدي في المكتبة', target: '/book/tafsir-as-saadi' as Href, icon: '📖' },
    { label: 'مفردات القرآن الكريم', target: '/quran/vocab' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية والتلاوات', target: '/library' as Href, icon: '🎧' },
  ],
  seerah: [
    { label: 'دروس السيرة النبوية', target: '/academy/subject/seerah' as Href, icon: '🎓' },
    { label: 'سيرة ابن كثير في المكتبة', target: '/book/seerah-ibn-kathir' as Href, icon: '📖' },
    { label: 'قصص الأنبياء', target: '/stories' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
  zakat: [
    { label: 'دروس الفقه (الزكاة)', target: '/academy/subject/fiqh' as Href, icon: '🎓' },
    { label: 'عمدة الفقه في المكتبة', target: '/book/umdat-al-fiqh' as Href, icon: '📖' },
    { label: 'أحكام الزكاة والصدقات', target: '/sharia' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
  siyam: [
    { label: 'دروس الفقه (الصيام)', target: '/academy/subject/fiqh' as Href, icon: '🎓' },
    { label: 'عمدة الفقه في المكتبة', target: '/book/umdat-al-fiqh' as Href, icon: '📖' },
    { label: 'مسار الصيام الرمضاني', target: '/paths' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
  tafsir: [
    { label: 'دروس القرآن والتفسير', target: '/academy/subject/tafsir' as Href, icon: '🎓' },
    { label: 'تفسير السعدي في المكتبة', target: '/book/tafsir-as-saadi' as Href, icon: '📖' },
    { label: 'مفردات القرآن الكريم', target: '/quran/vocab' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
  mustalah: [
    { label: 'دروس مصطلح الحديث', target: '/academy/subject/hadith' as Href, icon: '🎓' },
    { label: 'المنظومة البيقونية في المكتبة', target: '/book/manzumat-al-bayquniyyah' as Href, icon: '📖' },
    { label: 'قواعد قبول الأخبار', target: '/sharia' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
  muamalat: [
    { label: 'مقرر فقه المعاملات المالية', target: '/academy/locked/2' as Href, icon: '🎓' },
    { label: 'منهاج السالكين في المكتبة', target: '/book/minhaj-as-salikeen' as Href, icon: '📖' },
    { label: 'أحكام البيوع والعقود', target: '/sharia' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
  hajj: [
    { label: 'دروس الفقه (الحج والعمرة)', target: '/academy/subject/fiqh' as Href, icon: '🎓' },
    { label: 'عمدة الفقه في المكتبة', target: '/book/umdat-al-fiqh' as Href, icon: '📖' },
    { label: 'مناسك الحج خطوة بخطوة', target: '/paths' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
  arabic: [
    { label: 'مقرر اللغة العربية والنحو', target: '/academy/locked/2' as Href, icon: '🎓' },
    { label: 'متن الآجرومية في المكتبة', target: '/book/al-ajrumiyyah' as Href, icon: '📖' },
    { label: 'مفردات القرآن والبيان', target: '/quran/vocab' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
  mawarith: [
    { label: 'مقرر علم المواريث والفرائض', target: '/academy/locked/2' as Href, icon: '🎓' },
    { label: 'متن الرحبية في المكتبة', target: '/book/ar-rahbiyyah' as Href, icon: '📖' },
    { label: 'أحكام التركات والفروض', target: '/sharia' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
  ahwal: [
    { label: 'مقرر فقه الأسرة والأحوال', target: '/academy/locked/2' as Href, icon: '🎓' },
    { label: 'منهاج السالكين في المكتبة', target: '/book/minhaj-as-salikeen' as Href, icon: '📖' },
    { label: 'أحكام النكاح والأسرة', target: '/sharia' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
  usul: [
    { label: 'مقرر أصول الفقه واستنباط الأحكام', target: '/academy/locked/2' as Href, icon: '🎓' },
    { label: 'متن الورقات في المكتبة', target: '/book/al-waraqat' as Href, icon: '📖' },
    { label: 'قواعد دلالات الألفاظ والمقاصد', target: '/sharia' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
  qada: [
    { label: 'مقرر أدب القضاء والدعاوى', target: '/academy/locked/2' as Href, icon: '🎓' },
    { label: 'منهاج السالكين في المكتبة', target: '/book/minhaj-as-salikeen' as Href, icon: '📖' },
    { label: 'أحكام البينات والشهادات', target: '/sharia' as Href, icon: '⚖️' },
    { label: 'المواد الصوتية', target: '/library' as Href, icon: '🎧' },
  ],
};

export default function KnowledgeMap() {
  const { t, gc, dark } = useTheme();
  const router = useRouter();
  const top = useTopPad(0);
  const passed = useApp((s) => s.passed);
  const mast = useApp((s) => s.mast);
  const set = useApp((s) => s.set);
  const [sel, setSel] = useState<string | null>(null);
  const lessons = useContent((s) => s.lessons);
  const m = mapMastery(passed, mast, lessons);
  const byId = Object.fromEntries(MAP_NODES.map((n) => [n.id, n]));

  const edges = MAP_NODES.flatMap((b) =>
    b.prereqs.map((p) => {
      const a = byId[p];
      const y1 = a.y + 26;
      const y2 = b.y - 26;
      const ym = (y1 + y2) / 2;
      const on = m.mastered(b.id);
      const av = m.available(b.id);
      return { key: `${p}-${b.id}`, d: `M${a.x} ${y1} C${a.x} ${ym} ${b.x} ${ym} ${b.x} ${y2}`, c: on ? gc : av ? t.primary : t.line, w: on ? 3 : 2, dash: on || av ? undefined : '5 5' };
    }),
  );

  const node = sel ? byId[sel] : null;
  const mapLinks = useContent((s) => s.map);
  const backendLinks = node ? mapLinks[node.id]?.links : undefined;
  const fallbackLinks = node ? DEFAULT_MAP_LINKS[node.id] : undefined;
  const activeLinks = (backendLinks && backendLinks.length > 0) ? backendLinks : (fallbackLinks ?? []);
  const target = sel ? NODE_TARGETS[sel] : null;
  const stage2Sub = sel ? STAGE2_SUBJECTS.find((s) => s.mapNodeId === sel) : null;
  const on = sel ? m.mastered(sel) : false;
  const av = sel ? m.available(sel) : false;

  return (
    <Column>
      <View style={{ paddingTop: top, paddingHorizontal: 20, paddingBottom: 10, gap: 8 }}>
        <BackLink label="الأكاديمية" href="/academy" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Txt font="display" size={30} weight={700} accessibilityRole="header">
            خريطة العلم
          </Txt>
          <Txt size={15} weight={700} color={t.primary}>
            {m.lit} من {m.total} مضيء
          </Txt>
        </View>
        <ProgressBar value={(m.lit / m.total) * 100} height={5} color={gc} />
        <View style={{ flexDirection: 'row', gap: 14 }}>
          {[
            { label: 'مضيء', dot: { backgroundColor: gc } },
            { label: 'متاح', dot: { borderWidth: 2, borderColor: t.primary, backgroundColor: t.card } },
            { label: 'يحتاج متطلبًا', dot: { backgroundColor: t.lockBg } },
          ].map((x) => (
            <View key={x.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={[{ width: 12, height: 12, borderRadius: 6 }, x.dot]} />
              <Txt size={13} color={t.muted}>
                {x.label}
              </Txt>
            </View>
          ))}
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, alignItems: 'center' }}>
        <View style={{ width: 350, height: 900, direction: 'ltr' }}>
          <Svg width={350} height={900} style={{ position: 'absolute', left: 0, top: 0 }}>
            {edges.map((e) => (
              <Path key={e.key} d={e.d} fill="none" stroke={e.c} strokeWidth={e.w} strokeDasharray={e.dash} strokeLinecap="round" />
            ))}
          </Svg>
          {MAP_NODES.map((n) => {
            const nOn = m.mastered(n.id);
            const nAv = m.available(n.id);
            const locked = !nOn && !nAv;
            return (
              <Press
                key={n.id}
                onPress={() => setSel(n.id)}
                label={`${n.name} · ${nOn ? 'مضيء' : nAv ? 'متاح' : 'يحتاج متطلبًا'}`}
                style={{ position: 'absolute', left: n.x - 48, top: n.y - 26, width: 96, alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: nOn ? (dark ? '#122E26' : '#123B33') : nAv ? t.card : t.lockBg,
                    borderWidth: nOn ? 2.5 : nAv ? 2 : 1.5,
                    borderColor: nOn ? gc : nAv ? t.primary : t.line,
                    shadowColor: nOn ? gc : '#000000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: nOn ? 0.35 : 0.08,
                    shadowRadius: 5,
                    elevation: nOn ? 4 : 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {locked ? (
                    <LockIcon color={t.muted} />
                  ) : (
                    <Txt size={22} weight={700} color={nOn ? gc : t.primary}>
                      {nOn ? '✓' : '◆'}
                    </Txt>
                  )}
                </View>
                <View
                  style={{
                    backgroundColor: nOn ? (dark ? '#182E26' : '#EFF5F2') : nAv ? t.card : t.card,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: nOn ? gc : nAv ? t.line : 'transparent',
                    marginTop: 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 60,
                    maxWidth: 96,
                  }}>
                  <Txt
                    size={12}
                    weight={700}
                    color={nOn ? (dark ? gc : '#123B33') : locked ? t.muted : t.ink}
                    align="center"
                    lh={1.3}>
                    {n.name}
                  </Txt>
                </View>
              </Press>
            );
          })}
        </View>
      </ScrollView>

      <BottomSheet visible={!!node} onClose={() => setSel(null)} maxHeight={0.85} label={node?.name ?? ''} scrim="rgba(10,24,21,0.45)">
        {node && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt font="display" size={26} weight={700} accessibilityRole="header">
                {node.name}
              </Txt>
              <Pill
                label={on ? 'مضيء' : av ? 'متاح' : 'يحتاج متطلبًا'}
                bg={on ? t.goldSoft : av ? t.soft : t.lockBg}
                fg={on ? t.goldInk : av ? t.primary : t.muted}
                size={13}
              />
            </View>
            <Txt size={15} color={t.body} lh={1.8}>
              {node.note}
            </Txt>
            {node.prereqs.length > 0 && (
              <View style={{ gap: 6 }}>
                <Txt size={15} weight={700}>
                  المتطلبات السابقة
                </Txt>
                {node.prereqs.map((p) => {
                  const ok = m.mastered(p);
                  return (
                    <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: ok ? t.primary : t.lockBg, alignItems: 'center', justifyContent: 'center' }}>
                        <Txt size={13} color={t.onPrimary}>
                          {ok ? '✓' : ''}
                        </Txt>
                      </View>
                      <Txt size={16}>{byId[p].name}</Txt>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={{ gap: 8 }}>
              <Txt size={15} weight={700}>
                المصادر والمراجع المقررة:
              </Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {activeLinks.map((l) => {
                  const targetStr = typeof l.target === 'string' ? l.target : (l.target as { pathname?: string })?.pathname ?? '';
                  const isBook = targetStr.startsWith('/book');
                  return (
                    <Press
                      key={l.label + l.target}
                      label={l.label}
                      onPress={() => {
                        setSel(null);
                        router.navigate(l.target as Href);
                      }}
                      style={{
                        width: '48%',
                        flexGrow: 1,
                        borderWidth: 1.5,
                        borderColor: isBook ? gc : t.line,
                        backgroundColor: isBook ? (dark ? '#1A2923' : '#F6F3EC') : t.card,
                        borderRadius: 14,
                        padding: 12,
                        minHeight: 56,
                        justifyContent: 'center',
                        gap: 2,
                      }}>
                      <Txt size={14} weight={700} color={isBook ? t.goldInk : t.primary}>
                        {l.label}
                      </Txt>
                      <Txt size={11} color={t.muted}>
                        {isBook ? '📖 متن أصلي بالمكتبة' : '✓ مادة معتمدة'}
                      </Txt>
                    </Press>
                  );
                })}
              </View>
            </View>

            {stage2Sub && (
              <View style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 14, padding: 12, gap: 4 }}>
                <Txt size={14} weight={700} color={t.primary}>
                  مقرر المرحلة الثانية التأصيلي:
                </Txt>
                <Txt size={15} weight={700} color={t.ink}>
                  📖 {stage2Sub.bookTitle}
                </Txt>
                <Txt size={13} color={t.muted}>
                  المؤلف: {stage2Sub.author} ({stage2Sub.era})
                </Txt>
                <Txt size={13} color={t.goldInk}>
                  الشرح والمرجع: {stage2Sub.referenceCommentary}
                </Txt>
              </View>
            )}
            {target && (
              <Button
                size="lg"
                onPress={() => {
                  setSel(null);
                  router.navigate(target.href);
                }}>
                {target.label}
              </Button>
            )}
            {(on || av) && (
              <Button
                variant="secondary"
                size="lg"
                onPress={() => {
                  set({ mast: { ...mast, [node.id]: !on } });
                  setSel(null);
                }}>
                {on ? 'إلغاء الإضاءة' : 'أتقنت هذا المفهوم'}
              </Button>
            )}
          </>
        )}
      </BottomSheet>
    </Column>
  );
}
