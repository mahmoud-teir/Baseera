/** الترحيب — `s.welcome`: intro film on first launch (skippable), logo, tagline, «ابدأ رحلتك», sign-in link. */
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/core/Button';
import { Icon } from '@/components/core/Icon';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { Logo, WelcomeOrnament } from '@/components/layout/Ornament';
import { Column } from '@/components/layout/Screen';
import { ICON } from '@/data/structural';
import { Intro } from '@/features/intro/Intro';
import { useApp } from '@/state/app-store';
import { edge } from '@/theme/layout';
import { useTheme } from '@/theme/theme';

const PILLARS = [
  {
    icon: ICON.star8,
    title: 'بوابات التوحيد واليقين',
    desc: 'تأصيل العقيدة وبراهين أهل السنة والتحاكم لشرع الله',
  },
  {
    icon: ICON.tafsir,
    title: 'الأكاديمية الشرعية',
    desc: '٤ مراحل متدرجة في الفقه والتفسير والحديث والسيرة',
  },
  {
    icon: ICON.tasbeeh,
    title: 'العبادة والمحيا اليومي',
    desc: 'مواقيت الصلاة، المصحف المفسر، الأذكار، والمسبحة',
  },
  {
    icon: ICON.book,
    title: 'المكتبة والموسوعة الجامعة',
    desc: 'مئات الكتب المحققة وأسماء الله الحسنى والأدعية',
  },
];

export default function Welcome() {
  const { pc, gc, wOp, r, reduceMotion } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const introSeen = useApp((s) => s.introSeen);
  const set = useApp((s) => s.set);
  const [intro, setIntro] = useState(!introSeen && !reduceMotion);
  const [activeSlide, setActiveSlide] = useState(0);

  const closeIntro = useCallback(() => {
    setIntro(false);
    set({ introSeen: true });
  }, [set]);

  return (
    <Column bg={pc}>
      <StatusBar style="light" />
      <View style={{ flex: 1, alignItems: 'center', overflow: 'hidden' }}>
        <WelcomeOrnament opacity={wOp} gc={gc} />
        <View style={{ marginTop: Math.max(50, insets.top + 20) }}>
          <Logo size={88} pc={pc} gc={gc} />
        </View>
        <Txt font="display" size={48} weight={700} color="#FFFFFF" lh={1.2} style={{ marginTop: 8 }} accessibilityRole="header" fixed>
          بصيرة
        </Txt>
        <Txt size={13} color={gc} ltr fixed style={{ letterSpacing: 5 }}>
          BASEERAH
        </Txt>

        <View style={{ width: 44, height: 1.5, backgroundColor: gc, marginTop: 14, marginBottom: 14 }} />

        {/* بطاقة عرض الركيزة الحالية التفاعلية */}
        <Press
          onPress={() => setActiveSlide((prev) => (prev + 1) % PILLARS.length)}
          label={PILLARS[activeSlide].title}
          style={{
            width: '90%',
            maxWidth: 360,
            padding: 16,
            borderRadius: r(18),
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            borderColor: 'rgba(197, 155, 39, 0.4)',
            alignItems: 'center',
            gap: 6,
          }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(197, 155, 39, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 2,
            }}>
            <Icon d={PILLARS[activeSlide].icon} size={20} color={gc} />
          </View>
          <Txt size={16} weight={700} color="#FFFFFF" align="center">
            {PILLARS[activeSlide].title}
          </Txt>
          <Txt size={13} color="#CFE0DA" align="center" lh={1.5} style={{ paddingHorizontal: 10 }}>
            {PILLARS[activeSlide].desc}
          </Txt>

          {/* مؤشر النقاط التفاعلي */}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
            {PILLARS.map((_, pIdx) => (
              <View
                key={pIdx}
                style={{
                  width: activeSlide === pIdx ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: activeSlide === pIdx ? gc : 'rgba(255, 255, 255, 0.3)',
                }}
              />
            ))}
          </View>
        </Press>

        <Txt size={13} color="rgba(207, 224, 218, 0.8)" lh={1.5} align="center" style={{ marginTop: 14, paddingHorizontal: 36 }}>
          من الكتاب والسنة بفهم السلف الصالح · مجاني بالكامل
        </Txt>

        <View style={{ marginTop: 'auto', width: '100%', paddingHorizontal: 24, paddingBottom: 24 + insets.bottom, gap: 8 }}>
          <Button
            size="xl"
            tone="ivory"
            onPress={() => {
              router.push('/onboarding/intent' as any);
            }}>
            ابدأ رحلتك
          </Button>
          <Press onPress={() => router.push('/auth/sign-in')} label="لدي حساب · تسجيل الدخول" style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center' }}>
            <Txt size={14} weight={600} color="#CFE0DA">
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
