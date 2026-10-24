/**
 * بوابة المزيد — Hub for all Islamic daily devotions, spiritual utilities, and knowledge resources.
 * De-clutters the Home screen into a serene, structured Islamic portal.
 */
import { useRouter, type Href } from 'expo-router';
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Icon } from '@/components/core/Icon';
import { Txt } from '@/components/core/Txt';
import { RoundBackHeader, Screen } from '@/components/layout/Screen';
import { ICON } from '@/data/structural';
import { useTheme } from '@/theme/theme';

interface MoreItem {
  id: string;
  label: string;
  desc: string;
  href: Href;
  icon: string;
  badge?: string;
}

interface MoreSection {
  title: string;
  subtitle: string;
  items: MoreItem[];
}

const SECTIONS: MoreSection[] = [
  {
    title: 'دليل بصيرة وخريطة الطريق',
    subtitle: 'إرشادات السير والتدرج للمسلم وطالب العلم',
    items: [
      {
        id: 'guide',
        label: 'كيف تستفيد من تطبيق بصيرة؟',
        desc: 'دليل شامل يوضح خطة السير بين بوابات التوحيد، ودروس الأكاديمية، والعبادات اليومية',
        href: '/guide' as Href,
        icon: ICON.compass,
        badge: 'دليل إرشادي',
      },
    ],
  },
  {
    title: 'العقيدة والتوحيد والمنهج الحق',
    subtitle: 'بوابات اليقين ومعالم الطائفة المنصورة وبراهين التوحيد',
    items: [
      {
        id: 'tawheed-gateways',
        label: 'بوابات التوحيد واليقين',
        desc: '٧ بوابات علمية مؤصلة في التوحيد والتحاكم لشرع الله ورد الشبهات ومعالم الفرقة الناجية',
        href: '/tawheed' as Href,
        icon: ICON.star8,
        badge: '٧ بوابات',
      },
      {
        id: 'names',
        label: 'أسماء الله الحسنى الـ 99',
        desc: 'الأسماء الحسنى كاملة مع البحث والتفسير العقدي المؤصل والأدلة الشرعية',
        href: '/names' as Href,
        icon: ICON.names,
        badge: '99 اسمًا',
      },
    ],
  },
  {
    title: 'العبادات والأذكار اليومية',
    subtitle: 'أدوات العبادة والذكر المقرونة بالسنة النبوية',
    items: [
      {
        id: 'tasbeeh',
        label: 'المسبحة الإلكترونية',
        desc: 'عداد تسبيح تفاعلي باللمس مع اهتزازات حسية وحفظ تلقائي للدورات',
        href: '/tasbeeh' as Href,
        icon: ICON.tasbeeh,
        badge: 'تفاعلي',
      },
      {
        id: 'sunan',
        label: 'السنن النبوية اليومية',
        desc: 'متابعة السنن الرواتب، قيام الليل، الضحى، وسنن الصلاة واليوم والليلة',
        href: '/sunan' as Href,
        icon: ICON.sunan,
        badge: 'رواتب وآداب',
      },
      {
        id: 'adhkar',
        label: 'أذكار المسلم الشاملة',
        desc: 'أذكار الصباح والمساء، أدعية ما بعد الصلوات المكتوبة، والنوم والاستيقاظ',
        href: '/prayer' as Href,
        icon: ICON.heart,
        badge: 'حصن المسلم',
      },
      {
        id: 'duas',
        label: 'الأدعية المأثورة الجامعة',
        desc: 'أدعية القرآن الكريم وجوامع دعاء النبي ﷺ مصنفة ومبوبة',
        href: '/duas' as Href,
        icon: ICON.dua,
        badge: 'جوامع الكلم',
      },
    ],
  },
  {
    title: 'القرآن الكريم وتدبره',
    subtitle: 'متابعة التلاوة، الورد، وفهم معاني كتاب الله',
    items: [
      {
        id: 'khatmah',
        label: 'متابع ختمة القرآن الكريم',
        desc: 'تحديد خطة وأيام الختم، ومتابعة الورد القرآني ووتيرة الإنجاز',
        href: '/quran/khatmah' as Href,
        icon: ICON.tabQuran,
        badge: 'مخطط الورد',
      },
      {
        id: 'vocab',
        label: 'مفردات وغريب القرآن',
        desc: 'تفسير معاني المفردات القرآنية الغريبة مع شواهد الآيات وأقوال المفسرين',
        href: '/quran/vocab' as Href,
        icon: ICON.search,
        badge: 'تبيان الألفاظ',
      },
      {
        id: 'tajweed',
        label: 'أحكام التجويد العملية',
        desc: 'أحكام النون الساكنة والتنوين والميم والمدود ومخارج الحروف',
        href: '/quran/tajweed' as Href,
        icon: ICON.doc,
        badge: 'قواعد التلاوة',
      },
    ],
  },
  {
    title: 'الصلاة والتقويم والمواقيت',
    subtitle: 'أحكام الصلاة والقبلة والتقويم الهجري المبارك',
    items: [
      {
        id: 'qibla',
        label: 'بوصلة القبلة ومواقيت الصلاة',
        desc: 'تحديد دقيق لاتجاه الكعبة المشرفة ومواقيت الصلوات الخمس بحسب موقعك',
        href: '/prayer' as Href,
        icon: ICON.compass,
        badge: 'حساس دقيق',
      },
      {
        id: 'hijri',
        label: 'التقويم الهجري والمناسبات',
        desc: 'متابعة التاريخ الهجري الفضيل ومواعيد الصيام وأيام البيض',
        href: '/hijri' as Href,
        icon: ICON.clock,
        badge: 'أم القرى',
      },
    ],
  },
  {
    title: 'المتابعة والإثراء العلمي',
    subtitle: 'قياس إنجازك والاطلاع على كنوز التراث الإسلامي',
    items: [
      {
        id: 'stats',
        label: 'لوحة الإحصائيات الشاملة',
        desc: 'مؤشرات التزامك بالصلوات والأوراد والمسبحة والسنن والدروس',
        href: '/stats' as Href,
        icon: ICON.scales,
        badge: 'إنجاز شامل',
      },
      {
        id: 'quotes',
        label: 'أقوال وحكم العلماء',
        desc: 'درر السلف الصالح وأئمة الهدى في العقيدة والتزكية والعلم',
        href: '/quotes' as Href,
        icon: ICON.pen,
        badge: 'درر السلف',
      },
      {
        id: 'sharia',
        label: 'الموسوعة الشرعية',
        desc: 'مسائل فقهية مؤصلة بالأدلة في العبادات والمعاملات والأحوال',
        href: '/sharia' as Href,
        icon: ICON.fiqh,
        badge: 'فقه مؤصل',
      },
      {
        id: 'stories',
        label: 'قصص الأنبياء والصحابة',
        desc: 'سير الأنبياء والمرسلين والملائكة الأبرار والصحابة الكرام والدروس والعبر',
        href: '/stories' as Href,
        icon: ICON.user,
        badge: 'سير وعبر',
      },
    ],
  },
];

export default function MoreScreen() {
  const { t, r } = useTheme();
  const router = useRouter();

  return (
    <Screen gap={18} padBottom={32}>
      <RoundBackHeader title="بوابة العبادات والأقسام" href="/" />

      <View style={{ backgroundColor: t.goldSoft, borderRadius: r(18), padding: 14, gap: 4 }}>
        <Txt size={15} weight={700} color={t.goldInk}>
          ✨ جميع خدمات وأدوات بصيرة بين يديك
        </Txt>
        <Txt size={13} color={t.goldInk} lh={1.6}>
          قِسم متكامل يجمع لك أدوات الذكر والعبادة والقرآن والإحصائيات ومصادر العلم المؤصلة.
        </Txt>
      </View>

      {SECTIONS.map((section) => (
        <View key={section.title} style={{ gap: 10 }}>
          <View style={{ gap: 2, paddingHorizontal: 2 }}>
            <Txt font="display" size={20} weight={700} color={t.ink}>
              {section.title}
            </Txt>
            <Txt size={13} color={t.muted}>
              {section.subtitle}
            </Txt>
          </View>

          <View style={{ gap: 8 }}>
            {section.items.map((item) => (
              <Card
                key={item.id}
                variant="app"
                radius={16}
                pad={0}
                label={item.label}
                onPress={() => router.navigate(item.href)}>
                <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%' }}>
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: r(14),
                      backgroundColor: t.soft,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                    <Icon d={item.icon} size={22} color={t.primary} sw={2} />
                  </View>

                  <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <Txt size={16} weight={700} color={t.ink} style={{ flexShrink: 1 }}>
                        {item.label}
                      </Txt>
                      {item.badge ? (
                        <View
                          style={{
                            backgroundColor: t.soft,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: r(8),
                            flexShrink: 0,
                          }}>
                          <Txt size={11} weight={600} color={t.primary}>
                            {item.badge}
                          </Txt>
                        </View>
                      ) : null}
                    </View>
                    <Txt size={13} color={t.muted} lh={1.5} numberOfLines={2}>
                      {item.desc}
                    </Txt>
                  </View>

                  <View style={{ flexShrink: 0 }}>
                    <Icon d={ICON.forward} size={16} color={t.muted} sw={2.2} directional />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}
