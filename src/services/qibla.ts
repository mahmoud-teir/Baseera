/** Qibla math — same formulas as `Qibla Map.html` (initial great-circle bearing, d3.geoDistance × 6371). */

export const MECCA = { lat: 21.4225, lon: 39.8262 } as const;
const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Initial bearing from (lat, lon) to the Kaaba, degrees clockwise from true north. */
export function qiblaBearing(lat: number, lon: number): number {
  const φ1 = rad(lat);
  const φ2 = rad(MECCA.lat);
  const Δλ = rad(MECCA.lon - lon);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/** Great-circle distance to the Kaaba in km (haversine, R = 6371 km). */
export function distanceToKaaba(lat: number, lon: number): number {
  const φ1 = rad(lat);
  const φ2 = rad(MECCA.lat);
  const dφ = φ2 - φ1;
  const dλ = rad(MECCA.lon - lon);
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Angle to rotate the compass needle given the device heading (true north). */
export function needleAngle(bearing: number, heading: number): number {
  return (bearing - heading + 360) % 360;
}

/** Example cities shown on the prototype's Qibla map (labelled as examples there). */
export const EXAMPLE_CITIES: { name: string; lat: number; lon: number }[] = [
  { name: 'القاهرة', lon: 31.2357, lat: 30.0444 },
  { name: 'إسطنبول', lon: 28.9784, lat: 41.0082 },
  { name: 'جاكرتا', lon: 106.8456, lat: -6.2088 },
  { name: 'لندن', lon: -0.1276, lat: 51.5072 },
  { name: 'نيويورك', lon: -74.006, lat: 40.7128 },
  { name: 'عمّان', lon: 35.9239, lat: 31.9454 },
];
