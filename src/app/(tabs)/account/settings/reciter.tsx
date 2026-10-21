/** القارئ الافتراضي — choose the recitation used by the reader, with a short preview of Al-Fatiha 1:1. */
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { ayahAudioUrl, RECITERS } from '@/data/quran';
import { isCurrent, playQueue, stop, useAudio } from '@/services/audio';
import { useApp } from '@/state/app-store';
import { useTheme } from '@/theme/theme';

export default function Reciter() {
  const { t } = useTheme();
  const reciter = useApp((s) => s.setting('reciter'));
  const setSetting = useApp((s) => s.setSetting);
  const playingId = useAudio((s) => (s.playing ? s.queue[s.index]?.id : undefined));
  return (
    <Screen gap={12}>
      <BackLink label="الإعدادات" href="/account/settings" />
      <Title>القارئ الافتراضي</Title>
      <Lead>تلاوات مرتّلة لكل آية من مصدر عام (EveryAyah). اختر القارئ، واستمع إلى معاينة قصيرة.</Lead>
      {RECITERS.map((rc) => {
        const on = rc.id === reciter;
        const pid = `preview:${rc.id}`;
        const previewing = playingId === pid;
        return (
          <Card key={rc.id} variant="app" radius={18} pad={0} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, minHeight: 60, ...(on ? { borderColor: t.primary, borderWidth: 1.5 } : null) }}>
            <Press onPress={() => setSetting('reciter', rc.id)} accessibilityRole="radio" accessibilityState={{ checked: on }} label={rc.name} style={{ flex: 1, minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: t.primary, alignItems: 'center', justifyContent: 'center' }}>
                {on && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.primary }} />}
              </View>
              <Txt size={17} weight={600}>
                {rc.name}
              </Txt>
            </Press>
            <Press
              onPress={() => (previewing || isCurrent(pid) ? stop() : playQueue([{ id: pid, title: 'معاينة', uri: ayahAudioUrl(rc.id, 1, 1), artist: rc.name }], 0, { repeat: 1, autoNext: false }))}
              label={previewing ? `إيقاف معاينة ${rc.name}` : `معاينة ${rc.name}`}
              style={{ minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' }}>
              <Txt size={14} weight={600} color={t.primary}>
                {previewing ? '❚❚ إيقاف' : '▶ معاينة'}
              </Txt>
            </Press>
          </Card>
        );
      })}
    </Screen>
  );
}
