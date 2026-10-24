/**
 * اختيار المؤذن وصوت الأذان — تطبيق بصيرة.
 * يتيح اختيار المؤذن المفضل، والاستماع المسبق لعينات الأذان،
 * مع ضبط الصدوح في الوضع الصامت عبر مجرى المنبه (Alarm Stream).
 */
import { useEffect } from 'react';
import { View } from 'react-native';

import { PlayGlyph } from '@/components/core/PlayGlyph';
import { Card } from '@/components/core/Card';
import { IconTile } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { Hero } from '@/components/layout/Hero';
import { BackLink, Screen } from '@/components/layout/Screen';
import { ICON } from '@/data/structural';
import { playQueue, stop, toggle, useAudio } from '@/services/audio';
import { DEFAULT_MUADHIN, getMuadhinInfo, MUADHINS, type MuadhinInfo } from '@/services/muadhin';
import { rescheduleAll } from '@/services/notifications';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

export default function MuadhinSettings() {
  const { t, gc } = useTheme();
  const flash = useUi((s) => s.flash);
  const setting = useApp((s) => s.setting);
  const setSetting = useApp((s) => s.setSetting);

  const activeMuadhinId = setting('muadhin') || DEFAULT_MUADHIN.id;
  const currentMuadhin = getMuadhinInfo(activeMuadhinId);

  const playingId = useAudio((s) => s.queue[s.index]?.id);
  const playing = useAudio((s) => s.playing);

  // previewing tracked via audio store

  // Stop audio when unmounting
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  const handleSelect = (m: MuadhinInfo) => {
    setSetting('muadhin', m.id as any);
    flash(`تم اختيار ${m.name} لصوت الأذان`);
    rescheduleAll().catch(() => {});
  };

  const handlePreview = (m: MuadhinInfo) => {
    const trackId = `adhan_preview:${m.id}`;
    if (playingId === trackId && playing) {
      toggle();
    } else {
      playQueue([
        {
          id: trackId,
          title: `أذان الصلاة · ${m.name}`,
          artist: m.place,
          uri: m.audioUrl,
        },
      ]);
    }
  };

  return (
    <Screen padH={20} gap={16} padBottom={32}>
      <BackLink label="الإعدادات" href="/account/settings" />

      <Hero radius={24} pad={20} gap={8} diamond={{ size: 140, left: -40, top: -40, color: 'rgba(196,166,106,.45)' }}>
        <Txt font="display" size={28} weight={700} color="#FFFFFF" accessibilityRole="header">
          المؤذن وصوت الأذان
        </Txt>
        <Txt size={14} color="#CFE0DA" lh={1.7}>
          اختر مؤذنك المفضل لصدوح الأذان عند دخول وقت كل صلاة.
        </Txt>
      </Hero>

      {/* Alarm Stream Notice */}
      <Card variant="app" radius={18} pad={16} style={{ gap: 8, backgroundColor: t.goldSoft, borderColor: gc }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconTile d={ICON.moon} size={36} iconSize={20} bg="rgba(196,166,106,.35)" color={t.goldInk} radius={12} sw={2} />
          <Txt size={16} weight={700} color={t.goldInk}>
            الصدوح في الوضع الصامت (المنبه)
          </Txt>
        </View>
        <Txt size={13} color={t.goldInk} lh={1.8}>
          تم ضبط قناة الأذان لتتبع نظام المنبه ومستواه الصوتي (Alarm Stream)، بحيث يصدح الأذان في وقت الصلاة بدقة حتى لو كان الهاتف في وضع الصامت أو الاهتزاز.
        </Txt>
      </Card>

      {/* Muadhins List */}
      <View style={{ gap: 10 }}>
        <Txt size={15} weight={700} color={t.ink}>
          أصوات الأذان المعتمدة:
        </Txt>

        {MUADHINS.map((m) => {
          const isSelected = m.id === currentMuadhin.id;
          const isTrackPlaying = playingId === `adhan_preview:${m.id}` && playing;

          return (
            <Card
              key={m.id}
              variant="app"
              radius={18}
              pad={14}
              style={{
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? t.primary : t.line,
                backgroundColor: isSelected ? t.soft : t.card,
                gap: 10,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {/* Play preview button */}
                <Press
                  onPress={() => handlePreview(m)}
                  label={isTrackPlaying ? 'إيقاف الاستماع' : `استماع لصوت ${m.name}`}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: isTrackPlaying ? t.btn : t.card,
                    borderWidth: 1,
                    borderColor: t.line,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <PlayGlyph playing={isTrackPlaying} size={14} color={isTrackPlaying ? t.btnText : t.primary} />
                </Press>

                {/* Details */}
                <Press
                  onPress={() => handleSelect(m)}
                  label={`اختيار ${m.name}`}
                  style={{ flex: 1, gap: 2 }}>
                  <Txt size={16} weight={700} color={t.ink}>
                    {m.name}
                  </Txt>
                  <Txt size={13} color={t.muted}>
                    {m.place}
                  </Txt>
                </Press>

                {/* Select Radio / Checkmark */}
                <Press
                  onPress={() => handleSelect(m)}
                  label={isSelected ? 'محدد حالياً' : `تحديد ${m.name}`}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: isSelected ? t.primary : t.muted,
                    backgroundColor: isSelected ? t.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {isSelected && (
                    <Txt size={16} weight={700} color="#FFFFFF">
                      ✓
                    </Txt>
                  )}
                </Press>
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
