/**
 * شاشة الدخول التمهيدي — بوابات التوحيد واليقين
 * «معالم الدين الحق وأدلة الطائفة المنصورة» قبل الدخول للتطبيق
 */
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/core/Button';
import { Card } from '@/components/core/Card';
import { Icon } from '@/components/core/Icon';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { WelcomeOrnament } from '@/components/layout/Ornament';
import { ICON } from '@/data/structural';
import { useApp } from '@/state/app-store';
import { useTawheed } from '@/state/tawheed-store';
import { useTheme } from '@/theme/theme';

export default function TawheedIntroScreen() {
  const { pc, gc, wOp, r } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setApp = useApp((s) => s.set);
  const setHasSeenIntro = useTawheed((s) => s.setHasSeenIntro);

  const handleEnterGateways = () => {
    setHasSeenIntro(true);
    setApp({ onboarded: true });
    router.replace('/tawheed' as any);
  };

  const handleSkipToHome = () => {
    setHasSeenIntro(true);
    setApp({ onboarded: true });
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: pc }}>
      <StatusBar style="light" />
      <WelcomeOrnament opacity={wOp} gc={gc} />

      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(50, insets.top + 20),
          paddingBottom: Math.max(40, insets.bottom + 24),
          paddingHorizontal: 20,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}>
        {/* شارة التوحيد العلوية */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(197, 155, 39, 0.15)',
            borderWidth: 1,
            borderColor: gc,
            borderRadius: 99,
            paddingHorizontal: 16,
            paddingVertical: 6,
            gap: 8,
            marginBottom: 20,
          }}>
          <Icon d={ICON.star8} size={18} color={gc} />
          <Txt size={13} weight={600} color={gc}>
            بصيرة · معالم الدين الحق والبراهين
          </Txt>
        </View>

        {/* العنوان البارز */}
        <Txt font="display" size={32} weight={700} color="#FFFFFF" align="center" lh={1.3}>
          بوابات التوحيد واليقين
        </Txt>
        <Txt size={17} weight={500} color={gc} align="center" style={{ marginTop: 6 }}>
          وبراهين المنهج الحق والطائفة المنصورة
        </Txt>

        <View style={{ width: 48, height: 2, backgroundColor: gc, marginVertical: 18, borderRadius: 2 }} />

        {/* الآية المركزية */}
        <Card
          pad={18}
          radius={18}
          style={{
            width: '100%',
            marginBottom: 20,
            backgroundColor: 'rgba(10, 24, 21, 0.65)',
            borderColor: 'rgba(197, 155, 39, 0.3)',
            borderWidth: 1,
          }}>
          <Txt font="quran" size={20} color="#FFFFFF" align="center" lh={1.8}>
            ﴿قُلْ هَٰذِهِ سَبِيلِي أَدْعُو إِلَى اللَّهِ ۚ عَلَىٰ بَصِيرَةٍ أَنَا وَمَنِ اتَّبَعَنِي ۖ وَسُبْحَانَ اللَّهِ وَمَا أَنَا مِنَ الْمُشْرِكِينَ﴾
          </Txt>
          <Txt size={13} color={gc} align="center" style={{ marginTop: 8 }}>
            [سورة يوسف: ١٠٨]
          </Txt>
        </Card>

        {/* الركائز الأربع التي سيتعلمها المستخدم */}
        <Txt size={14} color="#CFE0DA" align="center" lh={1.6} style={{ marginBottom: 16, paddingHorizontal: 10 }}>
          قبل دخولك للتطبيق، ندعوك للمرور عبر ٧ بوابات علمية مؤصلة بالدليل القاطع من الكتاب والسنة وأقوال أئمة السلف، لترسيخ العقيدة الصافية في قلبك:
        </Txt>

        <View style={{ width: '100%', gap: 10, marginBottom: 28 }}>
          {[
            {
              title: 'التوحيد الخالص وشروطه',
              desc: 'الفرق الفارق بين توحيد الربوبية والألوهية، وشروط لا إله إلا الله السبعة.',
              icon: ICON.kaaba,
            },
            {
              title: 'التحاكم وإفراد الله بالحكم',
              desc: 'إفراد الله بالتشريع وتفصيل كفر دون كفر ورد غلو الخوارج وتفريط المرجئة.',
              icon: ICON.scales,
            },
            {
              title: 'الكفر بالطاغوت والولاء والبراء',
              desc: 'رؤوس الطواغيت وكيفية اجتنابهم، وحقوق الأخوة الإيمانية والعدل مع الخلق.',
              icon: ICON.heart,
            },
            {
              title: 'معالم الطائفة المنصورة',
              desc: 'حديث الافتراق، ولزوم الأثر، والثبات عند غربة الإسلام وفساد الزمان.',
              icon: ICON.star8,
            },
          ].map((item, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
                borderRadius: r(14),
                padding: 12,
                gap: 12,
              }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  flexShrink: 0,
                  backgroundColor: 'rgba(197, 155, 39, 0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon d={item.icon} size={20} color={gc} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt size={15} weight={700} color="#FFFFFF">
                  {item.title}
                </Txt>
                <Txt size={12} color="#A7C2B9" lh={1.4} style={{ marginTop: 2 }}>
                  {item.desc}
                </Txt>
              </View>
            </View>
          ))}
        </View>

        {/* أزرار الإجراءات */}
        <View style={{ width: '100%', gap: 10 }}>
          <Button
            size="xl"
            onPress={handleEnterGateways}
            style={{ backgroundColor: gc }}>
            <Txt size={17} weight={700} color="#182D29">
              دخول بوابات التوحيد واليقين
            </Txt>
          </Button>

          <Press
            onPress={handleSkipToHome}
            label="الدخول للتطبيق والمتابعة لاحقاً"
            style={{
              minHeight: 46,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 20,
              borderRadius: r(12),
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            }}>
            <Txt size={14} weight={600} color="#CFE0DA">
              المتابعة إلى الرئيسية (يمكنك العودة للمسار بأي وقت)
            </Txt>
          </Press>
        </View>
      </ScrollView>
    </View>
  );
}
