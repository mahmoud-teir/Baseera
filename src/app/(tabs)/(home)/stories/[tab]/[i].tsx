/** صفحة نبي / ملك / صحابي — `s.story`: medallion, sections pending verified content, previous/next. */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Txt } from '@/components/core/Txt';
import { BackLink, Screen } from '@/components/layout/Screen';
import { STORIES, storySuffix, storyTitle, type StoryTab } from '@/data/structural';
import { DEFAULT_STORIES } from '@/data/stories-defaults';
import { SourcedSection } from '@/features/content/SourcedSection';
import { Medallion } from '@/features/stories/Medallion';
import { useContent } from '@/state/content-store';
import { useTheme } from '@/theme/theme';

export function generateStaticParams() {
  return (Object.keys(STORIES) as StoryTab[]).flatMap((tab) => STORIES[tab].list.map((_, i) => ({ tab, i: String(i) })));
}

export default function Story() {
  const { tab: tabParam, i: iParam } = useLocalSearchParams<{ tab: StoryTab; i: string }>();
  const tab: StoryTab = tabParam && STORIES[tabParam] ? tabParam : 'prophets';
  const st = STORIES[tab];
  const i = Math.max(0, Math.min(st.list.length - 1, Number(iParam) || 0));
  const name = st.list[i];
  const router = useRouter();
  const { t, r } = useTheme();
  const go = (n: number) => router.setParams({ i: String(n) });
  const published = useContent((s) => s.stories[`${tab}/${i}`]);
  const defaultStory = DEFAULT_STORIES[`${tab}/${i}`];
  return (
    <Screen gap={14}>
      <BackLink label={st.name} href={{ pathname: '/stories', params: { tab } }} />
      <View style={{ alignSelf: 'center', marginVertical: 4 }}>
        <Medallion name={name} size={200} />
      </View>
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Txt font="display" size={30} weight={700} align="center" accessibilityRole="header">
          {storyTitle(tab, name)}
        </Txt>
        <Txt size={15} weight={600} color={t.goldInk}>
          {storySuffix(tab, name)}
        </Txt>
      </View>
      {st.secs.map((s) => (
        <SourcedSection
          key={s}
          heading={s}
          data={published?.sections[s] ?? defaultStory?.sections[s]}
          where={`${storyTitle(tab, name)} · ${s}`}
          pending="يُدرج هنا بعد المراجعة العلمية، مع الدليل من الكتاب أو السنة الصحيحة والمرجع."
        />
      ))}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button variant="secondary" radius={r(14)} disabled={i === 0} onPress={() => go(i - 1)} style={{ flex: 1 }}>
          السابق
        </Button>
        <Button disabled={i === st.list.length - 1} onPress={() => go(i + 1)} style={{ flex: 1 }}>
          التالي
        </Button>
      </View>
    </Screen>
  );
}
