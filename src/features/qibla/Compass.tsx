/** Qibla compass card from the prayer screen — real bearing + live heading when the device has a sensor. */
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { qiblaBearing, needleAngle } from '@/services/qibla';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

import { useHeading } from './useHeading';

export function QiblaCompassCard() {
  const { t, pc, gc, r, cs, reduceMotion } = useTheme();
  const router = useRouter();
  const loc = useApp((s) => s.location);
  const flash = useUi((s) => s.flash);
  const hd = useHeading(!!loc);
  const bearing = loc ? qiblaBearing(loc.lat, loc.lon) : null;
  const live = hd.status === 'active' && hd.heading != null;
  // With a live heading the needle points at the Kaaba; otherwise the dial is drawn north-up.
  const angle = bearing == null ? 0 : live ? needleAngle(bearing, hd.heading!) : bearing;
  const dialRotation = live ? -hd.heading! : 0;
  const lowAccuracy = live && hd.accuracy != null && hd.accuracy < 2;

  let status: string;
  if (!loc) status = 'حدّد موقعك أولًا لحساب اتجاه القبلة.';
  else if (live) status = lowAccuracy ? 'دقة البوصلة منخفضة — حرّك الجهاز على شكل 8 للمعايرة.' : 'وجّه أعلى الجهاز نحو السهم الذهبي.';
  else if (hd.status === 'needs-permission') status = 'اضغط «تشغيل البوصلة» للسماح بقراءة اتجاه الجهاز.';
  else if (hd.status === 'denied') status = 'لم يُسمح بقراءة اتجاه الجهاز. الاتجاه معروض بالنسبة إلى الشمال.';
  else if (hd.status === 'unsupported') status = 'لا توجد بوصلة في هذا الجهاز. الاتجاه معروض بالنسبة إلى الشمال الجغرافي.';
  else status = 'جارٍ تشغيل البوصلة…';

  return (
    <View style={{ backgroundColor: cs.backgroundColor, borderColor: cs.borderColor, borderWidth: cs.borderWidth, boxShadow: cs.boxShadow, borderRadius: r(22), padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <View
        accessibilityRole="image"
        accessibilityLabel={bearing != null ? `اتجاه القبلة ${Math.round(bearing)} درجة من الشمال` : 'اتجاه القبلة غير محدد'}
        style={{ width: 132, height: 132, borderRadius: 66, borderWidth: 2, borderColor: t.line, backgroundColor: t.soft }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, transform: [{ rotate: `${dialRotation}deg` }] }}>
          <Txt size={12} color={t.muted} align="center" style={{ marginTop: 4 }}>
            ش
          </Txt>
        </View>
        {bearing != null && (
          <Animated.View
            style={{
              position: 'absolute',
              left: 62,
              top: 14,
              width: 4,
              height: 100,
              transform: [{ rotate: `${angle}deg` }],
              transitionProperty: reduceMotion ? 'none' : 'transform',
              transitionDuration: 500,
            }}>
            <View style={{ position: 'absolute', top: 0, left: -6, width: 16, height: 16, backgroundColor: gc, transform: [{ rotate: '45deg' }] }} />
            <View style={{ position: 'absolute', top: 10, left: 0, width: 4, height: 44, backgroundColor: pc, borderRadius: 3 }} />
          </Animated.View>
        )}
        <View style={{ position: 'absolute', left: 59, top: 59, width: 10, height: 10, borderRadius: 5, backgroundColor: pc }} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <Txt size={17} weight={700}>
          اتجاه القبلة
        </Txt>
        {bearing != null && (
          <Txt size={14} color={t.muted}>
            من الشمال: <Txt size={14} color={t.ink} weight={600} ltr>{`${Math.round(bearing)}°`}</Txt>
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
          <Press onPress={() => router.navigate('/prayer/qibla')} label="خريطة القبلة" style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: r(12), backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
            <Txt size={15} weight={600} color={t.primary}>
              خريطة القبلة ‹
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
