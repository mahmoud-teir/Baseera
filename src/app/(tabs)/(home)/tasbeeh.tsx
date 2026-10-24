/**
 * المسبحة الإلكترونية — Digital Tasbeeh with Multi-level Haptic feedback, customizable Dhikr presets,
 * circular beaded progress dial, target cycle tracking, and persistent daily/cumulative counts.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, TextInput, Vibration, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Card } from '@/components/core/Card';
import { Icon } from '@/components/core/Icon';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { Screen, useBackTo, useTopPad } from '@/components/layout/Screen';
import { ICON } from '@/data/structural';
import { TASBEEH_PRESETS, type DhikrPreset } from '@/features/tasbeeh/tasbeehData';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';
import { dayKey } from '@/utils/date';

/** Universal vibrate icon (phone + side vibration waves) */
const VIBRATE_ICON = 'M8 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M12 17.5h.01 M2 9a4 4 0 0 0 0 6 M22 9a4 4 0 0 1 0 6';

export type HapticLevel = 'off' | 'light' | 'medium' | 'strong';
const HAPTIC_DURATIONS: Record<HapticLevel, number> = {
  off: 0,
  light: 50,
  medium: 80,
  strong: 130,
};

const DIAL_SIZE = 240;
const TRACK_RADIUS = 106;
const CENTER = DIAL_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * TRACK_RADIUS;

export default function TasbeehScreen() {
  const router = useRouter();
  const { t, pc, r } = useTheme();
  const topPad = useTopPad(6);
  const flash = useUi((s) => s.flash);
  const tasbeehState = useApp((s) => s.tasbeeh);
  const tapTasbeeh = useApp((s) => s.tapTasbeeh);
  const resetTasbeehDay = useApp((s) => s.resetTasbeehDay);
  const addCustomDhikr = useApp((s) => s.addCustomDhikr);

  const [selectedPreset, setSelectedPreset] = useState<DhikrPreset>(TASBEEH_PRESETS[0]);
  const [target, setTarget] = useState<number>(33); // 0 = open/free
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [cycles, setCycles] = useState<number>(0);
  const [hapticLevel, setHapticLevel] = useState<HapticLevel>('medium');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>('');

  const todayCount = (tasbeehState?.daily ?? {})[dayKey()] ?? 0;
  const totalCount = tasbeehState?.total ?? 0;

  const backToMore = useBackTo('/more');
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      backToMore();
    }
  };

  const handleTap = () => {
    const next = sessionCount + 1;
    if (hapticLevel !== 'off' && Platform.OS !== 'web') {
      const dur = HAPTIC_DURATIONS[hapticLevel];
      if (target > 0 && next >= target) {
        // Milestone completion rhythm
        Vibration.vibrate([0, 80, 100, 90, 100, 140]);
      } else {
        Vibration.vibrate(dur);
      }
    }

    tapTasbeeh();

    if (target > 0 && next >= target) {
      setSessionCount(0);
      setCycles((c) => c + 1);
      flash(`تم بحمد الله إكمال دورة ${target} تسبيحة ✨`);
    } else {
      setSessionCount(next);
    }
  };

  const toggleHaptic = () => {
    if (hapticLevel === 'off') {
      setHapticLevel('medium');
      if (Platform.OS !== 'web') Vibration.vibrate(80);
      flash('تم تفعيل الاهتزاز (متوسط)');
    } else {
      setHapticLevel('off');
      flash('تم تعطيل الاهتزاز');
    }
  };

  const handleResetSession = () => {
    setSessionCount(0);
    setCycles(0);
    flash('تم تصفير الدورة الحالية');
  };

  const handleAddCustom = () => {
    if (!customText.trim()) return;
    const trimmed = customText.trim();
    addCustomDhikr(trimmed);
    const newPreset: DhikrPreset = {
      id: `custom_${Date.now()}`,
      text: trimmed,
      target: target || 33,
      virtue: 'ذكر مبارك مضاف من قِبلك؛ الذكر حياة القلوب وطمأنينة النفوس.',
      ref: 'ذكر حر',
    };
    setSelectedPreset(newPreset);
    setCustomText('');
    setModalOpen(false);
    flash('تمت إضافة الذكر بنجاح');
  };

  const customList = tasbeehState?.customDhikr ?? [];

  // Circular progress calculations
  const progressRatio = target > 0 ? Math.min(1, sessionCount / target) : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progressRatio);

  return (
    <Screen
      noTopPad
      gap={14}
      padH={18}
      padBottom={30}
      header={
        <View
          style={{
            paddingTop: topPad,
            paddingHorizontal: 16,
            paddingBottom: 12,
            backgroundColor: t.bg,
            borderBottomWidth: 1,
            borderColor: t.line,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          {/* Back button */}
          <Press
            onPress={handleBack}
            label="رجوع"
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: t.card,
              borderWidth: 1,
              borderColor: t.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon d={ICON.back} size={20} color={t.ink} sw={2.2} directional />
          </Press>

          {/* Title & Quranic citation */}
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Txt font="display" size={20} weight={700} color={t.ink}>
              المسبحة الإلكترونية
            </Txt>
            <Txt size={11} color={t.muted}>
              «أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ»
            </Txt>
          </View>

          {/* Quick controls: Vibration & Reset */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Press
              onPress={toggleHaptic}
              label={hapticLevel !== 'off' ? 'تعطيل الاهتزاز' : 'تفعيل الاهتزاز'}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: hapticLevel !== 'off' ? t.goldSoft : t.soft,
                borderWidth: 1,
                borderColor: hapticLevel !== 'off' ? t.goldInk : t.line,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon d={VIBRATE_ICON} size={20} color={hapticLevel !== 'off' ? t.goldInk : t.muted} sw={2} />
            </Press>

            <Press
              onPress={handleResetSession}
              label="تصفير الدورة"
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: t.card,
                borderWidth: 1,
                borderColor: t.line,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon d={ICON.sync} size={18} color={t.ink} sw={2} />
            </Press>
          </View>
        </View>
      }>
      {/* 1. Dhikr selection carousel */}
      <View style={{ gap: 8, marginTop: 4 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 2, gap: 8 }}>
          {TASBEEH_PRESETS.map((p) => {
            const isSelected = selectedPreset.id === p.id;
            return (
              <Press
                key={p.id}
                onPress={() => {
                  setSelectedPreset(p);
                  setTarget(p.target);
                  setSessionCount(0);
                }}
                label={p.text}
                style={{
                  paddingHorizontal: 14,
                  height: 38,
                  borderRadius: r(14),
                  backgroundColor: isSelected ? t.goldSoft : t.card,
                  borderWidth: 1.5,
                  borderColor: isSelected ? t.goldInk : t.line,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Txt size={13} weight={isSelected ? 700 : 500} color={isSelected ? t.goldInk : t.ink} numberOfLines={1}>
                  {p.text}
                </Txt>
              </Press>
            );
          })}
          {customList.map((txt, idx) => {
            const isSel = selectedPreset.text === txt;
            return (
              <Press
                key={`custom_${idx}`}
                onPress={() => {
                  setSelectedPreset({
                    id: `custom_${idx}`,
                    text: txt,
                    target: target || 33,
                    virtue: 'صيغة مخصصة',
                    ref: 'مخصص',
                  });
                  setSessionCount(0);
                }}
                label={txt}
                style={{
                  paddingHorizontal: 14,
                  height: 38,
                  borderRadius: r(14),
                  backgroundColor: isSel ? t.goldSoft : t.card,
                  borderWidth: 1.5,
                  borderColor: isSel ? t.goldInk : t.line,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Txt size={13} weight={isSel ? 700 : 500} color={isSel ? t.goldInk : t.ink}>
                  {txt}
                </Txt>
              </Press>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. Active Dhikr Display Banner */}
      <Card
        variant="app"
        radius={22}
        pad={18}
        style={{
          alignItems: 'center',
          backgroundColor: t.card,
          borderWidth: 1,
          borderColor: t.line,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 5,
            borderRadius: 12,
            backgroundColor: t.goldSoft,
            marginBottom: 12,
          }}>
          <Icon d={ICON.sparkle} size={13} color={t.goldInk} sw={2} />
          <Txt size={12} weight={700} color={t.goldInk}>
            الذِّكْرُ الْمُخْتَارُ
          </Txt>
        </View>
        <Txt
          font="display"
          size={23}
          weight={700}
          color={t.primary}
          align="center"
          lh={1.75}
          style={{
            paddingTop: 8,
            paddingBottom: 4,
            paddingHorizontal: 8,
          }}>
          {selectedPreset.text}
        </Txt>
      </Card>

      {/* 3. The Grand Tasbeeh Dial (Interactive beaded counter ring) */}
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <View style={{ width: DIAL_SIZE, height: DIAL_SIZE, alignItems: 'center', justifyContent: 'center' }}>
          {/* SVG Progress Ring and Beads */}
          <Svg width={DIAL_SIZE} height={DIAL_SIZE} style={{ position: 'absolute' }}>
            {/* Background track circle */}
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={TRACK_RADIUS}
              stroke="rgba(196, 166, 106, 0.18)"
              strokeWidth={7}
              fill="none"
            />

            {/* Glowing Golden Progress Arc */}
            {target > 0 && (
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={TRACK_RADIUS}
                stroke="#C4A66A"
                strokeWidth={7}
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
              />
            )}

            {/* Traditional 33 prayer beads along circumference */}
            {target === 33 &&
              Array.from({ length: 33 }).map((_, idx) => {
                const angle = (idx * 2 * Math.PI) / 33 - Math.PI / 2;
                const bx = CENTER + TRACK_RADIUS * Math.cos(angle);
                const by = CENTER + TRACK_RADIUS * Math.sin(angle);
                const isPassed = sessionCount > idx;
                return (
                  <Circle
                    key={idx}
                    cx={bx}
                    cy={by}
                    r={isPassed ? 3.5 : 2}
                    fill={isPassed ? '#D4AF37' : 'rgba(196, 166, 106, 0.35)'}
                  />
                );
              })}
          </Svg>

          {/* Central Touch Dial */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`تسبيح: ${sessionCount}`}
            onPress={handleTap}
            style={({ pressed }) => [
              {
                width: 196,
                height: 196,
                borderRadius: 98,
                backgroundColor: pressed ? '#0A241E' : '#113B32',
                borderWidth: 2,
                borderColor: pressed ? '#E5C378' : 'rgba(196, 166, 106, 0.45)',
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: pressed ? 0.96 : 1 }],
                boxShadow: pressed ? '0px 0px 10px rgba(196,166,106,.3)' : '0px 0px 22px rgba(17,59,50,.45)',
              },
            ]}>
            <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              {/* Cycle label */}
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 2,
                  borderRadius: 10,
                  backgroundColor: 'rgba(196, 166, 106, 0.18)',
                }}>
                <Txt size={11} weight={600} color="#E5C378">
                  {cycles > 0 ? `الدورة ${cycles + 1}` : 'الدورة ١'}
                </Txt>
              </View>

              {/* Main counter number */}
              <Txt
                font="display"
                size={54}
                weight={700}
                color="#FAF8F2"
                ltr
                style={{ lineHeight: 58, marginVertical: 2 }}>
                {sessionCount}
              </Txt>

              {/* Target / Free reminder */}
              <Txt size={13} weight={600} color="#C4A66A">
                {target > 0 ? `من ${target}` : 'تسبيح حر'}
              </Txt>
            </View>
          </Pressable>
        </View>

        <Txt size={12} color={t.muted} style={{ marginTop: 8 }}>
          المس القرص للتسبيح
        </Txt>
      </View>

      {/* 4. Target selector pills */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Txt size={13} weight={600} color={t.muted}>
          الهدف:
        </Txt>
        {[
          { label: '33', val: 33 },
          { label: '100', val: 100 },
          { label: 'مفتوح', val: 0 },
        ].map((item) => {
          const active = target === item.val;
          return (
            <Press
              key={item.label}
              onPress={() => {
                setTarget(item.val);
                setSessionCount(0);
              }}
              label={`هدف ${item.label}`}
              style={{
                paddingHorizontal: 16,
                height: 34,
                borderRadius: r(12),
                backgroundColor: active ? pc : t.card,
                borderWidth: 1,
                borderColor: active ? pc : t.line,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Txt size={13} weight={active ? 700 : 500} color={active ? '#FFFFFF' : t.ink}>
                {item.label}
              </Txt>
            </Press>
          );
        })}
      </View>

      {/* 5. Vibration strength selector */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 2 }}>
        <Icon d={VIBRATE_ICON} size={15} color={hapticLevel !== 'off' ? t.goldInk : t.muted} sw={2} />
        <Txt size={12} weight={600} color={t.muted}>
          الاهتزاز:
        </Txt>
        {(['off', 'light', 'medium', 'strong'] as const).map((lvl) => {
          const isAct = hapticLevel === lvl;
          const labels: Record<HapticLevel, string> = {
            off: 'معطل',
            light: 'خفيف',
            medium: 'متوسط',
            strong: 'قوي',
          };
          return (
            <Press
              key={lvl}
              onPress={() => {
                setHapticLevel(lvl);
                if (lvl !== 'off' && Platform.OS !== 'web') {
                  Vibration.vibrate(HAPTIC_DURATIONS[lvl]);
                }
              }}
              label={labels[lvl]}
              style={{
                paddingHorizontal: 10,
                height: 28,
                borderRadius: 14,
                backgroundColor: isAct ? (lvl === 'off' ? t.soft : t.goldSoft) : t.card,
                borderWidth: 1,
                borderColor: isAct ? (lvl === 'off' ? t.muted : t.goldInk) : t.line,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Txt size={11} weight={isAct ? 700 : 500} color={isAct ? (lvl === 'off' ? t.ink : t.goldInk) : t.muted}>
                {labels[lvl]}
              </Txt>
            </Press>
          );
        })}
      </View>

      {/* 6. Statistics strip */}
      <Card
        variant="app"
        radius={18}
        pad={12}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          backgroundColor: t.card,
          borderWidth: 1,
          borderColor: t.line,
        }}>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Txt size={12} color={t.muted}>
            تسبيحات اليوم
          </Txt>
          <Txt size={20} weight={700} color={t.primary} ltr>
            {todayCount.toLocaleString('en-US')}
          </Txt>
        </View>
        <View style={{ width: 1, height: 28, backgroundColor: t.line }} />
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Txt size={12} color={t.muted}>
            الدورات المنجزة
          </Txt>
          <Txt size={20} weight={700} color={t.goldInk} ltr>
            {cycles.toLocaleString('en-US')}
          </Txt>
        </View>
        <View style={{ width: 1, height: 28, backgroundColor: t.line }} />
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Txt size={12} color={t.muted}>
            المجموع الكلي
          </Txt>
          <Txt size={20} weight={700} color={t.ink} ltr>
            {totalCount.toLocaleString('en-US')}
          </Txt>
        </View>
      </Card>

      {/* 7. Virtue of the selected Dhikr */}
      {selectedPreset.virtue ? (
        <Card
          variant="app"
          radius={18}
          pad={16}
          style={{
            gap: 8,
            backgroundColor: t.card,
            borderWidth: 1,
            borderColor: t.line,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon d={ICON.sparkle} size={16} color={t.goldInk} sw={2} />
            <Txt size={14} weight={700} color={t.goldInk}>
              فضل هذا الذكر من السنة النبوية
            </Txt>
          </View>
          <Txt size={14} lh={1.8} color={t.ink}>
            «{selectedPreset.virtue}»
          </Txt>
          <Txt size={12} color={t.muted} ltr style={{ alignSelf: 'flex-start' }}>
            {selectedPreset.ref}
          </Txt>
        </Card>
      ) : null}

      {/* 8. Action links */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14, marginVertical: 6 }}>
        <Press onPress={() => setModalOpen(true)} label="إضافة ذكر خاص">
          <Txt size={13} weight={600} color={t.primary}>
            + إضافة صيغة مخصصة
          </Txt>
        </Press>
        <Txt size={13} color={t.muted}>
          ·
        </Txt>
        <Press
          onPress={() => {
            resetTasbeehDay();
            flash('تم تصفير إحصائية اليوم');
          }}
          label="تصفير عداد اليوم">
          <Txt size={13} weight={500} color={t.muted}>
            تصفير عداد اليوم
          </Txt>
        </Press>
      </View>

      {/* Custom Dhikr Modal */}
      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 400, backgroundColor: t.card, borderRadius: r(20), padding: 20, gap: 14, borderWidth: 1, borderColor: t.line }}>
            <Txt font="display" size={20} weight={700}>
              إضافة صيغة تسبيح خاصة
            </Txt>
            <TextInput
              value={customText}
              onChangeText={setCustomText}
              placeholder="اكتب صيغة الذكر هنا…"
              placeholderTextColor={t.muted}
              style={{
                borderWidth: 1,
                borderColor: t.line,
                borderRadius: r(12),
                padding: 12,
                fontSize: 16,
                color: t.ink,
                textAlign: 'right',
                backgroundColor: t.bg,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
              <Press
                onPress={() => setModalOpen(false)}
                label="إلغاء"
                style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: r(12), backgroundColor: t.soft }}>
                <Txt size={14} color={t.muted}>
                  إلغاء
                </Txt>
              </Press>
              <Press
                onPress={handleAddCustom}
                label="إضافة"
                style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: r(12), backgroundColor: pc }}>
                <Txt size={14} weight={700} color="#FFFFFF">
                  إضافة
                </Txt>
              </Press>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
