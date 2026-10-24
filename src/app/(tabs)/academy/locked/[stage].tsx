/** مرحلة مغلقة — `s.locked` (stage 2 lists the six stage-1 subjects with their status and stage 2 curriculum preview). */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Card } from '@/components/core/Card';
import { LockIcon } from '@/components/core/Icon';
import { Pill } from '@/components/core/parts';
import { Txt } from '@/components/core/Txt';
import { BackLink, Note, Screen, Title } from '@/components/layout/Screen';
import { lessonsFor } from '@/data/content';
import { STAGE2_SUBJECTS, STAGE2_TOTAL_LESSONS } from '@/data/stage2Data';
import { STAGE3_SUBJECTS, STAGE3_TOTAL_LESSONS } from '@/data/stage3Data';
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

  const allStage1Done = items.every((i) => i.ok);

  return (
    <Screen gap={16}>
      <BackLink label="الأكاديمية" href="/academy" />
      <View style={{ alignSelf: 'center', width: 88, height: 88, borderRadius: 44, backgroundColor: allStage1Done ? t.goldSoft : t.lockBg, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
        <LockIcon size={42} color={allStage1Done ? t.goldInk : t.muted} sw={1.6} />
      </View>
      <Title align="center">{s2 ? (allStage1Done ? 'المرحلة الثانية: المستوى التأصيلي' : 'المرحلة الثانية مغلقة') : 'المرحلة الثالثة مغلقة'}</Title>
      <Txt size={16} color={t.muted} lh={1.9} align="center" style={{ paddingHorizontal: 8 }}>
        {s2
          ? allStage1Done
            ? `أحسنت! أكملت متطلبات المرحلة الأولى بنجاح. إليك خريطة مقررات ومصادر المرحلة الثانية (${STAGE2_TOTAL_LESSONS} درسًا تأصيليًا).`
            : 'تُفتح بعد اجتياز اختبارات المواد الست في المرحلة الأولى بنسبة ' + curriculum.passPct + '% فأكثر.'
          : 'تُفتح بعد النجاح في المرحلة الثانية. تابع دراستك خطوة بخطوة.'}
      </Txt>

      {s2 && (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt size={18} weight={700}>
              متطلبات المرحلة الأولى
            </Txt>
            <Pill label={allStage1Done ? 'مكتملة بالكامل ✓' : 'قيد الإنجاز'} bg={allStage1Done ? t.goldSoft : t.soft} fg={allStage1Done ? t.goldInk : t.primary} size={13} />
          </View>
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

          <View style={{ gap: 4, marginTop: 8 }}>
            <Txt size={20} weight={700} accessibilityRole="header">
              خطة مقررات ومتون المرحلة الثانية
            </Txt>
            <Txt size={14} color={t.muted} lh={1.6}>
              مستوى التأصيل العلمي ودراسة أمهات المتون المعتمدة والعلوم الآلية:
            </Txt>
          </View>

          <View style={{ gap: 12 }}>
            {STAGE2_SUBJECTS.map((sub, idx) => (
              <Card
                key={sub.id}
                variant="app"
                radius={18}
                pad={14}
                style={{ gap: 8 }}
                onPress={() => router.push(`/academy/subject/${sub.id}` as any)}
                label={sub.name}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <Txt size={16} weight={700} color={t.primary} style={{ flex: 1, minWidth: 0 }}>
                    {idx + 1}. {sub.name}
                  </Txt>
                  <View style={{ flexShrink: 0 }}>
                    <Pill label={`${sub.lessonsCount} درسًا`} bg={t.soft} fg={t.primary} size={11} />
                  </View>
                </View>
                <View style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 12, padding: 10, gap: 4 }}>
                  <Txt size={15} weight={700} color={t.ink}>
                    📖 المتن المعتمد: {sub.bookTitle}
                  </Txt>
                  <Txt size={13} color={t.muted}>
                    المؤلف: {sub.author} ({sub.era})
                  </Txt>
                  <Txt size={13} color={t.goldInk}>
                    المرجع والشرح: {sub.referenceCommentary}
                  </Txt>
                </View>
                <Txt size={14} color={t.body} lh={1.7}>
                  {sub.description}
                </Txt>
                <View style={{ gap: 6, marginTop: 4 }}>
                  {sub.keyTopics.map((top) => (
                    <View
                      key={top}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: 8,
                        backgroundColor: t.soft,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}>
                      <Txt size={14} color={t.primary} weight={700}>
                        •
                      </Txt>
                      <Txt size={12} color={t.ink} lh={1.6} style={{ flex: 1 }}>
                        {top}
                      </Txt>
                    </View>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        </>
      )}

      {!s2 && (
        <>
          <View style={{ gap: 4, marginTop: 4 }}>
            <Txt size={20} weight={700} accessibilityRole="header">
              خطة مقررات ومصادر المرحلة الثالثة
            </Txt>
            <Txt size={14} color={t.muted} lh={1.6}>
              مرحلة التخريج والاجتهاد والترجيح المقارن وفقه النوازل المعاصرة ({STAGE3_TOTAL_LESSONS} درسًا):
            </Txt>
          </View>

          <View style={{ gap: 12 }}>
            {STAGE3_SUBJECTS.map((sub, idx) => (
              <Card
                key={sub.id}
                variant="app"
                radius={18}
                pad={14}
                style={{ gap: 8 }}
                onPress={() => router.push(`/academy/subject/${sub.id}` as any)}
                label={sub.name}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <Txt size={16} weight={700} color={t.primary} style={{ flex: 1, minWidth: 0 }}>
                    {idx + 1}. {sub.name}
                  </Txt>
                  <View style={{ flexShrink: 0 }}>
                    <Pill label={`${sub.lessonsCount} درسًا`} bg={t.soft} fg={t.primary} size={11} />
                  </View>
                </View>
                <View style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 12, padding: 10, gap: 4 }}>
                  <Txt size={15} weight={700} color={t.ink}>
                    📖 المرجع المعتمد: {sub.bookTitle}
                  </Txt>
                  <Txt size={13} color={t.muted}>
                    المؤلف: {sub.author} ({sub.era})
                  </Txt>
                  <Txt size={13} color={t.goldInk}>
                    المرجع والشرح: {sub.referenceCommentary}
                  </Txt>
                </View>
                <Txt size={14} color={t.body} lh={1.7}>
                  {sub.description}
                </Txt>
                <View style={{ gap: 6, marginTop: 4 }}>
                  {sub.keyTopics.map((top) => (
                    <View
                      key={top}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: 8,
                        backgroundColor: t.soft,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}>
                      <Txt size={14} color={t.primary} weight={700}>
                        •
                      </Txt>
                      <Txt size={12} color={t.ink} lh={1.6} style={{ flex: 1 }}>
                        {top}
                      </Txt>
                    </View>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        </>
      )}

      {!s2 && (
        <Button size="lg" onPress={() => router.push('/academy/subject/comparative_fiqh' as any)}>
          بدء دراسة الفقه المقارن (المرحلة الثالثة)
        </Button>
      )}
      <Note align="center">القرآن والمكتبة والصوتيات وخريطة العلم متاحة لك دائمًا لمتابعة طلب العلم.</Note>
      <Button variant={!s2 ? 'secondary' : 'primary'} size="lg" onPress={() => router.dismissTo('/academy')}>
        {s2 && !allStage1Done ? 'متابعة دروس المرحلة الأولى' : 'العودة إلى الأكاديمية'}
      </Button>
    </Screen>
  );
}
