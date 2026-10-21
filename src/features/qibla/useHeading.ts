/**
 * Device heading (degrees from true north when available) for the Qibla compass.
 * Native: expo-location watchHeadingAsync. Web: DeviceOrientation events — iOS Safari exposes
 * `webkitCompassHeading` after a permission prompt; Chromium exposes absolute `alpha` through
 * `deviceorientationabsolute`. Desktop browsers have no sensor and report «unsupported».
 * Never fabricates an angle.
 */
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export type HeadingStatus = 'idle' | 'starting' | 'active' | 'unsupported' | 'denied' | 'needs-permission';

export interface HeadingState {
  status: HeadingStatus;
  heading: number | null;
  /** 0–3 (native accuracy level) — low values mean the compass needs calibration. */
  accuracy: number | null;
  start: () => void;
}

type IOSOrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number; webkitCompassAccuracy?: number };

/** iOS Safari needs a user gesture before DeviceOrientationEvent.requestPermission(). */
function needsGesture(): boolean {
  if (Platform.OS !== 'web' || typeof DeviceOrientationEvent === 'undefined') return false;
  return typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === 'function';
}

export function useHeading(enabled = true): HeadingState {
  const [status, setStatus] = useState<HeadingStatus>(() => (needsGesture() ? 'needs-permission' : 'idle'));
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const cleanup = useRef<(() => void) | null>(null);

  const startWeb = useCallback(async () => {
    if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined') {
      setStatus('unsupported');
      return;
    }
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<'granted' | 'denied'> };
    if (typeof DOE.requestPermission === 'function') {
      try {
        const res = await DOE.requestPermission();
        if (res !== 'granted') {
          setStatus('denied');
          return;
        }
      } catch {
        setStatus('needs-permission');
        return;
      }
    }
    setStatus('starting');
    let got = false;
    const onAbs = (e: DeviceOrientationEvent) => {
      if (e.alpha == null) return;
      got = true;
      setHeading((360 - e.alpha) % 360);
      setStatus('active');
    };
    const onIOS = (e: IOSOrientationEvent) => {
      if (typeof e.webkitCompassHeading === 'number') {
        got = true;
        setHeading(e.webkitCompassHeading);
        setAccuracy(e.webkitCompassAccuracy != null && e.webkitCompassAccuracy < 0 ? 0 : 3);
        setStatus('active');
      }
    };
    window.addEventListener('deviceorientationabsolute', onAbs as EventListener);
    window.addEventListener('deviceorientation', onIOS as EventListener);
    const timer = setTimeout(() => {
      if (!got) setStatus('unsupported');
    }, 2500);
    cleanup.current = () => {
      clearTimeout(timer);
      window.removeEventListener('deviceorientationabsolute', onAbs as EventListener);
      window.removeEventListener('deviceorientation', onIOS as EventListener);
    };
  }, []);

  const startNative = useCallback(async () => {
    setStatus('starting');
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setStatus('denied');
        return;
      }
      const sub = await Location.watchHeadingAsync(
        (h) => {
          const v = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          setHeading(v);
          setAccuracy(h.accuracy);
          setStatus('active');
        },
        () => setStatus('unsupported'),
      );
      cleanup.current = () => sub.remove();
    } catch {
      setStatus('unsupported');
    }
  }, []);

  const start = useCallback(() => {
    cleanup.current?.();
    if (Platform.OS === 'web') startWeb();
    else startNative();
  }, [startNative, startWeb]);

  useEffect(() => {
    if (!enabled || needsGesture()) return;
    // Subscribing to the device sensors is the external system this effect synchronises with.
    const id = setTimeout(start, 0);
    return () => {
      clearTimeout(id);
      cleanup.current?.();
    };
  }, [enabled, start]);

  return { status, heading, accuracy, start };
}
