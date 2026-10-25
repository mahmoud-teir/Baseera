/**
 * Console state — live data only. Everything is read from Supabase (staff RLS) and every change
 * goes through the security-definer RPCs of the `admin_console` and `cms` migrations, which enforce
 * the role matrix server-side. There is no sample data: without a configured backend the console
 * shows «Backend not connected».
 */
import { create } from 'zustand';

import { SUBJECTS } from '@/data/structural';
import { supabase } from '@/services/supabase';
import { CURRICULUM_DEFAULTS, CurriculumSchema, PRAYER_CONFIG_DEFAULTS, PrayerConfigSchema, useConfig, type Curriculum, type PrayerConfig } from '@/state/config-store';

import { S, type Lang, type Role } from './strings';

/** Workflow kind shown in queues: evidence · report · lesson · other content. */
export type Kind = 'ev' | 'rp' | 'ls' | 'ct';
export type ContentKind = 'lesson' | 'evidence' | 'quote' | 'vocab' | 'story' | 'sharia' | 'adhkar' | 'tafsir' | 'tajweed' | 'drill' | 'path' | 'map' | 'page' | 'book' | 'audio';
export type Action = 'send' | 'approve' | 'reject' | 'reopen' | 'triage' | 'fixed' | 'notify';
export type Json = Record<string, unknown>;

export interface Item {
  /** Unique key: `ct:<content id>` or `rp:<report id>`. */
  id: string;
  /** Server id (content_items.id or reports.id). */
  ref: string;
  kind: Kind;
  /** Content kind and slot key (null / empty for reports). */
  ckind: ContentKind | null;
  slot: string;
  title: string;
  meta: string;
  stage: number;
  rej: boolean;
  /** A published version is live in the app (the current draft may differ from it). */
  live: boolean;
  ap: string[];
  apMine: boolean;
  data: Json;
  published: Json | null;
  fields: { cat?: string; para?: string; note?: string };
}

export interface LogRow {
  id: string;
  at: number;
  role: Role | null;
  x: string;
  kind: Kind | null;
}

export interface Overview {
  ev: number;
  rp: number;
  ls: number;
  active: number;
  completion: number;
  avg: number | null;
  weekly: { d: Date; n: number }[];
  pipeline: number[];
}

export type Cell = { t: string; chip?: 'ok' | 'muted' | 'warn'; bar?: number; col?: 'ok' | 'muted' };
export interface StaffRow {
  user_id: string;
  email: string;
  display_name: string | null;
  role: Role;
}
export interface ReviewerRow {
  id: number;
  subject_id: string;
  name: string;
  published: boolean;
  last_review: string | null;
}
export interface FeedbackRow {
  id: number;
  message: string;
  contact: string | null;
  status: 'new' | 'read' | 'done';
  created_at: string;
}
export interface LearnerRow {
  code: string;
  learners: number;
  avg_progress: number;
  pass_rate: number;
}
export interface CertRow {
  code: string;
  name: string;
  stage: number;
  issued_at: string;
}

type Status = 'idle' | 'loading' | 'ready' | 'error' | 'signedOut' | 'noAccess' | 'unconfigured';

interface AdminState {
  status: Status;
  lang: Lang;
  /** Role used for the UI. Only admins may preview other roles; the server applies the real one. */
  role: Role;
  myRole: Role | null;
  myName: string;
  items: Item[];
  log: LogRow[];
  overview: Overview | null;
  learners: LearnerRow[];
  certs: CertRow[];
  staff: StaffRow[];
  reviewers: ReviewerRow[];
  feedback: FeedbackRow[];
  prayer: PrayerConfig;
  curriculum: Curriculum;
  toast: string;
  busy: boolean;
  setLang: (l: Lang) => void;
  setRole: (r: Role) => void;
  showToast: (m: string) => void;
  load: (signedIn: boolean) => Promise<void>;
  transition: (id: string, action: Action) => Promise<boolean>;
  saveDraft: (kind: ContentKind, slot: string, data: Json) => Promise<string | null>;
  deleteContent: (id: string) => Promise<boolean>;
  savePrayer: (p: PrayerConfig) => Promise<void>;
  saveCurriculum: (c: Curriculum) => Promise<boolean>;
  setStaff: (email: string, role: Role) => Promise<boolean>;
  removeStaff: (userId: string) => Promise<boolean>;
  saveReviewer: (r: Omit<ReviewerRow, 'id'> & { id: number | null }) => Promise<boolean>;
  deleteReviewer: (id: number) => Promise<boolean>;
  markFeedback: (id: number, status: FeedbackRow['status']) => Promise<boolean>;
  verifyCert: (code: string) => Promise<boolean>;
  uploadMedia: (file: Blob, name: string, folder: string) => Promise<string | null>;
}

// ── Stage mapping ────────────────────────────────────────────────────────────
export const MAX_STAGE: Record<Kind, number> = { ev: 2, rp: 3, ls: 2, ct: 2 };
const CT_STATUS = ['draft', 'review', 'published'];
const RP_STATUS = ['new', 'triaged', 'fixed', 'notified'];

export function stageName(lang: Lang, kind: Kind, stage: number) {
  const L = S[lang];
  return (kind === 'rp' ? L.rpS : kind === 'ls' ? L.lsS : L.evS)[stage];
}

/** «draft → review» from the audit log, in the console language. */
export function auditText(lang: Lang, kind: Kind | null, action: string) {
  const L = S[lang];
  if (!kind) return action === 'updated' ? L.saved : action;
  if (action === 'deleted') return L.deleted;
  const statuses = kind === 'rp' ? RP_STATUS : CT_STATUS;
  return action
    .split(' → ')
    .map((s) => (s === 'rejected' ? L.rejected : s === 'new' && kind !== 'rp' ? L.created : (stageName(lang, kind, statuses.indexOf(s)) ?? s)))
    .join(' → ');
}

/** The forward action for «Advance» (bulk) — lessons in review need individual scholar approvals. */
export function forwardAction(it: Item): Action | null {
  if (it.rej) return null;
  if (it.kind === 'rp') return (['triage', 'fixed', 'notify'] as const)[it.stage] ?? null;
  if (it.stage === 0) return 'send';
  return it.stage === 1 && it.kind !== 'ls' ? 'approve' : null;
}

const kindOf = (ck: ContentKind): Kind => (ck === 'lesson' ? 'ls' : ck === 'evidence' ? 'ev' : 'ct');
const asRole = (r: unknown): Role | null => (['content', 'scholar', 'mod', 'analytics', 'admin'].includes(r as string) ? (r as Role) : null);
const auditKind = (item: string): Kind | null => (item.startsWith('rp:') ? 'rp' : item.startsWith('ct:') ? 'ct' : null);

/** Server error codes → readable text (falls back to the raw message). */
export function errorText(lang: Lang, msg: string) {
  const L = S[lang];
  const code = Object.keys(L.errors).find((k) => msg.includes(k));
  return code ? L.errors[code] : msg;
}

async function loadLive() {
  const sb = supabase!;
  const { data: role, error: roleErr } = await sb.rpc('staff_role');
  if (roleErr) throw roleErr;
  const myRole = asRole(role);
  if (!myRole) return { myRole: null } as const;
  const { data: auth } = await sb.auth.getUser();
  const me = auth.user?.id;
  const { data: prof } = me ? await sb.from('profiles').select('display_name').eq('id', me).maybeSingle() : { data: null };
  const isAdmin = myRole === 'admin';
  const analytics = myRole === 'admin' || myRole === 'analytics';
  const triage = myRole === 'admin' || myRole === 'mod';
  const none = Promise.resolve({ data: [], error: null });

  const [ct, rp, audit, cfg, ov, learners, certs, staff, reviewers, feedback] = await Promise.all([
    // Full rows (drafts included) only through the staff RPC; clients can read published columns only.
    sb.rpc('admin_content'),
    sb.from('reports').select('id, where_text, reason, note, status, created_at').order('created_at', { ascending: false }).limit(500),
    sb.from('audit_log').select('id, at, actor_role, item, action').order('at', { ascending: false }).limit(300),
    sb.from('app_config').select('key, value').in('key', ['prayer', 'curriculum']),
    sb.rpc('admin_overview'),
    analytics ? sb.rpc('admin_learner_stats') : none,
    analytics ? sb.rpc('admin_certificates') : none,
    isAdmin ? sb.rpc('admin_list_staff') : none,
    sb.from('reviewers').select('id, subject_id, name, published, last_review').order('subject_id'),
    triage ? sb.from('feedback').select('id, message, contact, status, created_at').order('created_at', { ascending: false }).limit(300) : none,
  ]);
  for (const r of [ct, rp, audit, ov]) if (r.error) throw r.error;

  const items: Item[] = [];
  for (const c of ct.data ?? []) {
    const ck = c.kind as ContentKind;
    const k = kindOf(ck);
    const rej = c.status === 'rejected';
    const subject = SUBJECTS.find((s) => String(c.slot).startsWith(s.prefix + '-'));
    items.push({
      id: 'ct:' + c.id,
      ref: c.id,
      kind: k,
      ckind: ck,
      slot: c.slot,
      title: c.title || c.slot,
      meta: subject ? `${c.slot} · ${subject.name}` : `${ck} · ${c.slot}`,
      stage: rej ? 1 : Math.max(0, CT_STATUS.indexOf(c.status)),
      rej,
      live: c.published_data !== null,
      ap: c.approver_names ?? [],
      apMine: !!me && (c.approvals ?? []).includes(me),
      data: (c.data ?? {}) as Json,
      published: (c.published_data ?? null) as Json | null,
      fields: {},
    });
  }
  for (const r of rp.data ?? []) {
    const rej = r.status === 'rejected';
    items.push({
      id: 'rp:' + r.id,
      ref: String(r.id),
      kind: 'rp',
      ckind: null,
      slot: '',
      title: r.where_text,
      meta: r.reason,
      stage: rej ? 0 : Math.max(0, RP_STATUS.indexOf(r.status)),
      rej,
      live: false,
      ap: [],
      apMine: false,
      data: {},
      published: null,
      fields: { cat: r.reason, para: r.where_text, note: r.note || undefined },
    });
  }

  const log: LogRow[] = (audit.data ?? []).map((a) => ({ id: a.item, at: new Date(a.at).getTime(), role: asRole(a.actor_role), x: a.action, kind: auditKind(a.item) }));
  const o = ov.data as { evidence_review: number; open_reports: number; lessons_review: number; active_learners: number; completion: number; avg_score: number | null; weekly: number[]; pipeline: number[] };
  const today = new Date();
  const overview: Overview = {
    ev: o.evidence_review,
    rp: o.open_reports,
    ls: o.lessons_review,
    active: o.active_learners,
    completion: o.completion,
    avg: o.avg_score,
    weekly: o.weekly.map((n, i) => ({ d: new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i)), n })),
    pipeline: o.pipeline,
  };
  let prayer = PRAYER_CONFIG_DEFAULTS;
  let curriculum = CURRICULUM_DEFAULTS;
  for (const row of cfg.data ?? []) {
    if (row.key === 'prayer') {
      const p = PrayerConfigSchema.safeParse(row.value);
      if (p.success) prayer = p.data;
    } else {
      const c = CurriculumSchema.safeParse(row.value);
      if (c.success) curriculum = c.data;
    }
  }
  return {
    myRole,
    myName: (prof?.display_name as string | undefined) || auth.user?.email || '',
    items,
    log,
    overview,
    prayer,
    curriculum,
    learners: (learners.data ?? []) as LearnerRow[],
    certs: (certs.data ?? []) as CertRow[],
    staff: (staff.data ?? []) as StaffRow[],
    reviewers: (reviewers.data ?? []) as ReviewerRow[],
    feedback: (feedback.data ?? []) as FeedbackRow[],
  };
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useAdmin = create<AdminState>()((set, get) => {
  const toast = (m: string) => get().showToast(m);
  const fail = (msg: string) => toast(`${S[get().lang].failed}: ${errorText(get().lang, msg)}`);
  const reload = async () => {
    const r = await loadLive();
    if (!r.myRole) return set({ status: 'noAccess', myRole: null });
    set((s) => ({ ...r, status: 'ready', role: r.myRole === 'admin' ? s.role : r.myRole! }));
    useConfig.getState().setPrayer(r.prayer);
    useConfig.getState().setCurriculum(r.curriculum);
  };
  /** Run an RPC, toast its error, reload on success. Returns the RPC data (or true), undefined on error. */
  const call = async (p: PromiseLike<{ data: unknown; error: { message: string } | null }>, ok?: string): Promise<unknown> => {
    set({ busy: true });
    try {
      const { data, error } = await p;
      if (error) {
        fail(error.message);
        return undefined;
      }
      await reload().catch(() => {});
      if (ok) toast(ok);
      return data ?? true;
    } finally {
      set({ busy: false });
    }
  };

  return {
    status: supabase ? 'idle' : 'unconfigured',
    lang: 'ar',
    role: 'admin',
    myRole: null,
    myName: '',
    items: [],
    log: [],
    overview: null,
    learners: [],
    certs: [],
    staff: [],
    reviewers: [],
    feedback: [],
    prayer: PRAYER_CONFIG_DEFAULTS,
    curriculum: CURRICULUM_DEFAULTS,
    toast: '',
    busy: false,

    setLang: (lang) => set({ lang }),
    setRole: (role) => {
      if (get().myRole !== 'admin') return;
      set({ role });
    },
    showToast: (m) => {
      set({ toast: m });
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => set({ toast: '' }), 2200);
    },

    load: async (signedIn) => {
      if (!supabase) return set({ status: 'unconfigured' });
      if (!signedIn) return set({ status: 'signedOut' });
      set({ status: get().status === 'ready' ? 'ready' : 'loading' });
      try {
        await reload();
      } catch {
        set({ status: 'error' });
      }
    },

    transition: async (id, action) => {
      const st = get();
      const it = st.items.find((i) => i.id === id);
      if (!it || !supabase) return false;
      const res = await call(supabase.rpc('admin_transition', { p_kind: it.kind === 'rp' ? 'rp' : 'ct', p_id: it.ref, p_action: action }));
      if (res === undefined) return false;
      if (action === 'notify') {
        // Push to the reporter's devices (the in-app notification is written by the RPC).
        await supabase.functions.invoke('notify-reporter', { body: { report_id: Number(it.ref) } }).catch(() => {});
      }
      const now = get().items.find((i) => i.id === id);
      toast(`${it.title} → ${now?.rej ? S[st.lang].rejected : now ? stageName(st.lang, now.kind, now.stage) : ''}`);
      return true;
    },

    saveDraft: async (kind, slot, data) => {
      if (!supabase) return null;
      const res = await call(supabase.rpc('admin_save_draft', { p_kind: kind, p_slot: slot, p_data: data }), S[get().lang].drafted);
      return typeof res === 'string' ? res : null;
    },

    deleteContent: async (id) => {
      if (!supabase) return false;
      return (await call(supabase.rpc('admin_delete_content', { p_id: id }), S[get().lang].deleted)) !== undefined;
    },

    savePrayer: async (p) => {
      if (!supabase) return;
      set({ prayer: p });
      await call(supabase.rpc('admin_save_config', { p_key: 'prayer', p_value: p }), S[get().lang].saved);
    },

    saveCurriculum: async (c) => {
      if (!supabase) return false;
      return (await call(supabase.rpc('admin_save_config', { p_key: 'curriculum', p_value: c }), S[get().lang].saved)) !== undefined;
    },

    setStaff: async (email, role) => {
      if (!supabase) return false;
      return (await call(supabase.rpc('admin_set_staff', { p_email: email, p_role: role }), S[get().lang].saved)) !== undefined;
    },
    removeStaff: async (userId) => {
      if (!supabase) return false;
      return (await call(supabase.rpc('admin_remove_staff', { p_user: userId }), S[get().lang].saved)) !== undefined;
    },
    saveReviewer: async (r) => {
      if (!supabase) return false;
      return (
        (await call(supabase.rpc('admin_upsert_reviewer', { p_id: r.id, p_subject: r.subject_id, p_name: r.name, p_published: r.published, p_last_review: r.last_review || null }), S[get().lang].saved)) !==
        undefined
      );
    },
    deleteReviewer: async (id) => {
      if (!supabase) return false;
      return (await call(supabase.rpc('admin_delete_reviewer', { p_id: id }), S[get().lang].deleted)) !== undefined;
    },
    markFeedback: async (id, status) => {
      if (!supabase) return false;
      return (await call(supabase.rpc('admin_feedback_mark', { p_id: id, p_status: status }))) !== undefined;
    },

    verifyCert: async (code) => {
      if (!supabase) return false;
      const { data, error } = await supabase.functions.invoke<{ valid: boolean }>('verify-certificate', { body: { code: code.trim().toUpperCase() } });
      return !error && !!data?.valid;
    },

    uploadMedia: async (file, name, folder) => {
      if (!supabase) return null;
      set({ busy: true });
      try {
        const safe = name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, '-').slice(-60);
        const path = `${folder}/${Date.now().toString(36)}-${safe}`;
        const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type || undefined, upsert: false });
        if (error) {
          fail(error.message);
          return null;
        }
        return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
      } finally {
        set({ busy: false });
      }
    },
  };
});
