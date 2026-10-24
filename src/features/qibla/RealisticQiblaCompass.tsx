/**
 * Realistic Islamic Qibla Compass (البوصلة الواقعية الدقيقة للقبلة)
 * Features:
 * - Large high-definition 300px vector compass dial
 * - Complete 8 cardinal and ordinal directions: ش, ش.ش, ق, ج.ش, ج, ج.غ, غ, ش.غ
 * - 360-degree ticks (30° major with degree numbers, 10° medium, 5° minor)
 * - Prominent 3D golden Kaaba arrow with Holy Kaaba emblem
 * - North needle and top device forward notch
 * - High-precision bearing, live device heading, deviation delta, distance to Kaaba in km
 * - Ultra-smooth spring physics (silky fluid rotation with zero jerkiness)
 * - Visual alignment beacon and calibration prompt
 */
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { distanceToKaaba, qiblaBearing } from '@/services/qibla';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

import { shortestDelta } from './headingMath';
import { useHeading } from './useHeading';

const DIAL_SIZE = 300;
const RADIUS = DIAL_SIZE / 2;
const ALIGNED_DEG = 3;

const SPRING_CONFIG = {
  damping: 24,
  stiffness: 110,
  mass: 0.65,
  overshootClamping: false,
  restDisplacementThreshold: 0.05,
  restSpeedThreshold: 0.05,
};

interface DirectionMark {
  deg: number;
  label: string;
  isCardinal: boolean;
}

const DIRECTIONS: DirectionMark[] = [
  { deg: 0, label: 'ش', isCardinal: true }, // North
  { deg: 45, label: 'ش.ش', isCardinal: false }, // North-East
  { deg: 90, label: 'ق', isCardinal: true }, // East
  { deg: 135, label: 'ج.ش', isCardinal: false }, // South-East
  { deg: 180, label: 'ج', isCardinal: true }, // South
  { deg: 225, label: 'ج.غ', isCardinal: false }, // South-West
  { deg: 270, label: 'غ', isCardinal: true }, // West
  { deg: 315, label: 'ش.غ', isCardinal: false }, // North-West
];

export function RealisticQiblaCompass({ size = DIAL_SIZE }: { size?: number }) {
  const { t, gc, r, dark, reduceMotion } = useTheme();
  const loc = useApp((s) => s.location);
  const flash = useUi((s) => s.flash);
  const hd = useHeading(true, loc);

  const bearing = useMemo(() => (loc ? qiblaBearing(loc.lat, loc.lon) : null), [loc]);
  const distance = useMemo(() => (loc ? distanceToKaaba(loc.lat, loc.lon) : null), [loc]);

  const live = hd.status === 'active' && hd.heading != null && hd.headingContinuous != null;
  const currentHeading = live ? hd.heading! : 0;
  const dialRotation = live ? -hd.headingContinuous! : 0;
  const qiblaAngle = bearing != null ? (live ? bearing - hd.headingContinuous! : bearing) : 0;

  const turn = live && bearing != null ? shortestDelta(currentHeading, bearing) : null;
  const aligned = turn != null && Math.abs(turn) <= ALIGNED_DEG;

  // Ultra-smooth spring-animated rotation values
  const animatedDial = useSharedValue(0);
  const animatedNeedle = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      animatedDial.value = dialRotation;
      animatedNeedle.value = qiblaAngle;
    } else {
      animatedDial.value = withSpring(dialRotation, SPRING_CONFIG);
      animatedNeedle.value = withSpring(qiblaAngle, SPRING_CONFIG);
    }
  }, [dialRotation, qiblaAngle, reduceMotion, animatedDial, animatedNeedle]);

  const dialStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${animatedDial.value}deg` }],
  }));

  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${animatedNeedle.value}deg` }],
  }));

  // Build dial ticks: 72 ticks for every 5 degrees
  const ticks = useMemo(() => {
    const list = [];
    for (let deg = 0; deg < 360; deg += 5) {
      const isMajor30 = deg % 30 === 0;
      const isMedium10 = deg % 10 === 0 && !isMajor30;
      const tickLength = isMajor30 ? 12 : isMedium10 ? 8 : 4.5;
      const strokeWidth = isMajor30 ? 2 : isMedium10 ? 1.5 : 1;
      const color = isMajor30 ? gc : isMedium10 ? (dark ? '#738F85' : '#8A9E96') : dark ? '#344E45' : '#C7D3CD';

      const rad = (deg * Math.PI) / 180;
      const outerR = RADIUS - 18;
      const innerR = outerR - tickLength;

      const x1 = RADIUS + outerR * Math.sin(rad);
      const y1 = RADIUS - outerR * Math.cos(rad);
      const x2 = RADIUS + innerR * Math.sin(rad);
      const y2 = RADIUS - innerR * Math.cos(rad);

      list.push({ deg, x1, y1, x2, y2, strokeWidth, color, isMajor30 });
    }
    return list;
  }, [dark, gc]);

  const scale = size / DIAL_SIZE;

  return (
    <View style={{ alignItems: 'center', gap: 16 }}>
      {/* Outer Compass Housing */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: dark ? '#0E211B' : '#FAFDFB',
          borderWidth: 5,
          borderColor: aligned ? '#10B981' : gc,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: aligned
            ? `0px 0px 24px rgba(16, 185, 129, 0.45)`
            : `0px 6px 20px rgba(0, 0, 0, ${dark ? 0.4 : 0.12})`,
        }}>
        {/* Top Notch (12 o'clock indicator) */}
        <View
          style={{
            position: 'absolute',
            top: 2,
            zIndex: 10,
            alignItems: 'center',
          }}>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 7,
              borderRightWidth: 7,
              borderTopWidth: 10,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: aligned ? '#10B981' : '#EAB308',
            }}
          />
        </View>

        {/* Rotating Compass Dial Disc */}
        <Animated.View
          style={[
            {
              width: DIAL_SIZE,
              height: DIAL_SIZE,
              position: 'absolute',
              transform: [{ scale }],
            },
            dialStyle,
          ]}>
          <Svg width={DIAL_SIZE} height={DIAL_SIZE}>
            {/* Inner rings */}
            <Circle cx={RADIUS} cy={RADIUS} r={RADIUS - 8} stroke={gc} strokeWidth={1} fill="transparent" opacity={0.35} />
            <Circle cx={RADIUS} cy={RADIUS} r={RADIUS - 34} stroke={dark ? '#224036' : '#DFE7E3'} strokeWidth={1} fill="transparent" />
            <Circle cx={RADIUS} cy={RADIUS} r={RADIUS - 75} stroke={gc} strokeWidth={0.8} fill="transparent" opacity={0.25} />

            {/* Degree Ticks */}
            {ticks.map((t) => (
              <Line key={`tick-${t.deg}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.color} strokeWidth={t.strokeWidth} />
            ))}

            {/* Degree Numbers every 30° */}
            {ticks
              .filter((t) => t.isMajor30)
              .map((t) => {
                const rad = (t.deg * Math.PI) / 180;
                const textR = RADIUS - 28;
                const tx = RADIUS + textR * Math.sin(rad);
                const ty = RADIUS - textR * Math.cos(rad) + 4;
                return (
                  <SvgText
                    key={`deg-${t.deg}`}
                    x={tx}
                    y={ty}
                    fontSize={9.5}
                    fontWeight="700"
                    fill={t.deg === 0 ? '#EF4444' : dark ? '#A8C3B8' : '#5E796E'}
                    textAnchor="middle">
                    {t.deg}°
                  </SvgText>
                );
              })}

            {/* The 8 Directions (Cardinals & Ordinals) */}
            {DIRECTIONS.map((dir) => {
              const rad = (dir.deg * Math.PI) / 180;
              const r = dir.isCardinal ? RADIUS - 52 : RADIUS - 50;
              const x = RADIUS + r * Math.sin(rad);
              const y = RADIUS - r * Math.cos(rad) + (dir.isCardinal ? 6 : 4);
              const isNorth = dir.deg === 0;

              return (
                <SvgText
                  key={`dir-${dir.deg}`}
                  x={x}
                  y={y}
                  fontSize={dir.isCardinal ? (isNorth ? 18 : 16) : 11}
                  fontWeight={dir.isCardinal ? '800' : '600'}
                  fill={isNorth ? '#EF4444' : dir.isCardinal ? (dark ? '#FFFFFF' : '#143831') : gc}
                  textAnchor="middle">
                  {dir.label}
                </SvgText>
              );
            })}

            {/* Central 8-Pointed Star (خاتم التوحيد الإسلامي) */}
            <G transform={`translate(${RADIUS}, ${RADIUS}) scale(0.65)`}>
              <Path
                d="M0 -30 L8 -8 L30 0 L8 8 L0 30 L-8 8 L-30 0 L-8 -8 Z"
                fill={gc}
                opacity={0.35}
              />
              <Path
                d="M-21 -21 L0 -10 L21 -21 L10 0 L21 21 L0 10 L-21 21 L-10 0 Z"
                fill={dark ? '#1B473A' : '#D1E6DD'}
                opacity={0.4}
              />
            </G>

            {/* North Red Pointer Marker on the Dial */}
            <Polygon
              points={`${RADIUS - 4},${38} ${RADIUS + 4},${38} ${RADIUS},${20}`}
              fill="#EF4444"
            />
          </Svg>
        </Animated.View>

        {/* Large 3D Golden Qibla Arrow (سهم القبلة الكبير والواضح) */}
        {bearing != null && (
          <Animated.View
            style={[
              {
                width: DIAL_SIZE,
                height: DIAL_SIZE,
                position: 'absolute',
                transform: [{ scale }],
                alignItems: 'center',
                justifyContent: 'center',
              },
              needleStyle,
            ]}>
            <Svg width={DIAL_SIZE} height={DIAL_SIZE} viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`}>
              {/* Arrow Head: Pointing directly to Kaaba */}
              <G transform={`translate(${RADIUS}, 34)`}>
                {/* Kaaba Iconic Emblem at Arrow Tip */}
                <G transform="translate(-14, -20) scale(0.7)">
                  {/* Miniature Kaaba Silhouette */}
                  <Rect x="4" y="4" width="32" height="32" rx="4" fill="#1C1917" stroke={gc} strokeWidth="2.5" />
                  {/* Golden Kiswa Belt (حزام الكعبة الذهبي) */}
                  <Rect x="4" y="11" width="32" height="5" fill={gc} />
                  <Rect x="22" y="17" width="9" height="15" rx="1.5" fill={gc} />
                </G>

                {/* 3D Arrowhead Needle */}
                {/* Left side (Light Gold) */}
                <Polygon points="0,0 -11,54 0,44" fill="#FBBF24" />
                {/* Right side (Dark Gold) */}
                <Polygon points="0,0 11,54 0,44" fill="#D97706" />

                {/* Shaft extending downwards */}
                <Polygon points="-2.5,44 -2.5,108 0,112 0,44" fill="#F59E0B" />
                <Polygon points="0,44 0,112 2.5,108 2.5,44" fill="#B45309" />
              </G>

              {/* Counter-Weight Needle Tail */}
              <G transform={`translate(${RADIUS}, ${RADIUS + 35})`}>
                <Polygon points="0,52 -6,0 0,6" fill={dark ? '#334E44' : '#94A3B8'} />
                <Polygon points="0,52 6,0 0,6" fill={dark ? '#1B2C26' : '#64748B'} />
              </G>

              {/* Central Metallic Gold Boss Cap */}
              <Circle cx={RADIUS} cy={RADIUS} r={14} fill={gc} stroke="#78350F" strokeWidth={1.5} />
              <Circle cx={RADIUS} cy={RADIUS} r={8} fill={aligned ? '#10B981' : '#143831'} />
              <Circle cx={RADIUS} cy={RADIUS} r={3} fill="#FFFFFF" opacity={0.8} />
            </Svg>
          </Animated.View>
        )}
      </View>

      {/* Alignment Status Banner */}
      <View
        style={{
          width: '100%',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: r(16),
          borderWidth: 1.5,
          borderColor: aligned ? '#10B981' : t.line,
          backgroundColor: aligned ? (dark ? '#0A2E20' : '#E8FBF2') : t.card,
          alignItems: 'center',
          gap: 4,
        }}>
        <Txt size={16} weight={700} color={aligned ? (dark ? '#34D399' : '#059669') : t.ink}>
          {aligned
            ? '✓ أنت في اتجاه القبلة والكعبة المشرّفة تمامًا'
            : turn != null
              ? `استدر ${Math.round(Math.abs(turn))}° ${turn > 0 ? 'يمينًا' : 'يسارًا'}`
              : 'جارٍ تحديد اتجاه القبلة...'}
        </Txt>
        <Txt size={13} color={aligned ? (dark ? '#A7F3D0' : '#065F46') : t.muted} align="center">
          {aligned
            ? 'ضع هاتفك بشكل أفقي مستوٍ للحصول على أعلى دقة استقامة.'
            : 'وجّه رأس الهاتف نحو سهم الكعبة المذهب بالأعلى.'}
        </Txt>
      </View>

      {/* High-Precision Metrics Cards */}
      <View style={{ width: '100%', flexDirection: 'row', gap: 10 }}>
        {/* Device Heading */}
        <View
          style={{
            flex: 1,
            backgroundColor: t.soft,
            borderRadius: r(14),
            padding: 10,
            alignItems: 'center',
            gap: 2,
          }}>
          <Txt size={11} color={t.muted}>
            اتجاه هاتفك
          </Txt>
          <Txt size={20} weight={700} color={aligned ? (dark ? '#34D399' : '#059669') : t.ink} ltr>
            {`${Math.round(currentHeading)}°`}
          </Txt>
          <Txt size={11} weight={600} color={gc}>
            {DIRECTIONS.find((d) => Math.abs(shortestDelta(currentHeading, d.deg)) <= 22.5)?.label ?? ''}
          </Txt>
        </View>

        {/* Qibla Bearing */}
        <View
          style={{
            flex: 1,
            backgroundColor: t.goldSoft,
            borderRadius: r(14),
            padding: 10,
            alignItems: 'center',
            gap: 2,
          }}>
          <Txt size={11} color={t.goldInk}>
            اتجاه القبلة
          </Txt>
          <Txt size={20} weight={700} color={t.goldInk} ltr>
            {bearing != null ? `${bearing.toFixed(1)}°` : '—'}
          </Txt>
          <Txt size={11} color={t.goldInk}>
            من الشمال
          </Txt>
        </View>

        {/* Distance to Kaaba */}
        <View
          style={{
            flex: 1,
            backgroundColor: t.soft,
            borderRadius: r(14),
            padding: 10,
            alignItems: 'center',
            gap: 2,
          }}>
          <Txt size={11} color={t.muted}>
            المسافة لمكة
          </Txt>
          <Txt size={18} weight={700} color={t.ink} ltr>
            {distance != null ? `${Math.round(distance).toLocaleString('en-US')}` : '—'}
          </Txt>
          <Txt size={11} color={t.muted}>
            كيلومتر
          </Txt>
        </View>
      </View>

      {/* Sensor Calibration Button */}
      {loc && (
        <Press
          onPress={() => {
            hd.start();
            flash('حرّك الجهاز ببطء في الهواء على شكل الرقم 8 بعيدًا عن أي معادن أو أغطية مغناطيسية.');
          }}
          label="معايرة دقة البوصلة"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: t.card,
            borderWidth: 1,
            borderColor: t.line,
            borderRadius: r(12),
            paddingVertical: 10,
            paddingHorizontal: 16,
          }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: hd.accuracy === 3 ? '#10B981' : hd.accuracy === 2 ? '#F59E0B' : '#EF4444',
            }}
          />
          <Txt size={13} weight={600} color={t.ink}>
            دقة الحساس: {hd.accuracy === 3 ? 'ممتازة (3/3)' : hd.accuracy === 2 ? 'جيدة (2/3)' : 'تحتاج معايرة'} · اضغط للمعايرة ↻
          </Txt>
        </Press>
      )}
    </View>
  );
}
