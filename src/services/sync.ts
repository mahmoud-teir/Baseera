/**
 * Optional progress sync (HANDOFF §7 «مزامنة اختيارية»). Local state is the source of truth;
 * when the user is signed in and «مزامنة التقدم مع حسابي» is on, a debounced push stores the
 * syncable snapshot in Supabase and a pull on sign-in merges the remote copy (last write wins on
 * `updated_at`, plus union merges for monotonic data such as passed lessons).
 */
import type { Session } from '@supabase/supabase-js';

import { mergeQuranLogs } from '@/features/quran/log';
import { INITIAL_STATE, useApp, type AppState } from '@/state/app-store';

import { supabase } from './supabase';

/** Fields that follow the user across devices. Device-only data (location, downloads) stays local. */
const SYNC_KEYS = [
  'pname',
  'sv',
  'fs',
  'ls',
  'rt',
  'hc',
  'passed',
  'attempts',
  'mast',
  'pathDone',
  'srs',
  'planMin',
  'planDone',
  'prayed',
  'prayedAt',
  'quranLog',
  'adC',
  'fold',
  'lastRead',
  'quranBookmark',
  'starAyahs',
  'hifz',
  'coach',
  'notes',
  'savedQ',
  'lastBook',
  'certificates',
  'devices',
] as const satisfies readonly (keyof AppState)[];

type Snapshot = Pick<AppState, (typeof SYNC_KEYS)[number]>;

export function snapshot(s: AppState): Snapshot {
  const out = {} as Record<string, unknown>;
  SYNC_KEYS.forEach((k) => (out[k] = s[k]));
  return out as Snapshot;
}

/** Merge a remote snapshot into local state. */
export function mergeSnapshots(local: Snapshot & { updatedAt: number }, remote: Snapshot, remoteAt: number): Partial<AppState> {
  const newer = remoteAt > local.updatedAt;
  const base: Partial<AppState> = newer ? { ...remote } : {};
  // Passed lessons only ever grow: keep the union and the best score.
  const passed = { ...remote.passed };
  for (const [k, v] of Object.entries(local.passed)) {
    const r = passed[k];
    passed[k] = r ? { pct: Math.max(r.pct, v.pct), at: Math.min(r.at, v.at) } : v;
  }
  base.passed = passed;
  // Prayer log: keep every day recorded on either device (the newer copy wins for a day both have).
  const newerLog = newer ? remote : local;
  const olderLog = newer ? local : remote;
  base.prayed = { ...(olderLog.prayed ?? {}), ...(newerLog.prayed ?? {}) };
  base.prayedAt = { ...(olderLog.prayedAt ?? {}), ...(newerLog.prayedAt ?? {}) };
  base.quranLog = mergeQuranLogs(remote.quranLog, local.quranLog);
  // Notes: union by id.
  const ids = new Set(local.notes.map((n) => n.id));
  base.notes = [...local.notes, ...remote.notes.filter((n) => !ids.has(n.id))].sort((a, b) => b.at - a.at);
  // Devices: union by device id, keeping the newer lastActive
  const devices = { ...(remote.devices ?? {}) };
  for (const [id, dev] of Object.entries(local.devices ?? {})) {
    if (!devices[id] || dev.lastActive > devices[id].lastActive) {
      devices[id] = dev;
    }
  }
  base.devices = devices;
  return base;
}

let session: Session | null = null;

async function push() {
  if (!supabase || !session) return;
  const st = useApp.getState();
  if (!st.setting('sync')) return;
  // Never upload another account's data (it is replaced on the first pull for this account).
  if (st.owner !== session.user.id) return;
  await supabase.from('user_state').upsert({ user_id: session.user.id, data: snapshot(st), updated_at: new Date(st.updatedAt || Date.now()).toISOString() });
  // The account's display name (shown in the console and on certificates) follows the name set in the app.
  const name = st.pname.trim().slice(0, 60);
  if (name && name !== DEFAULT_NAME && name !== pushedName) {
    const { error } = await supabase.from('profiles').update({ display_name: name }).eq('id', session.user.id);
    if (!error) pushedName = name;
  }
}

const DEFAULT_NAME = INITIAL_STATE.pname;
let pushedName: string | null = null;

/** Use the account's name on this device when the device still shows the default name. */
async function pullName(uid: string) {
  if (!supabase) return;
  const { data } = await supabase.from('profiles').select('display_name').eq('id', uid).maybeSingle();
  const remote = (data?.display_name as string | undefined)?.trim();
  const local = useApp.getState().pname.trim();
  if (remote && remote !== DEFAULT_NAME && (!local || local === DEFAULT_NAME)) {
    pushedName = remote;
    useApp.getState().set({ pname: remote });
  }
}

export async function pull() {
  if (!supabase || !session) return;
  const { data, error } = await supabase.from('user_state').select('data, updated_at').eq('user_id', session.user.id).maybeSingle();
  if (error) return;
  // Each account keeps its own progress and logs. Data left on this device by a different account is
  // not merged into this one: start from this account's own copy. Data from before any sign-in is
  // adopted by the first account that signs in.
  const uid = session.user.id;
  const owner = useApp.getState().owner;
  if (owner !== uid) {
    if (owner) useApp.setState({ ...snapshot(INITIAL_STATE), updatedAt: 0 });
    useApp.setState({ owner: uid });
  }
  if (data) {
    const st = useApp.getState();
    useApp.setState(mergeSnapshots({ ...snapshot(st), updatedAt: st.updatedAt }, data.data as Snapshot, Date.parse(data.updated_at)));
  }
  // After the merge, which may bring back the default name from an older snapshot.
  await pullName(uid).catch(() => {});
}

/** Starts listening; returns an unsubscribe function. No-op without a configured backend. */
export function startSync(): () => void {
  if (!supabase) return () => {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  supabase.auth.getSession().then(({ data }) => {
    session = data.session;
    if (session) pull().catch(() => {});
  });
  const { data: authSub } = supabase.auth.onAuthStateChange((event, s) => {
    session = s;
    if (event === 'SIGNED_IN') pull().catch(() => {});
  });
  let last = useApp.getState().updatedAt;
  const unsubStore = useApp.subscribe((s) => {
    if (s.updatedAt === last) return;
    last = s.updatedAt;
    clearTimeout(timer);
    timer = setTimeout(() => push().catch(() => {}), 4000);
  });
  return () => {
    clearTimeout(timer);
    authSub.subscription.unsubscribe();
    unsubStore();
  };
}

export function currentSession(): Session | null {
  return session;
}
