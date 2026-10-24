/** Qibla compass card from the prayer screen — real bearing + live heading with ultra-smooth spring physics. */
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { qiblaBearing } from '@/services/qibla';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

import { shortestDelta } from './headingMath';
import { useHeading } from './useHeading';

/** Within this many degrees the device counts as facing the Qibla. */
const ALIGNED_DEG = 3;

const SPRING_CONFIG = {
  damping: 24,
  stiffness: 110,
  mass: 0.65,
  overshootClamping: false,
  restDisplacementThreshold: 0.05,
  restSpeedThreshold: 0.05,
};

export function QiblaCompassCard() {
  const { t, gc, r, cs, dark, reduceMotion } = useTheme();
  const router = useRouter();
  const loc = useApp((s) => s.location);
  const flash = useUi((s) => s.flash);
  const hd = useHeading(!!loc, loc);
  const bearing = loc ? qiblaBearing(loc.lat, loc.lon) : null;
  const live = hd.status === 'active' && hd.heading != null && hd.headingContinuous != null;
  // With a live heading the needle points at the Kaaba; otherwise the dial is drawn north-up.
  // Continuous angles (no 359→0 jump) so the animation always takes the short way round.
  const angle = bearing == null ? 0 : live ? bearing - hd.headingContinuous! : bearing;
  const dialRotation = live ? -hd.headingContinuous! : 0;
  const lowAccuracy = live && hd.accuracy != null && hd.accuracy < 2;
  // Signed turn still needed: positive = turn right (clockwise), negative = turn left.
  const turn = live && bearing != null ? shortestDelta(hd.heading!, bearing) : null;
  const aligned = turn != null && Math.abs(turn) <= ALIGNED_DEG;

  const animatedDial = useSharedValue(0);
  const animatedNeedle = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      animatedDial.value = dialRotation;
      animatedNeedle.value = angle;
    } else {
      animatedDial.value = withSpring(dialRotation, SPRING_CONFIG);
      animatedNeedle.value = withSpring(angle, SPRING_CONFIG);
    }
  }, [dialRotation, angle, reduceMotion, animatedDial, animatedNeedle]);

  const dialStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${animatedDial.value}deg` }],
  }));

  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${animatedNeedle.value}deg` }],
  }));

  let status: string;
  if (!loc) status = 'حدّد موقعك أولًا لحساب اتجاه القبلة.';
  else if (live && lowAccuracy) status = 'دقة البوصلة منخفضة — حرّك الجهاز على شكل 8 بعيدًا عن المعادن للمعايرة.';
  else if (live && aligned) status = 'أنت متّجه نحو القبلة.';
  else if (live && turn != null) status = `استدر ${Math.round(Math.abs(turn))}° ${turn > 0 ? 'يمينًا' : 'يسارًا'} — ضع الهاتف أفقيًا ووجّه أعلاه نحو السهم الذهبي.`;
  else if (hd.status === 'locating') status = 'جارٍ تحديد الشمال الحقيقي من موقعك… تأكّد أن خدمة الموقع (GPS) مفعّلة.';
  else if (hd.status === 'needs-permission') status = 'اضغط «تشغيل البوصلة» للسماح بقراءة اتجاه الجهاز.';
  else if (hd.status === 'denied') status = 'لم يُسمح بقراءة اتجاه الجهاز. الاتجاه معروض بالنسبة إلى الشمال.';
  else if (hd.status === 'unsupported') status = 'لا توجد بوصلة في هذا الجهاز. الاتجاه معروض بالنسبة إلى الشمال الجغرافي.';
  else status = 'جارٍ تشغيل البوصلة…';

  return (
    <View style={{ backgroundColor: cs.backgroundColor, borderColor: cs.borderColor, borderWidth: cs.borderWidth, boxShadow: cs.boxShadow, borderRadius: r(22), padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <View
        accessibilityRole="image"
        accessibilityLabel={bearing != null ? `اتجاه القبلة ${Math.round(bearing)} درجة من الشمال` : 'اتجاه القبلة غير محدد'}
        style={{
          width: 136,
          height: 136,
          borderRadius: 68,
          borderWidth: 2.5,
          borderColor: aligned ? '#10B981' : gc,
          backgroundColor: dark ? '#0B1E19' : t.soft,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: aligned ? `0px 0px 16px rgba(16, 185, 129, 0.4)` : undefined,
        }}>
        <View style={{ position: 'absolute', top: 3, zIndex: 5, width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: aligned ? '#10B981' : gc }} />
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 130,
              height: 130,
              alignItems: 'center',
              justifyContent: 'center',
            },
            dialStyle,
          ]}>
          <Txt size={12} weight={700} color="#EF4444" style={{ position: 'absolute', top: 5 }}>
            ش
          </Txt>
          <Txt size={11} weight={700} color={t.muted} style={{ position: 'absolute', right: 8 }}>
            ق
          </Txt>
          <Txt size={11} weight={700} color={t.muted} style={{ position: 'absolute', bottom: 5 }}>
            ج
          </Txt>
          <Txt size={11} weight={700} color={t.muted} style={{ position: 'absolute', left: 8 }}>
            غ
          </Txt>
        </Animated.View>
        {bearing != null && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: 130,
                height: 130,
                alignItems: 'center',
                justifyContent: 'center',
              },
              needleStyle,
            ]}>
            <View style={{ position: 'absolute', top: 12, alignItems: 'center' }}>
              <View style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#1C1917', borderWidth: 1.5, borderColor: gc, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 10, height: 2, backgroundColor: gc }} />
              </View>
              <View style={{ width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: gc }} />
              <View style={{ width: 3, height: 34, backgroundColor: gc, borderRadius: 1.5 }} />
            </View>
            <View style={{ position: 'absolute', bottom: 18, width: 2, height: 24, backgroundColor: dark ? '#4A6B60' : '#94A3B8' }} />
          </Animated.View>
        )}
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: gc, borderWidth: 1.5, borderColor: '#143831' }} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <Txt size={17} weight={700}>
          اتجاه القبلة
        </Txt>
        {bearing != null && (
          <Txt size={14} color={t.muted}>
            من الشمال الحقيقي: <Txt size={14} color={t.ink} weight={600} ltr>{`${bearing.toFixed(1)}°`}</Txt>
          </Txt>
        )}
        {live && (
          <Txt size={14} color={t.muted}>
            اتجاه جهازك: <Txt size={14} color={aligned ? t.primary : t.ink} weight={600} ltr>{`${Math.round(hd.heading!)}°`}</Txt>
          </Txt>
        )}
        <Txt size={13} color={t.muted} lh={1.7} accessibilityLiveRegion="polite">
          {status}
        </Txt>
        {loc && (
          <Press
            onPress={() => {
              hd.start();
              flash('حرّك الجهاز ببطء على شكل الرقم 8 بعيدًا عن المعادن والمغناطيس.');
            }}
            label={hd.status === 'needs-permission' ? 'تشغيل البوصلة' : 'معايرة'}
            style={{ alignSelf: 'flex-start', height: 40, paddingHorizontal: 16, borderWidth: 1.5, borderColor: t.primary, borderRadius: r(12), justifyContent: 'center' }}>
            <Txt size={15} weight={600} color={t.primary}>
              {hd.status === 'needs-permission' ? 'تشغيل البوصلة' : 'معايرة'}
            </Txt>
          </Press>
        )}
        <View style={{ gap: 6, marginTop: 4 }}>
          <Press onPress={() => router.navigate('/prayer/qibla')} label="البوصلة الواقعية والخريطة" style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: r(12), backgroundColor: t.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Txt size={15} weight={700} color={t.goldInk}>
              البوصلة الواقعية المكبرة والخريطة ‹
            </Txt>
          </Press>
          <Press onPress={() => router.navigate('/prayer/kaaba')} label="الكعبة ثلاثية الأبعاد" style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: r(12), backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
            <Txt size={15} weight={600} color={t.primary}>
              الكعبة ثلاثية الأبعاد ‹
            </Txt>
          </Press>
        </View>
      </View>
    </View>
  );
}
