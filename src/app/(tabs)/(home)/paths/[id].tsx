/** مسار — `s.path`: published steps (درس/حكم/صوتي/كتاب/قول) linking to their content, with per-step completion. */
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { PendingSlot, StepMark } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { Hero } from '@/components/layout/Hero';
import { BackLink, Note, Screen } from '@/components/layout/Screen';
import { PATHS } from '@/data/structural';
import { useApp } from '@/state/app-store';
import { useContent } from '@/state/content-store';
import { useTheme } from '@/theme/theme';

export function generateStaticParams() {
  return PATHS.map((p) => ({ id: p.id }));
}

export default function PathScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = PATHS.find((x) => x.id === id) ?? PATHS[0];
  const { t, gc } = useTheme();
  const router = useRouter();
  const pathDone = useApp((s) => s.pathDone);
  const set = useApp((s) => s.set);
  const steps = useContent((s) => s.paths[p.id]?.steps) ?? [];
  const minutes = useContent((s) => s.paths[p.id]?.minutes);
  const dn = steps.filter((_, i) => pathDone[`${p.id}:${i}`]).length;
  const toggleDone = (i: number) => set({ pathDone: { ...pathDone, [`${p.id}:${i}`]: !pathDone[`${p.id}:${i}`] } });
  return (
    <Screen gap={12}>
      <BackLink label="المسارات" href="/paths" />
      <Hero radius={24} pad={20} gap={8} diamond={{ size: 140, left: -40, top: -40, color: 'rgba(196,166,106,.5)' }} lattice={false}>
        <Txt size={14} weight={600} color={gc}>
          {p.tag}
        </Txt>
        <Txt font="display" size={32} weight={700} lh={1.3} color="#FFFFFF" accessibilityRole="header">
          {p.title}
        </Txt>
        {steps.length ? (
          <>
            <ProgressBar value={(dn / steps.length) * 100} light height={5} />
            <Txt size={14} color="#CFE0DA">
              {dn} من {steps.length} خطوات{minutes ? ` · نحو ${minutes} دقيقة` : ''}
            </Txt>
          </>
        ) : null}
      </Hero>
      {!steps.length ? <PendingSlot>خطوات هذا المسار تُدرج بعد إعدادها وتوثيق محتواها.</PendingSlot> : null}
      {steps.map((s, i) => {
        const on = !!pathDone[`${p.id}:${i}`];
        return (
          <Card key={i} variant="app" radius={18} pad={0} style={{ paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Press onPress={() => toggleDone(i)} label={`${s.title} · ${on ? 'منجزة' : 'غير منجزة'}`} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
              <StepMark done={on} n={i + 1} size={30} />
            </Press>
            <Press
              onPress={() => (s.target ? router.navigate(s.target as Href) : toggleDone(i))}
              label={`${s.kind}: ${s.title}`}
              style={{ flex: 1, gap: 2, minHeight: 44, justifyContent: 'center' }}>
              <Txt size={13} weight={600} color={t.goldInk}>
                {s.kind}
              </Txt>
              <Txt size={17} weight={600} color={s.target ? t.primary : t.ink}>
                {s.title}
              </Txt>
            </Press>
          </Card>
        );
      })}
      {steps.length ? <Note>اضغط الخطوة لفتح محتواها، واضغط الرقم لتعليمها منجزة.</Note> : null}
      <View />
    </Screen>
  );
}
