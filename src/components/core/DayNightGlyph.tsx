import Svg, { Circle, Path } from 'react-native-svg';

/**
 * The home screen's day/night glyph, drawn as SVG so it looks the same on every platform. The
 * prototype used the text characters «☾» / «☀», which each OS renders from a different fallback
 * font; these paths reproduce the prototype's rendering (outlined crescent, eight-ray sun).
 */
const SUN_RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  const at = (r: number) => `${(12 + r * Math.cos(a)).toFixed(2)} ${(12 + r * Math.sin(a)).toFixed(2)}`;
  return `M${at(7.7)} L${at(9.8)}`;
}).join(' ');

export function DayNightGlyph({ dark, color, background, size = 22 }: { dark: boolean; color: string; background?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {dark ? (
        <>
          <Path d={SUN_RAYS} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
          <Circle cx={12} cy={12} r={5} fill={color} stroke={background ?? 'transparent'} strokeWidth={0.5} />
        </>
      ) : (
        <Path
          d="M15.5 4.14 A8.6 8.6 0 1 0 15.5 19.86 A7.88 7.88 0 0 1 15.5 4.14 Z"
          fill="none"
          stroke={color}
          strokeWidth={1.8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </Svg>
  );
}
