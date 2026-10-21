import { View } from 'react-native';

import { Txt } from '@/components/core/Txt';
import { useTheme } from '@/theme/theme';

/** Calligraphic medallion (`medOf`): gold ring, green disc, Aref Ruqaa name tilted −4°. */
export function Medallion({ name, size }: { name: string; size: number }) {
  const { pc, gc } = useTheme();
  const inner = size - 10;
  const fs = Math.round(size * (name.length > 10 ? 0.17 : name.length > 6 ? 0.2 : name.length > 4 ? 0.26 : 0.31));
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: gc, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 4px 14px rgba(0,0,0,0.2)' }}>
      <View style={{ width: inner, height: inner, borderRadius: inner / 2, backgroundColor: pc, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', top: 5, left: 5, right: 5, bottom: 5, borderWidth: 1, borderColor: gc, borderRadius: inner, opacity: 0.45 }} />
        <Txt font="calligraphy" size={fs} lh={1.25} color={gc} align="center" fixed style={{ paddingHorizontal: 10, transform: [{ rotate: '-4deg' }] }}>
          {name}
        </Txt>
      </View>
    </View>
  );
}
