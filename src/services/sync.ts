/**
 * Optional progress sync (HANDOFF §7 «مزامنة اختيارية»). Local state is the source of truth;
 * when the user is signed in and «مزامنة التقدم مع حسابي» is on, a debounced push stores the
 * syncable snapshot in Supabase and a pull on sign-in merges the remote copy (last write wins on
 * `updated_at`, plus union merges for monotonic data such as passed lessons).
 */
import type { Session } from '@supabase/supabase-js';

import { useApp, type AppState } from '@/state/app-store';

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
  'adC',
  'fold',
  'lastRead',
  'hifz',
  'coach',
  'notes',
  'savedQ',
  'lastBook',
  'certificates',
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
  // Notes: union by id.
  const ids = new Set(local.notes.map((n) => n.id));
  base.notes = [...local.notes, ...remote.notes.filter((n) => !ids.has(n.id))].sort((a, b) => b.at - a.at);
  return base;
}

let session: Session | null = null;

async function push() {
  if (!supabase || !session) return;
  const st = useApp.getState();
  if (!st.setting('sync')) return;
  await supabase.from('user_state').upsert({ user_id: session.user.id, data: snapshot(st), updated_at: new Date(st.updatedAt || Date.now()).toISOString() });
}

export async function pull() {
  if (!supabase || !session) return;
  const { data, error } = await supabase.from('user_state').select('data, updated_at').eq('user_id', session.user.id).maybeSingle();
  if (error || !data) return;
  const st = useApp.getState();
  const merged = mergeSnapshots({ ...snapshot(st), updatedAt: st.updatedAt }, data.data as Snapshot, Date.parse(data.updated_at));
  useApp.setState(merged);
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
