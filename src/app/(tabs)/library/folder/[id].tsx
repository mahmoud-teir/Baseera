/** مجلد المكتبة — `s.folder`: cover hero + items → book reader / player. */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/core/Icon';
import { EmptyState, Skeleton } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Note, Screen } from '@/components/layout/Screen';
import { Lattice } from '@/components/layout/Ornament';
import { AUDIO_CATEGORIES, BOOK_CATEGORIES, ICON } from '@/data/structural';
import { artOf, Shade } from '@/features/library/FolderCover';
import { folderId, parseFolder, useLibrary } from '@/services/content';
import { edge } from '@/theme/layout';
import { useTheme } from '@/theme/theme';

export function generateStaticParams() {
  return [...BOOK_CATEGORIES.map((_, i) => ({ id: folderId('books', i) })), ...AUDIO_CATEGORIES.map((_, i) => ({ id: folderId('audio', i) }))];
}

export default function Folder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const f = parseFolder(id ?? 'books-0');
  const art = artOf(f.name);
  const router = useRouter();
  const { t, gc, r } = useTheme();
  const { items, loading } = useLibrary();
  const list = items.filter((x) => x.kind === (f.kind === 'books' ? 'book' : 'audio') && x.category === f.name);

  return (
    <Screen gap={14} padBottom={24}>
      <BackLink label="المكتبة" href={{ pathname: '/library', params: { tab: f.kind } }} />
      <View style={{ height: 190, borderRadius: r(26), backgroundColor: art.color, overflow: 'hidden', boxShadow: '0px 8px 20px rgba(0,0,0,0.16)' }}>
        <Lattice opacity={0.16} spacing={22} />
        <View style={{ position: 'absolute', ...edge.end(18), top: 18 }}>
          <Icon d={art.icon} size={86} color={gc} sw={1.3} />
        </View>
        <Shade height={110} />
        <View style={{ position: 'absolute', left: 18, right: 18, bottom: 14, gap: 3 }}>
          <Txt font="display" size={32} weight={700} lh={1.3} color="#FFFFFF" accessibilityRole="header">
            {f.name}
          </Txt>
          <Txt size={14} color="#E8EFEC">
            {f.kind === 'books' ? 'كتب' : 'صوتيات'} · {list.length ? `${list.length} عناصر` : 'بانتظار التوثيق'}
          </Txt>
        </View>
      </View>
      {loading ? (
        [1, 2, 3].map((k) => <Skeleton key={k} height={96} />)
      ) : !list.length ? (
        <EmptyState>لم يُنشر في هذا المجلد شيء بعد. تُضاف العناوين بعد توثيق مصدرها ومراجعتها.</EmptyState>
      ) : (
        list.map((x) => (
          <Press
            key={x.id}
            onPress={() => router.push(x.kind === 'book' ? `/book/${x.id}` : `/player/${x.id}`)}
            label={x.title}
            style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: r(18), padding: 10, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ width: 58, height: 76, borderRadius: 10, backgroundColor: art.color, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
              <Lattice opacity={0.18} spacing={22} />
              <Icon d={art.icon} size={28} color={gc} sw={1.7} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Txt size={17} weight={600}>
                {x.title}
              </Txt>
              <Txt size={14} color={t.muted}>
                {x.author ?? (x.kind === 'book' ? 'المؤلف — يُدرج بعد التوثيق' : 'المتحدث والمصدر — يُدرج بعد التوثيق')}
              </Txt>
            </View>
            <Icon d={ICON.forward} size={18} color={t.muted} sw={2.2} directional />
          </Press>
        ))
      )}
      <Note>العناوين والمؤلفون والتسجيلات تُدرج بعد التوثيق. لا تُعرض مادة بلا مصدر.</Note>
    </Screen>
  );
}
