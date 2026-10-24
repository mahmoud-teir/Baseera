/** قبلة الصلاة — البوصلة الواقعية المكبرة والخريطة التفاعلية. */
import { useState } from 'react';
import { View } from 'react-native';

import { Segmented } from '@/components/core/parts';
import { RoundBackHeader, Screen } from '@/components/layout/Screen';
import { QiblaMap } from '@/features/qibla/QiblaMap';
import { RealisticQiblaCompass } from '@/features/qibla/RealisticQiblaCompass';

type QiblaTab = 'compass' | 'map';

export default function QiblaScreen() {
  const [tab, setTab] = useState<QiblaTab>('compass');

  return (
    <Screen gap={16}>
      <RoundBackHeader title="قبلة الصلاة المشرّفة" href="/prayer" size={26} />

      <Segmented<QiblaTab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'compass', label: 'البوصلة الواقعية' },
          { value: 'map', label: 'الخريطة التفاعلية' },
        ]}
      />

      {tab === 'compass' ? (
        <View style={{ paddingTop: 8 }}>
          <RealisticQiblaCompass size={310} />
        </View>
      ) : (
        <QiblaMap />
      )}
    </Screen>
  );
}
