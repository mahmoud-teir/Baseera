/** Pure console rules (no UI imports) — shared by the views and the unit tests. */
import { MAX_STAGE, stageName, type Action, type Item, type Kind } from './store';
import { MATRIX, S, type L as Strings, type Lang, type Role } from './strings';
import type { ChipTone } from './ui';

const PERM = { view: 0, edit: 1, approve: 2, triage: 3, analytics: 4, roles: 5 } as const;
export const can = (role: Role, p: keyof typeof PERM) => MATRIX[role][PERM[p]] === 1;

/** Which permission each workflow action needs (mirrors `admin_transition`). */
export function allowed(role: Role, kind: Kind, a: Action) {
  if (kind === 'rp') return can(role, 'triage');
  if (a === 'approve' || a === 'reject') return can(role, 'approve');
  return can(role, 'edit');
}

/** Label for a queue item: report / lesson / evidence, or the exact content kind (quote, story, …). */
export const kindLabel = (L: Strings, k: Kind, ckind?: string | null) => (k === 'ct' && ckind ? (L.kinds[ckind] ?? ckind) : { ev: L.kEv, rp: L.kRp, ls: L.kLs, ct: L.catalog }[k]);

export function chipFor(lang: Lang, it: Item): { label: string; tone: ChipTone } {
  if (it.rej) return { label: S[lang].rejected, tone: 'err' };
  const fin = it.stage === MAX_STAGE[it.kind];
  return { label: stageName(lang, it.kind, it.stage), tone: fin ? 'ok' : it.stage === 0 ? 'muted' : 'warn' };
}

export const isPending = (i: Item) => !i.rej && i.stage < MAX_STAGE[i.kind];

/** «Only my role» — the design's mineFilter. */
export function mine(it: Item, role: Role) {
  if (role === 'admin' || role === 'analytics') return true;
  if (role === 'mod') return it.kind === 'rp';
  if (role === 'scholar') return it.stage === 1 && it.kind !== 'rp';
  return (it.kind !== 'rp' && it.stage === 0) || it.kind === 'ls';
}

