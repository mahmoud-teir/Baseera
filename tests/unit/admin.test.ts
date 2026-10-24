import { auditText, errorText, forwardAction, useAdmin, type Item } from '@/features/admin/store';
import { MATRIX, ROLES, S, VIEWS } from '@/features/admin/strings';
import { allowed, chipFor, isPending } from '@/features/admin/logic';
import { toCsv } from '@/features/admin/download';
import { toHijri } from '@/services/hijri';
import { dstMinutes, prayerTimesFor } from '@/services/prayer';
import { useApp } from '@/state/app-store';
import { PRAYER_CONFIG_DEFAULTS, useConfig } from '@/state/config-store';

const MAKKAH = { lat: 21.4225, lon: 39.8262 };
const OSLO = { lat: 59.91, lon: 10.75 };
const S0 = { calc: 'رابطة العالم الإسلامي', asr: 'الجمهور', adj: '0' };

afterEach(() => {
  useConfig.setState({ prayer: PRAYER_CONFIG_DEFAULTS });
  useApp.setState({ sv: {} });
});

describe('console: roles and permissions (design matrix = SQL has_perm)', () => {
  it('admin can do everything; each other role has exactly its column', () => {
    expect(MATRIX.admin.every(Boolean)).toBe(true);
    expect(ROLES.map((r) => MATRIX[r].reduce((a, b) => a + b, 0))).toEqual([2, 2, 2, 2, 6]);
  });
  it('workflow buttons follow the matrix', () => {
    expect(allowed('content', 'ev', 'send')).toBe(true);
    expect(allowed('content', 'ev', 'approve')).toBe(false);
    expect(allowed('scholar', 'ev', 'approve')).toBe(true);
    expect(allowed('scholar', 'ls', 'approve')).toBe(true);
    expect(allowed('scholar', 'rp', 'triage')).toBe(false);
    expect(allowed('mod', 'rp', 'notify')).toBe(true);
  });
  it('view access per role matches the design', () => {
    const views = (r: (typeof ROLES)[number]) => VIEWS.filter((v) => v.roles.includes(r)).map((v) => v.id);
    expect(views('mod')).toEqual(['queue', 'reports', 'inbox']);
    expect(views('scholar')).toEqual(['queue', 'evidence', 'catalog', 'library', 'scholars']);
    expect(views('admin')).toHaveLength(14);
  });
});

describe('console: live data only', () => {
  it('without a configured backend it reports «not connected» and holds no items', async () => {
    useAdmin.setState({ status: 'idle', items: [] });
    await useAdmin.getState().load(true);
    expect(useAdmin.getState().status).toBe('unconfigured');
    expect(useAdmin.getState().items).toHaveLength(0);
    expect(await useAdmin.getState().verifyCert('BSR-0001')).toBe(false);
  });
  const item = (p: Partial<Item>): Item => ({ id: 'ct:x', ref: 'x', kind: 'ct', ckind: 'quote', slot: 'q1', title: 't', meta: '', stage: 0, rej: false, live: false, ap: [], apMine: false, data: {}, published: null, fields: {}, ...p });
  it('«Advance» moves drafts to review and single-approval items to published, never lessons in review', () => {
    expect(forwardAction(item({ stage: 0 }))).toBe('send');
    expect(forwardAction(item({ stage: 1 }))).toBe('approve');
    expect(forwardAction(item({ kind: 'ls', ckind: 'lesson', stage: 1 }))).toBeNull();
    expect(forwardAction(item({ kind: 'rp', ckind: null, stage: 2 }))).toBe('notify');
    expect(forwardAction(item({ rej: true }))).toBeNull();
  });
  it('status chips and pending state', () => {
    expect(chipFor('en', item({ stage: 2 }))).toEqual({ label: 'Approved', tone: 'ok' });
    expect(chipFor('ar', item({ kind: 'ls', ckind: 'lesson', stage: 1 })).label).toBe('قيد المراجعة');
    expect(isPending(item({ stage: 2 }))).toBe(false);
  });
  it('server error codes are explained', () => {
    expect(errorText('en', 'source_required')).toBe('every text needs its source first');
    expect(errorText('ar', 'last_admin')).toBe('يجب أن يبقى مدير واحد على الأقل');
  });
});


