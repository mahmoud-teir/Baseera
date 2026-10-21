/** تغيير كلمة المرور — also the landing page of the password-reset email link. */
import { useState } from 'react';
import { TextInput } from 'react-native';

import { Button } from '@/components/core/Button';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { updatePassword, useSession } from '@/services/auth';
import { useTheme } from '@/theme/theme';

export default function Password() {
  const { t, r, font } = useTheme();
  const { session } = useSession();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const input = { height: 50, borderWidth: 1, borderColor: t.line, borderRadius: r(14), backgroundColor: t.card, color: t.ink, fontFamily: font('ui'), fontSize: 17, paddingHorizontal: 14, textAlign: 'right' as const };
  const save = async () => {
    if (pw !== pw2) return setMsg({ ok: false, text: 'كلمتا المرور غير متطابقتين.' });
    setBusy(true);
    try {
      const res = await updatePassword(pw);
      setMsg(res.ok ? { ok: true, text: res.message ?? 'تم' } : { ok: false, text: res.error });
    } catch {
      setMsg({ ok: false, text: 'كلمة المرور 8 أحرف على الأقل' });
    }
    setBusy(false);
  };
  return (
    <Screen gap={14} keyboard>
      <BackLink label="الإعدادات" href="/account/settings" />
      <Title>تغيير كلمة المرور</Title>
      {!session ? (
        <Lead>سجّل الدخول أولًا، أو افتح رابط إعادة التعيين المرسل إلى بريدك.</Lead>
      ) : (
        <>
          <TextInput value={pw} onChangeText={setPw} secureTextEntry placeholder="كلمة المرور الجديدة" placeholderTextColor={t.muted} accessibilityLabel="كلمة المرور الجديدة" autoComplete="new-password" style={input} />
          <TextInput value={pw2} onChangeText={setPw2} secureTextEntry placeholder="تأكيد كلمة المرور" placeholderTextColor={t.muted} accessibilityLabel="تأكيد كلمة المرور" autoComplete="new-password" style={input} />
          {msg && (
            <Txt size={14} color={msg.ok ? t.primary : t.errInk} accessibilityLiveRegion="assertive">
              {msg.text}
            </Txt>
          )}
          <Button size="lg" onPress={save} disabled={busy || !pw}>
            حفظ
          </Button>
        </>
      )}
    </Screen>
  );
}
