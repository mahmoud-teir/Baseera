import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/core/Txt';
import { useOnline } from '@/services/network';

/** Red strip shown while offline: «لا يوجد اتصال — المحتوى المحفوظ فقط متاح». */
export function OfflineBanner() {
  const online = useOnline();
  const insets = useSafeAreaInsets();
  if (online) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      role="alert"
      style={{ backgroundColor: '#B8412F', paddingTop: insets.top + 6, paddingBottom: 6, zIndex: 5 }}>
      <Txt size={14} weight={600} color="#FFFFFF" align="center">
        لا يوجد اتصال — المحتوى المحفوظ فقط متاح
      </Txt>
    </View>
  );
}
