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
import { MAP_LINK_TILES, MAP_NODES } from '@/data/structural';
import { mapMastery } from '@/features/academy/useAcademy';
import { useApp } from '@/state/app-store';
import { useContent } from '@/state/content-store';
import { useTheme } from '@/theme/theme';

export default function KnowledgeMap() {
  const { t, gc, pc, dark } = useTheme();
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
  const links = node ? mapLinks[node.id]?.links : undefined;
  const derived = sel === 'tawheed' || sel === 'aqeedah';
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
                style={{ position: 'absolute', left: n.x - 38, top: n.y - 26, width: 76, alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: nOn ? gc : nAv ? t.card : t.lockBg,
                    borderWidth: nOn ? 2 : nAv ? 2.5 : 2,
                    borderColor: nOn ? gc : nAv ? t.primary : t.line,
                    boxShadow: nOn ? `0px 0px 16px ${gc}` : undefined,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {locked ? (
                    <LockIcon color={t.muted} />
                  ) : (
                    <Txt size={22} weight={700} color={nOn ? (dark ? '#182D29' : pc) : t.primary}>
                      {nOn ? '✓' : '◆'}
                    </Txt>
                  )}
                </View>
                <Txt size={13} weight={600} color={locked ? t.muted : t.ink} align="center" lh={1.4}>
                  {n.name}
                </Txt>
              </Press>
            );
          })}
        </View>
      </ScrollView>

      <BottomSheet visible={!!node} onClose={() => setSel(null)} maxHeight={0.8} label={node?.name ?? ''} scrim="rgba(10,24,21,0.45)">
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {links
                ? links.map((l) => (
                    <Press
                      key={l.label + l.target}
                      label={l.label}
                      onPress={() => {
                        setSel(null);
                        router.navigate(l.target as Href);
                      }}
                      style={{ width: '48%', flexGrow: 1, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, borderRadius: 14, padding: 10, minHeight: 44, justifyContent: 'center' }}>
                      <Txt size={15} weight={700} color={t.primary}>
                        {l.label}
                      </Txt>
                    </Press>
                  ))
                : MAP_LINK_TILES.map((l) => (
                    <View key={l} style={{ width: '48%', flexGrow: 1, borderWidth: 1.5, borderStyle: 'dashed', borderColor: gc, borderRadius: 14, padding: 10, gap: 2 }}>
                      <Txt size={15} weight={700}>
                        {l}
                      </Txt>
                      <Txt size={13} color={t.goldInk}>
                        تُربط بعد التوثيق
                      </Txt>
                    </View>
                  ))}
            </View>
            {(derived || on || av) && (
              <Button
                size="lg"
                onPress={() => {
                  if (derived) {
                    setSel(null);
                    router.navigate('/academy/subject/aqeedah');
                  } else {
                    set({ mast: { ...mast, [node.id]: !on } });
                    setSel(null);
                  }
                }}>
                {derived ? 'افتح دروس العقيدة' : on ? 'إلغاء الإضاءة' : 'أتقنت هذا المفهوم'}
              </Button>
            )}
          </>
        )}
      </BottomSheet>
    </Column>
  );
}
