// Renders the Baseerah logo (welcome-screen geometry, 132px box) into the app icon set.
// Usage: node tools/make-icons.mjs
import { chromium } from '@playwright/test';

const PC = '#145C4B';
const GC = '#C4A66A';
const IV = '#FAF8F2';

function logo(size, { pc = PC, gc = GC, ivory = IV, mono = false } = {}) {
  const k = size / 132;
  const sq = (x, s, bg, rot) =>
    `<div style="position:absolute;left:${x * k}px;top:${x * k}px;width:${s * k}px;height:${s * k}px;background:${bg};${rot ? 'transform:rotate(45deg);' : ''}"></div>`;
  if (mono) {
    // Single-colour silhouette for Android themed icons.
    return `<div style="position:relative;width:${size}px;height:${size}px">${sq(18, 96, '#fff', false)}${sq(18, 96, '#fff', true)}${sq(39, 54, 'transparent', false)}</div>`;
  }
  return `<div style="position:relative;width:${size}px;height:${size}px">
    ${sq(18, 96, gc, false)}${sq(18, 96, gc, true)}${sq(26, 80, pc, false)}${sq(26, 80, pc, true)}
    ${sq(35, 62, gc, false)}${sq(35, 62, gc, true)}${sq(39, 54, pc, false)}${sq(39, 54, pc, true)}
    <div style="position:absolute;left:${46 * k}px;top:${46 * k}px;width:${40 * k}px;height:${40 * k}px;border-radius:50%;background:${ivory}"></div>
    <div style="position:absolute;left:${55 * k}px;top:${42 * k}px;width:${36 * k}px;height:${36 * k}px;border-radius:50%;background:${pc}"></div>
    <div style="position:absolute;left:${78 * k}px;top:${52 * k}px;width:${10 * k}px;height:${10 * k}px;background:${gc};transform:rotate(45deg)"></div>
  </div>`;
}

const page = (size, bg, inner, logoSize) =>
  `<html><body style="margin:0;width:${size}px;height:${size}px;background:${bg};display:flex;align-items:center;justify-content:center">${inner(logoSize)}</body></html>`;

const JOBS = [
  { file: 'assets/images/icon.png', size: 1024, bg: PC, logo: (s) => logo(s), logoSize: 720 },
  { file: 'assets/images/android-icon-foreground.png', size: 1024, bg: 'transparent', logo: (s) => logo(s), logoSize: 600 },
  { file: 'assets/images/android-icon-background.png', size: 1024, bg: PC, logo: () => '', logoSize: 0 },
  { file: 'assets/images/android-icon-monochrome.png', size: 1024, bg: 'transparent', logo: (s) => logo(s, { mono: true }), logoSize: 600 },
  { file: 'assets/images/splash-icon.png', size: 1024, bg: 'transparent', logo: (s) => logo(s), logoSize: 1024 },
  { file: 'assets/images/favicon.png', size: 48, bg: PC, logo: (s) => logo(s), logoSize: 40 },
];

const browser = await chromium.launch();
for (const j of JOBS) {
  const p = await browser.newPage({ viewport: { width: j.size, height: j.size } });
  await p.setContent(page(j.size, j.bg, j.logo, j.logoSize));
  await p.screenshot({ path: j.file, omitBackground: j.bg === 'transparent' });
  await p.close();
  console.log('wrote', j.file);
}
await browser.close();
