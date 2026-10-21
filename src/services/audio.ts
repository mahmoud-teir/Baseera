/**
 * One shared audio engine for the whole app (HANDOFF: lesson audio, Quran recitation with ayah
 * tracking and repeat ×1/×3/×5, library player with speed, sleep timer and queue, khushu mode).
 * Built on expo-audio; works on web (HTML audio), iOS and Android (background playback +
 * lock-screen controls).
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioStatus } from 'expo-audio';
import { Platform } from 'react-native';
import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  uri: string;
  artist?: string;
  /** Free-form tag, e.g. { surah, ayah } for recitation tracking. */
  meta?: Record<string, number | string>;
}

interface AudioState {
  queue: Track[];
  index: number;
  playing: boolean;
  loading: boolean;
  position: number;
  duration: number;
  rate: number;
  /** Times each track plays before advancing (×1/×3/×5). */
  repeat: number;
  repeatLeft: number;
  autoNext: boolean;
  sleepAt: number | null;
  /** Minutes chosen for the sleep timer (0 = off). */
  sleepMin: number;
  error: string | null;
}

export const useAudio = create<AudioState>()(() => ({
  queue: [],
  index: 0,
  playing: false,
  loading: false,
  position: 0,
  duration: 0,
  rate: 1,
  repeat: 1,
  repeatLeft: 1,
  autoNext: true,
  sleepAt: null,
  sleepMin: 0,
  error: null,
}));

let player: AudioPlayer | null = null;
let sleepTimer: ReturnType<typeof setTimeout> | undefined;
let modeSet = false;

function ensurePlayer(): AudioPlayer | null {
  if (Platform.OS === 'web' && typeof window === 'undefined') return null;
  if (!modeSet) {
    modeSet = true;
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => {});
  }
  if (!player) {
    player = createAudioPlayer(null, { updateInterval: 400 });
    player.addListener('playbackStatusUpdate', onStatus);
  }
  return player;
}

function onStatus(s: AudioStatus) {
  const st = useAudio.getState();
  useAudio.setState({
    playing: s.playing,
    loading: !s.isLoaded || s.isBuffering,
    position: s.currentTime,
    duration: s.duration || st.duration,
  });
  if (s.didJustFinish) handleFinish();
}

function handleFinish() {
  const st = useAudio.getState();
  if (st.repeatLeft > 1) {
    useAudio.setState({ repeatLeft: st.repeatLeft - 1 });
    player?.seekTo(0).then(() => player?.play());
    return;
  }
  if (st.autoNext && st.index < st.queue.length - 1) {
    loadIndex(st.index + 1, true);
    return;
  }
  useAudio.setState({ playing: false, position: 0 });
}

function loadIndex(i: number, autoplay: boolean) {
  const p = ensurePlayer();
  const st = useAudio.getState();
  const tr = st.queue[i];
  if (!p || !tr) return;
  useAudio.setState({ index: i, repeatLeft: st.repeat, position: 0, duration: 0, loading: true, error: null });
  try {
    p.replace({ uri: tr.uri });
    p.setPlaybackRate(st.rate);
    if (Platform.OS !== 'web') {
      try {
        p.setActiveForLockScreen(true, { title: tr.title, artist: tr.artist ?? 'بصيرة' }, { showSeekBackward: true, showSeekForward: true });
      } catch {
        // lock screen controls are best-effort
      }
    }
    if (autoplay) p.play();
  } catch {
    useAudio.setState({ error: 'تعذّر تشغيل المقطع', loading: false });
  }
}

/** Replace the queue and start at `start`. */
export function playQueue(queue: Track[], start = 0, opts: { repeat?: number; autoNext?: boolean } = {}) {
  useAudio.setState({ queue, repeat: opts.repeat ?? useAudio.getState().repeat, autoNext: opts.autoNext ?? true });
  loadIndex(start, true);
}

export function currentTrack(): Track | undefined {
  const s = useAudio.getState();
  return s.queue[s.index];
}

export function isCurrent(id: string): boolean {
  return currentTrack()?.id === id;
}

export function toggle(fallback?: () => void) {
  const p = ensurePlayer();
  const st = useAudio.getState();
  if (!st.queue.length) {
    fallback?.();
    return;
  }
  if (!p) return;
  if (st.playing) p.pause();
  else p.play();
}

export function pause() {
  player?.pause();
}

export function stop() {
  player?.pause();
  useAudio.setState({ playing: false, queue: [], index: 0, position: 0, duration: 0 });
}

export function seekBy(seconds: number) {
  if (!player) return;
  const st = useAudio.getState();
  const to = Math.max(0, Math.min(st.duration || Infinity, st.position + seconds));
  player.seekTo(to).catch(() => {});
}

export function seekTo(seconds: number) {
  player?.seekTo(seconds).catch(() => {});
}

export function jump(delta: number) {
  const st = useAudio.getState();
  const i = st.index + delta;
  if (i >= 0 && i < st.queue.length) loadIndex(i, true);
}

export function setRate(rate: number) {
  useAudio.setState({ rate });
  player?.setPlaybackRate(rate);
}

export function setRepeat(n: number) {
  useAudio.setState({ repeat: n, repeatLeft: n });
}

/** Sleep timer (المؤقّت): 0 cancels. */
export function setSleep(minutes: number) {
  clearTimeout(sleepTimer);
  if (!minutes) {
    useAudio.setState({ sleepAt: null, sleepMin: 0 });
    return;
  }
  const at = Date.now() + minutes * 60000;
  useAudio.setState({ sleepAt: at, sleepMin: minutes });
  sleepTimer = setTimeout(() => {
    player?.pause();
    useAudio.setState({ sleepAt: null, sleepMin: 0 });
  }, minutes * 60000);
}

export function playbackSpeedFromLabel(label: string): number {
  return Number(label.replace('×', '')) || 1;
}
