/** الأكاديمية الإسلامية — `s.academy`. */
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { IconTile } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { Card } from '@/components/core/Card';
import { Screen, Title } from '@/components/layout/Screen';
import { lessonsFor } from '@/data/content';
import { useContent } from '@/state/content-store';
import { lessonCountLabel, SUBJECTS } from '@/data/structural';
import { mapMastery, useAcademy } from '@/features/academy/useAcademy';
import { useApp } from '@/state/app-store';
import { useTheme } from '@/theme/theme';

function Dashes({ color }: { color: string }) {
  return (
    <View style={{ flex: 0.6, height: 2, flexDirection: 'row', gap: 6, overflow: 'hidden' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={{ width: 6, height: 2, backgroundColor: color }} />
      ))}
    </View>
  );
}

export default function Academy() {
  const { t, pc, gc, r, dark } = useTheme();
  const router = useRouter();
  const ac = useAcademy();
  const passed = useApp((s) => s.passed);
  const mast = useApp((s) => s.mast);
  const lessons = useContent((s) => s.lessons);
  const map = mapMastery(passed, mast, lessons);
  const stage2Open = ac.stage1Complete;

  const stage = (n: 2 | 3) => (
    <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
      <Press
        onPress={() => router.navigate(`/academy/locked/${n}`)}
        label={n === 2 ? 'المرحلة الثانية · مغلقة' : 'المرحلة الثالثة · مغلقة'}
        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.lockBg, alignItems: 'center', justifyContent: 'center' }}>
        <Txt size={18} weight={700} color={t.muted}>
          {n}
        </Txt>
      </Press>
      <Txt size={14} color={t.muted}>
        {n === 2 && stage2Open ? 'متاحة قريبًا' : 'مغلقة'}
      </Txt>
    </View>
  );

  return (
    <Screen>
      <Title>الأكاديمية الإسلامية</Title>
      <Press
        onPress={() => router.navigate('/academy/map')}
        label="خريطة العلم التفاعلية"
        style={{ backgroundColor: t.goldSoft, borderRadius: r(18), minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: gc, boxShadow: `0px 0px 8px ${gc}` }} />
        <Txt size={17} weight={700} color={t.goldInk} style={{ flex: 1 }}>
          خريطة العلم التفاعلية
        </Txt>
        <Txt size={14} color={t.goldInk} ltr>
          {map.lit}/{map.total}
        </Txt>
      </Press>

      <Card variant="app" pad={0} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 14 }}>
        <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: pc, alignItems: 'center', justifyContent: 'center' }}>
            <Txt size={17} weight={700} color="#FFFFFF">
              1
            </Txt>
          </View>
          <Txt size={14} weight={600} color={t.primary}>
            مفتوحة
          </Txt>
        </View>
        <Dashes color={gc} />
        {stage(2)}
        <Dashes color={t.line} />
        {stage(3)}
      </Card>
      <Txt size={14} color={t.muted} lh={1.7} style={{ marginTop: -4 }}>
        تُفتح المرحلة الثانية بعد اجتياز المرحلة الأولى بنسبة {ac.passPct}% فأكثر في كل مادة.
      </Txt>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Txt size={19} weight={600}>
          المرحلة الأولى · {SUBJECTS.length} مواد
        </Txt>
        <Txt size={14} weight={600} color={t.primary}>
          {ac.stagePct}%
        </Txt>
      </View>

      {SUBJECTS.map((s, i) => {
        const has = lessonsFor(lessons, s.prefix).length > 0;
        const pct = ac.subjectPct(s.prefix);
        return (
          <Press
            key={s.id}
            onPress={() => router.navigate(`/academy/subject/${s.id}`)}
            label={`${s.name} · ${pct}%`}
            style={{
              backgroundColor: t.card,
              borderWidth: 1,
              borderColor: i === 0 ? (dark ? '#6FD0B3' : pc) : t.line,
              borderRadius: r(18),
              paddingVertical: 12,
              paddingHorizontal: 14,
              flexDirection: 'row',
              gap: 12,
              alignItems: 'center',
            }}>
            <IconTile d={s.icon} bg={t.goldSoft} color={t.goldInk} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Txt size={17} weight={600}>
                  {s.name}
                </Txt>
                <Txt size={14} weight={600} color={t.primary}>
                  {pct}%
                </Txt>
              </View>
              <ProgressBar value={pct} height={5} />
              <Txt size={14} color={t.muted}>
                {lessonCountLabel(ac.planned(s.id))} · {has ? 'متاحة الآن' : 'المحتوى قيد الإعداد'}
              </Txt>
            </View>
          </Press>
        );
      })}
    </Screen>
  );
}
