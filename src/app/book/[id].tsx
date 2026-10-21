/** قارئ الكتاب — `s.book`: font size, in-book search, highlight → دفتر الفوائد (with source), report, download, page progress. */
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';

import { ReportLink } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { BackLink, Screen, Title, useTopPad } from '@/components/layout/Screen';
import { BOOK_FS } from '@/theme/tokens';
import { folderId, useLibraryItem } from '@/services/content';
import { BOOK_CATEGORIES } from '@/data/structural';
import { DOWNLOAD_ERRORS, downloadsSupported } from '@/services/downloads';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

export default function Book() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { item, loading } = useLibraryItem(id ?? '');
  const { t, r, lhBook, cs, font, dark } = useTheme();
  const top = useTopPad(0);
  const bookFs = useApp((s) => s.bookFs);
  const rt = useApp((s) => s.rt);
  const set = useApp((s) => s.set);
  const addNote = useApp((s) => s.addNote);
  const downloads = useApp((s) => s.downloads);
  const toggleDownload = useApp((s) => s.toggleDownload);
  const flash = useUi((s) => s.flash);
  const [q, setQ] = useState('');
  const [hl, setHl] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState(0);
  const sepia = rt === 'sepia' && !dark;

  const paras = useMemo(() => item?.chapters.flatMap((c, ci) => c.paragraphs.map((p, pi) => ({ key: `${ci}:${pi}`, chapter: c.title, text: p, ci }))) ?? [], [item]);
  const hits = q.trim() ? paras.filter((p) => p.text.includes(q.trim())) : [];

  useEffect(() => {
    if (item) set({ lastBook: { id: item.id, title: item.title, page: 1 } });
  }, [item, set]);

  if (!item) {
    return (
      <Screen>
        <BackLink label="المكتبة" href="/library" />
        <Title>{loading ? 'جارٍ التحميل…' : 'الكتاب غير متاح'}</Title>
      </Screen>
    );
  }
  const backHref = `/library/folder/${folderId('books', Math.max(0, BOOK_CATEGORIES.indexOf(item.category)))}` as const;
  const dlId = `b:${item.id}`;
  const dl = downloads.some((d) => d.id === dlId);
  const nHl = Object.values(hl).filter(Boolean).length;
  const source = `${item.title}${item.author ? ` — ${item.author}` : ''}${item.source ? ` · ${item.source}` : ''}`;

  const pages = item.pages ?? Math.max(1, item.chapters.length);
  const page = Math.max(1, Math.ceil(progress * pages));

  const sendHl = () => {
    paras.filter((p) => hl[p.key]).forEach((p) => addNote(`«${p.text.slice(0, 40)}…» — ${source} · ${p.chapter}`));
    setHl({});
    flash('أُضيف إلى دفتر الفوائد مع المصدر');
  };

  const toggleDl = () => {
    if (!downloadsSupported) {
      flash(DOWNLOAD_ERRORS.web);
      return;
    }
    // Book text is stored with the app state, so «downloading» keeps it on the device for offline reading.
    toggleDownload({ id: dlId, name: item.title, kind: 'كتاب', mb: item.size_mb ?? 0.1 });
  };

  const small = { width: 44, height: 44, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, borderRadius: r(12), alignItems: 'center' as const, justifyContent: 'center' as const };

  return (
    <Screen
      noTopPad
      padH={22}
      gap={14}
      bg={sepia ? '#F1E6CF' : undefined}
      onScroll={(e) => {
        const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
        const max = Math.max(1, contentSize.height - layoutMeasurement.height);
        const pr = Math.min(1, Math.max(0, contentOffset.y / max));
        setProgress(pr);
        set({ lastBook: { id: item.id, title: item.title, page: Math.max(1, Math.ceil(pr * pages)) } });
      }}
      header={
        <View style={{ paddingTop: top, paddingHorizontal: 20, paddingBottom: 10, gap: 10, borderBottomWidth: 1, borderColor: t.line }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <BackLink label={item.category} href={backHref} />
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Press onPress={toggleDl} label={dl ? 'إزالة التنزيل' : 'تنزيل الكتاب'} style={{ ...small, width: undefined, paddingHorizontal: 12 }}>
                <Txt size={14} weight={600} color={t.primary}>
                  {dl ? 'تم التنزيل ✓' : 'تنزيل'}
                </Txt>
              </Press>
              <Press onPress={() => set({ bookFs: Math.max(0, bookFs - 1) as 0 | 1 | 2 })} label="تصغير الخط" style={small}>
                <Txt size={15} fixed>
                  أ−
                </Txt>
              </Press>
              <Press onPress={() => set({ bookFs: Math.min(2, bookFs + 1) as 0 | 1 | 2 })} label="تكبير الخط" style={small}>
                <Txt size={20} fixed>
                  أ+
                </Txt>
              </Press>
            </View>
          </View>
          <Txt font="display" size={26} weight={700} accessibilityRole="header">
            {item.title}
          </Txt>
          <View style={{ backgroundColor: cs.backgroundColor, borderColor: cs.borderColor, borderWidth: cs.borderWidth, boxShadow: cs.boxShadow, borderRadius: r(12), paddingHorizontal: 12, height: 42, justifyContent: 'center' }}>
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="ابحث داخل الكتاب"
              placeholderTextColor={t.muted}
              accessibilityLabel="ابحث داخل الكتاب"
              style={{ fontFamily: font('ui'), fontSize: 16, color: t.ink, height: 38, textAlign: 'right' }}
            />
          </View>
          {!!q.trim() && (
            <View style={{ backgroundColor: t.goldSoft, borderRadius: r(10), paddingVertical: 8, paddingHorizontal: 10 }} accessibilityLiveRegion="polite">
              <Txt size={14} color={t.goldInk} lh={1.7}>
                {hits.length ? `${hits.length} نتيجة لـ «${q.trim()}» — مظلّلة في النص.` : `لا نتائج لـ «${q.trim()}» في هذا الكتاب.`}
              </Txt>
            </View>
          )}
        </View>
      }
      footer={
        <>
          {nHl > 0 && (
            <View style={{ backgroundColor: t.goldSoft, paddingVertical: 10, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Txt size={15} weight={600} color={t.goldInk} style={{ flex: 1 }}>
                {nHl} فقرة محددة
              </Txt>
              <Press onPress={sendHl} label="إلى دفتر الفوائد" style={{ height: 40, paddingHorizontal: 16, borderRadius: 12, backgroundColor: t.btn, justifyContent: 'center' }}>
                <Txt size={15} weight={700} color={t.btnText}>
                  إلى دفتر الفوائد
                </Txt>
              </Press>
            </View>
          )}
          <View style={{ backgroundColor: t.card, borderTopWidth: 1, borderColor: t.line, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Txt size={14} color={t.muted}>
              صفحة {page} من {pages}
            </Txt>
            <View style={{ flex: 1 }}>
              <ProgressBar value={(page / pages) * 100} height={4} label="موضع القراءة" />
            </View>
          </View>
        </>
      }>
      {paras.map((p, i) => (
        <View key={p.key}>
          {(i === 0 || paras[i - 1].ci !== p.ci) && (
            <Txt size={14} color={t.muted} style={{ marginBottom: 8 }}>
              {p.chapter}
            </Txt>
          )}
          <Press
            onPress={() => setHl({ ...hl, [p.key]: !hl[p.key] })}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!hl[p.key] }}
            label={`تحديد الفقرة ${i + 1}`}
            style={{ borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, marginHorizontal: -10, backgroundColor: hl[p.key] ? t.goldSoft : hits.includes(p) ? t.soft : 'transparent' }}>
            <Txt size={BOOK_FS[bookFs]} lh={lhBook} color={t.body}>
              {p.text}
            </Txt>
          </Press>
          <ReportLink where={`كتاب ${item.title} · ${p.chapter} · فقرة ${i + 1}`} />
        </View>
      ))}
      {!paras.length && (
        <Txt size={15} color={t.muted} align="center">
          نص الكتاب يُدرج بعد التوثيق.
        </Txt>
      )}
    </Screen>
  );
}
