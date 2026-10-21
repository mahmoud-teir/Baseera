/** خريطة القبلة — `s.qibla` (prototype iframe `Qibla Map.html`, rebuilt natively). */
import { RoundBackHeader, Screen } from '@/components/layout/Screen';
import { QiblaMap } from '@/features/qibla/QiblaMap';

export default function QiblaScreen() {
  return (
    <Screen gap={14}>
      <RoundBackHeader title="خريطة القبلة" href="/prayer" size={28} />
      <QiblaMap />
    </Screen>
  );
}
