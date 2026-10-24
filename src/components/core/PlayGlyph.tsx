import Svg, { Path, Rect } from 'react-native-svg';

/**
 * Play ▶ / pause ❚❚ drawn as SVG. The text characters render as a colour emoji on Android (▶️),
 * unlike the prototype's plain triangle, so play buttons use this instead.
 */
export function PlayGlyph({ playing = false, size = 14, color }: { playing?: boolean; size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {playing ? (
        <>
          <Rect x={5} y={3.5} width={5} height={17} rx={1} fill={color} />
          <Rect x={14} y={3.5} width={5} height={17} rx={1} fill={color} />
        </>
      ) : (
        <Path d="M6 3.2 L20.5 12 L6 20.8 Z" fill={color} strokeLinejoin="round" stroke={color} strokeWidth={1} />
      )}
    </Svg>
  );
}
