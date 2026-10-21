/** الأنبياء والملائكة والصحابة — `s.stories`. */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Segmented } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { STORIES, STORY_TABS, type StoryTab } from '@/data/structural';
import { Medallion } from '@/features/stories/Medallion';

export default function Stories() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: StoryTab }>();
  const [tab, setTab] = useState<StoryTab>(params.tab && STORIES[params.tab] ? params.tab : 'prophets');
  const st = STORIES[tab];
  return (
    <Screen gap={14}>
      <BackLink label="الرئيسية" href="/" />
      <Title>الأنبياء والملائكة والصحابة</Title>
      <Segmented options={STORY_TABS.map((x) => ({ value: x.id, label: x.label }))} value={tab} onChange={setTab} label="التصنيف" />
      <Lead size={14}>{st.note}</Lead>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 }}>
        {st.list.map((n, i) => (
          <Press key={n} onPress={() => router.navigate(`/stories/${tab}/${i}`)} label={n} style={{ width: '33.33%', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
            <Medallion name={n} size={96} />
            <Txt size={14} weight={600} align="center" lh={1.5}>
              {n}
            </Txt>
          </Press>
        ))}
      </View>
    </Screen>
  );
}
