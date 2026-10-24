/** تغيير كلمة المرور — يتحقق من كلمة المرور القديمة أو إعادة التعيين. */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { TextInput } from 'react-native';

import { Button } from '@/components/core/Button';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { changePassword, sendPasswordReset, useSession } from '@/services/auth';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

export default function Password() {
  const { t, r, font } = useTheme();
  const router = useRouter();
  const flash = useUi((s) => s.flash);
  const { session } = useSession();
  const [currentPw, setCurrentPw] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const input = {
    height: 50,
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: r(14),
    backgroundColor: t.card,
    color: t.ink,
    fontFamily: font('ui'),
    fontSize: 17,
    paddingHorizontal: 14,
    textAlign: 'right' as const,
  };

  const save = async () => {
    if (!currentPw) return setMsg({ ok: false, text: 'يرجى إدخال كلمة المرور الحالية أولًا.' });
    if (pw.length < 8) return setMsg({ ok: false, text: 'كلمة المرور الجديدة 8 أحرف على الأقل.' });
    if (pw !== pw2) return setMsg({ ok: false, text: 'كلمتا المرور غير متطابقتين.' });
    if (pw === currentPw) return setMsg({ ok: false, text: 'كلمة المرور الجديدة يجب أن تختلف عن الحالية.' });

    setBusy(true);
    setMsg(null);
    try {
      const res = await changePassword(currentPw, pw);
      if (res.ok) {
        flash(res.message ?? 'تم تغيير كلمة المرور بنجاح.');
        router.dismissTo('/account/settings');
      } else {
        setMsg({ ok: false, text: res.error });
      }
    } catch {
      setMsg({ ok: false, text: 'تعذّر إتمام العملية. حاول مرة أخرى.' });
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    if (!session?.user?.email) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await sendPasswordReset(session.user.email);
      setMsg(res.ok ? { ok: true, text: res.message ?? 'أرسلنا رابط إعادة التعيين إلى بريدك.' } : { ok: false, text: res.error });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen gap={14} keyboard>
      <BackLink label="الإعدادات" href="/account/settings" />
      <Title>تغيير كلمة المرور</Title>
      {!session ? (
        <Lead>سجّل الدخول أولًا، أو افتح رابط إعادة التعيين المرسل إلى بريدك.</Lead>
      ) : (
        <>
          <Lead>لحماية حسابك، يرجى إدخال كلمة المرور الحالية ثم كلمة المرور الجديدة:</Lead>
          <TextInput
            value={currentPw}
            onChangeText={setCurrentPw}
            secureTextEntry
            placeholder="كلمة المرور الحالية"
            placeholderTextColor={t.muted}
            accessibilityLabel="كلمة المرور الحالية"
            autoComplete="current-password"
            style={input}
          />
          <TextInput
            value={pw}
            onChangeText={setPw}
            secureTextEntry
            placeholder="كلمة المرور الجديدة (8 أحرف على الأقل)"
            placeholderTextColor={t.muted}
            accessibilityLabel="كلمة المرور الجديدة"
            autoComplete="new-password"
            style={input}
          />
          <TextInput
            value={pw2}
            onChangeText={setPw2}
            secureTextEntry
            placeholder="تأكيد كلمة المرور الجديدة"
            placeholderTextColor={t.muted}
            accessibilityLabel="تأكيد كلمة المرور الجديدة"
            autoComplete="new-password"
            style={input}
          />
          {msg && (
            <Txt size={14} color={msg.ok ? t.primary : t.errInk} accessibilityLiveRegion="assertive">
              {msg.text}
            </Txt>
          )}
          <Button size="lg" onPress={save} disabled={busy || !currentPw || !pw || !pw2}>
            {busy ? 'جارٍ الحفظ…' : 'حفظ كلمة المرور'}
          </Button>
          <Press
            onPress={handleForgot}
            disabled={busy}
            label="نسيت كلمة المرور الحالية"
            style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center' }}>
            <Txt size={15} weight={600} color={t.primary}>
              نسيت كلمة المرور الحالية؟
            </Txt>
          </Press>
        </>
      )}
    </Screen>
  );
}
