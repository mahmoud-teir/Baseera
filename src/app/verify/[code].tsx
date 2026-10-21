/** Public certificate verification (`verify-certificate` Edge Function) — linked from the printed certificate. */
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { Card } from '@/components/core/Card';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/theme/theme';

export default function Verify() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { t } = useTheme();
  const [state, setState] = useState<'loading' | 'valid' | 'invalid' | 'unavailable'>(supabase ? 'loading' : 'unavailable');
  const [info, setInfo] = useState<{ name: string; stage: number; issued_at: string } | null>(null);
  useEffect(() => {
    if (!supabase) return;
    supabase.functions
      .invoke<{ valid: boolean; name?: string; stage?: number; issued_at?: string }>('verify-certificate', { body: { code } })
      .then(({ data, error }) => {
        if (error || !data?.valid) setState('invalid');
        else {
          setInfo({ name: data.name!, stage: data.stage!, issued_at: data.issued_at! });
          setState('valid');
        }
      })
      .catch(() => setState('invalid'));
  }, [code]);
  return (
    <Screen gap={14}>
      <BackLink label="الرئيسية" href="/" />
      <Title>التحقق من الشهادة</Title>
      <Txt size={15} color={t.muted} ltr style={{ alignSelf: 'flex-start' }}>
        {code}
      </Txt>
      {state === 'loading' && <Lead>جارٍ التحقق…</Lead>}
      {state === 'unavailable' && <Lead>خدمة التحقق غير مضبوطة في هذه النسخة.</Lead>}
      {state === 'invalid' && (
        <Card variant="app">
          <Txt size={17} weight={700} color={t.errInk}>
            لم نجد شهادة بهذا الرمز.
          </Txt>
        </Card>
      )}
      {state === 'valid' && info && (
        <Card variant="app" style={{ gap: 6 }}>
          <Txt size={17} weight={700} color={t.primary}>
            شهادة صحيحة ✓
          </Txt>
          <Txt size={16}>الاسم: {info.name}</Txt>
          <Txt size={16}>المرحلة: {info.stage}</Txt>
          <Txt size={16}>تاريخ الإصدار: {new Date(info.issued_at).toLocaleDateString('ar')}</Txt>
        </Card>
      )}
    </Screen>
  );
}
