// Visual smoke test: visits every route at a given viewport, saves screenshots and collects
// console / page errors. Usage: node tools/shots.mjs [baseUrl] [width] [height] [outDir] [routes...]
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , base = 'http://localhost:8081', w = '390', h = '844', out = 'test-results/shots', ...only] = process.argv;
export const ROUTES = [
  '/', '/academy', '/academy/subject/aqeedah', '/academy/subject/fiqh', '/academy/lesson/AQ-01', '/academy/lesson/AQ-02', '/academy/locked/2', '/academy/map',
  '/lesson/AQ-01/quiz', '/lesson/AQ-01/result', '/lesson/AQ-01/answers', '/khushu/AQ-01',
  '/quran', '/quran/tajweed', '/reader/1', '/reader/2', '/coach/1', '/drill',
  '/library', '/library/folder/books-0', '/book/demo-b-0-1', '/player/demo-a-0-1',
  '/account', '/account/notebook', '/account/memorized', '/account/certificates', '/account/settings', '/account/settings/reciter', '/account/settings/supervision', '/account/settings/privacy', '/account/settings/funding', '/account/settings/contact',
  '/prayer', '/prayer/adhkar/morning', '/prayer/qibla', '/prayer/kaaba', '/hijri', '/paths', '/paths/ramadan', '/stories', '/stories/prophets/0', '/sharia', '/sharia/0/1', '/quotes', '/plan', '/review',
  '/welcome', '/auth/sign-in', '/auth/password', '/verify/TEST-CODE', '/does-not-exist',
];
const routes = only.length ? only : ROUTES;
mkdirSync(out, { recursive: true });
const state = { state: { onboarded: true, introSeen: true, location: { lat: 21.4225, lon: 39.8262, label: 'مكة المكرمة', at: 0, source: 'manual' } }, version: 1 };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, locale: 'ar', deviceScaleFactor: 1 });
await ctx.addInitScript((s) => localStorage.setItem('baseerah.app.v1', s), JSON.stringify(state));
const report = [];
for (const r of routes) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text().slice(0, 300)));
  const t0 = Date.now();
  try {
    await page.goto(base + r, { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForFunction(() => !document.body.innerText.includes('Bundling'), null, { timeout: 120000 });
    await page.waitForTimeout(1200);
  } catch (e) {
    errors.push('nav: ' + e.message.split('\n')[0]);
  }
  const name = r === '/' ? 'home' : r.slice(1).replace(/[\/]/g, '_');
  await page.screenshot({ path: join(out, `${name}.png`), fullPage: false });
  const dir = await page.evaluate(() => getComputedStyle(document.body).direction);
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  report.push({ route: r, ms: Date.now() - t0, dir, overflowX, errors });
  console.log(`${errors.length ? 'ERR' : 'ok '} ${r} ${errors.length ? JSON.stringify(errors).slice(0, 400) : ''}`);
  await page.close();
}
writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();
