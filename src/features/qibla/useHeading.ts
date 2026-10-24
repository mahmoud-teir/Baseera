/**
 * Device heading in degrees from TRUE north for the Qibla compass.
 *
 * Uses native compass heading via expo-location's watchHeadingAsync, which provides
 * hardware-calibrated, tilt-compensated orientation from Android (Sensor.TYPE_ROTATION_VECTOR /
 * geomagnetic sensor) and iOS (CLLocationManager).
 *
 * When native true heading is provided (trueHeading >= 0), it is used directly and geomagnetic
 * declination is recorded. When trueHeading is unavailable (common on Android without continuous GPS fix),
 * magnetic heading is adjusted by observed or estimated geomagnetic declination from the user's location.
 */
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { declinationFrom, estimateDeclination, norm360, shortestDelta, smoothAngle, unwrap } from './headingMath';

export type HeadingStatus = 'idle' | 'starting' | 'locating' | 'active' | 'unsupported' | 'denied' | 'needs-permission';

export interface HeadingState {
  status: HeadingStatus;
  /** Smoothed true heading, 0–360. */
  heading: number | null;
  /** The same heading as a continuous angle (no 359→0 jump) for animating the dial and needle. */
  headingContinuous: number | null;
  /** 0–3 (native accuracy level) — low values mean the compass needs calibration. */
  accuracy: number | null;
  /** True heading source note for the UI: true north is always used once active. */
  start: () => void;
}

type IOSOrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number; webkitCompassAccuracy?: number };

/** iOS Safari needs a user gesture before DeviceOrientationEvent.requestPermission(). */
function needsGesture(): boolean {
  if (Platform.OS !== 'web' || typeof DeviceOrientationEvent === 'undefined') return false;
  return typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === 'function';
}

/** Current screen rotation on the web, in degrees (0 / 90 / 180 / 270). */
function webScreenAngle(): number {
  if (typeof window === 'undefined') return 0;
  const so = (window.screen as Screen & { orientation?: { angle?: number } }).orientation;
  if (so && typeof so.angle === 'number') return so.angle;
  const legacy = (window as unknown as { orientation?: number }).orientation;
  return typeof legacy === 'number' ? legacy : 0;
}

export function useHeading(enabled = true, coords?: { lat: number; lon: number } | null): HeadingState {
  const [status, setStatus] = useState<HeadingStatus>(() => (needsGesture() ? 'needs-permission' : 'idle'));
  const [heading, setHeading] = useState<number | null>(null);
  const [headingContinuous, setHeadingContinuous] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const cleanup = useRef<(() => void) | null>(null);
  const smooth = useRef<number | null>(null);
  const declination = useRef<number | null>(null);

  /** Feed one raw true-heading sample (already screen-compensated) with adaptive stabilization. */
  const push = useCallback((raw: number) => {
    const norm = norm360(raw);
    const current = smooth.current;
    if (current == null) {
      smooth.current = norm;
      setHeading(norm);
      setHeadingContinuous(norm);
      setStatus('active');
      return;
    }

    const diff = Math.abs(shortestDelta(current, norm));
    // Deadband threshold: if the difference is smaller than 0.25°,
    // ignore micro-jitter/trembling when device is held still
    if (diff < 0.25) {
      return;
    }

    // Adaptive smoothing factor:
    // When movement is subtle (< 3.0°), smooth heavily (k = 0.14) to make it silky.
    // When movement is medium (3° - 15°), moderate responsiveness (k = 0.35).
    // When movement is large (> 15°), high responsiveness (k = 0.75) to follow hand turn instantly.
    let k = 0.35;
    if (diff < 3.0) {
      k = 0.14;
    } else if (diff > 15.0) {
      k = 0.75;
    }

    const s = smoothAngle(current, norm, k);
    smooth.current = s;
    setHeading(s);
    setHeadingContinuous((prev) => unwrap(prev, s));
    setStatus('active');
  }, []);

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
    // Chromium: alpha is counter-clockwise from north for the device's top; add the screen rotation.
    const onAbs = (e: DeviceOrientationEvent) => {
      if (e.alpha == null) return;
      got = true;
      push(360 - e.alpha + webScreenAngle());
    };
    // iOS Safari: webkitCompassHeading is already clockwise from north for the device's top.
    const onIOS = (e: IOSOrientationEvent) => {
      if (typeof e.webkitCompassHeading !== 'number') return;
      got = true;
      setAccuracy(e.webkitCompassAccuracy != null && (e.webkitCompassAccuracy < 0 || e.webkitCompassAccuracy > 25) ? 0 : 3);
      push(e.webkitCompassHeading + webScreenAngle());
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
  }, [push]);

  const startNative = useCallback(async () => {
    setStatus('starting');
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setStatus('denied');
        return;
      }

      // Seed declination if coordinates are available
      if (coords && declination.current == null) {
        declination.current = estimateDeclination(coords.lat, coords.lon);
      }

      const headingSub = await Location.watchHeadingAsync(
        (h) => {
          setAccuracy(h.accuracy);
          const d = declinationFrom(h.trueHeading, h.magHeading);
          if (d != null) {
            declination.current = d;
          }

          if (h.trueHeading >= 0) {
            push(h.trueHeading);
          } else if (h.magHeading >= 0) {
            // Android geomagnetic fallback with true north declination adjustment
            const dec = declination.current ?? (coords ? estimateDeclination(coords.lat, coords.lon) : 0);
            push(norm360(h.magHeading + dec));
          } else {
            setStatus('locating');
          }
        },
        () => {
          setStatus('unsupported');
        },
      );

      cleanup.current = () => {
        headingSub.remove();
      };
    } catch {
      setStatus('unsupported');
    }
  }, [coords, push]);

  const start = useCallback(() => {
    cleanup.current?.();
    smooth.current = null;
    if (Platform.OS === 'web') startWeb();
    else startNative();
  }, [startNative, startWeb]);

  useEffect(() => {
    if (!enabled || needsGesture()) return;
    const id = setTimeout(start, 0);
    return () => {
      clearTimeout(id);
      cleanup.current?.();
    };
  }, [enabled, start]);

  return { status, heading, headingContinuous, accuracy, start };
}
