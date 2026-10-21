/// <reference types="node" />
import { expect, test, type Page } from '@playwright/test';

import { backend, signedIn, type Backend } from './backend';

/**
 * Baseerah Console (`/admin`) against the fake Supabase project. Every change must reach the server
 * as the matching RPC; the fixtures below exist only in this test.
 */
const now = new Date().toISOString();
const CONTENT = [
  { id: 'c-ev', kind: 'evidence', slot: 'AQ-01/e1', title: 'AQ-01/e1', status: 'draft', data: { kind: 'quran', label: 'آية', text: 'نص', source: 'مصدر', ref: '' }, published_data: null, approvals: [], approver_names: [], updated_at: now },
  { id: 'c-ls', kind: 'lesson', slot: 'AQ-01', title: 'درس للمراجعة', status: 'review', data: { title: 'درس للمراجعة', minutes: 10, objectives: ['هدف'], sections: [{ heading: 'الشرح', body: 'نص' }], summary: [], quiz: { passPct: 85, questions: [] } }, published_data: null, approvals: ['x'], approver_names: ['مراجع أول'], updated_at: now },
];
const REPORTS = [{ id: 7, where_text: 'الدرس AQ-01 · الشرح', reason: 'خطأ في النص', note: 'ملاحظة', status: 'fixed', created_at: now }];
const FEEDBACK = [{ id: 3, message: 'رسالة من متعلم', contact: null, status: 'new', created_at: now }];
const OVERVIEW = { evidence_review: 0, open_reports: 1, lessons_review: 1, active_learners: 0, completion: 0, avg_score: null, weekly: [0, 0, 0, 0, 0, 0, 0], pipeline: [1, 1, 0] };

async function staff(page: Page, role = 'admin'): Promise<Backend> {
  await signedIn(page);
  return backend(page, {
    tables: { content_items: CONTENT, reports: REPORTS, feedback: FEEDBACK, profiles: [{ id: '00000000-0000-4000-8000-000000000001', display_name: 'مدير الاختبار' }], audit_log: [], app_config: [], reviewers: [] },
    rpc: {
      staff_role: role,
      admin_overview: OVERVIEW,
      admin_list_staff: [{ user_id: 'u1', email: 'admin@e2e.test', display_name: 'مدير الاختبار', role: 'admin' }],
      admin_learner_stats: [],
      admin_certificates: [],
      admin_transition: 'review',
      admin_save_draft: 'new-id',
      admin_content: CONTENT,
    },
    fn: { 'notify-reporter': { sent: 0 } },
  });
}

async function open(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await expect(page.getByText('Baseerah Console')).toBeVisible();
}

const rpcBody = (b: Backend, name: string) => b.calls.filter((c) => c.path === 'rpc/' + name).map((c) => c.body as Record<string, unknown>);

test('signed out: the console asks for a staff sign-in and shows no data', async ({ page }) => {
  await backend(page);
  await page.goto('/admin/queue', { waitUntil: 'networkidle' });
  await expect(page.getByText('Staff sign-in required')).toBeVisible();
});

test('no staff role: access is refused', async ({ page }) => {
  await signedIn(page);
  await backend(page, { rpc: { staff_role: null } });
  await page.goto('/admin/queue', { waitUntil: 'networkidle' });
  await expect(page.getByText('No console access')).toBeVisible();
});

test('queue shows live items without any sample banner; sending to a scholar calls the workflow RPC', async ({ page }) => {
  const b = await staff(page);
  await open(page, '/admin/queue');
  await expect(page.getByText('MOCK')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Alerts · 3' })).toBeVisible();
  await page.getByRole('button', { name: 'AQ-01/e1' }).click();
  await page.getByRole('button', { name: 'Send to scholar' }).click();
  await expect.poll(() => rpcBody(b, 'admin_transition')).toContainEqual({ p_kind: 'ct', p_id: 'c-ev', p_action: 'send' });
});

test('lessons need a second, different scholar: the approve button names the signed-in reviewer', async ({ page }) => {
  const b = await staff(page);
  await open(page, '/admin/queue');
  await page.getByRole('button', { name: 'درس للمراجعة' }).click();
  await page.getByRole('button', { name: 'Approve as مدير الاختبار' }).click();
  await expect.poll(() => rpcBody(b, 'admin_transition')).toContainEqual({ p_kind: 'ct', p_id: 'c-ls', p_action: 'approve' });
});

test('lesson editor saves a draft for an empty curriculum slot', async ({ page }) => {
  const b = await staff(page);
  await open(page, '/admin/lessons');
  await page.getByRole('button', { name: /^AQ-03/ }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('عنوان درس جديد');
  await page.getByRole('button', { name: 'Add · Objectives' }).click();
  await page.getByRole('textbox', { name: 'Objectives 1' }).fill('هدف جديد');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect.poll(() => rpcBody(b, 'admin_save_draft')[0]).toMatchObject({ p_kind: 'lesson', p_slot: 'AQ-03', p_data: { title: 'عنوان درس جديد', objectives: ['هدف جديد'] } });
});

test('catalog: adhkar are written with text, source and count', async ({ page }) => {
  const b = await staff(page);
  await open(page, '/admin/catalog');
  await page.getByRole('button', { name: 'Adhkar', exact: true }).click();
  await page.getByRole('button', { name: 'أذكار الصباح' }).click();
  await page.getByRole('button', { name: 'Add · Adhkar' }).click();
  await page.getByRole('textbox', { name: 'Verified text' }).fill('نص ذكر');
  await page.getByRole('textbox', { name: 'Source' }).fill('مصدر الذكر');
  await page.getByRole('textbox', { name: 'Repetitions' }).fill('3');
  await page.getByRole('button', { name: 'Save draft' }).click();
  const sent = await expect.poll(() => rpcBody(b, 'admin_save_draft').length).toBe(1);
  void sent;
  const body = rpcBody(b, 'admin_save_draft')[0];
  expect(body).toMatchObject({ p_kind: 'adhkar', p_slot: 'morning' });
  expect((body.p_data as { items: Record<string, unknown>[] }).items[0]).toMatchObject({ text: 'نص ذكر', source: 'مصدر الذكر', count: 3 });
});

test('reports: «Notify learner» runs the transition and sends the push', async ({ page }) => {
  const b = await staff(page);
  await open(page, '/admin/reports');
  await page.getByRole('button', { name: 'الدرس AQ-01 · الشرح' }).click();
  await page.getByRole('button', { name: 'Notify learner' }).click();
  await expect.poll(() => rpcBody(b, 'admin_transition')).toContainEqual({ p_kind: 'rp', p_id: '7', p_action: 'notify' });
  await expect.poll(() => b.calls.some((c) => c.path === 'fn/notify-reporter')).toBe(true);
});

test('team, feedback and prayer defaults go through admin RPCs', async ({ page }) => {
  const b = await staff(page);
  await open(page, '/admin/roles');
  await page.getByRole('textbox', { name: 'Email' }).fill('scholar@e2e.test');
  await page.locator('select[aria-label="Role"]').selectOption('scholar');
  await page.getByRole('button', { name: 'Add or change' }).click();
  await expect.poll(() => rpcBody(b, 'admin_set_staff')).toContainEqual({ p_email: 'scholar@e2e.test', p_role: 'scholar' });

  await open(page, '/admin/inbox');
  await expect(page.getByText('رسالة من متعلم')).toBeVisible();
  await page.getByRole('button', { name: 'Mark done' }).click();
  await expect.poll(() => rpcBody(b, 'admin_feedback_mark')).toContainEqual({ p_id: 3, p_status: 'done' });

  await open(page, '/admin/prayer');
  await page.locator('select[aria-label="Calculation method"]').selectOption('Umm al-Qura');
  await expect.poll(() => rpcBody(b, 'admin_save_config')[0]).toMatchObject({ p_key: 'prayer', p_value: { method: 'Umm al-Qura' } });
});

test('roles below admin cannot preview other roles or see admin views', async ({ page }) => {
  await staff(page, 'mod');
  await open(page, '/admin/prayer');
  await expect(page).toHaveURL(/\/admin\/queue$/);
  await expect(page.getByRole('tab', { name: 'System' })).toHaveCount(0);
  await expect(page.locator('select').first()).toBeDisabled();
});

test('Arabic switches the console to RTL', async ({ page }) => {
  await staff(page);
  await open(page, '/admin/queue');
  await page.getByRole('button', { name: 'العربية' }).click();
  const h = page.getByRole('heading', { name: 'قائمة العمل' });
  await expect(h).toBeVisible();
  expect(await h.evaluate((el) => getComputedStyle(el).direction)).toBe('rtl');
});

test('⌘K search jumps to a view; Escape closes it', async ({ page }) => {
  await staff(page);
  await open(page, '/admin/queue');
  await page.keyboard.press('Control+k');
  const q = page.getByPlaceholder('Jump to a screen or item…');
  await expect(q).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(q).toHaveCount(0);
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder('Jump to a screen or item…').fill('catalog');
  await page.getByRole('button', { name: 'Content catalog' }).last().click();
  await expect(page).toHaveURL(/\/admin\/catalog$/);
});

test('console has no horizontal overflow', async ({ page }) => {
  await staff(page);
  for (const v of ['queue', 'overview', 'lessons', 'catalog', 'roles', 'prayer']) {
    await open(page, '/admin/' + v);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over, v).toBeLessThanOrEqual(0);
  }
});
