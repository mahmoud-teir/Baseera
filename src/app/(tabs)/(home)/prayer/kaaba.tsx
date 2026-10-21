/** الكعبة المشرّفة — `s.kaaba` (prototype iframe `Kaaba 3D.html`, rebuilt with react-three-fiber). */
import { useIsFocused } from 'expo-router';
import { lazy, Suspense, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Txt } from '@/components/core/Txt';
import { Column, RoundBackHeader, useTopPad } from '@/components/layout/Screen';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { edge } from '@/theme/layout';
import { useTheme } from '@/theme/theme';

const KaabaScene = lazy(() => import('@/features/kaaba/KaabaScene'));

export default function KaabaScreen() {
  const { t, reduceMotion } = useTheme();
  const focused = useIsFocused();
  const top = useTopPad(0);
  const [retry, setRetry] = useState(0);
  return (
    <Column>
      <View style={{ paddingTop: top, paddingHorizontal: 20, paddingBottom: 10 }}>
        <RoundBackHeader title="الكعبة المشرّفة" href="/prayer" size={28} />
      </View>
      <View style={{ flex: 1, backgroundColor: '#0E2A25' }}>
        <View pointerEvents="none" style={{ position: 'absolute', top: 12, ...edge.start(16), zIndex: 5 }}>
          <Txt font="display" size={26} weight={700} color="#FAF8F2">
            الكعبة المشرّفة
          </Txt>
          <Txt size={13} color="#C4A66A">
            اسحب للدوران · اقرص للتقريب
          </Txt>
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
              <KaabaScene reduceMotion={reduceMotion} />
            </Suspense>
          </ErrorBoundary>
        )}
      </View>
      <View style={{ backgroundColor: t.bg, padding: 12 }}>
        <Txt size={13} color={t.muted} align="center" lh={1.7}>
          نموذج توضيحي بأبعاد تقريبية بالمتر، للتعريف بالمعالم لا للقياس.
        </Txt>
      </View>
    </Column>
  );
}
