/** صفحة مسألة — `s.sharia` (detail mode): five fixed sections, each with evidence chain + report. */
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Txt } from '@/components/core/Txt';
import { BackLink, Screen } from '@/components/layout/Screen';
import { SHARIA_SECTIONS, SHARIA_TOPICS } from '@/data/structural';
import { SourcedSection } from '@/features/content/SourcedSection';
import { useContent } from '@/state/content-store';
import { useTheme } from '@/theme/theme';

export function generateStaticParams() {
  return SHARIA_TOPICS.flatMap((tp, ti) => tp.subs.map((_, si) => ({ topic: String(ti), sub: String(si) })));
}

export default function ShariaDetail() {
  const { topic, sub } = useLocalSearchParams<{ topic: string; sub: string }>();
  const tp = SHARIA_TOPICS[Number(topic)] ?? SHARIA_TOPICS[0];
  const name = tp.subs[Number(sub)] ?? tp.subs[0];
  const { t } = useTheme();
  const published = useContent((s) => s.sharia[`${Number(topic) || 0}/${Number(sub) || 0}`]);
  return (
    <Screen gap={12}>
      <BackLink label="الموسوعة" href="/sharia" />
      <Txt size={14} weight={600} color={t.goldInk}>
        {tp.name}
      </Txt>
      <Txt font="display" size={30} weight={700} accessibilityRole="header">
        {name}
      </Txt>
      {SHARIA_SECTIONS.map((x) => (
        <SourcedSection key={x} heading={x} data={published?.sections[x]} where={`الموسوعة · ${name} · ${x}`} pending="يُدرج هنا بعد المراجعة العلمية مع المصدر ورقم الصفحة." actions />
      ))}
      <View style={{ backgroundColor: t.goldSoft, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 }}>
        <Txt size={14} color={t.goldInk} lh={1.9}>
          للتعليم فقط. للأحكام الخاصة بحالتك راجع أهل العلم.
        </Txt>
      </View>
    </Screen>
  );
}
