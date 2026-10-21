/// <reference types="node" />
import { expect, test, type Page } from '@playwright/test';

import { backend, LESSONS, type Row } from './backend';

/**
 * The app shows only what the console has published. With nothing published every slot says it is
 * pending; with published rows (test fixtures defined here) each screen shows them.
 */
async function onboarded(page: Page) {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('baseerah.app.v1', JSON.stringify({ state: { onboarded: true, introSeen: true }, version: 2 }));
      sessionStorage.setItem('seeded', '1');
    }
  });
}

test.describe('nothing published yet', () => {
  test.beforeEach(async ({ page }) => {
    await onboarded(page);
    await backend(page);
  });

  test('academy, lessons and quotes say they are pending — no sample text', async ({ page }) => {
    await page.goto('/academy', { waitUntil: 'networkidle' });
    await expect(page.getByText('المحتوى قيد الإعداد').first()).toBeVisible();
    await page.goto('/academy/lesson/AQ-01', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'الدرس لم يُنشر بعد' })).toBeVisible();
    await page.goto('/quotes', { waitUntil: 'networkidle' });
    await expect(page.getByText(/لا توجد أقوال منشورة بعد/)).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/تجريبي|Lorem|sample/i);
  });

  test('adhkar, stories, encyclopedia, paths and funding show pending slots', async ({ page }) => {
    for (const [url, text] of [
      ['/prayer/adhkar/morning', /تُدرج هنا من مصدر موثّق/],
      ['/stories/prophets/0', /يُدرج هنا بعد المراجعة العلمية/],
      ['/sharia/0/0', /يُدرج هنا بعد المراجعة العلمية/],
      ['/paths/ramadan', /خطوات هذا المسار تُدرج/],
      ['/account/settings/funding', /تُنشر هنا البيانات المعتمدة/],
      ['/drill', /مقاطع التدريب تُضاف/],
    ] as const) {
      await page.goto(url, { waitUntil: 'networkidle' });
      await expect(page.getByText(text).first()).toBeVisible();
    }
  });

  test('the library has no demo books', async ({ page }) => {
    await page.goto('/library', { waitUntil: 'networkidle' });
    await expect(page.getByText(/كتاب تجريبي|تسجيل تجريبي/)).toHaveCount(0);
  });
});

test.describe('published content', () => {
  const rows: Row[] = [
    ...LESSONS.slice(0, 2),
    { id: 'q1', kind: 'quote', slot: 'q-1', data: { cat: 'العقيدة', text: 'نص قول الاختبار', scholar: 'عالم الاختبار', source: 'كتاب الاختبار ١/٢' } },
    { id: 'a1', kind: 'adhkar', slot: 'morning', data: { items: [{ id: 'm1', text: 'نص ذكر الاختبار', count: 3, source: 'تخريج الاختبار' }] } },
    { id: 's1', kind: 'story', slot: 'prophets/0', data: { sections: { 'نسبه وزمنه': { text: 'نص سيرة الاختبار', source: 'مصدر السيرة' } } } },
    { id: 'p1', kind: 'path', slot: 'ramadan', data: { minutes: 30, steps: [{ kind: 'درس', title: 'خطوة الاختبار', target: '/academy/lesson/AQ-01' }] } },
    { id: 'f1', kind: 'page', slot: 'funding', data: { sections: [{ heading: 'مصادر التمويل', body: 'نص تمويل الاختبار' }] } },
    { id: 'b1', kind: 'book', slot: 'b-1', data: { title: 'كتاب الاختبار', category: 'العقيدة', author: 'مؤلف', source: 'دار النشر', chapters: [{ title: 'الفصل الأول', paragraphs: ['فقرة الاختبار'] }] } },
    { id: 't1', kind: 'tafsir', slot: '1', data: { tafsir: 'تفسير الاختبار', source: 'طبعة الاختبار', ayahs: { 1: 'نص تفسير الآية الأولى' } } },
  ];
  test.beforeEach(async ({ page }) => {
    await onboarded(page);
    await backend(page, { rows });
  });

  test('home and quotes show the published quote with its source', async ({ page }) => {
    await page.goto('/quotes', { waitUntil: 'networkidle' });
    await expect(page.getByText('نص قول الاختبار').first()).toBeVisible();
    await expect(page.getByText('كتاب الاختبار ١/٢').first()).toBeVisible();
  });

  test('the academy lists published lessons and their content', async ({ page }) => {
    await page.goto('/academy/lesson/AQ-01', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'درس اختبار 1' })).toBeVisible();
    await expect(page.getByText('نص شرح الاختبار')).toBeVisible();
  });

  test('adhkar count up to the published repetitions', async ({ page }) => {
    await page.goto('/prayer/adhkar/morning', { waitUntil: 'networkidle' });
    await expect(page.getByText('نص ذكر الاختبار')).toBeVisible();
    const counter = page.getByRole('button', { name: /عدّ الذكر 1: 0 من 3/ });
    await counter.click();
    await expect(page.getByRole('button', { name: /عدّ الذكر 1: 1 من 3/ })).toBeVisible();
  });

  test('paths link their steps to real screens', async ({ page }) => {
    await page.goto('/paths/ramadan', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'درس: خطوة الاختبار' }).click();
    await expect(page).toHaveURL(/\/academy\/lesson\/AQ-01$/);
  });

  test('funding page, library book and tafsir come from published content', async ({ page }) => {
    await page.goto('/account/settings/funding', { waitUntil: 'networkidle' });
    await expect(page.getByText('نص تمويل الاختبار')).toBeVisible();
    await page.goto('/library', { waitUntil: 'networkidle' });
    await page.getByPlaceholder(/ابحث/).first().fill('كتاب الاختبار');
    await expect(page.getByText('كتاب الاختبار').first()).toBeVisible();
    await page.goto('/reader/1', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'الآية 1', exact: true }).first().click();
    await expect(page.getByText('نص تفسير الآية الأولى')).toBeVisible();
  });
});
