/**
 * PagedBookReader — قارئ الموسوعات والكتب الكبرى المجزأة (البداية والنهاية).
 * Mobile-First, Virtualized Chunk Streaming, Instant Volume & Chapter Jump, Notes & Offline Cache.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/core/Button';
import { Icon } from '@/components/core/Icon';
import { ReportLink } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Screen, useTopPad } from '@/components/layout/Screen';
import { BOOK_CATEGORIES, ICON } from '@/data/structural';
import {
  getEncyclopediaIndex,
  getVolumeChunk,
  type EncyclopediaIndex,
  type VolumeChapter,
  type VolumePayload,
} from '@/services/encyclopedia';
import type { LibraryItem } from '@/state/content-store';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';
import { BOOK_FS } from '@/theme/tokens';

const STORAGE_KEY_POS = 'baseerah_encyclopedia_pos_bidayah';

interface PosState {
  vol: number;
  chapterIndex: number;
}

export function PagedBookReader({ item }: { item: LibraryItem }) {
  const { t, r, lhBook, cs, font, dark, pc } = useTheme();
  const top = useTopPad(0);

  const bookFs = useApp((s) => s.bookFs);
  const rt = useApp((s) => s.rt);
  const set = useApp((s) => s.set);
  const addNote = useApp((s) => s.addNote);
  const flash = useUi((s) => s.flash);
  const openReport = useUi((s) => s.openReport);

  const sepia = rt === 'sepia' && !dark;

  // Master Index state
  const [index, setIndex] = useState<EncyclopediaIndex | null>(null);
  const [indexLoading, setIndexLoading] = useState(true);

  // Active Reading State
  const [activeVol, setActiveVol] = useState<number>(1);
  const [volPayload, setVolPayload] = useState<VolumePayload | null>(null);
  const [volLoading, setVolLoading] = useState<boolean>(true);
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);

  // Modals for Table of Contents
  const [volModalOpen, setVolModalOpen] = useState(false);
  const [chapterModalOpen, setChapterModalOpen] = useState(false);

  // Search & Highlights
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hl, setHl] = useState<Record<number, boolean>>({});

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  // 1. Load Master Index and Last Read Position
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [idx, savedPos] = await Promise.all([
          getEncyclopediaIndex(item.indexUrl),
          AsyncStorage.getItem(STORAGE_KEY_POS),
        ]);
        if (alive) {
          setIndex(idx);
          setIndexLoading(false);
          if (savedPos) {
            try {
              const pos = JSON.parse(savedPos) as PosState;
              if (pos.vol >= 1 && pos.vol <= (idx.totalVolumes || 20)) {
                setActiveVol(pos.vol);
                setActiveChapterIdx(Math.max(0, pos.chapterIndex || 0));
              }
            } catch {
              // ignore parse error
            }
          }
        }
      } catch {
        if (alive) {
          setIndexLoading(false);
          flash('تعذر تحميل فهرس الموسوعة، يرجى التحقق من الاتصال.');
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [item.indexUrl, flash]);

  // 2. Load Volume Chunk whenever activeVol changes
  useEffect(() => {
    let alive = true;
    (async () => {
      await Promise.resolve();
      if (!alive) return;
      setVolLoading(true);
      setHl({});
      setQ('');
      try {
        const payload = await getVolumeChunk(activeVol);
        if (alive) {
          setVolPayload(payload);
          setVolLoading(false);
          // Scroll to top of new volume
          scrollRef.current?.scrollTo({ y: 0, animated: false });
        }
      } catch {
        if (alive) {
          setVolLoading(false);
          flash(`تعذر تحميل المجلد ${activeVol}، حاول مجدداً.`);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [activeVol, flash]);

  // 3. Save position on change
  useEffect(() => {
    const pos: PosState = { vol: activeVol, chapterIndex: activeChapterIdx };
    void AsyncStorage.setItem(STORAGE_KEY_POS, JSON.stringify(pos));
    set({
      lastBook: {
        id: item.id,
        title: `البداية والنهاية (م ${activeVol})`,
        page: activeChapterIdx + 1,
      },
    });
  }, [activeVol, activeChapterIdx, item.id, set]);

  const currentChapter: VolumeChapter | undefined = volPayload?.chapters[activeChapterIdx];

  // Search filtering in current chapter + Clean meta lines
  const parasWithHit = useMemo(() => {
    if (!currentChapter) return [];
    const query = q.trim().toLowerCase();
    return currentChapter.paragraphs
      .filter((p) => {
        const str = p.trim();
        return !str.startsWith('META#') && !str.startsWith('#META') && !str.startsWith('#####OpenITI#');
      })
      .map((p, i) => ({
        text: p,
        index: i,
        isHit: query.length > 0 && p.toLowerCase().includes(query),
      }));
  }, [currentChapter, q]);

  const totalHits = useMemo(() => parasWithHit.filter((p) => p.isHit).length, [parasWithHit]);

  // Highlights management
  const selectedCount = Object.values(hl).filter(Boolean).length;
  const sendHighlightsToNotes = () => {
    if (!currentChapter || !volPayload) return;
    const sourceInfo = `البداية والنهاية · الحافظ ابن كثير · المجلد ${activeVol} (${currentChapter.title} · ص ${currentChapter.page})`;
    parasWithHit
      .filter((p) => hl[p.index])
      .forEach((p) => {
        addNote(`«${p.text.trim()}»\n\n— المصدر: ${sourceInfo}`);
      });
    setHl({});
    flash('أُضيفت الفائدة إلى دفتر الفوائد مع توثيق المجلد والصفحة');
  };

  const handleNextChapter = () => {
    if (!volPayload) return;
    if (activeChapterIdx < volPayload.chapters.length - 1) {
      setActiveChapterIdx(activeChapterIdx + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else if (activeVol < (index?.totalVolumes ?? 20)) {
      setActiveVol(activeVol + 1);
      setActiveChapterIdx(0);
    }
  };

  const handlePrevChapter = () => {
    if (activeChapterIdx > 0) {
      setActiveChapterIdx(activeChapterIdx - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else if (activeVol > 1) {
      setActiveVol(activeVol - 1);
      setActiveChapterIdx(0);
    }
  };

  const smallBtn = {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: t.line,
    backgroundColor: t.card,
    borderRadius: r(12),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  const backCategoryIndex = Math.max(0, BOOK_CATEGORIES.indexOf(item.category));

  if (indexLoading) {
    return (
      <Screen>
        <BackLink label="المكتبة" href={`/library/folder/books-${backCategoryIndex}`} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <ActivityIndicator size="large" color={pc} />
          <Txt size={15} color={t.muted}>
            جارٍ تهيئة فهرس موسوعة البداية والنهاية...
          </Txt>
        </View>
      </Screen>
    );
  }

  const volTitle = index?.volumes[activeVol - 1]?.title ?? `المجلد ${activeVol}`;
  const totalChaptersInVol = volPayload?.chapters.length ?? 1;

  return (
    <Screen
      noTopPad
      scrollRef={scrollRef}
      padH={20}
      gap={14}
      bg={sepia ? '#F1E6CF' : undefined}
      header={
        <View style={{ paddingTop: top, paddingHorizontal: 16, paddingBottom: 10, gap: 10, borderBottomWidth: 1, borderColor: t.line, backgroundColor: t.bg }}>
          {/* Top action row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <BackLink label="المكتبة" href={`/library/folder/books-${backCategoryIndex}`} />
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {/* Search toggle */}
              <Press
                onPress={() => setSearchOpen(!searchOpen)}
                label={searchOpen ? 'إغلاق البحث' : 'بحث في الباب'}
                style={{ ...smallBtn, backgroundColor: searchOpen ? t.goldSoft : t.card, borderColor: searchOpen ? t.goldInk : t.line }}>
                <Icon d={ICON.search} size={18} color={searchOpen ? t.goldInk : t.ink} sw={2.2} />
              </Press>

              {/* Volume Switcher button */}
              <Press
                onPress={() => setVolModalOpen(true)}
                label="اختيار المجلد"
                style={{ ...smallBtn, width: undefined, paddingHorizontal: 12, backgroundColor: t.soft }}>
                <Txt size={13} weight={700} color={pc}>
                  مجلد {activeVol} من 20 ▾
                </Txt>
              </Press>

              {/* Font controls */}
              <Press onPress={() => set({ bookFs: Math.max(0, bookFs - 1) as 0 | 1 | 2 })} label="تصغير الخط" style={smallBtn}>
                <Txt size={15} fixed>
                  أ−
                </Txt>
              </Press>

              <Press onPress={() => set({ bookFs: Math.min(2, bookFs + 1) as 0 | 1 | 2 })} label="تكبير الخط" style={smallBtn}>
                <Txt size={20} fixed>
                  أ+
                </Txt>
              </Press>

              <Press onPress={() => openReport(`موسوعة البداية والنهاية · مجلد ${activeVol}`)} label="إبلاغ" style={smallBtn}>
                <Icon d={ICON.flag} size={18} color={t.muted} sw={2.2} />
              </Press>
            </View>
          </View>

          {/* Title & Volume summary */}
          <View style={{ gap: 2 }}>
            <Txt font="display" size={22} weight={700} accessibilityRole="header" numberOfLines={1}>
              البداية والنهاية
            </Txt>
            <Txt size={12} color={t.muted} numberOfLines={1}>
              {volTitle}
            </Txt>
          </View>

          {/* Quick Chapter Selector Bar */}
          <Press
            onPress={() => setChapterModalOpen(true)}
            label="فهرس أبواب المجلد"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 9,
              paddingHorizontal: 12,
              borderRadius: r(10),
              backgroundColor: t.card,
              borderWidth: 1,
              borderColor: t.line,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Icon d={ICON.book} size={16} color={pc} />
              <Txt size={13} weight={600} color={t.ink} numberOfLines={1} style={{ flex: 1 }}>
                {currentChapter ? currentChapter.title : 'اختر الباب...'}
              </Txt>
            </View>
            <Txt size={12} color={pc} weight={700}>
              فهرس الأبواب ({activeChapterIdx + 1}/{totalChaptersInVol}) ▾
            </Txt>
          </Press>

          {/* In-Chapter Search Input */}
          {searchOpen && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: cs.backgroundColor,
                borderColor: cs.borderColor,
                borderWidth: cs.borderWidth,
                borderRadius: r(12),
                paddingHorizontal: 10,
                height: 40,
              }}>
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="ابحث في نص هذا الباب…"
                placeholderTextColor={t.muted}
                style={{ flex: 1, fontFamily: font('ui'), fontSize: 13, color: t.ink, paddingHorizontal: 6, textAlign: 'right' }}
                autoFocus
              />
              {!!q && (
                <Press onPress={() => setQ('')} label="مسح">
                  <Icon d={ICON.close} size={16} color={t.muted} />
                </Press>
              )}
              {!!q.trim() && (
                <View style={{ paddingHorizontal: 8, backgroundColor: totalHits > 0 ? t.goldSoft : t.soft, borderRadius: 6, marginLeft: 6 }}>
                  <Txt size={11} weight={700} color={totalHits > 0 ? t.goldInk : t.muted}>
                    {totalHits} نتيجة
                  </Txt>
                </View>
              )}
            </View>
          )}
        </View>
      }
      footer={
        <>
          {/* Highlight selection bar */}
          {selectedCount > 0 && (
            <View style={{ backgroundColor: t.goldSoft, paddingVertical: 10, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Txt size={14} weight={600} color={t.goldInk} style={{ flex: 1 }}>
                {selectedCount} فقرة محددة
              </Txt>
              <Press onPress={sendHighlightsToNotes} label="حفظ في الفوائد" style={{ height: 38, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.btn, justifyContent: 'center' }}>
                <Txt size={13} weight={700} color={t.btnText}>
                  إلى دفتر الفوائد
                </Txt>
              </Press>
            </View>
          )}

          {/* Bottom chapter navigation bar */}
          <View style={{ backgroundColor: t.card, borderTopWidth: 1, borderColor: t.line, paddingVertical: 10, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Button
              size="sm"
              variant="secondary"
              onPress={handlePrevChapter}
              disabled={activeVol === 1 && activeChapterIdx === 0}
              style={{ flex: 1 }}>
              ‹ السابق
            </Button>

            <View style={{ alignItems: 'center', minWidth: 90 }}>
              <Txt size={11} color={t.muted}>
                باب {activeChapterIdx + 1} من {totalChaptersInVol}
              </Txt>
              <Txt size={11} weight={700} color={pc}>
                ص {currentChapter?.page ?? 1}
              </Txt>
            </View>

            <Button
              size="sm"
              variant="primary"
              onPress={handleNextChapter}
              disabled={activeVol === 20 && activeChapterIdx === totalChaptersInVol - 1}
              style={{ flex: 1 }}>
              التالي ›
            </Button>
          </View>
        </>
      }>

      {/* Main Content Area */}
      {volLoading ? (
        <View style={{ paddingVertical: 60, alignItems: 'center', gap: 14 }}>
          <ActivityIndicator size="large" color={pc} />
          <Txt size={14} color={t.muted}>
            جارٍ استدعاء نصوص المجلد {activeVol}...
          </Txt>
        </View>
      ) : (
        <View style={{ gap: 14, paddingBottom: 24 }}>
          {/* Chapter Heading Banner */}
          <View style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: r(12), backgroundColor: t.soft, gap: 4 }}>
            <Txt size={11} color={pc} weight={700}>
              المجلد {activeVol} · صفحة {currentChapter?.page ?? 1}
            </Txt>
            <Txt font="display" size={18} weight={700} color={t.ink}>
              {currentChapter?.title}
            </Txt>
          </View>

          {/* Paragraphs */}
          {parasWithHit.map((p) => {
            const isSelected = !!hl[p.index];
            return (
              <Press
                key={p.index}
                onPress={() => setHl({ ...hl, [p.index]: !isSelected })}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                label={`تحديد الفقرة ${p.index + 1}`}
                style={{
                  borderRadius: 10,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  marginHorizontal: -10,
                  backgroundColor: isSelected
                    ? t.goldSoft
                    : p.isHit
                    ? 'rgba(196, 166, 106, 0.22)'
                    : 'transparent',
                  borderWidth: isSelected ? 1.5 : 0,
                  borderColor: isSelected ? t.goldInk : 'transparent',
                }}>
                <Txt size={BOOK_FS[bookFs]} lh={lhBook} color={t.body}>
                  {p.text}
                </Txt>
              </Press>
            );
          })}

          <View style={{ alignItems: 'center', paddingTop: 20 }}>
            <ReportLink where={`البداية والنهاية · مجلد ${activeVol} · باب ${currentChapter?.title}`} label="أبلغ عن ملاحظة أو خطأ في هذا الباب" />
          </View>
        </View>
      )}

      {/* Modal 1: Volumes Selector */}
      <Modal visible={volModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: t.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '82%', paddingBottom: 30 }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderColor: t.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ gap: 2 }}>
                <Txt size={17} weight={700}>
                  فهرس مجلدات البداية والنهاية (20 مجلداً)
                </Txt>
                <Txt size={12} color={t.muted}>
                  طبعة دار هجر المحققة — 13,078 صفحة كاملة
                </Txt>
              </View>
              <Press onPress={() => setVolModalOpen(false)} label="إغلاق">
                <Icon d={ICON.close} size={20} color={t.muted} />
              </Press>
            </View>

            <ScrollView contentContainerStyle={{ padding: 14, gap: 8 }}>
              {index?.volumes.map((v) => {
                const isCurrent = v.volume === activeVol;
                return (
                  <Press
                    key={v.volume}
                    onPress={() => {
                      setActiveVol(v.volume);
                      setActiveChapterIdx(0);
                      setVolModalOpen(false);
                    }}
                    label={`المجلد ${v.volume}`}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: isCurrent ? pc : t.line,
                      backgroundColor: isCurrent ? t.soft : t.card,
                      gap: 4,
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Txt size={14} weight={700} color={isCurrent ? pc : t.ink} style={{ flex: 1 }}>
                        {v.title}
                      </Txt>
                      <View style={{ backgroundColor: isCurrent ? pc : t.line, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Txt size={11} weight={700} color={isCurrent ? t.onPrimary : t.muted}>
                          {v.pageCount} صفحة
                        </Txt>
                      </View>
                    </View>
                    <Txt size={11} color={t.muted}>
                      عدد الأبواب: {v.chaptersCount} باباً · الحجم: {v.sizeKb} KB
                    </Txt>
                  </Press>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Chapters in current volume Selector */}
      <Modal visible={chapterModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: t.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '82%', paddingBottom: 30 }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderColor: t.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ gap: 2 }}>
                <Txt size={17} weight={700}>
                  أبواب وفصول المجلد {activeVol}
                </Txt>
                <Txt size={12} color={t.muted}>
                  إجمالي الأبواب: {totalChaptersInVol} باباً
                </Txt>
              </View>
              <Press onPress={() => setChapterModalOpen(false)} label="إغلاق">
                <Icon d={ICON.close} size={20} color={t.muted} />
              </Press>
            </View>

            <ScrollView contentContainerStyle={{ padding: 14, gap: 8 }}>
              {volPayload?.chapters.map((c, idx) => {
                const isCurrent = idx === activeChapterIdx;
                return (
                  <Press
                    key={idx}
                    onPress={() => {
                      setActiveChapterIdx(idx);
                      setChapterModalOpen(false);
                      scrollRef.current?.scrollTo({ y: 0, animated: true });
                    }}
                    label={c.title}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isCurrent ? pc : t.line,
                      backgroundColor: isCurrent ? t.soft : t.card,
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isCurrent ? pc : t.line, alignItems: 'center', justifyContent: 'center' }}>
                        <Txt size={12} weight={700} color={isCurrent ? t.onPrimary : t.ink}>
                          {idx + 1}
                        </Txt>
                      </View>
                      <Txt size={13} weight={600} color={isCurrent ? pc : t.ink} numberOfLines={2} style={{ flex: 1 }}>
                        {c.title}
                      </Txt>
                    </View>
                    <Txt size={11} color={t.muted} weight={600}>
                      ص {c.page}
                    </Txt>
                  </Press>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
