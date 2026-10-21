/**
 * Accounts (optional — the whole app works signed out). Email + password or a one-time email
 * link via Supabase Auth; sessions are stored on the device. Account deletion goes through an
 * Edge Function that removes the user server-side (service key never leaves the server).
 */
import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { z } from 'zod';

import { backendConfigured, SITE_URL, supabase } from './supabase';

export const EmailSchema = z.string().trim().email('البريد الإلكتروني غير صحيح');
export const PasswordSchema = z.string().min(8, 'كلمة المرور 8 أحرف على الأقل');

export function useSession(): { session: Session | null; ready: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, ready };
}

type Result = { ok: true; message?: string } | { ok: false; error: string };

const UNAVAILABLE: Result = { ok: false, error: 'الحسابات غير مفعّلة في هذه النسخة بعد (لم يُضبط الخادم).' };

function arabicError(msg: string): string {
  if (/invalid login/i.test(msg)) return 'البريد أو كلمة المرور غير صحيحة.';
  if (/already registered|already exists/i.test(msg)) return 'هذا البريد مسجّل مسبقًا. سجّل الدخول بدلًا من ذلك.';
  if (/rate limit|too many/i.test(msg)) return 'محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة.';
  if (/network|fetch/i.test(msg)) return 'تعذّر الاتصال بالخادم. تحقّق من الاتصال.';
  return 'تعذّر إتمام العملية. حاول مرة أخرى.';
}

const redirectTo = Platform.OS === 'web' ? `${typeof window !== 'undefined' ? window.location.origin : SITE_URL}/auth/sign-in` : 'baseerah://auth/sign-in';

export async function signIn(email: string, password: string): Promise<Result> {
  if (!supabase) return UNAVAILABLE;
  const { error } = await supabase.auth.signInWithPassword({ email: EmailSchema.parse(email), password });
  return error ? { ok: false, error: arabicError(error.message) } : { ok: true };
}

export async function signUp(email: string, password: string, name: string): Promise<Result> {
  if (!supabase) return UNAVAILABLE;
  const { data, error } = await supabase.auth.signUp({
    email: EmailSchema.parse(email),
    password: PasswordSchema.parse(password),
    options: { data: { display_name: name }, emailRedirectTo: redirectTo },
  });
  if (error) return { ok: false, error: arabicError(error.message) };
  return { ok: true, message: data.session ? undefined : 'أرسلنا رسالة تأكيد إلى بريدك. افتحها لتفعيل الحساب.' };
}

export async function sendMagicLink(email: string): Promise<Result> {
  if (!supabase) return UNAVAILABLE;
  const { error } = await supabase.auth.signInWithOtp({ email: EmailSchema.parse(email), options: { emailRedirectTo: redirectTo } });
  return error ? { ok: false, error: arabicError(error.message) } : { ok: true, message: 'أرسلنا رابط الدخول إلى بريدك.' };
}

export async function sendPasswordReset(email: string): Promise<Result> {
  if (!supabase) return UNAVAILABLE;
  const { error } = await supabase.auth.resetPasswordForEmail(EmailSchema.parse(email), { redirectTo });
  return error ? { ok: false, error: arabicError(error.message) } : { ok: true, message: 'أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك.' };
}

export async function updatePassword(password: string): Promise<Result> {
  if (!supabase) return UNAVAILABLE;
  const { error } = await supabase.auth.updateUser({ password: PasswordSchema.parse(password) });
  return error ? { ok: false, error: arabicError(error.message) } : { ok: true, message: 'تم تغيير كلمة المرور.' };
}

export async function signOut(scope: 'local' | 'others' = 'local'): Promise<Result> {
  if (!supabase) return UNAVAILABLE;
  const { error } = await supabase.auth.signOut({ scope });
  return error ? { ok: false, error: arabicError(error.message) } : { ok: true, message: scope === 'others' ? 'سُجّل الخروج من الأجهزة الأخرى.' : undefined };
}

export async function deleteAccount(): Promise<Result> {
  if (!supabase) return UNAVAILABLE;
  const { error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) return { ok: false, error: arabicError(error.message) };
  await supabase.auth.signOut({ scope: 'local' });
  return { ok: true, message: 'حُذف حسابك وبياناتك من الخادم.' };
}

export { backendConfigured };
