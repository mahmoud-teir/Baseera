/**
 * Location for prayer times and Qibla — requested only with the user's permission and kept on
 * the device (never sent to the backend).
 */
import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { useApp, type LocationFix } from '@/state/app-store';

import type { City } from './cities';

export type LocationError = 'denied' | 'unavailable' | 'timeout';

export async function locateDevice(): Promise<{ ok: true; fix: LocationFix } | { ok: false; error: LocationError }> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return { ok: false, error: 'denied' };
    const last = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 }).catch(() => null);
    const pos =
      last ??
      (await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>((res) => setTimeout(() => res(null), 15000)),
      ]));
    if (!pos) return { ok: false, error: 'timeout' };
    let label: string | undefined;
    if (Platform.OS !== 'web') {
      try {
        const [g] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        label = g?.city ?? g?.subregion ?? g?.region ?? undefined;
      } catch {
        // label is optional
      }
    }
    const fix: LocationFix = { lat: pos.coords.latitude, lon: pos.coords.longitude, label, at: Date.now(), source: 'gps' };
    useApp.getState().set({ location: fix });
    return { ok: true, fix };
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}

export function setManualCity(c: City) {
  useApp.getState().set({ location: { lat: c.lat, lon: c.lon, label: c.name, at: Date.now(), source: 'manual' } });
}

export const LOCATION_ERRORS: Record<LocationError, string> = {
  denied: 'لم يُمنح إذن الموقع. يمكنك السماح به من إعدادات الجهاز أو اختيار مدينتك يدويًا.',
  unavailable: 'تعذّر تحديد الموقع على هذا الجهاز. اختر مدينتك يدويًا.',
  timeout: 'استغرق تحديد الموقع وقتًا طويلًا. حاول مرة أخرى أو اختر مدينتك يدويًا.',
};
