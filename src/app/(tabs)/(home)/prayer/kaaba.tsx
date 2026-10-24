/** الكعبة المشرّفة — `s.kaaba` (prototype iframe `Kaaba 3D.html`, rebuilt with react-three-fiber). */
import { useIsFocused } from 'expo-router';
import { lazy, Suspense, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Icon } from '@/components/core/Icon';
import { Txt } from '@/components/core/Txt';
import { Column, RoundBackHeader, useTopPad } from '@/components/layout/Screen';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { ICON } from '@/data/structural';
import { KAABA_LANDMARKS } from '@/three/kaaba';
import { edge } from '@/theme/layout';
import { useTheme } from '@/theme/theme';

const KaabaScene = lazy(() => import('@/features/kaaba/KaabaScene'));

export default function KaabaScreen() {
  const { t, reduceMotion } = useTheme();
  const focused = useIsFocused();
  const top = useTopPad(0);
  const [retry, setRetry] = useState(0);
  const [selectedLandmark, setSelectedLandmark] = useState('overview');
  const [zoomStep, setZoomStep] = useState(0);

  const currentLandmark = useMemo(
    () => KAABA_LANDMARKS.find((x) => x.id === selectedLandmark) ?? KAABA_LANDMARKS[0],
    [selectedLandmark]
  );

  const handleZoomIn = () => setZoomStep((s) => s + 1);
  const handleZoomOut = () => setZoomStep((s) => s - 1);
  const handleReset = () => {
    setSelectedLandmark('overview');
    setZoomStep(0);
  };

  return (
    <Column>
      <View style={{ paddingTop: top, paddingHorizontal: 20, paddingBottom: 10 }}>
        <RoundBackHeader
          title="الكعبة المشرّفة"
          href="/prayer"
          size={28}
          right={
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#143831', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={ICON.kaaba} size={24} color="#C4A66A" sw={2} />
            </View>
          }
        />
      </View>

      <View style={{ flex: 1, backgroundColor: '#0E2A25', position: 'relative' }}>
        <View pointerEvents="none" style={{ position: 'absolute', top: 12, ...edge.start(16), zIndex: 5 }}>
          <Txt font="display" size={24} weight={700} color="#FAF8F2">
            الكعبة المشرّفة
          </Txt>
          <Txt size={12} color="#C4A66A">
            اسحب للدوران · اقرص للتقريب · انقر معلماً للتكبير
          </Txt>
        </View>

        {/* Floating Zoom & Reset Controls */}
        <View
          style={{
            position: 'absolute',
            top: 14,
            ...edge.end(14),
            zIndex: 10,
            backgroundColor: 'rgba(14, 42, 37, 0.88)',
            borderRadius: 22,
            borderWidth: 1,
            borderColor: 'rgba(196, 166, 106, 0.4)',
            padding: 3,
            gap: 2,
          }}>
          <Pressable
            onPress={handleZoomIn}
            accessibilityLabel="تكبير المنظور"
            hitSlop={6}
            style={({ pressed }) => [
              {
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? 'rgba(196, 166, 106, 0.25)' : 'transparent',
              },
            ]}>
            <Txt size={22} weight={700} color="#DFCA97">
              +
            </Txt>
          </Pressable>
          <View style={{ height: 1, backgroundColor: 'rgba(196, 166, 106, 0.25)', marginHorizontal: 6 }} />
          <Pressable
            onPress={handleZoomOut}
            accessibilityLabel="تصغير المنظور"
            hitSlop={6}
            style={({ pressed }) => [
              {
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? 'rgba(196, 166, 106, 0.25)' : 'transparent',
              },
            ]}>
            <Txt size={22} weight={700} color="#DFCA97">
              −
            </Txt>
          </Pressable>
          <View style={{ height: 1, backgroundColor: 'rgba(196, 166, 106, 0.25)', marginHorizontal: 6 }} />
          <Pressable
            onPress={handleReset}
            accessibilityLabel="إعادة ضبط المشهد"
            hitSlop={6}
            style={({ pressed }) => [
              {
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? 'rgba(196, 166, 106, 0.25)' : 'transparent',
              },
            ]}>
            <Icon d={ICON.sync} size={16} color="#DFCA97" sw={2} />
          </Pressable>
        </View>

        {focused && (
          <ErrorBoundary
            key={retry}
            fallback={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
                <Txt size={16} color="#FAF8F2" align="center" lh={1.8}>
                  تعذّر تشغيل العرض ثلاثي الأبعاد على هذا الجهاز (WebGL غير متاح).
                </Txt>
                <Button tone="ivory" onPress={() => setRetry((n) => n + 1)}>
                  إعادة المحاولة
                </Button>
              </View>
            }>
            <Suspense fallback={<ActivityIndicator style={{ flex: 1 }} color="#C4A66A" accessibilityLabel="جارٍ تحميل النموذج" />}>
              <KaabaScene
                landmark={selectedLandmark}
                zoomStep={zoomStep}
                reduceMotion={reduceMotion}
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </View>

      {/* Landmarks Carousel */}
      <View style={{ backgroundColor: '#0E2A25', borderTopWidth: 1, borderTopColor: 'rgba(196, 166, 106, 0.25)' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10, gap: 8 }}
        >
          {KAABA_LANDMARKS.map((lm) => {
            const isActive = lm.id === selectedLandmark;
            return (
              <Pressable
                key={lm.id}
                onPress={() => setSelectedLandmark(lm.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 18,
                  backgroundColor: isActive ? '#C4A66A' : '#143831',
                  borderWidth: 1,
                  borderColor: isActive ? '#DFCA97' : 'rgba(196, 166, 106, 0.3)',
                }}>
                <Txt size={14}>{lm.icon}</Txt>
                <Txt
                  size={12}
                  weight={isActive ? 700 : 500}
                  color={isActive ? '#0E2A25' : '#FAF8F2'}>
                  {lm.name}
                </Txt>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Selected Landmark Details Card */}
        {currentLandmark && (
          <View
            style={{
              marginHorizontal: 14,
              marginBottom: 8,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: '#143831',
              borderWidth: 1,
              borderColor: 'rgba(196, 166, 106, 0.25)',
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <Txt size={16}>{currentLandmark.icon}</Txt>
              <Txt font="display" size={14} weight={700} color="#FAF8F2">
                {currentLandmark.name}
              </Txt>
            </View>
            <Txt size={12} color="#E8DEC8" lh={1.6}>
              {currentLandmark.desc}
            </Txt>
          </View>
        )}
      </View>

      <View style={{ backgroundColor: t.bg, paddingVertical: 8, paddingHorizontal: 12 }}>
        <Txt size={11} color={t.muted} align="center" lh={1.5}>
          نموذج تفاعلي ثلاثي الأبعاد بأبعاد معمارية توثيقية دقيقة، للتعريف بالمعالم المقدسة.
        </Txt>
      </View>
    </Column>
  );
}
