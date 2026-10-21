/** موسوعة الشريعة — `s.sharia` (list mode): disclaimer, search, 8-topic accordion. */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Icon } from '@/components/core/Icon';
import { DiamondBullet, EmptyState } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Screen, Title } from '@/components/layout/Screen';
import { ICON, SHARIA_TOPICS } from '@/data/structural';
import { useTheme } from '@/theme/theme';

export default function Sharia() {
  const { t, gc, font } = useTheme();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const qq = q.trim();
  const topics = SHARIA_TOPICS.map((tp, ti) => {
    const subs = tp.subs.map((name, si) => ({ name, si })).filter((s) => !qq || tp.name.includes(qq) || s.name.includes(qq));
    return { ...tp, ti, filtered: subs, open: qq ? subs.length > 0 : open === tp.name };
  }).filter((x) => !qq || x.filtered.length > 0);

  return (
    <Screen gap={12}>
      <BackLink label="الرئيسية" href="/" />
      <Title>موسوعة الشريعة</Title>
      <View style={{ backgroundColor: t.goldSoft, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 }}>
        <Txt size={14} color={t.goldInk} lh={1.9}>
          محتوى تعليمي مع بيان المصادر والإشراف العلمي. ليس منصة لإصدار أحكام على الأشخاص أو تنفيذ العقوبات.
        </Txt>
      </View>
      <View style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 16, paddingHorizontal: 14, height: 48, justifyContent: 'center' }}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="ابحث في الموسوعة"
          placeholderTextColor={t.muted}
          accessibilityLabel="ابحث في الموسوعة"
          style={{ fontFamily: font('ui'), fontSize: 17, color: t.ink, height: 44, textAlign: 'right' }}
        />
      </View>
      {!!qq && !topics.length && <EmptyState>لا نتائج. جرّب كلمة أخرى.</EmptyState>}
      {topics.map((tp) => (
        <Card key={tp.name} variant="app" radius={18} pad={0} style={{ overflow: 'hidden' }}>
          <Press
            onPress={() => setOpen(open === tp.name ? null : tp.name)}
            accessibilityState={{ expanded: tp.open }}
            label={`${tp.name} · ${tp.subs.length} أبواب`}
            style={{ minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <DiamondBullet size={10} color={gc} />
            <Txt size={18} weight={600} style={{ flex: 1 }}>
              {tp.name}
            </Txt>
            <Txt size={14} color={t.muted}>
              {tp.subs.length} أبواب
            </Txt>
            <View style={{ transform: [{ rotate: tp.open ? '180deg' : '0deg' }] }}>
              <Icon d={ICON.chevronDown} size={20} color={t.muted} sw={2.2} />
            </View>
          </Press>
          {tp.open && (
            <View style={{ paddingHorizontal: 12, paddingBottom: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {tp.filtered.map((s) => (
                <Press
                  key={s.name}
                  onPress={() => router.navigate(`/sharia/${tp.ti}/${s.si}`)}
                  label={s.name}
                  style={{ borderWidth: 1, borderColor: t.line, backgroundColor: t.soft, borderRadius: 99, minHeight: 40, paddingHorizontal: 14, justifyContent: 'center' }}>
                  <Txt size={15} weight={600} color={t.primary}>
                    {s.name}
                  </Txt>
                </Press>
              ))}
            </View>
          )}
        </Card>
      ))}
    </Screen>
  );
}
