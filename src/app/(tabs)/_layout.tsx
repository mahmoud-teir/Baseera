/**
 * Tab navigator — five tabs (HANDOFF §4 TabBar): الرئيسية، الأكاديمية، القرآن، المكتبة، حسابي.
 * Phones: 84px bottom bar. Tablets/desktop (≥768px): the prototype's 150px vertical side rail on the
 * start (right) side, next to a centred content column.
 */
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { forwardRef, type ComponentRef, type ReactNode } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/core/Icon';
import { Txt } from '@/components/core/Txt';
import { Logo } from '@/components/layout/Ornament';
import { ICON } from '@/data/structural';
import { SIDE_RAIL_WIDTH, TAB_BAR_HEIGHT, useLayout, edge } from '@/theme/layout';
import { useTheme } from '@/theme/theme';

const TABS = [
  { name: 'home', href: '/', label: 'الرئيسية', icon: ICON.tabHome },
  { name: 'academy', href: '/academy', label: 'الأكاديمية', icon: ICON.tabAcademy },
  { name: 'quran', href: '/quran', label: 'القرآن', icon: ICON.tabQuran },
  { name: 'library', href: '/library', label: 'المكتبة', icon: ICON.tabLibrary },
  { name: 'account', href: '/account', label: 'حسابي', icon: ICON.tabAccount },
] as const;

type TabButtonProps = TabTriggerSlotProps & { label: string; icon: string };

const TabButton = forwardRef<ComponentRef<typeof View>, TabButtonProps>(function TabButton({ label, icon, isFocused, ...props }, ref) {
  const { t, r } = useTheme();
  const color = isFocused ? t.primary : t.muted;
  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!isFocused }}
      style={({ pressed }) => [
        { width: 72, alignItems: 'center', gap: 5, minHeight: 48, opacity: pressed ? 0.7 : 1 },
        Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null,
      ]}>
      <View style={{ width: 44, height: 28, borderRadius: r(14), backgroundColor: isFocused ? t.soft : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        <Icon d={icon} size={22} color={color} sw={isFocused ? 2.2 : 1.8} />
      </View>
      <Txt size={13} weight={600} color={color} fixed>
        {label}
      </Txt>
    </Pressable>
  );
});

function Bar({ children, wide }: { children?: ReactNode; wide: boolean }) {
  const { t, pc, gc } = useTheme();
  const insets = useSafeAreaInsets();
  if (wide) {
    return (
      <View
        accessibilityRole="tablist"
        style={{
          width: SIDE_RAIL_WIDTH,
          height: '100%',
          backgroundColor: t.card,
          ...edge.borderEnd(1),
          borderColor: t.line,
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          paddingTop: Math.max(24, insets.top + 12),
        }}>
        <View style={{ alignItems: 'center', gap: 4, marginBottom: 14 }}>
          <Logo size={44} pc={pc} gc={gc} />
          <Txt font="display" size={22} weight={700} color={t.ink} fixed>
            بصيرة
          </Txt>
        </View>
        {children}
      </View>
    );
  }
  return (
    <View
      accessibilityRole="tablist"
      style={{
        height: TAB_BAR_HEIGHT + insets.bottom,
        paddingBottom: insets.bottom,
        backgroundColor: t.card,
        borderTopWidth: 1,
        borderColor: t.line,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
        paddingTop: 10,
      }}>
      {children}
    </View>
  );
}

export default function TabLayout() {
  const { wide } = useLayout();
  const { t } = useTheme();
  const list = (
    <TabList asChild>
      <Bar wide={wide}>
        {TABS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} resetOnFocus asChild>
            <TabButton label={tab.label} icon={tab.icon} />
          </TabTrigger>
        ))}
      </Bar>
    </TabList>
  );
  return (
    <Tabs style={{ flex: 1, flexDirection: wide ? 'row' : 'column', backgroundColor: t.bg }}>
      {wide && list}
      <TabSlot style={{ flex: 1 }} />
      {!wide && list}
    </Tabs>
  );
}
