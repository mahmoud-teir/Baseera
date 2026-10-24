/**
 * دليل بصيرة الإيماني — Roadmap & User Guide
 * مرجع إرشادي شامل يوضح للمستخدم خريطة السير المتكاملة بين العقيدة، والدروس، والعبادة اليومية
 */
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Card } from '@/components/core/Card';
import { Icon } from '@/components/core/Icon';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { RoundBackHeader, Screen } from '@/components/layout/Screen';
import { ICON } from '@/data/structural';
import { useTheme } from '@/theme/theme';

export default function GuideScreen() {
  const { t, gc, r, dark } = useTheme();
  const router = useRouter();

  return (
    <Screen bg={t.bg}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <RoundBackHeader title="دليل بصيرة الإيماني" href="/" size={20} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 40,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}>
        {/* البطاقة الترحيبية الكبرى */}
        <Card
          pad={20}
          radius={22}
          style={{
            backgroundColor: dark ? '#15241E' : '#EBF5F0',
            borderColor: gc,
            borderWidth: 1.5,
            gap: 10,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: t.goldSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon d={ICON.compass} size={24} color={gc} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt size={12} weight={700} color={gc}>
                خريطة السير الإيماني
              </Txt>
              <Txt size={18} weight={700} color={t.ink}>
                كيف تستفيد من تطبيق «بصيرة»؟
              </Txt>
            </View>
          </View>
          <Txt size={14} color={t.ink} lh={1.7}>
            صُمم تطبيق «بصيرة» ليكون منصة متكاملة ورفيقاً يومياً للمسلم في رحلته إلى الله؛ يجمع بين صيانة الأصل والعقيدة، والتدرج في طلب العلم المؤصل، وعمارة الأوقات بالعبادة والذكر من الكتاب وصحيح السنة بفهم سلف الأمة.
          </Txt>
        </Card>

        {/* عنوان المحطات الأربع */}
        <Txt size={17} weight={700} color={t.ink} style={{ marginTop: 4 }}>
          أركان الرحلة في بصيرة (٤ محطات متكاملة)
        </Txt>

        {/* 1. المحطة الأولى: بوابات التوحيد */}
        <Card pad={18} radius={18} style={{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={14} weight={700} color={gc}>١</Txt>
              </View>
              <Txt size={16} weight={700} color={t.ink}>
                بوابات التوحيد واليقين (الأساس المتين)
              </Txt>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: dark ? '#18241F' : t.goldSoft }}>
              <Txt size={11} weight={700} color={gc}>الأصل الأول</Txt>
            </View>
          </View>

          <Txt size={13} color={t.muted} lh={1.6}>
            التوحيد أول واجب على المكلف وآخر واجب. ابدأ رحلتك باجتياز البوابات السبع: معرفة أقسام التوحيد، شروط لا إله إلا الله، التحصن من الشرك ونواقض الإسلام، إفراد الله بالحكم والتحاكم لشريعته، الكفر بالطاغوت، الولاء والبراء، ومعالم الطائفة المنصورة.
          </Txt>

          <Button
            size="md"
            onPress={() => router.push('/tawheed' as any)}
            style={{ backgroundColor: gc, marginTop: 4 }}>
            <Txt size={14} weight={700} color="#182D29">
              دخول بوابات التوحيد واليقين ←
            </Txt>
          </Button>
        </Card>

        {/* 2. المحطة الثانية: الأكاديمية الشرعية */}
        <Card pad={18} radius={18} style={{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={14} weight={700} color={gc}>٢</Txt>
              </View>
              <Txt size={16} weight={700} color={t.ink}>
                الأكاديمية الشرعية (البناء المتدرج)
              </Txt>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: dark ? '#18241F' : t.goldSoft }}>
              <Txt size={11} weight={700} color={gc}>العلم المؤصل</Txt>
            </View>
          </View>

          <Txt size={13} color={t.muted} lh={1.6}>
            منهج تعليمي منظم مقسم إلى ٤ مراحل متدرجة: من لم يبدأ بعد، المبتدئ، المتوسط، والمتقدم. يدرس الطالب أسبوعياً دروساً مؤصلة في: الفقه، الحديث، التفسير، السيرة، والتزكية، مع بنك أسئلة واختبارات لترسيخ المفاهيم.
          </Txt>

          <Button
            size="md"
            tone="ivory"
            onPress={() => router.push('/academy/map' as any)}
            style={{ marginTop: 4 }}>
            استكشاف خريطة الأكاديمية والدروس ←
          </Button>
        </Card>

        {/* 3. المحطة الثالثة: العبادة والمحيا اليومي */}
        <Card pad={18} radius={18} style={{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={14} weight={700} color={gc}>٣</Txt>
              </View>
              <Txt size={16} weight={700} color={t.ink}>
                المحيا والعبادة اليومية (ثمار العمل)
              </Txt>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: dark ? '#18241F' : t.goldSoft }}>
              <Txt size={11} weight={700} color={gc}>اليوم والليلة</Txt>
            </View>
          </View>

          <Txt size={13} color={t.muted} lh={1.6}>
            العلم يهتف بالعمل؛ اجعل بصيرة رفيق يومك: إقامة الصلوات في مواقيتها الدقيقة وتحديد القبلة، ورد القرآن وتفسير السعدي، ومتابعة ختمتك، وأذكار الصباح والمساء بعدادات ذاتية، والمسبحة التفاعلية، ومتابعة السنن الرواتب.
          </Txt>

          {/* أزرار سريعة للأدوات اليومية */}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {[
              { label: 'المصحف والختمة', href: '/(tabs)/quran' },
              { label: 'الأذكار المأثورة', href: '/(tabs)/(home)/prayer/adhkar/sabah' },
              { label: 'المسبحة الذكية', href: '/(tabs)/(home)/tasbeeh' },
              { label: 'مواقيت الصلاة', href: '/(tabs)/(home)/prayer' },
            ].map((btn, bIdx) => (
              <Press
                key={bIdx}
                onPress={() => router.push(btn.href as any)}
                label={btn.label}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: r(10),
                  backgroundColor: dark ? '#18241F' : '#F4F9F6',
                  borderWidth: 1,
                  borderColor: t.line,
                }}>
                <Txt size={12} weight={600} color={t.ink}>
                  {btn.label}
                </Txt>
              </Press>
            ))}
          </View>
        </Card>

        {/* 4. المحطة الرابعة: المكتبة والموسوعة الشاملة */}
        <Card pad={18} radius={18} style={{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={14} weight={700} color={gc}>٤</Txt>
              </View>
              <Txt size={16} weight={700} color={t.ink}>
                المكتبة والموسوعة الجامعة (الزاد الدائم)
              </Txt>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: dark ? '#18241F' : t.goldSoft }}>
              <Txt size={11} weight={700} color={gc}>المراجع والكتب</Txt>
            </View>
          </View>

          <Txt size={13} color={t.muted} lh={1.6}>
            مئات أمهات الكتب المحققة والمبوبة، أسماء الله الحسنى الـ 99 مع شواهدها وتفسيرها العقدي والتعبد بها، وموسوعة الأدعية القرآنية والنبوية الجامعة لكل حوائج الدنيا والآخرة تعمل بالكامل بلا إنترنت.
          </Txt>

          <Button
            size="md"
            tone="ivory"
            onPress={() => router.push('/(tabs)/(home)/more' as any)}
            style={{ marginTop: 4 }}>
            استعراض الموسوعة والمكتبة كاملة ←
          </Button>
        </Card>

        {/* وصايا ذهبية لطالب النجاة */}
        <Card
          pad={16}
          radius={18}
          style={{
            backgroundColor: dark ? '#1C1F1D' : '#FBFBFB',
            borderColor: t.line,
            borderWidth: 1,
            gap: 8,
          }}>
          <Txt size={15} weight={700} color={gc}>
            ✨ وصايا سلفية للسالك إلى الله:
          </Txt>
          <Txt size={13} color={t.ink} lh={1.7}>
            • <Txt weight={700} color={t.ink}>إخلاص النية:</Txt> تعلم لله وحده لرفع الجهل عن نفسك وعن غيرك.{'\n'}
            • <Txt weight={700} color={t.ink}>التدرج:</Txt> قليل دائم يثبت في القلب خير من كثير منقطع.{'\n'}
            • <Txt weight={700} color={t.ink}>مقرنة العلم بالعمل:</Txt> ثمرة التوحيد والعلم الخشية والاستقامة.
          </Txt>
        </Card>
      </ScrollView>
    </Screen>
  );
}
