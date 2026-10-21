/** تواصل معنا واقتراحاتك — sends feedback to the backend (`feedback` table); queued nowhere else. */
import { useState } from 'react';
import { TextInput } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/core/Button';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { backendConfigured, supabase } from '@/services/supabase';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

const Feedback = z.object({ message: z.string().trim().min(5, 'اكتب رسالة أوضح (5 أحرف على الأقل)').max(4000), contact: z.string().trim().max(200).optional() });

export default function Contact() {
  const { t, r, font } = useTheme();
  const flash = useUi((s) => s.flash);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const send = async () => {
    const parsed = Feedback.safeParse({ message, contact: contact || undefined });
    if (!parsed.success) {
      setErr(parsed.error.issues[0].message);
      return;
    }
    if (!supabase) {
      setErr('الإرسال غير متاح في هذه النسخة (لم يُضبط الخادم).');
      return;
    }
    setBusy(true);
    // Through the rate-limited `submit-feedback` function (direct inserts are closed server-side).
    const { error } = await supabase.functions.invoke('submit-feedback', { body: { message: parsed.data.message, contact: parsed.data.contact ?? '' } });
    setBusy(false);
    if (error) setErr((error as { context?: { status?: number } }).context?.status === 429 ? 'أرسلت رسائل كثيرة. انتظر قليلًا ثم أعد المحاولة.' : 'تعذّر الإرسال. تحقّق من الاتصال ثم أعد المحاولة.');
    else {
      setMessage('');
      setContact('');
      setErr(null);
      flash('وصلت رسالتك. جزاك الله خيرًا.');
    }
  };

  const input = { borderWidth: 1, borderColor: t.line, borderRadius: r(14), backgroundColor: t.card, color: t.ink, fontFamily: font('ui'), fontSize: 16, padding: 12, textAlign: 'right' as const };
  return (
    <Screen gap={12} keyboard>
      <BackLink label="الإعدادات" href="/account/settings" />
      <Title>تواصل معنا</Title>
      <Lead>اقتراحك أو ملاحظتك تصل إلى فريق المشروع. لبلاغات الأخطاء العلمية استخدم «أبلغ عن خطأ» بجانب الفقرة.</Lead>
      <TextInput value={message} onChangeText={setMessage} multiline placeholder="رسالتك" placeholderTextColor={t.muted} accessibilityLabel="رسالتك" style={{ ...input, minHeight: 140, textAlignVertical: 'top' }} />
      <TextInput value={contact} onChangeText={setContact} placeholder="بريدك للرد (اختياري)" placeholderTextColor={t.muted} accessibilityLabel="بريدك للرد" keyboardType="email-address" autoCapitalize="none" style={{ ...input, height: 48 }} />
      {err && (
        <Txt size={14} color={t.errInk} accessibilityLiveRegion="assertive">
          {err}
        </Txt>
      )}
      {!backendConfigured && (
        <Txt size={13} color={t.muted}>
          الخادم غير مضبوط في هذه النسخة.
        </Txt>
      )}
      <Button size="lg" onPress={send} disabled={busy}>
        {busy ? 'جارٍ الإرسال…' : 'إرسال'}
      </Button>
    </Screen>
  );
}
