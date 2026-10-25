/** قارئ الكتاب — `s.book`: font size, in-book search, highlight → دفتر الفوائد (with source), report, download, page progress. */
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { Icon } from '@/components/core/Icon';
import { ReportLink } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { BackLink, Screen, Title, useTopPad } from '@/components/layout/Screen';
import { BOOK_CATEGORIES, ICON } from '@/data/structural';
import { BookCover } from '@/features/library/BookCover';
import { PagedBookReader } from '@/features/encyclopedia/PagedBookReader';
import { folderId, useLibraryItem, type LibraryItem } from '@/services/content';
import { DOWNLOAD_ERRORS, downloadsSupported } from '@/services/downloads';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';
import { BOOK_FS } from '@/theme/tokens';

export default function Book() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { item, loading } = useLibraryItem(id ?? '');

  if (item?.paged || id === 'al-bidayah-wan-nihayah') {
    const pagedItem: LibraryItem = item ?? {
      id: 'al-bidayah-wan-nihayah',
      kind: 'book',
      category: 'التاريخ الإسلامي',
      title: 'البداية والنهاية (الموسوعة الكاملة 21 مجلداً)',
      author: 'الحافظ عماد الدين إسماعيل بن كثير (ت 774هـ)',
      source: 'دار هجر — تحقيق د. عبد الله بن عبد المحسن التركي',
      pages: 13078,
      size_mb: 21.5,
      paged: true,
      audio_url: null,
      chapters: [],
    };
    return <PagedBookReader item={pagedItem} />;
  }

  if (!item) {
    return (
      <Screen>
        <BackLink label="المكتبة" href="/library" />
        <Title>{loading ? 'جارٍ التحميل…' : 'الكتاب غير متاح'}</Title>
      </Screen>
    );
  }

  return <RegularBookReader item={item} />;
}

function cleanEditionText(src?: string | null): string | null {
  if (!src) return null;
  let s = src.replace(/https?:\/\/[^\s)]+/g, '').replace(/shamela\.ws\/[^\s)]+/g, '').replace(/[\(\/]\s*[\)\/]/g, '').trim();
  if (s.includes('المكتبة الشاملة') || s.length < 3) {
    return 'نسخة محققة معتمدة';
  }
  return s.split('—')[0].trim() || 'نسخة محققة معتمدة';
}

function RegularBookReader({ item }: { item: LibraryItem }) {
  const { t, r, lhBook, cs, font, dark } = useTheme();
  const top = useTopPad(0);
  const bookFs = useApp((s) => s.bookFs);
  const rt = useApp((s) => s.rt);
  const set = useApp((s) => s.set);
  const addNote = useApp((s) => s.addNote);
  const downloads = useApp((s) => s.downloads);
  const toggleDownload = useApp((s) => s.toggleDownload);
  const flash = useUi((s) => s.flash);
  const openReport = useUi((s) => s.openReport);

  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const [activeHitIndex, setActiveHitIndex] = useState(0);
  const [hl, setHl] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState(0);

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const paraOffsets = useRef<Record<string, number>>({});
  const saveProgressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sepia = rt === 'sepia' && !dark;

  const mainTitle = useMemo(() => {
    const m = item.title.match(/^([^(]+)/);
    return m ? m[1].trim() : item.title;
  }, [item.title]);

  const paras = useMemo(
    () => item.chapters.flatMap((c, ci) => c.paragraphs.map((p, pi) => ({ key: `${ci}:${pi}`, chapter: c.title, text: p, ci }))),
    [item]
  );

  const hits = useMemo(() => (q.trim() ? paras.filter((p) => p.text.includes(q.trim())) : []), [paras, q]);

  // Jump to first hit when query changes
  useEffect(() => {
    if (hits.length > 0 && q.trim()) {
      const target = hits[0];
      const y = paraOffsets.current[target.key];
      if (typeof y === 'number') {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 90), animated: true });
      }
    }
  }, [hits, q]);

  const scrollToHit = (targetPara: (typeof paras)[0]) => {
    if (!targetPara) return;
    const y = paraOffsets.current[targetPara.key];
    if (typeof y === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 90), animated: true });
    }
  };

  const handleNextHit = () => {
    if (hits.length === 0) return;
    const next = (activeHitIndex + 1) % hits.length;
    setActiveHitIndex(next);
    scrollToHit(hits[next]);
  };

  const handlePrevHit = () => {
    if (hits.length === 0) return;
    const prev = (activeHitIndex - 1 + hits.length) % hits.length;
    setActiveHitIndex(prev);
    scrollToHit(hits[prev]);
  };

  useEffect(() => {
    set({ lastBook: { id: item.id, title: item.title, page: 1 } });
    return () => {
      if (saveProgressTimeout.current) clearTimeout(saveProgressTimeout.current);
    };
  }, [item, set]);

  const backHref = `/library/folder/${folderId('books', Math.max(0, BOOK_CATEGORIES.indexOf(item.category)))}` as const;
  const dlId = `b:${item.id}`;
  const dl = downloads.some((d) => d.id === dlId);
  const nHl = Object.values(hl).filter(Boolean).length;
  const source = `${item.title}${item.author ? ` — ${item.author}` : ''}${item.source ? ` · ${item.source}` : ''}`;

  // Authentic page count: ~1000 chars per mobile reading screen
  const totalChars = useMemo(() => paras.reduce((sum, p) => sum + p.text.length, 0), [paras]);
  const realPages = useMemo(() => {
    if (paras.length === 0) return 1;
    const byTextLength = Math.max(1, Math.ceil(totalChars / 1000));
    // If item.pages matches digital text within reason (<= 2.5x), respect it
    if (item.pages && item.pages > 0 && item.pages <= byTextLength * 2.5 && item.pages >= Math.floor(byTextLength * 0.4)) {
      return item.pages;
    }
    return byTextLength;
  }, [paras.length, totalChars, item.pages]);

  const page = progress <= 0 ? 1 : Math.min(realPages, Math.max(1, Math.ceil(progress * realPages)));

  const sendHl = () => {
    paras
      .filter((p) => hl[p.key])
      .forEach((p) => {
        addNote(`«${p.text.trim()}»\n\n— المصدر: ${source} · ${p.chapter}`);
      });
    setHl({});
    flash('أُضيف النص كاملًا إلى دفتر الفوائد مع توثيق المصدر');
  };

  const toggleDl = () => {
    if (!downloadsSupported) {
      flash(DOWNLOAD_ERRORS.web);
      return;
    }
    toggleDownload({ id: dlId, name: item.title, kind: 'كتاب', mb: item.size_mb ?? 0.1 });
  };

  const small = {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: t.line,
    backgroundColor: t.card,
    borderRadius: r(12),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  return (
    <Screen
      noTopPad
      scrollRef={scrollRef}
      padH={22}
      gap={14}
      bg={sepia ? '#F1E6CF' : undefined}
      onScroll={(e) => {
        const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
        const max = Math.max(1, contentSize.height - layoutMeasurement.height);
        const pr = Math.min(1, Math.max(0, contentOffset.y / max));
        setProgress(pr);

        if (saveProgressTimeout.current) clearTimeout(saveProgressTimeout.current);
        saveProgressTimeout.current = setTimeout(() => {
          const curPage = pr <= 0 ? 1 : Math.min(realPages, Math.max(1, Math.ceil(pr * realPages)));
          set({ lastBook: { id: item.id, title: item.title, page: curPage } });
        }, 400);
      }}
      header={
        <View style={{ paddingTop: top, paddingHorizontal: 18, paddingBottom: 10, gap: 10, borderBottomWidth: 1, borderColor: t.line, backgroundColor: t.bg }}>
          {/* Top toolbar */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <BackLink label={item.category} href={backHref} />
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {/* Search toggle */}
              <Press
                onPress={() => setSearchOpen(!searchOpen)}
                label={searchOpen ? 'إغلاق البحث' : 'بحث داخل الكتاب'}
                style={{ ...small, backgroundColor: searchOpen ? t.goldSoft : t.card, borderColor: searchOpen ? t.goldInk : t.line }}>
                <Icon d={ICON.search} size={18} color={searchOpen ? t.goldInk : t.ink} sw={2.2} />
              </Press>

              <Press onPress={toggleDl} label={dl ? 'إزالة التنزيل' : 'تنزيل الكتاب'} style={{ ...small, width: undefined, paddingHorizontal: 12 }}>
                <Txt size={13} weight={600} color={t.primary}>
                  {dl ? 'منزّل ✓' : 'تنزيل'}
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

              <Press onPress={() => openReport(`كتاب: ${item.title}`)} label="إبلاغ عن ملاحظة" style={small}>
                <Icon d={ICON.flag} size={18} color={t.muted} sw={2.2} />
              </Press>
            </View>
          </View>

          {/* Book title */}
          <Txt font="display" size={22} weight={700} accessibilityRole="header" numberOfLines={1}>
            {mainTitle}
          </Txt>

          {/* Integrated Search Bar (shown when searchOpen is true) */}
          {searchOpen && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 42 }}>
              {/* Input field */}
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: cs.backgroundColor,
                  borderColor: cs.borderColor,
                  borderWidth: cs.borderWidth,
                  borderRadius: r(12),
                  paddingHorizontal: 10,
                  height: 42,
                }}>
                <TextInput
                  value={q}
                  onChangeText={(val) => {
                    setQ(val);
                    setActiveHitIndex(0);
                  }}
                  placeholder="ابحث في نص هذا الكتاب…"
                  placeholderTextColor={t.muted}
                  accessibilityLabel="ابحث في نص هذا الكتاب"
                  autoFocus
                  style={{ flex: 1, fontFamily: font('ui'), fontSize: 14, color: t.ink, paddingHorizontal: 6, textAlign: 'right' }}
                />
                {!!q && (
                  <Press
                    onPress={() => {
                      setQ('');
                      setActiveHitIndex(0);
                    }}
                    label="مسح"
                    style={{ padding: 4 }}>
                    <Icon d={ICON.close} size={16} color={t.muted} sw={2} />
                  </Press>
                )}
              </View>

              {/* Counter badge */}
              {!!q.trim() && (
                <View
                  style={{
                    paddingHorizontal: 8,
                    height: 34,
                    borderRadius: r(10),
                    backgroundColor: hits.length > 0 ? t.goldSoft : t.soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Txt size={12} weight={700} color={hits.length > 0 ? t.goldInk : t.muted} ltr>
                    {hits.length > 0 ? `${activeHitIndex + 1}/${hits.length}` : '0'}
                  </Txt>
                </View>
              )}

              {/* Prev / Next navigation */}
              {hits.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <Press
                    onPress={handlePrevHit}
                    label="السابق"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: r(10),
                      backgroundColor: t.card,
                      borderWidth: 1,
                      borderColor: t.line,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Icon d={ICON.chevronUp} size={18} color={t.ink} sw={2.2} />
                  </Press>
                  <Press
                    onPress={handleNextHit}
                    label="التالي"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: r(10),
                      backgroundColor: t.card,
                      borderWidth: 1,
                      borderColor: t.line,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Icon d={ICON.chevronDown} size={18} color={t.ink} sw={2.2} />
                  </Press>
                </View>
              )}
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
          <View style={{ backgroundColor: t.card, borderTopWidth: 1, borderColor: t.line, paddingTop: 10, paddingHorizontal: 20, paddingBottom: 22, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Txt size={14} color={t.muted} weight={600}>
              صفحة {page} من {realPages}
            </Txt>
            <View style={{ flex: 1 }}>
              <ProgressBar value={progress * 100} animated={false} height={5} label="موضع القراءة" />
            </View>
          </View>
        </>
      }>
      {/* Book Frontispiece Typographic Cover */}
      <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 14, gap: 6 }}>
        <BookCover
          title={item.title}
          author={item.author}
          category={item.category}
          source={item.source}
          size="lg"
        />
        {cleanEditionText(item.source) && (
          <View style={{ backgroundColor: t.soft, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 14, marginTop: 2 }}>
            <Txt size={11} color={t.goldInk} weight={600}>
              {cleanEditionText(item.source)}
            </Txt>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, marginBottom: 4 }}>
          <View style={{ width: 32, height: 1, backgroundColor: t.goldInk, opacity: 0.35 }} />
          <Txt size={11} color={t.goldInk} weight={700}>۞</Txt>
          <View style={{ width: 32, height: 1, backgroundColor: t.goldInk, opacity: 0.35 }} />
        </View>
      </View>
      {paras.map((p, i) => {
        const isHit = hits.includes(p);
        const isActiveHit = hits[activeHitIndex]?.key === p.key;

        return (
          <View
            key={p.key}
            onLayout={(e) => {
              paraOffsets.current[p.key] = e.nativeEvent.layout.y;
            }}>
            {(i === 0 || paras[i - 1].ci !== p.ci) && (
              <Txt size={15} weight={700} color={t.primary} style={{ marginTop: i > 0 ? 16 : 0, marginBottom: 8 }}>
                {p.chapter}
              </Txt>
            )}
            <Press
              onPress={() => setHl({ ...hl, [p.key]: !hl[p.key] })}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!hl[p.key] }}
              label={`تحديد الفقرة ${i + 1}`}
              style={{
                borderRadius: 12,
                paddingVertical: 8,
                paddingHorizontal: 10,
                marginHorizontal: -10,
                backgroundColor: hl[p.key]
                  ? t.goldSoft
                  : isActiveHit
                  ? t.goldSoft
                  : isHit
                  ? 'rgba(196, 166, 106, 0.18)'
                  : 'transparent',
                borderWidth: isActiveHit ? 1.5 : 0,
                borderColor: isActiveHit ? t.goldInk : 'transparent',
              }}>
              <Txt size={BOOK_FS[bookFs]} lh={lhBook} color={t.body}>
                {p.text}
              </Txt>
            </Press>
          </View>
        );
      })}
      {paras.length > 0 && (
        <View style={{ alignItems: 'center', paddingTop: 28, paddingBottom: 16 }}>
          <ReportLink where={`كتاب ${item.title}`} label="أبلغ عن ملاحظة أو خطأ في هذا الكتاب" />
        </View>
      )}
      {!paras.length && (
        <Txt size={15} color={t.muted} align="center">
          نص الكتاب يُدرج بعد التوثيق.
        </Txt>
      )}
    </Screen>
  );
}
