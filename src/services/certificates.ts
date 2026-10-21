/**
 * Certificates (HANDOFF §7 «الشهادة: تُمنح بعد إتمام المرحلة، مجانية، برمز تحقق»).
 * Issued by the `issue-certificate` Edge Function, which re-checks the user's passed lessons
 * server-side before minting a verification code. Printing uses the platform print/PDF service.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { Certificate } from '@/state/app-store';

import { SITE_URL, supabase } from './supabase';

export async function issueCertificate(stage: number, name: string): Promise<{ ok: true; cert: Certificate } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'إصدار الشهادات يحتاج إلى الخادم، وهو غير مضبوط في هذه النسخة.' };
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return { ok: false, error: 'سجّل الدخول أولًا لتُصدر الشهادة باسمك ويمكن التحقق منها.' };
  const { data, error } = await supabase.functions.invoke<{ code: string; issued_at: string; name: string }>('issue-certificate', { body: { stage, name } });
  if (error || !data) return { ok: false, error: 'لم تكتمل شروط الشهادة بعد على الخادم، أو تعذّر الاتصال.' };
  return { ok: true, cert: { stage, code: data.code, name: data.name, issuedAt: data.issued_at } };
}

export function verifyUrl(code: string) {
  return `${SITE_URL}/verify/${encodeURIComponent(code)}`;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function certificateHtml(c: Certificate): string {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=IBM+Plex+Sans+Arabic:wght@400;600&display=swap" rel="stylesheet">
<style>@page{size:A4 landscape;margin:0}body{margin:0;background:#FAF8F2;font-family:'IBM Plex Sans Arabic',sans-serif;color:#182D29}
.f{margin:28px;border:2px solid #C4A66A;border-radius:18px;padding:48px;text-align:center;min-height:calc(100vh - 160px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
.d{width:44px;height:44px;border:2px solid #C4A66A;transform:rotate(45deg)}h1{font-family:Amiri,serif;font-size:44px;margin:8px 0}
.n{font-family:Amiri,serif;font-size:36px;color:#145C4B}.l{width:80px;height:2px;background:#C4A66A}.m{color:#5B6B67;font-size:16px}</style></head>
<body><div class="f"><div class="d"></div><div class="m">أكاديمية بصيرة · شهادة تعليمية مجانية</div>
<h1>شهادة إتمام المرحلة ${c.stage === 1 ? 'الأولى' : c.stage === 2 ? 'الثانية' : 'الثالثة'}</h1>
<div class="m">تُمنح لطالب العلم</div><div class="n">${esc(c.name)}</div><div class="l"></div>
<div class="m">تاريخ الإصدار: ${esc(new Date(c.issuedAt).toLocaleDateString('ar'))}</div>
<div class="m" dir="ltr">${esc(c.code)}</div><div class="m">للتحقق: ${esc(verifyUrl(c.code))}</div>
<div class="m">المحتوى تعليمي ولا يُصدر أحكامًا على الأشخاص.</div></div></body></html>`;
}

export async function exportCertificate(c: Certificate) {
  const html = certificateHtml(c);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html, width: 842, height: 595 });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'الشهادة' });
}
