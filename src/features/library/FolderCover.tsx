/** Library folder cover: oklch colour per subject, folder tab, lattice, bottom shade, gold icon (ART). */
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Icon } from '@/components/core/Icon';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { Lattice } from '@/components/layout/Ornament';
import { LIBRARY_ART } from '@/data/structural';
import { edge } from '@/theme/layout';
import { useTheme } from '@/theme/theme';
import { oklch } from '@/utils/color';

export function artOf(name: string) {
  const a = LIBRARY_ART[name] ?? LIBRARY_ART['العقيدة'];
  return { icon: a.icon, color: oklch(0.4, 0.08, a.hue), tab: oklch(0.5, 0.09, a.hue) };
}

export function Shade({ height }: { height: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height }}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="shade" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor="#000" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#000" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#shade)" />
      </Svg>
    </View>
  );
}

export function FolderCover({ name, count, onPress }: { name: string; count: string; onPress: () => void }) {
  const { gc, r } = useTheme();
  const art = artOf(name);
  return (
    <Press onPress={onPress} label={`${name} · ${count}`} style={{ marginTop: 14, height: 178, borderRadius: r(22), backgroundColor: art.color, boxShadow: '0px 6px 16px rgba(0,0,0,0.14)' }}>
      <View style={{ position: 'absolute', top: -14, ...edge.start(16), width: 66, height: 18, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: art.tab }} />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: r(22), overflow: 'hidden' }}>
        <Lattice opacity={0.16} spacing={22} />
        <Shade height={90} />
      </View>
      <View style={{ position: 'absolute', ...edge.end(14), top: 14 }}>
        <Icon d={art.icon} size={54} color={gc} sw={1.5} />
      </View>
      <View style={{ position: 'absolute', left: 14, right: 14, bottom: 12, gap: 3 }}>
        <Txt size={19} weight={700} lh={1.4} color="#FFFFFF">
          {name}
        </Txt>
        <Txt size={13} color="#E8EFEC">
          {count}
        </Txt>
      </View>
    </Press>
  );
}
