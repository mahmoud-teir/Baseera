/**
 * شاشة تحديد الهدف والمسار الأولي — Onboarding Intent Selector
 * تتيح للمستخدم الجديد فهم وجهته واختيار المسار الأنسب له بكل طمأنينة ووضوح
 */
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/core/Button';
import { Icon } from '@/components/core/Icon';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { Logo } from '@/components/layout/Ornament';
import { Column } from '@/components/layout/Screen';
import { ICON } from '@/data/structural';
import { useApp } from '@/state/app-store';
import { useTheme } from '@/theme/theme';

interface PathOption {
  id: 'tawheed' | 'academy' | 'daily';
  title: string;
  badge: string;
  desc: string;
  icon: string;
  route: string;
}

const PATH_OPTIONS: PathOption[] = [
  {
    id: 'tawheed',
    badge: 'الأصل والأساس',
    title: 'تثبيت العقيدة والمنهج الحق أولاً',
    desc: 'خوض بوابات التوحيد واليقين السبع، التعرف على براهين أهل السنة والجماعة، رد الشبهات، ونيل وسام التوحيد.',
    icon: ICON.star8,
    route: '/tawheed/intro',
  },
  {
    id: 'academy',
    badge: 'طلب العلم المؤصل',
    title: 'دراسة العلوم الشرعية بالتدريج',
    desc: 'بدء الدروس المنهجية خطوة بخطوة في الفقه والحديث والتفسير والسيرة والتزكية عبر مراحل الأكاديمية الأربع.',
    icon: ICON.tafsir,
    route: '/academy/map',
  },
  {
    id: 'daily',
    badge: 'الزاد اليومي',
    title: 'المحيا والعبادات اليومية',
    desc: 'مواقيت الصلاة الدقيقة والقبلة، المصحف الشريف المفسر، أذكار الصباح والمساء، المسبحة الذكية، ومتابعة السنن.',
    icon: ICON.tasbeeh,
    route: '/(tabs)/(home)',
  },
];

export default function OnboardingIntentScreen() {
  const { pc, gc, r } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const set = useApp((s) => s.set);

  const [selectedPath, setSelectedPath] = useState<'tawheed' | 'academy' | 'daily'>('tawheed');

  const handleStart = (route?: string) => {
    set({ onboarded: true });
    const target = route ?? PATH_OPTIONS.find((p) => p.id === selectedPath)?.route ?? '/(tabs)/(home)';
    router.replace(target as any);
  };

  return (
    <Column bg={pc}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: Math.max(30, insets.top + 10),
          paddingBottom: Math.max(30, insets.bottom + 20),
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}>
        {/* الشعار والعنوان العلوي */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Logo size={68} pc={pc} gc={gc} />
          <Txt size={13} color={gc} ltr fixed style={{ letterSpacing: 4, marginTop: 8 }}>
            BASEERAH
          </Txt>
          <Txt size={24} weight={700} color="#FFFFFF" lh={1.4} align="center" style={{ marginTop: 12 }}>
            ما هو مقصدك الأول من بصيرة؟
          </Txt>
          <Txt size={14} color="#CFE0DA" lh={1.6} align="center" style={{ marginTop: 6, paddingHorizontal: 16 }}>
            اختر البداية الأنسب لك اليوم. يمكنك استكشاف وتصفح كافة الأقسام والميزات لاحقاً في أي وقت بكل حرية.
          </Txt>
        </View>

        {/* بطاقات الخيارات الثلاثة */}
        <View style={{ width: '100%', gap: 14, marginBottom: 24 }}>
          {PATH_OPTIONS.map((opt) => {
            const isSelected = selectedPath === opt.id;

            return (
              <Press
                key={opt.id}
                onPress={() => setSelectedPath(opt.id)}
                label={opt.title}
                style={{
                  padding: 16,
                  borderRadius: r(18),
                  backgroundColor: isSelected ? 'rgba(197, 155, 39, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                  borderWidth: 1.5,
                  borderColor: isSelected ? gc : 'rgba(255, 255, 255, 0.15)',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 14,
                }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: isSelected ? gc : 'rgba(255, 255, 255, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}>
                  <Icon d={opt.icon} size={22} color={isSelected ? '#182D29' : '#FFFFFF'} />
                </View>

                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <Txt size={11} weight={700} color={isSelected ? gc : '#CFE0DA'}>
                      {opt.badge}
                    </Txt>
                    {isSelected && (
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 8,
                          backgroundColor: gc,
                        }}>
                        <Txt size={10} weight={700} color="#182D29">
                          المحدد ✓
                        </Txt>
                      </View>
                    )}
                  </View>

                  <Txt size={16} weight={700} color="#FFFFFF" lh={1.4}>
                    {opt.title}
                  </Txt>
                  <Txt size={13} color="#CFE0DA" lh={1.5}>
                    {opt.desc}
                  </Txt>
                </View>
              </Press>
            );
          })}
        </View>

        {/* أزرار المتابعة */}
        <View style={{ width: '100%', gap: 10 }}>
          <Button size="xl" tone="ivory" onPress={() => handleStart()}>
            الانطلاق بالمسار المختار ←
          </Button>

          <Press
            onPress={() => handleStart('/(tabs)/(home)')}
            label="استكشاف كافة أقسام التطبيق مباشرة"
            style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }}>
            <Txt size={14} weight={600} color="#CFE0DA">
              أو استكشاف كافة أقسام التطبيق مباشرة
            </Txt>
          </Press>
        </View>
      </ScrollView>
    </Column>
  );
}
