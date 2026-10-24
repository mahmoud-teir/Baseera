/**
 * Qibla map — port of `Qibla Map.html`: azimuthal-equidistant projection centred on Makkah, so the
 * straight line from any point to the centre is the Qibla direction. d3-geo builds the SVG paths;
 * react-native-svg renders them on web, iOS and Android. Land data (world-atlas countries-110m) is
 * bundled, so the map works offline.
 */
import { geoAzimuthalEquidistant, geoGraticule10, geoPath } from 'd3-geo';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';

import { ChoiceChips } from '@/components/core/parts';
import { Txt } from '@/components/core/Txt';
import { distanceToKaaba, EXAMPLE_CITIES, MECCA, qiblaBearing } from '@/services/qibla';
import { useApp } from '@/state/app-store';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/theme';
const world = require('world-atlas/countries-110m.json') as Topology<{ countries: GeometryCollection }>;

const SIZE = 390;
// Prototype zoom (scale 70), clipped to a circle 150° around Makkah: radius = 70 × 150° in
// radians ≈ 183, so the disc keeps a clean round edge inside the viewBox while still covering
// every inhabited region (the far side of the Pacific is the only part left out).
const projection = geoAzimuthalEquidistant()
  .rotate([-MECCA.lon, -MECCA.lat])
  .scale(70)
  .translate([SIZE / 2, SIZE / 2])
  .clipAngle(150);
const path = geoPath(projection);
const LAND = path(feature(world, world.objects.countries) as never) ?? '';
const GRATICULE = path(geoGraticule10()) ?? '';
const SPHERE = path({ type: 'Sphere' }) ?? '';

export function QiblaMap() {
  const { t, r } = useTheme();
  const { width, colW, wide } = useLayout();
  const loc = useApp((s) => s.location);
  const options = useMemo(
    () => [...(loc ? [{ name: loc.label ? `موقعي · ${loc.label}` : 'موقعي', lat: loc.lat, lon: loc.lon }] : []), ...EXAMPLE_CITIES],
    [loc],
  );
  const [sel, setSel] = useState(0);
  const city = options[Math.min(sel, options.length - 1)];
  const p = projection([city.lon, city.lat]) ?? [SIZE / 2, SIZE / 2];
  const c = projection([MECCA.lon, MECCA.lat]) ?? [SIZE / 2, SIZE / 2];
  const bearing = Math.round(qiblaBearing(city.lat, city.lon));
  const km = Math.round(distanceToKaaba(city.lat, city.lon));
  // Phone: full content width; tablet/desktop: a comfortable fixed size inside the column.
  const avail = (wide ? colW : width || 390) - 40 - 26;
  const side = Math.max(240, Math.min(avail, 440));
  const labelBelow = p[1] < 40;
  // City label as native text over the map: SVG <text> does not shape Arabic (letters came out
  // disconnected on Android). Positioned in screen pixels from the projected point.
  const k = side / SIZE;
  const LABEL_W = 220;
  const labelLeft = Math.max(0, Math.min(side - LABEL_W, p[0] * k - LABEL_W / 2));
  const labelTop = labelBelow ? (p[1] + 10) * k : (p[1] - 12) * k - 24;

  return (
    <View style={{ gap: 14 }}>
      <View style={{ backgroundColor: t.card, borderRadius: r(22), borderWidth: 1, borderColor: t.line, padding: 12, alignItems: 'center' }}>
        <View style={{ direction: 'ltr' }} accessibilityRole="image" accessibilityLabel={`خريطة القبلة: من ${city.name} اتجاه ${bearing} درجة من الشمال، ${km} كم`}>
          <Svg width={side} height={side} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <Path d={SPHERE} fill="#123b33" stroke="#C4A66A" strokeOpacity={0.35} strokeWidth={1} />
            <Path d={GRATICULE} fill="none" stroke="#C4A66A" strokeOpacity={0.12} strokeWidth={0.6} />
            <Path d={LAND} fill="#1d5a4c" stroke="#0E2A25" strokeWidth={0.5} />
            <Line x1={p[0]} y1={p[1]} x2={c[0]} y2={c[1]} stroke="#0E2A25" strokeOpacity={0.6} strokeWidth={5} strokeLinecap="round" />
            <Line x1={p[0]} y1={p[1]} x2={c[0]} y2={c[1]} stroke="#C4A66A" strokeWidth={2.5} strokeDasharray="6 5" strokeLinecap="round" />
            <Circle cx={p[0]} cy={p[1]} r={6} fill="#FAF8F2" stroke="#C4A66A" strokeWidth={2} />
            <G x={c[0]} y={c[1]}>
              <Rect x={-7} y={-7} width={14} height={14} fill="#C4A66A" />
              <Rect x={-7} y={-7} width={14} height={14} fill="#C4A66A" transform="rotate(45)" />
              <Circle r={3} fill="#0E2A25" />
            </G>
          </Svg>
          {/* Label with a dark halo so it stays readable over land and sea. */}
          <View pointerEvents="none" style={{ position: 'absolute', left: labelLeft, top: labelTop, width: LABEL_W, alignItems: 'center' }}>
            <Txt size={13} weight={700} color="#FAF8F2" align="center" numberOfLines={1} style={{ textShadowColor: '#0E2A25', textShadowRadius: 4, textShadowOffset: { width: 0, height: 0 } }}>
              {city.name}
            </Txt>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[
          // At the Kaaba itself a bearing is meaningless.
          { label: 'اتجاه القبلة (من الشمال)', value: km < 2 ? '—' : `${bearing}°` },
          { label: 'المسافة إلى الكعبة (كم)', value: km.toLocaleString('en-US') },
        ].map((s) => (
          <View key={s.label} style={{ flex: 1, backgroundColor: t.card, borderRadius: r(18), borderWidth: 1, borderColor: t.line, padding: 12, gap: 4 }}>
            <Txt size={13} color={t.muted}>
              {s.label}
            </Txt>
            <Txt size={26} weight={700} color={t.primary} ltr style={{ alignSelf: 'flex-start' }}>
              {s.value}
            </Txt>
          </View>
        ))}
      </View>
      <ChoiceChips options={options.map((o, i) => ({ value: i, label: o.name }))} value={sel} onChange={setSel} borderWidth={1} />
      <Txt size={13} color={t.muted} lh={1.8}>
        الإسقاط متساوي المسافات حول مكة: الخط المستقيم من أي مدينة إلى المركز هو اتجاه القبلة. «موقعي» يُحسب من موقع جهازك، وبقية المدن أمثلة.
      </Txt>
    </View>
  );
}
