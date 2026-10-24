/**
 * المزيد — بوابة الحساب والخدمات والأدوات الإسلامية الشاملة.
 * تجمع الملف الشخصي، الإحصائيات، دفتر الفوائد، وجميع الأدوات والعبادات الإسلامية (+20 خدمة).
 */
import { useRouter, type Href } from 'expo-router';
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Icon } from '@/components/core/Icon';
import { IconTile } from '@/components/core/parts';
import { Txt } from '@/components/core/Txt';
import { Hero } from '@/components/layout/Hero';
import { Note, Screen, Title } from '@/components/layout/Screen';
import { ICON } from '@/data/structural';
import { useAcademy } from '@/features/academy/useAcademy';
import { S } from '@/features/admin/strings';
import { useStaffRole } from '@/features/admin/useIsStaff';
import { useSession } from '@/services/auth';
import { useInbox } from '@/services/inbox';
import { useApp } from '@/state/app-store';
import { useAppUpdater } from '@/features/updater/useAppUpdater';
import { CURRENT_APP_VERSION } from '@/services/updater';
import { useTheme } from '@/theme/theme';

interface ToolItem {
  id: string;
  label: string;
  desc: string;
  href: Href;
  icon: string;
  badge?: string;
}

interface ToolSection {
  title: string;
  subtitle: string;
  items: ToolItem[];
}

const ISLAMIC_SECTIONS: ToolSection[] = [
  {
    title: 'العقيدة والتوحيد والمنهج الحق',
    subtitle: 'بوابات اليقين والتوحيد وأسماء الله الحسنى',
    items: [
      {
        id: 'tawheed-gateways',
        label: 'بوابات التوحيد واليقين',
        desc: '٧ بوابات علمية مؤصلة في توحيد العبادة والتحاكم لشرع الله ورد الشبهات',
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
      {
        id: 'terms',
        label: 'معجم المصطلحات الشرعية',
        desc: 'المفاهيم والحدود الشرعية (لغةً واصطلاحاً) في العقيدة والفقه والحديث والمعاملات والتزكية',
        href: '/terms' as Href,
        icon: ICON.book,
        badge: 'لغةً واصطلاحاً',
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
        id: 'kaaba',
        label: 'الكعبة المشرفة ثلاثية الأبعاد',
        desc: 'مجسم واقعي تفاعلي للكعبة المشرفة والمسجد الحرام مع التكبير والتصغير',
        href: '/prayer/kaaba' as Href,
        icon: ICON.kaaba,
        badge: 'مجسم 3D',
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
];

export default function AccountScreen() {
  const { t, pc, gc, r, dark } = useTheme();
  const router = useRouter();
  const ac = useAcademy();
  const pname = useApp((s) => s.pname);
  const notes = useApp((s) => s.notes);
  const fs = useApp((s) => s.fs);
  const certs = useApp((s) => s.certificates);
  const attempts = useApp((s) => s.attempts);
  const set = useApp((s) => s.set);
  const { session } = useSession();
  const quizzes = Object.keys(attempts).length;
  const inbox = useInbox();
  const staffRole = useStaffRole();

  const settingsRows = [
    { d: ICON.shield, label: 'لوحة الإدارة والتحكم', val: staffRole ? S.ar.roleN[staffRole] : 'إدارة المحتوى والتحديثات', go: () => router.push('/admin') },
    { d: ICON.download, label: 'التحقق من وجود تحديثات', val: `v${CURRENT_APP_VERSION}`, go: () => useAppUpdater.getState().checkUpdate(false) },
    { d: ICON.bell, label: 'الإشعارات', val: inbox.unread ? `${inbox.unread} جديد` : '', go: () => router.navigate('/account/notifications') },
    { d: ICON.fontSize, label: 'حجم الخط', val: ['عادي', 'كبير', 'أكبر'][fs], go: () => set({ fs: ((fs + 1) % 3) as 0 | 1 | 2 }) },
    { d: ICON.moon, label: 'الوضع الليلي', val: dark ? 'مفعّل' : 'متوقف', go: () => set({ dark: !dark }) },
    { d: ICON.sliders, label: 'إعدادات الحساب والمزامنة', val: '', go: () => router.navigate('/account/settings') },
  ];

  return (
    <Screen gap={16} padBottom={32}>
      <Title>المزيد</Title>

      {/* User Profile Hero */}
      <Hero radius={24} pad={18} diamond={{ size: 110, left: -30, top: -30 }} style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FAF8F2', alignItems: 'center', justifyContent: 'center' }}>
          <Txt size={24} weight={700} color={pc}>
            {(pname || 'ط').trim().charAt(0) || 'ط'}
          </Txt>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Txt size={20} weight={600} color="#FFFFFF">
            {pname || 'طالب العلم'}
          </Txt>
          <Txt size={14} weight={600} color={gc}>
            {staffRole ? S.ar.roleN[staffRole] : `المرحلة الأولى · ${ac.totalPassed ? 'متعلّم' : 'مبتدئ'}`}
          </Txt>
          {session?.user.email ? (
            <Txt size={13} color="#CFE0DA" ltr numberOfLines={1} style={{ alignSelf: 'flex-start' }}>
              {session.user.email}
            </Txt>
          ) : null}
        </View>
      </Hero>

      {/* Quick Learning Stats */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[
          { n: ac.totalPassed, l: 'درس مكتمل' },
          { n: quizzes, l: 'اختبار مُؤدّى' },
          { n: certs.length, l: 'شهادة' },
        ].map((x) => (
          <Card key={x.l} variant="app" radius={16} pad={12} style={{ flex: 1, alignItems: 'center' }}>
            <Txt size={24} weight={700} color={t.primary}>
              {x.n}
            </Txt>
            <Txt size={13} color={t.muted}>
              {x.l}
            </Txt>
          </Card>
        ))}
      </View>

      {/* Quick Profile Actions (Notes, Saved, Certificates) */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card
          variant="app"
          radius={14}
          pad={10}
          onPress={() => router.navigate('/account/notebook')}
          label="دفتر الفوائد"
          style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <Icon d={ICON.notebook} size={20} color={t.primary} sw={2} />
          <Txt size={13} weight={600} color={t.ink}>
            دفتر الفوائد
          </Txt>
          <Txt size={11} color={t.muted}>
            {notes.length} فائدة
          </Txt>
        </Card>

        <Card
          variant="app"
          radius={14}
          pad={10}
          onPress={() => router.navigate('/account/memorized')}
          label="المحفوظات"
          style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <Icon d={ICON.bookmark} size={20} color={t.primary} sw={2} />
          <Txt size={13} weight={600} color={t.ink}>
            المحفوظات
          </Txt>
          <Txt size={11} color={t.muted}>
            السور والآيات
          </Txt>
        </Card>

        <Card
          variant="app"
          radius={14}
          pad={10}
          onPress={() => router.navigate('/account/certificates')}
          label="الشهادات"
          style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <Icon d={ICON.medal} size={20} color={t.primary} sw={2} />
          <Txt size={13} weight={600} color={t.ink}>
            الشهادات
          </Txt>
          <Txt size={11} color={t.muted}>
            {certs.length} شهادة
          </Txt>
        </Card>
      </View>

      {/* Islamic Tools & Services Sections */}
      <View style={{ marginTop: 8, gap: 18 }}>
        <View style={{ backgroundColor: t.goldSoft, borderRadius: r(16), padding: 14, gap: 4 }}>
          <Txt size={15} weight={700} color={t.goldInk}>
            ✨ بوابة الخدمات والأدوات الإسلامية (+20 خدمة)
          </Txt>
          <Txt size={13} color={t.goldInk} lh={1.6}>
            جميع أدوات الذكر، العبادة اليومية، القرآن الكريم، والعلوم الشرعية المؤصلة في مكان واحد.
          </Txt>
        </View>

        {ISLAMIC_SECTIONS.map((section) => (
          <View key={section.title} style={{ gap: 8 }}>
            <View style={{ gap: 2, paddingHorizontal: 2 }}>
              <Txt font="display" size={19} weight={700} color={t.ink}>
                {section.title}
              </Txt>
              <Txt size={12} color={t.muted}>
                {section.subtitle}
              </Txt>
            </View>

            <View style={{ gap: 6 }}>
              {section.items.map((item) => (
                <Card
                  key={item.id}
                  variant="app"
                  radius={14}
                  pad={0}
                  label={item.label}
                  onPress={() => router.navigate(item.href)}>
                  <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' }}>
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: r(12),
                        backgroundColor: t.soft,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                      <Icon d={item.icon} size={20} color={t.primary} sw={2} />
                    </View>

                    <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <Txt size={15} weight={700} color={t.ink} style={{ flexShrink: 1 }}>
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
                      <Txt size={12} color={t.muted} lh={1.4} numberOfLines={2}>
                        {item.desc}
                      </Txt>
                    </View>

                    <View style={{ flexShrink: 0 }}>
                      <Icon d={ICON.forward} size={15} color={t.muted} sw={2.2} directional />
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* App Settings Section */}
      <View style={{ marginTop: 10, gap: 8 }}>
        <Txt font="display" size={19} weight={700} color={t.ink}>
          إعدادات التطبيق
        </Txt>

        <View style={{ gap: 6 }}>
          {settingsRows.map((x) => (
            <Card
              key={x.label}
              variant="app"
              radius={14}
              pad={0}
              onPress={x.go}
              label={`${x.label}${x.val ? ` · ${x.val}` : ''}`}
              style={{ paddingHorizontal: 14, minHeight: 52, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <IconTile d={x.d} size={34} iconSize={18} bg={t.soft} color={t.primary} radius={10} sw={1.9} />
              <Txt size={16} weight={600} style={{ flex: 1 }}>
                {x.label}
              </Txt>
              <Txt size={13} color={t.muted}>
                {x.val}
              </Txt>
            </Card>
          ))}
        </View>
      </View>

      <Note>تطبيق «بصيرة» صدقة جارية ومتاح لوجه الله تعالى دون أي إعلانات. نسأل الله القبول والإخلاص.</Note>
    </Screen>
  );
}
