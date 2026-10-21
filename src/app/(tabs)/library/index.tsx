/** المكتبة — `s.library`: search, الكتب / الصوتيات / التنزيلات, folder grid, resume, downloads quota. */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Card } from '@/components/core/Card';
import { Chip } from '@/components/core/Chip';
import { Icon } from '@/components/core/Icon';
import { EmptyState, Skeleton } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { Note, Screen, Title } from '@/components/layout/Screen';
import { AUDIO_CATEGORIES, BOOK_CATEGORIES, DOWNLOAD_QUOTA_MB, ICON } from '@/data/structural';
import { FolderCover } from '@/features/library/FolderCover';
import { folderId, useLibrary } from '@/services/content';
import { deleteDownload, downloadsSupported } from '@/services/downloads';
import { useApp } from '@/state/app-store';
import { useTheme } from '@/theme/theme';

type Tab = 'books' | 'audio' | 'dl';

export default function Library() {
  const { t, r, cs, font } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'audio' || params.tab === 'dl' ? params.tab : 'books');
  const [q, setQ] = useState('');
  const { items, loading, error, reload } = useLibrary();
  const downloads = useApp((s) => s.downloads);
  const lastBook = useApp((s) => s.lastBook);
  const qq = q.trim();

  const cats = tab === 'books' ? BOOK_CATEGORIES : AUDIO_CATEGORIES;
  const kind = tab === 'books' ? 'book' : 'audio';
  const shown = cats.map((name, i) => ({ name, i, n: items.filter((x) => x.kind === kind && x.category === name).length })).filter((c) => !qq || c.name.includes(qq));
  const hits = qq ? items.filter((x) => x.kind === kind && x.title.includes(qq)) : [];
  const used = Math.round(downloads.reduce((a, d) => a + d.mb, 0) * 10) / 10;

  return (
    <Screen gap={14}>
      <Title>المكتبة</Title>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: cs.backgroundColor, borderColor: cs.borderColor, borderWidth: cs.borderWidth, boxShadow: cs.boxShadow, borderRadius: r(16), paddingHorizontal: 14, height: 48 }}>
        <Icon d={ICON.search} size={16} color={t.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="ابحث في الكتب والصوتيات"
          placeholderTextColor={t.muted}
          accessibilityLabel="ابحث في الكتب والصوتيات"
          style={{ flex: 1, fontFamily: font('ui'), fontSize: 17, color: t.ink, height: 44, textAlign: 'right' }}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(
          [
            ['books', 'الكتب'],
            ['audio', 'الصوتيات'],
            ['dl', 'التنزيلات'],
          ] as [Tab, string][]
        ).map(([k, l]) => (
          <Chip key={k} label={l} outline active={tab === k} onPress={() => setTab(k)} height={40} fontSize={16} />
        ))}
      </View>

      {error && (
        <View style={{ backgroundColor: t.errBg, borderRadius: r(16), padding: 14, gap: 8 }}>
          <Txt size={15} color={t.errInk} lh={1.8}>
            تعذّر تحميل المكتبة. تحقّق من الاتصال.
          </Txt>
          <Button variant="secondary" onPress={reload} style={{ alignSelf: 'flex-start', borderColor: t.errInk, minHeight: 36 }}>
            <Txt size={15} weight={600} color={t.errInk}>
              إعادة المحاولة
            </Txt>
          </Button>
        </View>
      )}

      {tab === 'dl' ? (
        <View style={{ gap: 10 }}>
          <Card variant="app" radius={18} pad={14} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt size={16} weight={600}>
                مساحة التنزيلات
              </Txt>
              <Txt size={16} weight={600} ltr>
                {`${used} / ${DOWNLOAD_QUOTA_MB} MB`}
              </Txt>
            </View>
            <ProgressBar value={(used / DOWNLOAD_QUOTA_MB) * 100} />
          </Card>
          {!downloadsSupported && <Note>التنزيل للاستماع والقراءة بلا اتصال متاح في تطبيق الجوال.</Note>}
          {!downloads.length ? (
            <EmptyState>لا توجد تنزيلات. اضغط زر التنزيل داخل أي سورة أو كتاب أو تسجيل.</EmptyState>
          ) : (
            downloads.map((d) => (
              <Card key={d.id} variant="app" radius={16} pad={0} style={{ paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt size={16} weight={600}>
                    {d.name}
                  </Txt>
                  <Txt size={14} color={t.muted}>
                    {d.kind} · {d.mb} MB
                  </Txt>
                </View>
                <Press onPress={() => deleteDownload(d.id)} label={`حذف ${d.name}`} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d={ICON.close} size={18} color={t.muted} sw={2.2} />
                </Press>
              </Card>
            ))
          )}
        </View>
      ) : loading ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {[1, 2, 3, 4].map((k) => (
            <Skeleton key={k} height={140} style={{ width: '47%', flexGrow: 1 }} />
          ))}
        </View>
      ) : (
        <>
          {tab === 'books' && !qq && lastBook && (
            <Card variant="app" radius={18} pad={0} onPress={() => router.push(`/book/${lastBook.id}`)} label={`تابع القراءة: ${lastBook.title}`} style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt size={14} weight={600} color={t.goldInk}>
                  تابع من حيث توقفت
                </Txt>
                <Txt size={17} weight={600}>
                  {lastBook.title}
                </Txt>
                <Txt size={14} color={t.muted}>
                  صفحة {lastBook.page} · محفوظ على جهازك{useApp.getState().setting('sync') ? ' ومتزامن مع حسابك' : ''}
                </Txt>
              </View>
              <Icon d={ICON.forward} size={18} color={t.muted} sw={2.2} directional />
            </Card>
          )}
          {hits.map((x) => (
            <Card key={x.id} variant="app" radius={16} pad={0} onPress={() => router.push(x.kind === 'book' ? `/book/${x.id}` : `/player/${x.id}`)} label={x.title} style={{ paddingVertical: 10, paddingHorizontal: 14, gap: 2 }}>
              <Txt size={16} weight={600}>
                {x.title}
              </Txt>
              <Txt size={14} color={t.muted}>
                {x.category}
              </Txt>
            </Card>
          ))}
          {!!qq && !shown.length && !hits.length && <EmptyState>لا نتائج لـ «{qq}». جرّب كلمة أخرى أو تصفّح التصنيفات.</EmptyState>}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 22 }}>
            {shown.map((c) => (
              <View key={c.name} style={{ width: '47%', flexGrow: 1 }}>
                <FolderCover
                  name={c.name}
                  count={c.n ? `${c.n} ${tab === 'books' ? 'كتب' : 'تسجيلات'}` : 'بانتظار التوثيق'}
                  onPress={() => router.navigate(`/library/folder/${folderId(tab === 'books' ? 'books' : 'audio', c.i)}`)}
                />
              </View>
            ))}
          </View>
        </>
      )}
      <Note>المكتبة والصوتيات مجانية للجميع. لا تُعرض كتب أو تسجيلات إلا بعد توثيق مصدرها.</Note>
    </Screen>
  );
}
