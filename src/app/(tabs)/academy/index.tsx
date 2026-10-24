/** الأكاديمية الإسلامية — `s.academy`. */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { IconTile, Pill } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { Screen, Title } from '@/components/layout/Screen';
import { lessonsFor } from '@/data/content';
import { STAGE2_SUBJECTS } from '@/data/stage2Data';
import { STAGE3_SUBJECTS } from '@/data/stage3Data';
import { lessonCountLabel, STAGE2_SUBJECTS_LIST, STAGE3_SUBJECTS_LIST, SUBJECTS } from '@/data/structural';
import { mapMastery, useAcademy } from '@/features/academy/useAcademy';
import { useApp } from '@/state/app-store';
import { useContent } from '@/state/content-store';
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
  const [activeStage, setActiveStage] = useState<1 | 2 | 3>(1);

  // Check stage unlock progression
  const stage1Done = ac.stagePct >= 100 || ac.stage1Complete;
  const stage2Done =
    stage1Done &&
    STAGE2_SUBJECTS_LIST.every((s) => ac.subjectPct(s.prefix) >= 100);

  const isStageLocked = (n: 1 | 2 | 3) => {
    if (n === 1) return false;
    if (n === 2) return !stage1Done;
    return !stage2Done;
  };

  const handleSelectStage = (n: 1 | 2 | 3) => {
    if (isStageLocked(n)) {
      router.push(`/academy/locked/${n}`);
      return;
    }
    setActiveStage(n);
  };

  const stageBtn = (n: 1 | 2 | 3, label: string) => {
    const active = activeStage === n;
    const locked = isStageLocked(n);
    return (
      <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
        <Press
          onPress={() => handleSelectStage(n)}
          label={`المرحلة ${n} · ${label} ${locked ? '(مقفلة)' : ''}`}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: active ? pc : locked ? (dark ? '#1A2924' : '#EAEFEA') : t.soft,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: active ? 2 : 1,
            borderColor: active ? gc : locked ? t.line : t.line,
            opacity: locked ? 0.75 : 1,
          }}>
          <Txt size={locked ? 15 : 18} weight={700} color={active ? '#FFFFFF' : locked ? t.muted : t.ink}>
            {locked ? '🔒' : n}
          </Txt>
        </Press>
        <Txt size={12} weight={active ? 700 : 500} color={active ? t.primary : locked ? t.muted : t.ink}>
          {locked ? `${label} 🔒` : active ? 'المختارة' : label}
        </Txt>
      </View>
    );
  };

  const activeSubjects = activeStage === 1 ? SUBJECTS : activeStage === 2 ? STAGE2_SUBJECTS_LIST : STAGE3_SUBJECTS_LIST;

  return (
    <Screen gap={16}>
      <Title>الأكاديمية الإسلامية</Title>

      {/* Interactive Knowledge Map Banner */}
      <Press
        onPress={() => router.navigate('/academy/map')}
        label="خريطة العلم التفاعلية"
        style={{
          backgroundColor: t.goldSoft,
          borderRadius: r(18),
          minHeight: 56,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: gc, boxShadow: `0px 0px 8px ${gc}` }} />
        <Txt size={17} weight={700} color={t.goldInk} style={{ flex: 1 }}>
          خريطة العلم التفاعلية (19 عقدة معرفية)
        </Txt>
        <Txt size={14} color={t.goldInk} ltr>
          {map.lit}/{map.total}
        </Txt>
      </Press>

      {/* Stage Selector (1 -> 2 -> 3) */}
      <Card variant="app" pad={0} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 14 }}>
        {stageBtn(1, 'التأسيس')}
        <Dashes color={activeStage >= 2 ? gc : t.line} />
        {stageBtn(2, 'التأصيل')}
        <Dashes color={activeStage === 3 ? gc : t.line} />
        {stageBtn(3, 'التخصص')}
      </Card>

      {/* Stage Description & Overview Card */}
      {activeStage === 1 && (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <View style={{ gap: 2 }}>
              <Txt size={19} weight={700}>
                المرحلة الأولى: التأسيس · 6 مواد
              </Txt>
              <Txt size={13} color={t.muted}>
                العقيدة، الفقه، التفسير، الحديث، السيرة، والتزكية (53 درسًا)
              </Txt>
            </View>
            <Txt size={15} weight={700} color={t.primary}>
              {ac.stagePct}%
            </Txt>
          </View>

          {stage1Done && (
            <Card
              variant="app"
              pad={14}
              onPress={() => handleSelectStage(2)}
              style={{ backgroundColor: t.goldSoft, borderColor: gc, borderWidth: 1.5, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Txt size={20}>🎉</Txt>
                <Txt size={16} weight={700} color={t.goldInk} style={{ flex: 1 }}>
                  مبارك! أتممت متطلبات المرحلة الأولى بنجاح
                </Txt>
              </View>
              <Txt size={13} color={t.goldInk} lh={1.6}>
                تم فتح المرحلة الثانية (المستوى التأصيلي). اضغط هنا للانتقال إليها ومتابعة دراسة المتون المعتمدة.
              </Txt>
            </Card>
          )}
        </>
      )}

      {activeStage === 2 && (
        <Card
          variant="app"
          pad={14}
          onPress={() => router.push('/academy/locked/2')}
          label="تفاصيل خطة المرحلة الثانية"
          style={{ borderWidth: 1, borderColor: t.line, gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt size={17} weight={700} color={t.primary}>
              المرحلة الثانية: التأصيل والعلوم الآلية
            </Txt>
            <Pill label="9 مواد · 108 دروس" bg={t.soft} fg={t.primary} size={12} />
          </View>
          <Txt size={13} color={t.muted} lh={1.6}>
            المعاملات المالية، فقه الأسرة، الفرائض، أصول الفقه، مصطلح الحديث، الواسطية، علوم القرآن، والنحو القرآني.
          </Txt>
          <Txt size={12} weight={700} color={gc}>
            اضغط لعرض الخطة والمتون المعتمدة ومراجعة متطلبات المرحلة الأولى ⤢
          </Txt>
        </Card>
      )}

      {activeStage === 3 && (
        <Card
          variant="app"
          pad={14}
          onPress={() => router.push('/academy/locked/3')}
          label="تفاصيل خطة المرحلة الثالثة"
          style={{ borderWidth: 1.5, borderColor: gc, backgroundColor: dark ? '#132821' : '#F6FAF8', gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt size={17} weight={700} color={t.primary}>
              المرحلة الثالثة: التخصص والاجتهاد والترجيح
            </Txt>
            <Pill label="5 مواد تخصصية · 70 درسًا" bg={t.goldSoft} fg={t.goldInk} size={12} />
          </View>
          <Txt size={13} color={t.ink} lh={1.6}>
            الفقه المقارن، أصول الفقه الموسع، علل الحديث وصحيح البخاري، التفسير المقارن، وفقه النوازل والمجامع الفقهية.
          </Txt>
          <Txt size={12} weight={700} color={gc}>
            اضغط لتصفح مصادر المرحلة وأمهات الكتب وقرارات المجامع ⤢
          </Txt>
        </Card>
      )}

      {/* Subject List for the Active Stage */}
      {activeSubjects.map((s, i) => {
        const has = lessonsFor(lessons, s.prefix).length > 0;
        const pct = ac.subjectPct(s.prefix);
        const s3Meta = STAGE3_SUBJECTS.find((m) => m.id === s.id);
        const s2Meta = STAGE2_SUBJECTS.find((m) => m.id === s.id);
        const bookName = s3Meta?.bookTitle ?? s2Meta?.bookTitle;
        const subjectStage = STAGE3_SUBJECTS_LIST.some((x) => x.id === s.id) ? 3 : STAGE2_SUBJECTS_LIST.some((x) => x.id === s.id) ? 2 : 1;
        const locked = isStageLocked(subjectStage as 1 | 2 | 3);

        return (
          <Press
            key={s.id}
            onPress={() => {
              if (locked) {
                router.push(`/academy/locked/${subjectStage}`);
                return;
              }
              router.navigate(`/academy/subject/${s.id}`);
            }}
            label={`${s.name} · ${pct}%`}
            style={{
              backgroundColor: t.card,
              borderWidth: 1,
              borderColor: i === 0 && activeStage === 1 ? (dark ? '#6FD0B3' : pc) : t.line,
              borderRadius: r(18),
              paddingVertical: 12,
              paddingHorizontal: 14,
              flexDirection: 'row',
              gap: 12,
              alignItems: 'center',
            }}>
            <IconTile d={s.icon} bg={t.goldSoft} color={t.goldInk} />
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt size={16} weight={700} numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>
                  {s.name}
                </Txt>
                <Txt size={13} weight={700} color={t.primary} style={{ flexShrink: 0, marginStart: 8 }}>
                  {pct}%
                </Txt>
              </View>
              {bookName ? (
                <Txt size={12} color={t.goldInk} numberOfLines={1}>
                  📖 {bookName}
                </Txt>
              ) : null}
              <ProgressBar value={pct} height={4} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt size={12} color={t.muted}>
                  {lessonCountLabel(ac.planned(s.id))}
                </Txt>
                <Txt size={11} color={has ? t.primary : t.muted} weight={has ? 600 : 400}>
                  {has ? 'دروس جاهزة' : 'بانتظار النشر'}
                </Txt>
              </View>
            </View>
          </Press>
        );
      })}
    </Screen>
  );
}
