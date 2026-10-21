/**
 * قارئ السورة — `s.reader`: verified Uthmani text (Tanzil), ayah tracking while reciting,
 * ayah sheet (تفسير / استماع بتكرار / تجويد), paper mode, offline downloads.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Linking, View, type ListViewToken } from 'react-native';

import { Button } from '@/components/core/Button';
import { Icon } from '@/components/core/Icon';
import { ChoiceChips, Diamond, EvidenceActions, PendingSlot, Segmented, Skeleton } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { BottomSheet } from '@/components/overlays/BottomSheet';
import { Hero } from '@/components/layout/Hero';
import { BackLink, Column, useTopPad } from '@/components/layout/Screen';
import { ayahAudioUrl, reciterName, surah, SURAHS, useAyahs } from '@/data/quran';
import { ICON } from '@/data/structural';
import { jump, playbackSpeedFromLabel, playQueue, setRate, setRepeat, toggle, useAudio, type Track } from '@/services/audio';
import { DOWNLOAD_ERRORS, downloadsSupported, downloadSurah, localAyahUri, surahDownloadId } from '@/services/downloads';
import { useOnline } from '@/services/network';
import { useApp } from '@/state/app-store';
import { useContent } from '@/state/content-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

export function generateStaticParams() {
  return SURAHS.map((s) => ({ surah: String(s.n) }));
}

export default function Reader() {
  const params = useLocalSearchParams<{ surah: string; ayah?: string }>();
  const n = Math.max(1, Math.min(114, Number(params.surah) || 1));
  const s = surah(n);
  const { ayahs: loaded, error: textError, retry } = useAyahs(n);
  const ayahs = useMemo(() => loaded ?? [], [loaded]);
  const router = useRouter();
  const { t, gc, r, dark } = useTheme();
  const top = useTopPad(0);
  const online = useOnline();
  const rt = useApp((st) => st.rt);
  const set = useApp((st) => st.set);
  const fold = useApp((st) => st.fold);
  const cycleFold = useApp((st) => st.cycleFold);
  const setting = useApp((st) => st.setting);
  const downloads = useApp((st) => st.downloads);
  const flash = useUi((st) => st.flash);
  const reciter = setting('reciter');
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
  const listRef = useRef<FlatList<string>>(null);

  const playingId = useAudio((st) => st.queue[st.index]?.id);
  const playing = useAudio((st) => st.playing);
  const repeat = useAudio((st) => st.repeat);
  const nowAyah = playingId?.startsWith(`ayah:${n}:`) ? Number(playingId.split(':')[2]) : null;
  const downloaded = downloads.some((d) => d.id === surahDownloadId(reciter, n));

  // Jump to the requested ayah (resume reading).
  useEffect(() => {
    const a = Number(params.ayah);
    if (a > 1) setTimeout(() => listRef.current?.scrollToIndex({ index: Math.min(a - 1, ayahs.length - 1), animated: false, viewPosition: 0.1 }), 50);
  }, [params.ayah, ayahs.length]);

  // Follow the recitation.
  useEffect(() => {
    if (nowAyah && playing) listRef.current?.scrollToIndex({ index: nowAyah - 1, animated: true, viewPosition: 0.3 });
  }, [nowAyah, playing]);

  const tracks = useCallback((): Track[] => {
    return ayahs.map((_, i) => ({
      id: `ayah:${n}:${i + 1}`,
      title: `سورة ${s.name} · الآية ${i + 1}`,
      artist: reciterName(reciter),
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
  const [onViewable] = useState(() => ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) useApp.getState().set({ lastRead: { surah: nRef.current, ayah: first.index + 1 } });
  });

  const doDownload = async () => {
    setDl({ done: 0, total: s.ayas });
    const res = await downloadSurah(reciter, n, (done, total) => setDl({ done, total }));
    setDl(null);
    flash(res.ok ? `نُزّلت سورة ${s.name} للاستماع بلا اتصال` : DOWNLOAD_ERRORS[res.error]);
  };

  const marked = !!fold[n];
  const header = (
    <Hero radius={0} pad={0} diamond={{ size: 140, left: -40, top: -20 }} style={{ borderBottomLeftRadius: 26, borderBottomRightRadius: 26, paddingTop: top, paddingBottom: 16, paddingHorizontal: 20, gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <BackLink label="القرآن الكريم" href="/quran" color={gc} />
        <Press
          onPress={() => set({ rt: rt === 'sepia' ? 'default' : 'sepia' })}
          accessibilityRole="switch"
          accessibilityState={{ checked: rt === 'sepia' }}
          label="الوضع الورقي"
          style={{ height: 36, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,.5)', borderRadius: 99, justifyContent: 'center' }}>
          <Txt size={14} weight={600} color="#FFFFFF">
            {rt === 'sepia' ? 'ورقي ✓' : 'ورقي'}
          </Txt>
        </Press>
      </View>
      <Txt font="display" size={35} weight={700} lh={1.3} color="#FFFFFF" accessibilityRole="header">
        سورة {s.name}
      </Txt>
      <Txt size={14} color="#CFE0DA">
        {s.type} · {s.ayas} آية
      </Txt>
    </Hero>
  );

  return (
    <Column bg={bg}>
      <StatusBar style="light" />
      {header}
      <FlatList
        ref={listRef}
        data={ayahs}
        keyExtractor={(_, i) => String(i)}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 14, paddingHorizontal: 20, paddingBottom: 16, gap: 10 }}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        onScrollToIndexFailed={(e) => setTimeout(() => listRef.current?.scrollToIndex({ index: e.index, animated: false }), 200)}
        initialNumToRender={12}
        windowSize={9}
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
          <Txt size={13} color={t.muted} lh={1.7} align="center" style={{ marginBottom: 4 }}>
            اضغط على أي آية للتفسير والاستماع والتجويد.
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
          const a = index + 1;
          const isSel = sel === a;
          const isNow = nowAyah === a && playing;
          return (
            <Press
              onPress={() => {
                setSel(a);
                setTab('tafsir');
                set({ lastRead: { surah: n, ayah: a } });
              }}
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
                {item}
              </Txt>
            </Press>
          );
        }}
      />
      <View style={{ backgroundColor: t.card, borderTopWidth: 1, borderColor: t.line, paddingTop: 10, paddingHorizontal: 20, paddingBottom: 22, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Press
          onPress={onMain}
          label={playing && nowAyah ? 'إيقاف مؤقت' : 'تشغيل'}
          style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: t.btn, alignItems: 'center', justifyContent: 'center' }}>
          <Txt size={16} color={t.btnText}>
            {playing && nowAyah ? '❚❚' : '▶'}
          </Txt>
        </Press>
        <View style={{ flex: 1, gap: 6 }}>
          <Txt size={15} weight={600}>
            {nowAyah ? `الآية ${nowAyah} · ${reciterName(reciter)}` : sel ? `الآية ${sel}` : 'تشغيل السورة'}
          </Txt>
          <ProgressBar value={dl ? (dl.done / dl.total) * 100 : nowAyah ? (nowAyah / s.ayas) * 100 : 0} height={4} />
        </View>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt font="display" size={24} weight={700} accessibilityRole="header">
                الآية {sel}
              </Txt>
              <Press onPress={() => cycleFold(n)} label={marked ? `علامة مرجعية: ${fold[n]}` : 'إضافة علامة مرجعية'} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={24} color={marked ? gc : t.muted}>
                  {marked ? '★' : '☆'}
                </Txt>
              </Press>
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
              <View style={{ gap: 9 }}>
                {tafsir && tafsir.ayahs[String(sel)] ? (
                  <>
                    <Txt size={14} weight={600} color={t.goldInk}>
                      {tafsir.tafsir} · {tafsir.source}
                    </Txt>
                    <Txt size={17} lh={1.9} color={t.body}>
                      {tafsir.ayahs[String(sel)]}
                    </Txt>
                    <EvidenceActions where={`تفسير سورة ${s.name} · الآية ${sel}`} data={{ text: tafsir.ayahs[String(sel)], source: `${tafsir.tafsir} · ${tafsir.source}` }} />
                  </>
                ) : (
                  <>
                    <PendingSlot>تفسير هذه الآية يُدرج من مصدر موثّق بعد المراجعة العلمية.</PendingSlot>
                    <EvidenceActions where={`تفسير سورة ${s.name} · الآية ${sel}`} />
                  </>
                )}
              </View>
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
                    <Txt size={18} color={t.btnText}>
                      {playing && nowAyah === sel ? '❚❚' : '▶'}
                    </Txt>
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
