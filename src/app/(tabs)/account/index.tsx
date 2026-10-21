/** حسابي — `s.account`: profile, stats, notebook, memorized, certificates, font size, night mode, settings. */
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { IconTile } from '@/components/core/parts';
import { Txt } from '@/components/core/Txt';
import { Hero } from '@/components/layout/Hero';
import { Note, Screen, Title } from '@/components/layout/Screen';
import { ICON } from '@/data/structural';
import { useAcademy } from '@/features/academy/useAcademy';
import { useSession } from '@/services/auth';
import { useInbox } from '@/services/inbox';
import { useApp } from '@/state/app-store';
import { useTheme } from '@/theme/theme';

export default function Account() {
  const { t, pc, gc, dark } = useTheme();
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

  const rows = [
    { d: ICON.notebook, label: 'دفتر الفوائد', val: `${notes.length} فائدة`, go: () => router.navigate('/account/notebook') },
    { d: ICON.bookmark, label: 'المحفوظات', val: '', go: () => router.navigate('/account/memorized') },
    { d: ICON.medal, label: 'الشهادات', val: String(certs.length), go: () => router.navigate('/account/certificates') },
    { d: ICON.bell, label: 'الإشعارات', val: inbox.unread ? `${inbox.unread} جديد` : '', go: () => router.navigate('/account/notifications') },
    { d: ICON.fontSize, label: 'حجم الخط', val: ['عادي', 'كبير', 'أكبر'][fs], go: () => set({ fs: ((fs + 1) % 3) as 0 | 1 | 2 }) },
    { d: ICON.moon, label: 'الوضع الليلي', val: dark ? 'مفعّل' : 'متوقف', go: () => set({ dark: !dark }) },
    { d: ICON.sliders, label: 'إعدادات الحساب', val: '', go: () => router.navigate('/account/settings') },
  ];

  return (
    <Screen gap={14}>
      <Title>حسابي</Title>
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
            المرحلة الأولى · {ac.totalPassed ? 'متعلّم' : 'مبتدئ'}
            {session?.user.email ? ` · ${session.user.email}` : ''}
          </Txt>
        </View>
      </Hero>
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
      <View style={{ gap: 8 }}>
        {rows.map((x) => (
          <Card key={x.label} variant="app" radius={16} pad={0} onPress={x.go} label={`${x.label}${x.val ? ` · ${x.val}` : ''}`} style={{ paddingHorizontal: 14, minHeight: 54, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <IconTile d={x.d} size={36} iconSize={20} bg={t.soft} color={t.primary} radius={11} sw={1.9} />
            <Txt size={17} weight={600} style={{ flex: 1 }}>
              {x.label}
            </Txt>
            <Txt size={14} color={t.muted}>
              {x.val}
            </Txt>
          </Card>
        ))}
      </View>
      <Note>الشهادات التعليمية مجانية وتُمنح عند إتمام كل مرحلة. المحتوى تعليمي ولا يُصدر أحكامًا على الأشخاص.</Note>
    </Screen>
  );
}
