/** الترحيب — `s.welcome`: intro film on first launch (skippable), logo, tagline, «ابدأ رحلتك», sign-in link. */
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/core/Button';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { Logo, WelcomeOrnament } from '@/components/layout/Ornament';
import { Column } from '@/components/layout/Screen';
import { Intro } from '@/features/intro/Intro';
import { useApp } from '@/state/app-store';
import { edge } from '@/theme/layout';
import { useTheme } from '@/theme/theme';

export default function Welcome() {
  const { pc, gc, wOp, reduceMotion } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const introSeen = useApp((s) => s.introSeen);
  const set = useApp((s) => s.set);
  const [intro, setIntro] = useState(!introSeen && !reduceMotion);
  const closeIntro = useCallback(() => {
    setIntro(false);
    set({ introSeen: true });
  }, [set]);

  return (
    <Column bg={pc}>
      <StatusBar style="light" />
      <View style={{ flex: 1, alignItems: 'center', overflow: 'hidden' }}>
        <WelcomeOrnament opacity={wOp} gc={gc} />
        <View style={{ marginTop: Math.max(140, insets.top + 100) }}>
          <Logo size={132} pc={pc} gc={gc} />
        </View>
        <Txt font="display" size={69} weight={700} color="#FFFFFF" lh={1.2} style={{ marginTop: 18 }} accessibilityRole="header" fixed>
          بصيرة
        </Txt>
        <Txt size={15} color={gc} ltr fixed style={{ letterSpacing: 6 }}>
          BASEERAH
        </Txt>
        <View style={{ width: 56, height: 1.5, backgroundColor: gc, marginTop: 28, marginBottom: 22 }} />
        <Txt size={22} weight={500} color="#FFFFFF" lh={1.7} align="center" style={{ paddingHorizontal: 48 }}>
          بصيرة — رحلتك في طلب العلم الشرعي
        </Txt>
        <Txt size={15} color="#CFE0DA" lh={1.7} align="center" style={{ marginTop: 10, paddingHorizontal: 48 }}>
          من الكتاب والسنة بفهم السلف الصالح · مجاني بالكامل
        </Txt>
        <View style={{ marginTop: 'auto', width: '100%', paddingHorizontal: 24, paddingBottom: 30 + insets.bottom, gap: 8 }}>
          <Button
            size="xl"
            tone="ivory"
            onPress={() => {
              set({ onboarded: true });
              router.replace('/');
            }}>
            ابدأ رحلتك
          </Button>
          <Press onPress={() => router.push('/auth/sign-in')} label="لدي حساب · تسجيل الدخول" style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center' }}>
            <Txt size={15} weight={600} color="#CFE0DA">
              لدي حساب · تسجيل الدخول
            </Txt>
          </Press>
        </View>
      </View>
      {intro && !reduceMotion && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}>
          <Intro onDone={closeIntro} />
          <Press
            onPress={closeIntro}
            label="تخطّي الفيديو التعريفي"
            style={{ position: 'absolute', top: insets.top + 14, ...edge.end(16), minHeight: 44, paddingHorizontal: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,.55)', backgroundColor: 'rgba(10,24,21,.55)', borderRadius: 99, justifyContent: 'center' }}>
            <Txt size={15} weight={600} color="#FFFFFF">
              تخطّي
            </Txt>
          </Press>
        </View>
      )}
    </Column>
  );
}
