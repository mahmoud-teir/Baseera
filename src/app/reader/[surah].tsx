/**
 * قارئ السورة — `s.reader`: verified Uthmani text (Tanzil), ayah tracking while reciting,
 * ayah sheet (تفسير / استماع بتكرار / تجويد), paper mode, offline downloads.
 * يدعم نمطين للقراءة:
 * 1) صفحات المصحف (عرض متصل بنظام صفحات مصحف المدينة 604 صفحات)
 * 2) آيات مجزأة (عرض كل آية في بطاقة مستقلة)
 */
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState as RNAppState, FlatList, Linking, ScrollView, View, type ListViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlayGlyph } from '@/components/core/PlayGlyph';
import { Button } from '@/components/core/Button';
import { Icon } from '@/components/core/Icon';
import { ChoiceChips, Diamond, EvidenceActions, PendingSlot, Segmented, Skeleton } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { BottomSheet } from '@/components/overlays/BottomSheet';
import { Hero } from '@/components/layout/Hero';
import { BackLink, Column, useTopPad } from '@/components/layout/Screen';
import {
  ayahAudioUrl,
  getPagesForSurah,
  juzName,
  reciterName,
  surah,
  SURAHS,
  toArabicDigits,
  useAyahs,
  type SurahMeta,
  type SurahPageSegment,
} from '@/data/quran';
import { ICON } from '@/data/structural';
import { jump, playbackSpeedFromLabel, playQueue, setRate, setRepeat, stop, toggle, useAudio, type Track } from '@/services/audio';
import { DOWNLOAD_ERRORS, downloadsSupported, downloadSurah, localAyahUri, surahDownloadId } from '@/services/downloads';
import { useOnline } from '@/services/network';
import { useApp } from '@/state/app-store';
import { useContent } from '@/state/content-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';
import { TAFSIRS, getTafsirInfo, useAyahTafsir } from '@/services/tafsir';


/** Quran log sampling interval, and how long without scrolling before the time stops counting. */
const TICK_S = 5;
const IDLE_MS = 2 * 60_000;

export function generateStaticParams() {
  return SURAHS.map((s) => ({ surah: String(s.n) }));
}

/** بطاقة صفحة المصحف الشريف في نمط الصفحات المتصلة */
function MushafPageItem({
  segment,
  ayahs,
  surahMeta,
  sel,
  nowAyah,
  playing,
  onAyahPress,
  sepia,
  card,
  t,
  gc,
  r,
}: {
  segment: SurahPageSegment;
  ayahs: string[];
  surahMeta: SurahMeta;
  sel: number | null;
  nowAyah: number | null;
  playing: boolean;
  onAyahPress: (a: number) => void;
  sepia: boolean;
  card: string;
  t: any;
  gc: string;
  r: (n: number) => number;
}) {
  const pageAyahs = useMemo(() => {
    const list: { num: number; text: string }[] = [];
    for (let a = segment.startAyah; a <= segment.endAyah; a++) {
      list.push({ num: a, text: ayahs[a - 1] ?? '' });
    }
    return list;
  }, [segment.startAyah, segment.endAyah, ayahs]);

  const frameBorderColor = sepia ? 'rgba(180,140,75,0.45)' : 'rgba(196,166,106,0.4)';
  const innerBorderColor = sepia ? 'rgba(180,140,75,0.25)' : 'rgba(196,166,106,0.2)';

  return (
    <View
      style={{
        backgroundColor: card,
        borderRadius: r(20),
        borderWidth: 1.5,
        borderColor: frameBorderColor,
        padding: 14,
        marginHorizontal: 2,
        marginBottom: 16,
      }}>
      {/* رأس الصفحة: اسم السورة | الجزء | رقم الصفحة */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderColor: innerBorderColor,
          marginBottom: 10,
        }}>
        <Txt size={13} weight={600} color={gc}>
          سورة {surahMeta.name}
        </Txt>
        <Txt size={12} weight={600} color={t.muted}>
          {juzName(segment.juz)}
        </Txt>
        <Txt size={13} weight={600} color={gc}>
          صفحة {toArabicDigits(segment.page)}
        </Txt>
      </View>

      {/* الإطار الداخلي لآيات المصحف */}
      <View
        style={{
          borderWidth: 1,
          borderColor: innerBorderColor,
          borderRadius: r(12),
          padding: 12,
        }}>
        {/* ترويسة السورة والبسملة إذا كانت السورة تبدأ في هذه الصفحة */}
        {segment.hasBasmala && (
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <View
              style={{
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: sepia ? '#EADDC0' : t.goldSoft,
                borderWidth: 1.5,
                borderColor: gc,
                borderRadius: r(10),
                paddingVertical: 7,
                paddingHorizontal: 16,
                marginBottom: 10,
              }}>
              <Txt font="display" size={20} weight={700} color={t.goldInk}>
                سُورَةُ {surahMeta.name}
              </Txt>
              <Txt size={12} color={t.goldInk} style={{ opacity: 0.9 }}>
                {surahMeta.type} · {toArabicDigits(surahMeta.ayas)} آية
              </Txt>
            </View>
            <Txt font="quran" size={24} weight={600} color={gc} align="center" style={{ marginTop: 2 }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Txt>
          </View>
        )}

        {/* النص القرآني المتصل للصفحة */}
        <Txt
          font="quran"
          size={24}
          lh={2.3}
          align={segment.page <= 2 ? 'center' : 'justify'}
          style={{ writingDirection: 'rtl' }}>
          {pageAyahs.map((item) => {
            const isSel = sel === item.num;
            const isNow = nowAyah === item.num && playing;
            return (
              <Txt
                key={item.num}
                font="quran"
                size={24}
                onPress={() => onAyahPress(item.num)}
                color={isSel ? (sepia ? '#1C402E' : t.primary) : isNow ? (sepia ? '#8B6A2B' : t.goldInk) : t.ink}
                style={{
                  backgroundColor: isSel
                    ? (sepia ? 'rgba(42,92,67,0.18)' : t.soft)
                    : isNow
                      ? (sepia ? 'rgba(196,166,106,0.3)' : t.goldSoft)
                      : 'transparent',
                }}>
                {item.text}
                <Txt font="quran" size={22} weight={700} color={gc}>
                  {` ﴿${toArabicDigits(item.num)}﴾ `}
                </Txt>
              </Txt>
            );
          })}
        </Txt>
      </View>

      {/* ذيل الصفحة: رقم صفحة المصحف */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 8,
          marginTop: 10,
          borderTopWidth: 1,
          borderColor: innerBorderColor,
          gap: 6,
        }}>
        <Txt size={12} color={gc}>—</Txt>
        <Txt size={13} weight={700} color={gc}>
          {toArabicDigits(segment.page)}
        </Txt>
        <Txt size={12} color={gc}>—</Txt>
      </View>
    </View>
  );
}

/** عرض محتوى تفسير الآية مع إمكانية التبديل السريع بين أمهات كتب التفسير الستة */
function AyahTafsirContent({
  surah,
  ayah,
  surahName,
  defaultTafsir,
  onSelectTafsir,
  publishedTafsir,
  t,
  r,
}: {
  surah: number;
  ayah: number;
  surahName: string;
  defaultTafsir: string;
  onSelectTafsir: (name: string) => void;
  publishedTafsir?: { tafsir: string; source: string; ayahs: Record<string, string> } | null;
  t: any;
  r: (n: number) => number;
}) {
  const [activeTafsirId, setActiveTafsirId] = useState(getTafsirInfo(defaultTafsir).id);
  const { text, loading, error, retry, tafsirInfo } = useAyahTafsir(surah, ayah, activeTafsirId);

  const displayText = text ?? (publishedTafsir?.ayahs[String(ayah)] ?? null);

  return (
    <View style={{ gap: 12 }}>
      {/* شريط اختيار كتاب التفسير من التفاسير الستة المعتمدة */}
      <View style={{ gap: 6 }}>
        <Txt size={13} weight={600} color={t.muted}>
          اختر كتاب التفسير:
        </Txt>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -4 }}
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
          {TAFSIRS.map((tInfo) => {
            const isSelected = tInfo.id === activeTafsirId;
            return (
              <Press
                key={tInfo.id}
                onPress={() => {
                  setActiveTafsirId(tInfo.id);
                  onSelectTafsir(tInfo.name);
                }}
                label={tInfo.name}
                style={{
                  paddingHorizontal: 14,
                  height: 36,
                  borderRadius: 99,
                  backgroundColor: isSelected ? t.primary : t.soft,
                  borderWidth: 1,
                  borderColor: isSelected ? t.primary : t.line,
                  justifyContent: 'center',
                }}>
                <Txt size={13} weight={600} color={isSelected ? '#FFFFFF' : t.ink}>
                  {tInfo.shortName}
                </Txt>
              </Press>
            );
          })}
        </ScrollView>
      </View>

      {/* ترويسة التفسير الحالي والمصدر */}
      <View style={{ backgroundColor: t.goldSoft, borderRadius: r(12), padding: 10, gap: 2 }}>
        <Txt size={14} weight={700} color={t.goldInk}>
          {tafsirInfo.name} · {tafsirInfo.source}
        </Txt>
        <Txt size={12} color={t.goldInk} style={{ opacity: 0.85 }}>
          {tafsirInfo.author}
        </Txt>
      </View>

      {/* نص التفسير المعتمد */}
      {loading ? (
        <View style={{ gap: 8, paddingVertical: 10 }}>
          <Skeleton height={20} />
          <Skeleton height={20} />
          <Skeleton height={20} />
          <Skeleton height={14} style={{ width: '70%' }} />
        </View>
      ) : error && !displayText ? (
        <View style={{ backgroundColor: t.errBg, borderRadius: r(14), padding: 14, gap: 8 }}>
          <Txt size={14} color={t.errInk} lh={1.8}>
            تعذّر تحميل تفسير هذه الآية بدون اتصال، ولم يُحفظ هذا الجزء محلياً بعد.
          </Txt>
          <Button variant="secondary" onPress={retry} style={{ alignSelf: 'flex-start', borderColor: t.errInk, minHeight: 36 }}>
            <Txt size={14} weight={600} color={t.errInk}>
              إعادة المحاولة
            </Txt>
          </Button>
        </View>
      ) : displayText ? (
        <View style={{ gap: 10 }}>
          <Txt size={16} lh={2} color={t.ink} selectable>
            {displayText}
          </Txt>
          <EvidenceActions
            where={`تفسير سورة ${surahName} · الآية ${ayah} (${tafsirInfo.name})`}
            data={{ text: displayText, source: `${tafsirInfo.name} · ${tafsirInfo.source}` }}
          />
        </View>
      ) : (
        <PendingSlot>تفسير هذه الآية غير متوفر حالياً في هذا الكتاب.</PendingSlot>
      )}
    </View>
  );
}

export default function Reader() {
  const params = useLocalSearchParams<{ surah: string; ayah?: string }>();
  const n = Math.max(1, Math.min(114, Number(params.surah) || 1));
  const s = surah(n);
  const { ayahs: loaded, error: textError, retry } = useAyahs(n);
  const ayahs = useMemo(() => loaded ?? [], [loaded]);
  const router = useRouter();
  const { t, gc, r, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const top = useTopPad(0);
  const online = useOnline();
  const rt = useApp((st) => st.rt);
  const set = useApp((st) => st.set);
  const fold = useApp((st) => st.fold);
  const cycleFold = useApp((st) => st.cycleFold);
  const quranBookmark = useApp((st) => st.quranBookmark);
  const setQuranBookmark = useApp((st) => st.setQuranBookmark);
  const starAyahs = useApp((st) => st.starAyahs);
  const toggleStarAyah = useApp((st) => st.toggleStarAyah);
  const setting = useApp((st) => st.setting);
  const setSetting = useApp((st) => st.setSetting);
  const downloads = useApp((st) => st.downloads);
  const flash = useUi((st) => st.flash);
  const reciter = useApp((st) => st.setting('reciter'));
  const savedQuranMode = useApp((st) => st.setting('quranMode'));
  const [localMode, setLocalMode] = useState<'صفحات المصحف' | 'آيات مجزأة' | null>(null);
  const quranMode = localMode ?? savedQuranMode;
  const isPageMode = quranMode === 'صفحات المصحف';

  const sepia = rt === 'sepia' && !dark;
  const bg = sepia ? '#F1E6CF' : t.bg;
  const card = sepia ? '#F8EFDB' : t.card;

  const [sel, setSel] = useState<number | null>(null);
  // Published tafsir for this surah (loaded lazily; undefined = not fetched, null = none published).
  const tafsir = useContent((st) => st.tafsir[n]);
  const loadTafsir = useContent((st) => st.loadTafsir);
  useEffect(() => {
    if (sel !== null && tafsir === undefined) loadTafsir(n).catch(() => {});
  }, [sel, tafsir, n, loadTafsir]);
  const [tab, setTab] = useState<'tafsir' | 'listen' | 'tajweed'>('tafsir');
  const [dl, setDl] = useState<{ done: number; total: number } | null>(null);
  const listRef = useRef<FlatList<any>>(null);

  const playingId = useAudio((st) => st.queue[st.index]?.id);
  const playing = useAudio((st) => st.playing);
  const repeat = useAudio((st) => st.repeat);
  const nowAyah = playingId?.startsWith(`ayah:${n}:`) ? Number(playingId.split(':')[2]) : null;
  const downloaded = downloads.some((d) => d.id === surahDownloadId(reciter, n));

  // مقاطع صفحات السورة وفق مصحف المدينة
  const pageSegments = useMemo(() => getPagesForSurah(n), [n]);
  const [currentAyah, setCurrentAyah] = useState(1);
  const [currentPage, setCurrentPage] = useState(pageSegments[0]?.page ?? 1);

  // Jump to the requested ayah (resume reading).
  useEffect(() => {
    const a = Number(params.ayah);
    if (a > 1) {
      setTimeout(() => {
        if (isPageMode) {
          const pageIdx = pageSegments.findIndex((p) => a >= p.startAyah && a <= p.endAyah);
          if (pageIdx >= 0) {
            listRef.current?.scrollToIndex({ index: pageIdx, animated: false, viewPosition: 0.1 });
          }
        } else {
          listRef.current?.scrollToIndex({ index: Math.min(a - 1, ayahs.length - 1), animated: false, viewPosition: 0.1 });
        }
      }, 60);
    }
  }, [params.ayah, ayahs.length, isPageMode, pageSegments]);

  // Follow the recitation.
  useEffect(() => {
    if (nowAyah && playing) {
      if (isPageMode) {
        const pageIdx = pageSegments.findIndex((p) => nowAyah >= p.startAyah && nowAyah <= p.endAyah);
        if (pageIdx >= 0) {
          listRef.current?.scrollToIndex({ index: pageIdx, animated: true, viewPosition: 0.15 });
        }
      } else {
        listRef.current?.scrollToIndex({ index: nowAyah - 1, animated: true, viewPosition: 0.3 });
      }
    }
  }, [nowAyah, playing, isPageMode, pageSegments]);

  const tracks = useCallback((): Track[] => {
    return ayahs.map((_, i) => ({
      id: `ayah:${n}:${i + 1}`,
      title: `سورة ${s.name} · الآية ${i + 1}`,
      artist: reciterName(reciter),
      album: `سورة ${s.name}`,
      artworkUrl: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=600&q=80',
      uri: localAyahUri(reciter, n, i + 1) ?? ayahAudioUrl(reciter, n, i + 1, setting('quality')),
      meta: { surah: n, ayah: i + 1 },
    }));
  }, [ayahs, n, reciter, s.name, setting]);

  const playFrom = (a: number) => {
    if (!online && !downloaded) {
      flash('لا يوجد اتصال، وهذه السورة غير منزّلة.');
      return;
    }
    setRate(playbackSpeedFromLabel(setting('speed')));
    playQueue(tracks(), a - 1, { autoNext: setting('autoNext'), repeat });
    set({ lastRead: { surah: n, ayah: a } });
  };

  const onMain = () => {
    if (nowAyah) toggle();
    else playFrom(sel ?? 1);
  };

  // FlatList needs a stable callback; the surah number is read from a ref inside it.
  const nRef = useRef(n);
  useEffect(() => {
    nRef.current = n;
  }, [n]);
  // Ayahs on screen and the last scroll time, for the Quran log below.
  const visible = useRef<number[]>([]);
  const lastMove = useRef(0);
  const [onViewable] = useState(() => ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.item) {
      if (typeof first.item === 'string') {
        const a = (first.index != null ? first.index : 0) + 1;
        setCurrentAyah(a);
        useApp.getState().set({ lastRead: { surah: nRef.current, ayah: a } });
        visible.current = viewableItems.flatMap((v) => (v.index != null ? [v.index + 1] : []));
      } else {
        const seg = first.item as SurahPageSegment;
        setCurrentAyah(seg.startAyah);
        setCurrentPage(seg.page);
        useApp.getState().set({ lastRead: { surah: nRef.current, ayah: seg.startAyah } });
        const allVisibleAyahs: number[] = [];
        viewableItems.forEach((v) => {
          const sSeg = v.item as SurahPageSegment;
          if (sSeg?.startAyah && sSeg?.endAyah) {
            for (let a = sSeg.startAyah; a <= sSeg.endAyah; a++) allVisibleAyahs.push(a);
          }
        });
        visible.current = allVisibleAyahs;
      }
    }
    lastMove.current = Date.now();
  });

  // Quran log: every TICK_S seconds while this screen is open and the app in front, the ayahs on screen
  // count as read and the playing ayah as heard. Time counts only while the user scrolls or listens
  // (not while the phone is left open on the page). Saved once a minute and on leaving.
  useFocusEffect(
    useCallback(() => {
      let pending = { read: new Set<number>(), heard: new Set<number>(), seconds: 0 };
      const flush = () => {
        if (!pending.read.size && !pending.heard.size && !pending.seconds) return;
        useApp.getState().logQuran(n, { read: [...pending.read], heard: [...pending.heard], seconds: pending.seconds });
        pending = { read: new Set(), heard: new Set(), seconds: 0 };
      };
      let ticks = 0;
      const opened = Date.now();
      const id = setInterval(() => {
        if (RNAppState.currentState !== 'active') return;
        const au = useAudio.getState();
        const id0 = au.queue[au.index]?.id;
        const heard = au.playing && id0?.startsWith(`ayah:${n}:`) ? Number(id0.split(':')[2]) : null;
        const listening = heard != null;
        const reading = Date.now() - Math.max(lastMove.current, opened) < IDLE_MS;
        if (reading) visible.current.forEach((a) => pending.read.add(a));
        if (heard != null) pending.heard.add(heard);
        if (reading || listening) pending.seconds += TICK_S;
        if (++ticks % 12 === 0) flush();
      }, TICK_S * 1000);
      const sub = RNAppState.addEventListener('change', (st) => st !== 'active' && flush());
      return () => {
        clearInterval(id);
        sub.remove();
        flush();
      };
    }, [n]),
  );

  const doDownload = async () => {
    setDl({ done: 0, total: s.ayas });
    const res = await downloadSurah(reciter, n, (done, total) => setDl({ done, total }));
    setDl(null);
    flash(res.ok ? `نُزّلت سورة ${s.name} للاستماع بلا اتصال` : DOWNLOAD_ERRORS[res.error]);
  };

  const isBookmarkHere = quranBookmark?.surah === n && (
    isPageMode ? quranBookmark?.page === currentPage : quranBookmark?.ayah === currentAyah
  );

  const marked = !!fold[n];
  const header = (
    <Hero radius={0} pad={0} diamond={{ size: 140, left: -40, top: -20 }} style={{ borderBottomLeftRadius: 26, borderBottomRightRadius: 26, paddingTop: top, paddingBottom: 16, paddingHorizontal: 20, gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <BackLink label="القرآن الكريم" href="/quran" color={gc} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Press
            onPress={() => {
              setQuranBookmark(n, currentAyah, currentPage);
              flash(`تم حفظ فاصل القراءة عند سورة ${s.name} · الآية ${currentAyah} 🔖`);
            }}
            accessibilityRole="button"
            label="حفظ فاصل القراءة"
            style={{
              height: 36,
              paddingHorizontal: 10,
              borderWidth: 1,
              borderColor: isBookmarkHere ? gc : 'rgba(255,255,255,.5)',
              backgroundColor: isBookmarkHere ? 'rgba(196,166,106,.3)' : 'transparent',
              borderRadius: 99,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}>
            <Icon d={ICON.bookmark} size={15} color={isBookmarkHere ? gc : '#FFFFFF'} sw={2} />
            <Txt size={12} weight={600} color={isBookmarkHere ? gc : '#FFFFFF'}>
              {isBookmarkHere ? 'الفاصل 🔖' : 'فاصل'}
            </Txt>
          </Press>
          <Press
            onPress={() => {
              const next = isPageMode ? 'آيات مجزأة' : 'صفحات المصحف';
              setLocalMode(next);
              setSetting('quranMode', next);
            }}
            accessibilityRole="switch"
            accessibilityState={{ checked: isPageMode }}
            label="نمط قراءة القرآن"
            style={{ height: 36, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,.5)', borderRadius: 99, justifyContent: 'center' }}>
            <Txt size={13} weight={600} color="#FFFFFF">
              {isPageMode ? 'صفحات ✓' : 'مجزأة'}
            </Txt>
          </Press>
          <Press
            onPress={() => set({ rt: rt === 'sepia' ? 'default' : 'sepia' })}
            accessibilityRole="switch"
            accessibilityState={{ checked: rt === 'sepia' }}
            label="الوضع الورقي"
            style={{ height: 36, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,.5)', borderRadius: 99, justifyContent: 'center' }}>
            <Txt size={13} weight={600} color="#FFFFFF">
              {rt === 'sepia' ? 'ورقي ✓' : 'ورقي'}
            </Txt>
          </Press>
        </View>
      </View>
      <Txt font="display" size={35} weight={700} lh={1.3} color="#FFFFFF" accessibilityRole="header">
        سورة {s.name}
      </Txt>
      <Txt size={14} color="#CFE0DA">
        {s.type} · {toArabicDigits(s.ayas)} آية
      </Txt>
    </Hero>
  );

  const onAyahCardPress = (a: number) => {
    setSel(a);
    setTab('tafsir');
    set({ lastRead: { surah: n, ayah: a } });
  };

  return (
    <Column bg={bg}>
      <StatusBar style="light" />
      {header}
      <FlatList
        key={isPageMode ? 'pages' : 'cards'}
        ref={listRef}
        data={isPageMode ? pageSegments : ayahs}
        keyExtractor={(item, i) => (isPageMode ? `page-${(item as SurahPageSegment).page}` : `ayah-${i}`)}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 14, paddingHorizontal: isPageMode ? 14 : 20, paddingBottom: 16, gap: isPageMode ? 0 : 10 }}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onScrollToIndexFailed={(e) => setTimeout(() => listRef.current?.scrollToIndex({ index: e.index, animated: false }), 200)}
        initialNumToRender={isPageMode ? 4 : 12}
        windowSize={isPageMode ? 5 : 9}
        ListEmptyComponent={
          textError ? (
            <View style={{ backgroundColor: t.errBg, borderRadius: r(16), padding: 14, gap: 8 }}>
              <Txt size={15} color={t.errInk} lh={1.8}>
                تعذّر تحميل نص المصحف.
              </Txt>
              <Button variant="secondary" onPress={retry} style={{ alignSelf: 'flex-start', borderColor: t.errInk, minHeight: 36 }}>
                <Txt size={15} weight={600} color={t.errInk}>
                  إعادة المحاولة
                </Txt>
              </Button>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {[1, 2, 3, 4, 5].map((k) => (
                <Skeleton key={k} height={62} />
              ))}
            </View>
          )
        }
        ListHeaderComponent={
          <Txt size={13} color={t.muted} lh={1.7} align="center" style={{ marginBottom: 6 }}>
            {isPageMode ? 'اضغط على أي آية في الصفحة لعرض التفسير والاستماع والتجويد.' : 'اضغط على أي آية للتفسير والاستماع والتجويد.'}
          </Txt>
        }
        ListFooterComponent={
          <Press onPress={() => Linking.openURL('https://tanzil.net')} label="مصدر النص: مشروع تنزيل" accessibilityRole="link" style={{ paddingVertical: 12 }}>
            <Txt size={13} color={t.muted} align="center" lh={1.7}>
              نص المصحف بالرسم العثماني من مشروع تنزيل (tanzil.net) — منقول دون تغيير، برخصة المشاع الإبداعي 3.0.
            </Txt>
          </Press>
        }
        renderItem={({ item, index }) => {
          if (isPageMode) {
            const segment = item as SurahPageSegment;
            return (
              <MushafPageItem
                segment={segment}
                ayahs={ayahs}
                surahMeta={s}
                sel={sel}
                nowAyah={nowAyah}
                playing={playing}
                onAyahPress={onAyahCardPress}
                sepia={sepia}
                card={card}
                t={t}
                gc={gc}
                r={r}
              />
            );
          }

          const a = index + 1;
          const isSel = sel === a;
          const isNow = nowAyah === a && playing;
          return (
            <Press
              onPress={() => onAyahCardPress(a)}
              label={`الآية ${a}`}
              style={{
                backgroundColor: isSel ? t.soft : isNow ? t.goldSoft : card,
                borderWidth: isSel || isNow ? 2 : 1,
                borderColor: isSel ? t.primary : isNow ? gc : t.line,
                borderRadius: r(18),
                padding: 14,
                flexDirection: 'row',
                gap: 12,
                alignItems: 'flex-start',
              }}>
              <Diamond n={a} size={34} color={gc} />
              <Txt font="quran" size={24} lh={2.1} style={{ flex: 1, paddingTop: 2 }} selectable>
                {item as string}
              </Txt>
            </Press>
          );
        }}
      />

      {/* مشغل الصوت السفلي — تم رفع المسافة السفلية لمراعاة أزرار التنقل الثلاثة في أندرويد */}
      <View
        style={{
          backgroundColor: t.card,
          borderTopWidth: 1,
          borderColor: t.line,
          paddingTop: 10,
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 12) + 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
        <Press
          onPress={onMain}
          label={playing && nowAyah ? 'إيقاف مؤقت' : 'تشغيل'}
          style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: t.btn, alignItems: 'center', justifyContent: 'center' }}>
          <PlayGlyph playing={!!(playing && nowAyah)} size={14} color={t.btnText} />
        </Press>
        <View style={{ flex: 1, gap: 6 }}>
          <Txt size={15} weight={600}>
            {nowAyah ? `الآية ${nowAyah} · ${reciterName(reciter)}` : sel ? `الآية ${sel}` : 'تشغيل السورة'}
          </Txt>
          <ProgressBar value={dl ? (dl.done / dl.total) * 100 : nowAyah ? (nowAyah / s.ayas) * 100 : 0} height={4} />
        </View>
        {(playing || nowAyah !== null) && (
          <Press
            onPress={() => stop()}
            label="إغلاق المشغل"
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICON.close} size={18} color={t.muted} sw={2.2} />
          </Press>
        )}
        {downloadsSupported && (
          <Press
            onPress={downloaded || dl ? undefined : doDownload}
            disabled={downloaded || !!dl}
            label={downloaded ? 'السورة منزّلة' : 'تنزيل السورة للاستماع بلا اتصال'}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            {downloaded ? (
              <Txt size={18} color={t.primary}>
                ✓
              </Txt>
            ) : (
              <Icon d={ICON.download} size={22} color={dl ? t.muted : t.primary} sw={2} />
            )}
          </Press>
        )}
      </View>

      <BottomSheet visible={sel !== null} onClose={() => setSel(null)} maxHeight={0.75} label={`الآية ${sel ?? ''}`} scrim="rgba(10,24,21,0.45)">
        {sel !== null && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <Txt font="display" size={24} weight={700} accessibilityRole="header">
                الآية {toArabicDigits(sel)}
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {/* وضع فاصل القراءة عند الآية */}
                <Press
                  onPress={() => {
                    const page = pageSegments.find((p) => sel >= p.startAyah && sel <= p.endAyah)?.page;
                    setQuranBookmark(n, sel, page);
                    flash(`تم حفظ فاصل القراءة عند سورة ${s.name} · الآية ${sel} 🔖`);
                  }}
                  accessibilityRole="button"
                  label="وضع فاصل القراءة عند هذه الآية"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 10,
                    height: 36,
                    borderRadius: r(12),
                    backgroundColor: quranBookmark?.surah === n && quranBookmark?.ayah === sel ? t.goldSoft : t.soft,
                    borderWidth: 1,
                    borderColor: quranBookmark?.surah === n && quranBookmark?.ayah === sel ? gc : t.line,
                  }}>
                  <Icon d={ICON.bookmark} size={15} color={quranBookmark?.surah === n && quranBookmark?.ayah === sel ? t.goldInk : t.primary} sw={2} />
                  <Txt size={12} weight={700} color={quranBookmark?.surah === n && quranBookmark?.ayah === sel ? t.goldInk : t.primary}>
                    {quranBookmark?.surah === n && quranBookmark?.ayah === sel ? 'الفاصل هنا ✓' : 'حفظ كفاصل 🔖'}
                  </Txt>
                </Press>

                {/* تمييز الآية بنجمة للمحفوظات */}
                <Press
                  onPress={() => {
                    toggleStarAyah(n, sel);
                    const isStarred = !starAyahs[`${n}:${sel}`];
                    flash(isStarred ? `تمت إضافة الآية ${sel} إلى المحفوظات ★` : `أزيلت الآية ${sel} من المحفوظات`);
                  }}
                  accessibilityRole="button"
                  label="تمييز الآية بنجمة"
                  style={{
                    width: 38,
                    height: 36,
                    borderRadius: r(12),
                    backgroundColor: starAyahs[`${n}:${sel}`] ? t.goldSoft : t.soft,
                    borderWidth: 1,
                    borderColor: starAyahs[`${n}:${sel}`] ? gc : t.line,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Txt size={18} color={starAyahs[`${n}:${sel}`] ? gc : t.muted}>
                    {starAyahs[`${n}:${sel}`] ? '★' : '☆'}
                  </Txt>
                </Press>

                {/* حفظ السورة كاملة */}
                <Press
                  onPress={() => {
                    cycleFold(n);
                    const willMark = !fold[n];
                    flash(willMark ? `أضيفت سورة ${s.name} إلى المحفوظات ★` : `أزيلت سورة ${s.name} من المحفوظات`);
                  }}
                  accessibilityRole="button"
                  label={marked ? `سورة محفوظة: ${fold[n]}` : 'حفظ السورة'}
                  style={{
                    height: 36,
                    paddingHorizontal: 8,
                    borderRadius: r(12),
                    backgroundColor: marked ? t.goldSoft : t.soft,
                    borderWidth: 1,
                    borderColor: marked ? gc : t.line,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                  <Txt size={15} color={marked ? gc : t.muted}>
                    {marked ? '★' : '☆'}
                  </Txt>
                  <Txt size={11} color={marked ? t.goldInk : t.muted}>
                    {marked ? fold[n] : 'سورة'}
                  </Txt>
                </Press>
              </View>
            </View>
            <Txt font="quran" size={22} lh={2.1} color={t.ink}>
              {ayahs[sel - 1]}
            </Txt>
            <Segmented
              options={[
                { value: 'tafsir', label: 'تفسير' },
                { value: 'listen', label: 'استماع' },
                { value: 'tajweed', label: 'تجويد' },
              ]}
              value={tab}
              onChange={setTab}
              height={40}
              label="أقسام الآية"
            />
            {!online && tab !== 'tajweed' && !(tab === 'listen' && downloaded) ? (
              <View style={{ backgroundColor: t.errBg, borderRadius: r(16), padding: 14, gap: 8 }}>
                <Txt size={15} color={t.errInk} lh={1.8}>
                  تعذّر تحميل هذا القسم بدون اتصال.
                </Txt>
                <Press onPress={() => flash(online ? 'تمت إعادة الاتصال' : 'ما زال الاتصال منقطعًا')} label="إعادة المحاولة" style={{ alignSelf: 'flex-start', borderWidth: 1.5, borderColor: t.errInk, borderRadius: r(10), paddingHorizontal: 14, height: 36, justifyContent: 'center' }}>
                  <Txt size={15} weight={600} color={t.errInk}>
                    إعادة المحاولة
                  </Txt>
                </Press>
              </View>
            ) : tab === 'tafsir' ? (
              <AyahTafsirContent
                surah={n}
                ayah={sel}
                surahName={s.name}
                defaultTafsir={setting('tafsir')}
                onSelectTafsir={(name) => setSetting('tafsir', name as any)}
                publishedTafsir={tafsir}
                t={t}
                r={r}
              />
            ) : tab === 'listen' ? (
              <View style={{ gap: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22 }}>
                  <Press onPress={() => (nowAyah ? jump(1) : setSel(Math.min(s.ayas, sel + 1)))} label="الآية التالية" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon d={ICON.prevTrack} size={26} color={t.muted} sw={1.8} directional />
                  </Press>
                  <Press
                    onPress={() => (nowAyah === sel ? toggle() : playFrom(sel))}
                    label={playing && nowAyah === sel ? 'إيقاف مؤقت' : `تشغيل الآية ${sel}`}
                    style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.btn, alignItems: 'center', justifyContent: 'center' }}>
                    <PlayGlyph playing={playing && nowAyah === sel} size={15} color={t.btnText} />
                  </Press>
                  <Press onPress={() => (nowAyah ? jump(-1) : setSel(Math.max(1, sel - 1)))} label="الآية السابقة" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon d={ICON.nextTrack} size={26} color={t.muted} sw={1.8} directional />
                  </Press>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Txt size={14} color={t.muted} style={{ width: 54 }}>
                    التكرار
                  </Txt>
                  <View style={{ flex: 1 }}>
                    <ChoiceChips options={[1, 3, 5].map((x) => ({ value: x, label: `×${x}` }))} value={repeat} onChange={setRepeat} radius={r(10)} height={38} borderWidth={1} flex />
                  </View>
                </View>
                <Press onPress={() => router.push('/account/settings/reciter')} label="تغيير القارئ" style={{ minHeight: 32 }}>
                  <Txt size={14} color={t.muted}>
                    القارئ: {reciterName(reciter)} · <Txt size={14} color={t.primary} weight={600}>تغيير</Txt>
                  </Txt>
                </Press>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <Txt size={16} lh={1.9} color={t.body}>
                  أحكام التجويد في هذه الآية تظهر هنا بألوان توضيحية مع اسم الحكم وشرحه المختصر، بعد المراجعة العلمية.
                </Txt>
                <Button
                  onPress={() => {
                    setSel(null);
                    router.navigate('/quran/tajweed');
                  }}
                  style={{ backgroundColor: t.goldSoft, minHeight: 46 }}
                  radius={r(14)}>
                  <Txt size={16} weight={700} color={t.goldInk}>
                    افتح دروس التجويد
                  </Txt>
                </Button>
              </View>
            )}
          </>
        )}
      </BottomSheet>
    </Column>
  );
}
