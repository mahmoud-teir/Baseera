/** المشغّل — `s.player`: real playback with ±15s, speed, sleep timer, queue, download for offline. */
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Card } from '@/components/core/Card';
import { ChoiceChips } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { BackLink, Screen, Title } from '@/components/layout/Screen';
import { AUDIO_CATEGORIES } from '@/data/structural';
import { isCurrent, playQueue, seekBy, setRate, setSleep, toggle, useAudio } from '@/services/audio';
import { cachedItem, folderId, useLibraryItem } from '@/services/content';
import { DOWNLOAD_ERRORS, downloadFile } from '@/services/downloads';
import { useOnline } from '@/services/network';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';
import { mmss } from '@/utils/date';

export default function Player() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { item, loading } = useLibraryItem(id ?? '');
  const { t, r } = useTheme();
  const online = useOnline();
  const downloads = useApp((s) => s.downloads);
  const queue = useApp((s) => s.queue);
  const toggleQueue = useApp((s) => s.toggleQueue);
  const flash = useUi((s) => s.flash);
  const trackId = `lib:${id}`;
  const playing = useAudio((s) => s.playing && s.queue[s.index]?.id === trackId);
  const pos = useAudio((s) => (s.queue[s.index]?.id === trackId ? s.position : 0));
  const dur = useAudio((s) => (s.queue[s.index]?.id === trackId ? s.duration : 0));
  const rate = useAudio((s) => s.rate);
  const sleepSel = useAudio((s) => s.sleepMin);

  if (!item) {
    return (
      <Screen>
        <BackLink label="المكتبة" href="/library" />
        <Title>{loading ? 'جارٍ التحميل…' : 'التسجيل غير متاح'}</Title>
      </Screen>
    );
  }
  const dl = downloads.find((d) => d.id === `a:${item.id}`);
  const uri = dl?.uri ?? item.audio_url;
  const canPlay = !!uri && (online || !!dl);
  const inQueue = queue.includes(item.id);

  const play = () => {
    if (!uri) return;
    if (isCurrent(trackId)) toggle();
    else {
      // Play this item, then any queued recordings.
      const rest = queue.filter((q) => q !== item.id).map((q) => cachedItem(q)).filter((x) => x?.audio_url);
      playQueue([
        { id: trackId, title: item.title, uri, artist: item.author ?? 'بصيرة' },
        ...rest.map((x) => ({ id: `lib:${x!.id}`, title: x!.title, uri: x!.audio_url!, artist: x!.author ?? 'بصيرة' })),
      ]);
    }
  };
  const download = async () => {
    if (!item.audio_url) return;
    const res = await downloadFile(`a:${item.id}`, item.audio_url, item.title, 'صوت', item.size_mb ?? 20);
    flash(res.ok ? 'نُزّل التسجيل للاستماع بلا اتصال' : DOWNLOAD_ERRORS[res.error]);
  };

  return (
    <Screen padH={24} gap={18} padBottom={24}>
      <BackLink label={item.category} href={`/library/folder/${folderId('audio', Math.max(0, AUDIO_CATEGORIES.indexOf(item.category)))}`} />
      <View style={{ height: 260, borderRadius: r(28), borderWidth: 1, borderColor: t.line, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
        <Txt size={12} color={t.muted}>
          غلاف التسجيل
        </Txt>
      </View>
      <View style={{ gap: 4 }}>
        <Txt font="display" size={28} weight={700} accessibilityRole="header">
          {item.title}
        </Txt>
        <Txt size={15} color={t.muted}>
          {item.author ? `${item.author}${item.source ? ` · ${item.source}` : ''}` : 'اسم المتحدث والمصدر — يُدرج بعد التوثيق'}
        </Txt>
      </View>
      {!online && !dl && (
        <View style={{ backgroundColor: t.errBg, borderRadius: r(16), padding: 14 }}>
          <Txt size={15} color={t.errInk}>
            تعذّر التشغيل بدون اتصال. سيعمل التشغيل عند عودة الاتصال.
          </Txt>
        </View>
      )}
      {!item.audio_url && (
        <View style={{ backgroundColor: t.goldSoft, borderRadius: r(16), padding: 14 }}>
          <Txt size={15} color={t.goldInk} lh={1.8}>
            الملف الصوتي لهذا العنوان يُدرج بعد توثيق مصدره.
          </Txt>
        </View>
      )}
      <View style={{ gap: 8 }}>
        <ProgressBar value={dur ? (pos / dur) * 100 : 0} label="موضع التشغيل" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', direction: 'ltr' }}>
          <Txt size={14} color={t.muted} ltr>
            {mmss(pos)}
          </Txt>
          <Txt size={14} color={t.muted} ltr>
            {mmss(dur)}
          </Txt>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 26 }}>
        <Press onPress={() => seekBy(-15)} disabled={!playing} label="رجوع 15 ثانية" style={{ minWidth: 48, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: playing ? 1 : 0.5 }}>
          <Txt size={15} color={t.muted}>
            −15ث
          </Txt>
        </Press>
        <Press onPress={play} disabled={!canPlay} label={playing ? 'إيقاف مؤقت' : 'تشغيل'} style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: t.btn, alignItems: 'center', justifyContent: 'center', opacity: canPlay ? 1 : 0.5 }}>
          <Txt size={22} color={t.btnText}>
            {playing ? '❚❚' : '▶'}
          </Txt>
        </Press>
        <Press onPress={() => seekBy(15)} disabled={!playing} label="تقديم 15 ثانية" style={{ minWidth: 48, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: playing ? 1 : 0.5 }}>
          <Txt size={15} color={t.muted}>
            +15ث
          </Txt>
        </Press>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Txt size={14} color={t.muted} style={{ width: 50 }}>
          المؤقّت
        </Txt>
        <View style={{ flex: 1 }}>
          <ChoiceChips options={[0, 15, 30, 60].map((m) => ({ value: m, label: m ? `${m} د` : 'إيقاف' }))} value={sleepSel} onChange={setSleep} radius={10} height={40} borderWidth={1} flex />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button variant="secondary" radius={r(14)} disabled={!item.audio_url || !!dl} onPress={download} style={{ flex: 1, minHeight: 46 }}>
          {dl ? 'تم التنزيل ✓' : 'تنزيل للاستماع بلا اتصال'}
        </Button>
        <Button variant="secondary" radius={r(14)} onPress={() => toggleQueue(item.id)} style={{ flex: 1, minHeight: 46 }}>
          {inQueue ? 'في القائمة ✓' : 'أضف إلى قائمة التشغيل'}
        </Button>
      </View>
      {queue.length > 0 && (
        <Card variant="app" radius={16} pad={0} style={{ paddingVertical: 12, paddingHorizontal: 14, gap: 6 }}>
          <Txt size={15} weight={700}>
            قائمة التشغيل
          </Txt>
          {queue.map((q) => {
            const x = cachedItem(q);
            return (
              <Txt key={q} size={15} color={t.body}>
                ◆ {x ? `${x.title} · ${x.category}` : q}
              </Txt>
            );
          })}
        </Card>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Txt size={14} color={t.muted} style={{ width: 50 }}>
          السرعة
        </Txt>
        <View style={{ flex: 1 }}>
          <ChoiceChips options={[0.75, 1, 1.25, 1.5].map((n) => ({ value: n, label: `${n}×` }))} value={rate} onChange={setRate} radius={r(10)} height={40} borderWidth={1} flex />
        </View>
      </View>
    </Screen>
  );
}
