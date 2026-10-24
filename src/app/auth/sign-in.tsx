/**
 * تسجيل الدخول — Step 1 «لدي حساب · تسجيل الدخول» and settings «طرق تسجيل الدخول».
 * Email + password (sign in / create account), email link, password reset. Accounts are optional.
 */
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Segmented } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { backendConfigured, sendMagicLink, sendPasswordReset, signIn, signOut, signUp, useSession } from '@/services/auth';
import { pull } from '@/services/sync';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

export default function SignIn() {
  const { t, r, font } = useTheme();
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const flash = useUi((s) => s.flash);
  const pname = useApp((s) => s.pname);
  const set = useApp((s) => s.set);
  const { session } = useSession();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async (
    fn: () => Promise<{ ok: true; message?: string } | { ok: false; error: string }>,
    after?: (msg?: string) => void,
  ) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fn();
      if (res.ok) {
        if (res.message) setMsg({ ok: true, text: res.message });
        after?.(res.message);
      } else setMsg({ ok: false, text: res.error });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error && 'issues' in e ? (e as unknown as { issues: { message: string }[] }).issues[0].message : 'بيانات غير صحيحة' });
    } finally {
      setBusy(false);
    }
  };

  const done = (customMsg?: string) => {
    set({ onboarded: true });
    pull().catch(() => {});
    flash(customMsg ?? 'مرحبًا بك');
    router.replace((redirect as Href) || '/');
  };

  const input = { height: 50, borderWidth: 1, borderColor: t.line, borderRadius: r(14), backgroundColor: t.card, color: t.ink, fontFamily: font('ui'), fontSize: 17, paddingHorizontal: 14, textAlign: 'right' as const };

  if (session) {
    return (
      <Screen gap={14}>
        <BackLink label="الإعدادات" href="/account/settings" />
        <Title>الحساب</Title>
        <Lead>أنت مسجّل الدخول بالبريد:</Lead>
        <Txt size={17} weight={600} ltr style={{ alignSelf: 'flex-start' }}>
          {session.user.email}
        </Txt>
        <Button variant="secondary" onPress={() => router.push('/auth/password')}>
          تغيير كلمة المرور
        </Button>
        <Button onPress={() => run(() => signOut('local'), () => flash('سُجّل الخروج'))} disabled={busy}>
          تسجيل الخروج
        </Button>
      </Screen>
    );
  }

  return (
    <Screen gap={14} keyboard>
      <BackLink label="رجوع" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <Title>{mode === 'in' ? 'تسجيل الدخول' : 'إنشاء حساب'}</Title>
      <Lead>الحساب اختياري: يحفظ تقدّمك ودفتر فوائدك على الخادم لتتابع على أي جهاز، ويُصدر الشهادات باسمك.</Lead>
      {!backendConfigured && (
        <View style={{ backgroundColor: t.goldSoft, borderRadius: r(14), padding: 12 }}>
          <Txt size={14} color={t.goldInk} lh={1.8}>
            الحسابات غير مفعّلة في هذه النسخة بعد (لم يُضبط الخادم). يعمل التطبيق كاملًا دون حساب، وتُحفظ بياناتك على جهازك.
          </Txt>
        </View>
      )}
      <Segmented
        options={[
          { value: 'in', label: 'لدي حساب' },
          { value: 'up', label: 'حساب جديد' },
        ]}
        value={mode}
        onChange={setMode}
        label="نوع العملية"
      />
      <TextInput value={email} onChangeText={setEmail} placeholder="البريد الإلكتروني" placeholderTextColor={t.muted} accessibilityLabel="البريد الإلكتروني" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" style={input} />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="كلمة المرور"
        placeholderTextColor={t.muted}
        accessibilityLabel="كلمة المرور"
        secureTextEntry
        autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
        textContentType={mode === 'in' ? 'password' : 'newPassword'}
        style={input}
      />
      {msg && (
        <Txt size={14} color={msg.ok ? t.primary : t.errInk} lh={1.7} accessibilityLiveRegion="assertive">
          {msg.text}
        </Txt>
      )}
      <Button
        size="lg"
        disabled={busy || !email || !password}
        onPress={() =>
          run(
            () => (mode === 'in' ? signIn(email, password) : signUp(email, password, pname)),
            (resMsg) => done(resMsg),
          )
        }>
        {busy ? 'جارٍ…' : mode === 'in' ? 'دخول' : 'إنشاء الحساب'}
      </Button>
      <Button variant="secondary" disabled={busy || !email} onPress={() => run(() => sendMagicLink(email))}>
        أرسل لي رابط دخول بالبريد
      </Button>
      {mode === 'in' && (
        <Press onPress={() => run(() => sendPasswordReset(email))} disabled={busy || !email} label="نسيت كلمة المرور" style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center' }}>
          <Txt size={15} weight={600} color={t.primary}>
            نسيت كلمة المرور؟
          </Txt>
        </Press>
      )}
    </Screen>
  );
}
