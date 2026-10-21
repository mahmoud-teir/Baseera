/// <reference types="node" />
import { readFileSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import { backend, EVIDENCE, KEY as FIXTURE_ANSWERS, LESSONS } from './backend';

/** Exact Tanzil text of Al-Fatiha 1:2, read from the shipped asset (verbatim codepoints). */
const FATIHA_2 = readFileSync('assets/quran/quran-uthmani.txt', 'utf8').split(/\r?\n/)[1].split('|')[2];

const KEY = 'baseerah.app.v1';
const AQ_ANSWERS = FIXTURE_ANSWERS;

// Every test talks to the fake backend; by default nothing is published.
test.beforeEach(async ({ page }) => {
  await backend(page, { fn: { 'submit-report': { id: 42 } } });
});
const withLessons = (page: Page) => backend(page, { rows: [...LESSONS, EVIDENCE], fn: { 'submit-report': { id: 42 } } });
const LETTERS = ['أ', 'ب', 'ج', 'د'];

async function onboarded(page: Page, extra: Record<string, unknown> = {}) {
  await page.addInitScript(
    ([k, v]) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem(k, v);
        sessionStorage.setItem('seeded', '1');
      }
    },
    [KEY, JSON.stringify({ state: { onboarded: true, introSeen: true, ...extra }, version: 1 })] as const,
  );
}

/** Navigate and wait until the static page has hydrated (React handlers attached). */
async function open(page: Page, url: string) {
  const res = await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('[data-testid], [role], body') !== null);
  return res;
}

async function answerQuiz(page: Page, answers: number[]) {
  for (let i = 0; i < answers.length; i++) {
    await expect(page.getByText(`السؤال ${i + 1} من ${answers.length}`)).toBeVisible();
    await page.getByRole('radio', { name: new RegExp(`^${LETTERS[answers[i]]}:`) }).click();
    await page.getByRole('button', { name: i === answers.length - 1 ? 'إنهاء الاختبار' : 'التالي', exact: true }).click();
  }
}

test('first visit shows the welcome screen; «ابدأ رحلتك» opens the home screen', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByRole('heading', { name: 'بصيرة' })).toBeVisible();
  await page.getByRole('button', { name: 'ابدأ رحلتك' }).click();
  await expect(page.getByText('أهلًا بك يا طالب العلم')).toBeVisible();
});

test('the intro film plays on first launch and can be skipped', async ({ page }) => {
  await page.goto('/welcome');
  const skip = page.getByRole('button', { name: 'تخطّي الفيديو التعريفي' });
  await expect(skip).toBeVisible();
  await skip.click();
  await expect(skip).toBeHidden();
  await expect(page.getByRole('button', { name: 'ابدأ رحلتك' })).toBeVisible();
});

test('document is Arabic and right-to-left', async ({ page }) => {
  await onboarded(page);
  await page.goto('/academy');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.getByRole('heading', { name: 'الأكاديمية الإسلامية' })).toBeVisible();
});

test('passing a quiz at ≥85% unlocks the next lesson (HANDOFF §7)', async ({ page }) => {
  await onboarded(page);
  await withLessons(page);
  await page.goto('/academy/subject/aqeedah');
  await expect(page.getByRole('button', { name: /AQ-02 .* مقفل/ })).toBeDisabled();
  await page.getByRole('button', { name: /AQ-01 .* ابدأ/ }).click();
  await page.getByRole('button', { name: /ابدأ الاختبار/ }).click();
  await answerQuiz(page, AQ_ANSWERS);
  await expect(page.getByText('أحسنت، لقد نجحت')).toBeVisible();
  await expect(page.getByText('100%')).toBeVisible();
  await page.getByRole('button', { name: 'فتح الدرس التالي · AQ-02' }).click();
  await expect(page).toHaveURL(/\/academy\/lesson\/AQ-02$/);
  await expect(page.getByRole('heading', { name: 'درس اختبار 2' })).toBeVisible();
});

test('failing a quiz offers a retry and answer review with explanations', async ({ page }) => {
  await onboarded(page);
  await withLessons(page);
  await page.goto('/academy/lesson/AQ-01');
  await page.getByRole('button', { name: /ابدأ الاختبار/ }).click();
  await answerQuiz(page, AQ_ANSWERS.map((a) => (a + 1) % 4));
  await expect(page.getByText('لم تبلغ النسبة المطلوبة')).toBeVisible();
  await page.getByRole('button', { name: 'مراجعة الإجابات' }).click();
  await expect(page.getByText('0 صحيحة')).toBeVisible();
  await expect(page.getByText('8 خاطئة')).toBeVisible();
  await page.getByRole('button', { name: 'أعد الاختبار' }).click();
  await expect(page.getByText('السؤال 1 من 8')).toBeVisible();
});

test('a locked lesson cannot be opened directly', async ({ page }) => {
  await onboarded(page);
  await withLessons(page);
  await page.goto('/academy/lesson/AQ-05');
  await expect(page.getByRole('heading', { name: 'هذا الدرس مقفل' })).toBeVisible();
});

test('report sheet requires a reason and confirms the report', async ({ page }) => {
  await onboarded(page);
  await withLessons(page);
  await page.goto('/academy/lesson/AQ-01');
  await page.getByRole('button', { name: 'أبلغ عن خطأ · الدرس AQ-01 · الشرح' }).click();
  const dialog = page.getByRole('dialog', { name: 'أبلغ عن خطأ' });
  await expect(dialog.getByText('الموضع: الدرس AQ-01 · الشرح')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'إرسال البلاغ' })).toBeDisabled();
  await dialog.getByRole('radio', { name: 'خطأ إملائي أو لغوي' }).click();
  await dialog.getByLabel('ملاحظة البلاغ').fill('اختبار آلي');
  await dialog.getByRole('button', { name: 'إرسال البلاغ' }).click();
  await expect(page.getByRole('status')).toContainText(/بلاغك/);
});

test('evidence chain sheet shows the published source and the reliability levels', async ({ page }) => {
  await onboarded(page);
  await withLessons(page);
  await page.goto('/academy/lesson/AQ-01');
  await page.getByRole('button', { name: 'اعرف الدليل · الدرس AQ-01 · آية' }).click();
  const sheet = page.getByRole('dialog', { name: 'سلسلة الدليل' });
  await expect(sheet.getByText('مستوى الاعتماد العلمي')).toBeVisible();
  await expect(sheet.getByText(/مصدر الاختبار/).first()).toBeVisible();
  await expect(sheet.getByText('لم يُصنَّف بعد — لا يُعرض كحقيقة قطعية.')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
});

test('tab bar on phones, side rail on tablets and desktop', async ({ page }, info) => {
  await onboarded(page);
  await page.goto('/');
  const tabs = page.getByRole('tab', { name: 'الأكاديمية' });
  await expect(tabs).toBeVisible();
  await expect(page.getByRole('tab', { name: 'الرئيسية' })).toBeVisible();
  await expect.poll(async () => (await page.getByRole('tablist').boundingBox()) !== null).toBe(true);
  const list = (await page.getByRole('tablist').boundingBox())!;
  const box = (await page.getByRole('tab', { name: 'الرئيسية' }).boundingBox()) ?? list;
  const vw = page.viewportSize()!.width;
  if (info.project.name === 'phone') {
    expect(box.y).toBeGreaterThan(page.viewportSize()!.height - 120); // bottom bar
    expect(box.x).toBeGreaterThan(vw / 2); // first tab on the right (RTL)
  } else {
    expect(list.x).toBeGreaterThan(vw - 160); // side rail on the start (right) side
    expect(list.height).toBeGreaterThan(page.viewportSize()!.height - 10);
  }
});

test('browser history: back and forward between routes', async ({ page }) => {
  await onboarded(page);
  await page.goto('/');
  await page.getByRole('tab', { name: 'الأكاديمية' }).click();
  await expect(page).toHaveURL(/\/academy$/);
  await page.getByRole('button', { name: /العقيدة والتوحيد ·/ }).click();
  await expect(page).toHaveURL(/\/academy\/subject\/aqeedah$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/academy$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/academy\/subject\/aqeedah$/);
});

test('direct loads of deep routes work and unknown routes show the 404 page', async ({ page }) => {
  await onboarded(page);
  for (const [url, text] of [
    ['/reader/2', 'سورة البقرة'],
    ['/stories/prophets/5', 'النبي إبراهيم'],
    ['/paths/hajj', 'مناسك الحج والعمرة'],
    ['/sharia/0/1', 'الصلاة'],
    ['/account/settings', 'الإعدادات'],
  ]) {
    await page.goto(url);
    await expect(page.getByRole('heading', { name: text }).first()).toBeVisible();
  }
  const res = await page.goto('/no-such-page');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'الصفحة غير موجودة' })).toBeVisible();
});

test('Quran reader shows the verified Uthmani text with Tanzil attribution', async ({ page }) => {
  await onboarded(page);
  await page.goto('/reader/1');
  await expect(page.getByRole('button', { name: 'الآية 2' })).toContainText(FATIHA_2);
  await expect(page.getByText(/مشروع تنزيل/)).toBeAttached();
  await page.getByRole('button', { name: 'الآية 2' }).click();
  await expect(page.getByRole('dialog', { name: 'الآية 2' })).toBeVisible();
});

test('dark mode and font size persist across reloads', async ({ page }) => {
  await onboarded(page);
  await page.goto('/account/settings');
  await page.getByRole('switch', { name: /المظهر/ }).click();
  await page.getByRole('switch', { name: /حجم الخط/ }).click();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByRole('switch', { name: 'المظهر: ليلي' })).toBeVisible();
  await expect(page.getByRole('switch', { name: 'حجم الخط: كبير' })).toBeVisible();
});

test('notebook: add and delete a note', async ({ page }) => {
  await onboarded(page);
  await open(page, '/account/notebook');
  await page.getByLabel('فائدة جديدة').fill('فائدة للاختبار');
  await page.getByRole('button', { name: 'إضافة' }).click();
  await expect(page.getByText('فائدة للاختبار')).toBeVisible();
  await page.getByRole('button', { name: 'حذف الفائدة' }).click();
  await expect(page.getByText('دفترك فارغ')).toBeVisible();
});

test('keyboard: Tab reaches controls and Enter activates them', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/welcome');
  const cta = page.getByRole('button', { name: 'ابدأ رحلتك' });
  for (let i = 0; i < 6 && !(await cta.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(cta).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText('أهلًا بك يا طالب العلم')).toBeVisible();
});

test('prayer screen asks for a location instead of showing fake times', async ({ page }) => {
  await onboarded(page);
  await page.goto('/prayer');
  await expect(page.getByText('حدّد موقعك لحساب المواقيت والقبلة')).toBeVisible();
  await page.getByRole('button', { name: 'اختر مدينة' }).click();
  await page.getByRole('button', { name: 'القاهرة، مصر' }).click();
  await expect(page.getByText('الصلاة القادمة')).toBeVisible();
  await expect(page.getByText(/حسب القاهرة/)).toBeVisible();
});

test('Hijri calendar shows the current Umm al-Qura month', async ({ page }) => {
  await onboarded(page);
  await page.goto('/hijri');
  await expect(page.getByText(/14\d\d$/).first()).toBeVisible();
  await page.getByRole('button', { name: 'الشهر التالي' }).click();
  await expect(page.getByText('المواسم')).toBeVisible();
});

test('no horizontal overflow on key screens', async ({ page }) => {
  await onboarded(page);
  for (const url of ['/', '/academy', '/quran', '/library', '/account', '/prayer', '/academy/map']) {
    await page.goto(url);
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow, url).toBe(false);
  }
});
