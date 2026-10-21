/** المحفوظات — `s.memorized`: per-surah memorisation status (tap to cycle), counts, links to the coach. */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Pill } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Note, Screen, Title } from '@/components/layout/Screen';
import { SURAHS } from '@/data/quran';
import { HIFZ_LABELS, useHifzColors } from '@/features/quran/hifz';
import { useApp } from '@/state/app-store';
import { useTheme } from '@/theme/theme';

export default function Memorized() {
  const { t, r, font } = useTheme();
  const router = useRouter();
  const hifz = useApp((s) => s.hifz);
  const cycle = useApp((s) => s.cycleHifz);
  const colors = useHifzColors();
  const [q, setQ] = useState('');
  const vals = Object.values(hifz);
  const list = SURAHS.filter((s) => !q.trim() || s.name.includes(q.trim()));
  return (
    <Screen gap={12}>
      <BackLink label="حسابي" href="/account" />
      <Title>المحفوظات</Title>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card variant="app" radius={16} pad={12} style={{ flex: 1, alignItems: 'center' }}>
          <Txt size={24} weight={700} color={t.primary}>
            {vals.filter((v) => v === 2).length}
          </Txt>
          <Txt size={13} color={t.muted}>
            سورة محفوظة
          </Txt>
        </Card>
        <Card variant="app" radius={16} pad={12} style={{ flex: 1, alignItems: 'center' }}>
          <Txt size={24} weight={700} color={t.goldInk}>
            {vals.filter((v) => v === 3).length}
          </Txt>
          <Txt size={13} color={t.muted}>
            تحتاج مراجعة
          </Txt>
        </Card>
      </View>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="ابحث عن سورة"
        placeholderTextColor={t.muted}
        accessibilityLabel="ابحث عن سورة"
        style={{ height: 44, borderWidth: 1, borderColor: t.line, borderRadius: r(14), backgroundColor: t.card, color: t.ink, fontFamily: font('ui'), fontSize: 16, paddingHorizontal: 14, textAlign: 'right' }}
      />
      <Note>اضغط على السورة لتغيير حالتها، أو على «تدرّب» لفتح مدرب الحفظ.</Note>
      {list.map((s) => {
        const v = hifz[s.n] ?? 0;
        return (
          <Card key={s.n} variant="app" radius={16} pad={0} style={{ minHeight: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Press onPress={() => cycle(s.n)} label={`سورة ${s.name} · ${HIFZ_LABELS[v]} — اضغط للتغيير`} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 }}>
              <Txt font="display" size={22} weight={700} style={{ flex: 1 }}>
                سورة {s.name}
              </Txt>
              <Pill label={HIFZ_LABELS[v]} bg={colors[v].bg} fg={colors[v].fg} />
            </Press>
            <Press onPress={() => router.push({ pathname: '/coach/[surah]', params: { surah: String(s.n) } })} label={`تدرّب على سورة ${s.name}`} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}>
              <Txt size={14} weight={600} color={t.primary}>
                تدرّب
              </Txt>
            </Press>
          </Card>
        );
      })}
    </Screen>
  );
}
