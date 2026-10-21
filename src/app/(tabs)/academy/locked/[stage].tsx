/** مرحلة مغلقة — `s.locked` (stage 2 lists the six stage-1 subjects with their status). */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Card } from '@/components/core/Card';
import { LockIcon } from '@/components/core/Icon';
import { Txt } from '@/components/core/Txt';
import { BackLink, Note, Screen, Title } from '@/components/layout/Screen';
import { lessonsFor } from '@/data/content';
import { plannedCount, useConfig } from '@/state/config-store';
import { useContent } from '@/state/content-store';
import { SUBJECTS } from '@/data/structural';
import { useApp } from '@/state/app-store';
import { useTheme } from '@/theme/theme';

export function generateStaticParams() {
  return [{ stage: '2' }, { stage: '3' }];
}

export default function Locked() {
  const { stage } = useLocalSearchParams<{ stage: string }>();
  const s2 = stage !== '3';
  const passed = useApp((s) => s.passed);
  const router = useRouter();
  const { t } = useTheme();
  const lessons = useContent((s) => s.lessons);
  const curriculum = useConfig((s) => s.curriculum);

  const items = SUBJECTS.map((s) => {
    const ls = lessonsFor(lessons, s.prefix);
    const planned = plannedCount(curriculum, s.id);
    const n = ls.filter((l) => passed[l.code]).length;
    const ok = ls.length > 0 && ls.length >= planned && n === ls.length;
    return { name: s.name, ok, state: ok ? 'مُجتازة' : n > 0 || ls.length ? `${n} من ${planned} دروس` : 'لم تبدأ' };
  });

  return (
    <Screen>
      <BackLink label="الأكاديمية" href="/academy" />
      <View style={{ alignSelf: 'center', width: 88, height: 88, borderRadius: 44, backgroundColor: t.lockBg, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
        <LockIcon size={42} color={t.muted} sw={1.6} />
      </View>
      <Title align="center">{s2 ? 'المرحلة الثانية مغلقة' : 'المرحلة الثالثة مغلقة'}</Title>
      <Txt size={16} color={t.muted} lh={1.9} align="center" style={{ paddingHorizontal: 8 }}>
        {s2 ? 'تُفتح بعد اجتياز اختبارات المواد الست في المرحلة الأولى بنسبة ' + curriculum.passPct + '% فأكثر.' : 'تُفتح بعد النجاح في المرحلة الثانية. تابع دراستك خطوة بخطوة.'}
      </Txt>
      {s2 && (
        <Card variant="app" pad={0} style={{ paddingVertical: 6, paddingHorizontal: 14 }}>
          {items.map((it, i) => (
            <View key={it.name} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 11, borderBottomWidth: i < items.length - 1 ? 1 : 0, borderColor: t.line }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: it.ok ? t.primary : t.lockBg, alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={14} color={t.onPrimary}>
                  {it.ok ? '✓' : ''}
                </Txt>
              </View>
              <Txt size={16} weight={600} style={{ flex: 1 }}>
                {it.name}
              </Txt>
              <Txt size={14} color={t.muted}>
                {it.state}
              </Txt>
            </View>
          ))}
        </Card>
      )}
      <Note align="center">القرآن والمكتبة والصوتيات متاحة لك دائمًا، حتى والمراحل مغلقة.</Note>
      <Button size="lg" onPress={() => router.dismissTo('/academy')}>
        {s2 ? 'العودة إلى المرحلة الأولى' : 'العودة إلى الأكاديمية'}
      </Button>
    </Screen>
  );
}
