/// <reference types="node" />
/**
 * A stand-in Supabase for the E2E build (`npm run export:e2e` points the app at
 * https://e2e.supabase.test). Requests are answered from in-test fixtures; nothing here ships in
 * the app. `calls` records RPC and function invocations so tests can assert what the UI sent.
 */
import type { Page, Route } from '@playwright/test';

export const SUPA = 'https://e2e.supabase.test';

export type Row = { id: string; kind: string; slot: string; data: unknown; sort?: number };

/** Test fixture: 8 published AQ lessons, 8 questions each, correct answers KEY. */
export const KEY = [1, 0, 2, 1, 3, 0, 2, 1];
export const LESSONS: Row[] = Array.from({ length: 8 }, (_, n) => ({
  id: 'lesson-' + (n + 1),
  kind: 'lesson',
  slot: `AQ-0${n + 1}`,
  data: {
    title: `درس اختبار ${n + 1}`,
    minutes: 10,
    objectives: ['هدف الاختبار'],
    sections: [{ heading: 'الشرح', body: 'نص شرح الاختبار' }],
    summary: ['ملخص الاختبار'],
    quiz: { passPct: 85, questions: KEY.map((answer, i) => ({ id: `q${i + 1}`, q: `سؤال الاختبار ${i + 1}`, options: ['خيار أول', 'خيار ثان', 'خيار ثالث', 'خيار رابع'], answer, explain: 'توضيح الاختبار' })) },
  },
}));
export const EVIDENCE: Row = { id: 'ev-1', kind: 'evidence', slot: 'AQ-01/e1', data: { kind: 'quran', label: 'آية', text: 'نص دليل الاختبار', source: 'مصدر الاختبار', ref: '1:1', wajh: 'وجه الاختبار' } };

export interface Backend {
  calls: { path: string; body: unknown }[];
  rows: Row[];
}

const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

/** PostgREST `eq.` filters from the query string (enough for the app's reads). */
function filterRows(url: URL, rows: Record<string, unknown>[]) {
  let out = rows;
  url.searchParams.forEach((v, k) => {
    if (['select', 'order', 'limit', 'offset'].includes(k)) return;
    if (v.startsWith('eq.')) out = out.filter((r) => String(r[k]) === v.slice(3));
    else if (v.startsWith('neq.')) out = out.filter((r) => String(r[k]) !== v.slice(4));
    else if (v.startsWith('in.(')) {
      const set = v.slice(4, -1).split(',');
      out = out.filter((r) => set.includes(String(r[k])));
    }
  });
  return out;
}

/**
 * Serve `rows` as the published content. `tables` adds other tables (by name), `rpc` maps RPC names to
 * results (functions get the request body), and `fn` does the same for Edge Functions.
 */
export async function backend(
  page: Page,
  opts: { rows?: Row[]; tables?: Record<string, Record<string, unknown>[]>; rpc?: Record<string, unknown | ((body: unknown) => unknown)>; fn?: Record<string, unknown> } = {},
): Promise<Backend> {
  const state: Backend = { calls: [], rows: opts.rows ?? [] };
  await page.route(`${SUPA}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    let body: unknown = null;
    try {
      body = req.postDataJSON();
    } catch {
      body = req.postData();
    }
    const single = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object');
    const respond = (rows: Record<string, unknown>[]) => json(route, single ? (rows[0] ?? null) : rows);

    if (path.startsWith('/rest/v1/rpc/')) {
      const name = path.slice('/rest/v1/rpc/'.length);
      state.calls.push({ path: 'rpc/' + name, body });
      const r = opts.rpc?.[name];
      return json(route, typeof r === 'function' ? (r as (b: unknown) => unknown)(body) : (r ?? null));
    }
    if (path.startsWith('/rest/v1/')) {
      const table = path.slice('/rest/v1/'.length);
      if (req.method() !== 'GET') {
        state.calls.push({ path: table, body });
        return json(route, null, 201);
      }
      if (table === 'published_content') return respond(filterRows(url, state.rows as unknown as Record<string, unknown>[]));
      return respond(filterRows(url, opts.tables?.[table] ?? []));
    }
    if (path.startsWith('/functions/v1/')) {
      const name = path.slice('/functions/v1/'.length);
      state.calls.push({ path: 'fn/' + name, body });
      return json(route, opts.fn?.[name] ?? {});
    }
    if (path.startsWith('/auth/v1/user')) return json(route, STAFF_USER);
    if (path.startsWith('/auth/v1/')) return json(route, {});
    if (path.startsWith('/storage/v1/')) return json(route, { Key: 'media/x' });
    return json(route, {}, 404);
  });
  return state;
}

export const STAFF_USER = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'admin@e2e.test', app_metadata: {}, user_metadata: {}, created_at: '2026-10-01T00:00:00Z' };

/** Store a signed-in session for the fake project (supabase-js reads it from localStorage). */
export async function signedIn(page: Page) {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: STAFF_USER.id, exp, role: 'authenticated', email: STAFF_USER.email })}.sig`;
  const session = { access_token: token, refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600, expires_at: exp, user: STAFF_USER };
  await page.addInitScript((s) => localStorage.setItem('sb-e2e-auth-token', s), JSON.stringify(session));
}
