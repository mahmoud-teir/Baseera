/**
 * مسار بوابات التوحيد واليقين — Tawheed & Sunnah Gateways Roadmap
 * عرض تفاعلي للبوابات السبع مع الأقفال ومعدل التقدم والأوسمة
 */
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ScrollView } from 'react-native';

import { Card } from '@/components/core/Card';
import { Icon, LockIcon } from '@/components/core/Icon';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { RoundBackHeader, Screen } from '@/components/layout/Screen';
import { ICON } from '@/data/structural';
import { TAWHEED_GATES, type TawheedGate } from '@/data/tawheedGatewaysData';
import { useTawheed } from '@/state/tawheed-store';
import { useTheme } from '@/theme/theme';

export default function TawheedRoadmapScreen() {
  const { t, gc, r, dark } = useTheme();
  const router = useRouter();
  const unlockedGates = useTawheed((s) => s.unlockedGates);
  const completedGates = useTawheed((s) => s.completedGates);
  const quizScores = useTawheed((s) => s.quizScores);

  const completedCount = Object.keys(completedGates).length;
  const totalGates = TAWHEED_GATES.length;
  const progressRatio = totalGates > 0 ? (completedCount / totalGates) * 100 : 0;
  const isMastered = completedCount >= totalGates;

  const handleGatePress = (gate: TawheedGate, isUnlocked: boolean) => {
    if (!isUnlocked) return;
    router.push(`/tawheed/${gate.id}` as any);
  };

  return (
    <Screen bg={t.bg}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <RoundBackHeader title="بوابات التوحيد واليقين" href="/" size={24} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}>
        {/* بطاقة التقديم ونسبة الإنجاز */}
        <Card
          pad={18}
          radius={20}
          style={{
            marginBottom: 20,
            borderColor: isMastered ? gc : t.line,
            borderWidth: 1,
            backgroundColor: t.card,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: isMastered ? 'rgba(197, 155, 39, 0.2)' : t.goldSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon d={ICON.star8} size={22} color={gc} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt size={17} weight={700} color={t.ink} numberOfLines={2}>
                  معالم الدين الحق والطائفة المنصورة
                </Txt>
                <Txt size={12} color={t.muted} style={{ marginTop: 2 }}>
                  أصول العقيدة والتحاكم وبراهين أهل السنة والجماعة
                </Txt>
              </View>
            </View>
          </View>

          {/* شريط الإنجاز */}
          <View style={{ marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <Txt size={13} weight={600} color={t.ink}>
                التقدم في البوابات
              </Txt>
              <Txt size={13} weight={700} color={gc}>
                {completedCount} من {totalGates} بوابات
              </Txt>
            </View>
            <ProgressBar value={progressRatio} color={gc} track={t.line} height={8} />
          </View>

          {/* وسام الإتقان عند إكمال البوابات */}
          {isMastered && (
            <View
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: r(12),
                backgroundColor: 'rgba(197, 155, 39, 0.12)',
                borderWidth: 1,
                borderColor: gc,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}>
              <Icon d={ICON.star8} size={28} color={gc} />
              <View style={{ flex: 1 }}>
                <Txt size={14} weight={700} color={gc}>
                  مبارك! حزت وسام «بصيرة التوحيد واليقين»
                </Txt>
                <Txt size={12} color={t.ink} lh={1.4} style={{ marginTop: 2 }}>
                  أتممت مدارسة أصول التوحيد وإفراد الله بالحكم وبراهين الطائفة المنصورة بحمد الله وفضله.
                </Txt>
              </View>
            </View>
          )}
        </Card>

        {/* قائمة البوابات السبع التفاعلية */}
        <View style={{ gap: 14 }}>
          {TAWHEED_GATES.map((gate) => {
            const isUnlocked = !!unlockedGates[gate.id];
            const isCompleted = !!completedGates[gate.id];
            const score = quizScores[gate.id];

            return (
              <Press
                key={gate.id}
                onPress={() => handleGatePress(gate, isUnlocked)}
                disabled={!isUnlocked}
                label={`البوابة ${gate.number}: ${gate.title}`}>
                <Card
                  pad={16}
                  radius={18}
                  style={{
                    backgroundColor: isCompleted
                      ? dark
                        ? '#132821'
                        : '#F2F8F5'
                      : isUnlocked
                        ? t.card
                        : dark
                          ? '#161C1A'
                          : '#F6F6F6',
                    borderColor: isCompleted
                      ? 'rgba(46, 125, 90, 0.45)'
                      : isUnlocked
                        ? gc
                        : t.line,
                    borderWidth: 1,
                    opacity: isUnlocked ? 1 : 0.65,
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, width: '100%' }}>
                    {/* رقم البوابة أو حالة القفل */}
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        flexShrink: 0,
                        borderRadius: 22,
                        backgroundColor: isCompleted
                          ? t.primary
                          : isUnlocked
                            ? 'rgba(197, 155, 39, 0.16)'
                            : dark
                              ? '#222B27'
                              : '#EAEAEA',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: isCompleted ? t.primary : isUnlocked ? gc : 'transparent',
                      }}>
                      {isCompleted ? (
                        <Txt size={18} weight={700} color="#FFFFFF">
                          ✓
                        </Txt>
                      ) : isUnlocked ? (
                        <Txt font="display" size={17} weight={700} color={gc}>
                          {gate.number}
                        </Txt>
                      ) : (
                        <LockIcon size={20} color={t.muted} />
                      )}
                    </View>

                    {/* تفاصيل البوابة */}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <Txt size={12} weight={700} color={isUnlocked ? gc : t.muted} style={{ flexShrink: 1 }}>
                          البوابة {gate.number}
                        </Txt>
                        {isCompleted && (
                          <View
                            style={{
                              backgroundColor: 'rgba(46, 125, 90, 0.15)',
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 99,
                            }}>
                            <Txt size={11} weight={600} color={t.primary}>
                              مكتملة · {score ?? 100}%
                            </Txt>
                          </View>
                        )}
                        {!isCompleted && isUnlocked && (
                          <View
                            style={{
                              backgroundColor: 'rgba(197, 155, 39, 0.15)',
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 99,
                            }}>
                            <Txt size={11} weight={600} color={gc}>
                              مفتوحة الآن
                            </Txt>
                          </View>
                        )}
                        {!isUnlocked && (
                          <Txt size={11} color={t.muted}>
                            مقفلة 🔒
                          </Txt>
                        )}
                      </View>

                      <Txt size={16} weight={700} color={t.ink} style={{ marginTop: 4 }}>
                        {gate.title}
                      </Txt>

                      <Txt size={13} color={t.muted} lh={1.4} style={{ marginTop: 2 }}>
                        {gate.subtitle}
                      </Txt>

                      {/* شارة المعرفة المستفادة */}
                      <View
                        style={{
                          marginTop: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          alignSelf: 'flex-start',
                          maxWidth: '100%',
                          backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: r(8),
                        }}>
                        <View style={{ flexShrink: 0 }}>
                          <Icon d={ICON.star8} size={14} color={isUnlocked ? gc : t.muted} />
                        </View>
                        <Txt size={11} weight={600} color={isUnlocked ? t.ink : t.muted} style={{ flexShrink: 1 }} numberOfLines={1}>
                          {gate.badgeTitle}
                        </Txt>
                      </View>
                    </View>
                  </View>
                </Card>
              </Press>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}
