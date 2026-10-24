/** Pure helpers for the compass heading (unit-tested in tests/unit/services.test.ts). */

/** Normalise any angle to [0, 360). */
export const norm360 = (a: number) => ((a % 360) + 360) % 360;

/** Signed shortest rotation from `from` to `to`, in (-180, 180]. */
export function shortestDelta(from: number, to: number): number {
  const d = norm360(to - from);
  return d > 180 ? d - 360 : d;
}

/**
 * Continuous ("unwrapped") angle: follows `next` from `prev` by the shortest rotation, so a needle
 * animating between successive values never spins the long way round when it crosses north.
 */
export function unwrap(prev: number | null, next: number): number {
  return prev == null ? next : prev + shortestDelta(prev, next);
}

/**
 * Exponential smoothing on the unit circle (sin/cos), so 359° and 1° average to 0°, not 180°.
 * `k` is the weight of the new sample (0–1).
 */
export function smoothAngle(prev: number | null, next: number, k: number): number {
  if (prev == null) return norm360(next);
  const r = Math.PI / 180;
  const x = (1 - k) * Math.cos(prev * r) + k * Math.cos(next * r);
  const y = (1 - k) * Math.sin(prev * r) + k * Math.sin(next * r);
  return norm360(Math.atan2(y, x) / r);
}

/**
 * Magnetic declination (true − magnetic, degrees east positive) from a heading sample that carries
 * both values, or null when the true heading is not available yet.
 */
export function declinationFrom(trueHeading: number, magHeading: number): number | null {
  if (!(trueHeading >= 0) || !(magHeading >= 0)) return null;
  return shortestDelta(magHeading, trueHeading);
}

/**
 * Android fused heading: expo-sensors DeviceMotion reports `rotation.alpha` = −azimuth (radians) from
 * the TYPE_ROTATION_VECTOR sensor, referenced to magnetic north. Returns the magnetic heading in degrees.
 */
export function magneticFromRotationAlpha(alphaRad: number): number {
  return norm360((-alphaRad * 180) / Math.PI);
}

/**
 * Approximate geomagnetic declination (degrees, east positive) for a given latitude and longitude.
 * Based on the geomagnetic dipole approximation using the current North Magnetic Pole (~86.5°N, 164.0°E).
 */
export function estimateDeclination(lat: number, lon: number): number {
  const poleLat = 86.5 * (Math.PI / 180);
  const poleLon = 164.0 * (Math.PI / 180);
  const phi = lat * (Math.PI / 180);
  const lambda = lon * (Math.PI / 180);
  const dLon = poleLon - lambda;
  const y = Math.sin(dLon);
  const x = Math.cos(phi) * Math.tan(poleLat) - Math.sin(phi) * Math.cos(dLon);
  const decRad = Math.atan2(y, x);
  return (decRad * 180) / Math.PI;
}
