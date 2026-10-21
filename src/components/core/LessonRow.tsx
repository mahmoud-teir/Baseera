import { View } from 'react-native';

import { useTheme } from '@/theme/theme';

import { LockIcon } from './Icon';
import { Press } from './Press';
import { Txt } from './Txt';

/**
 * LessonRow — components/core/LessonRow.{d.ts,jsx,prompt.md}
 * «صف درس بثلاث حالات: مكتمل، حالي، مقفل.»
 * Props from LessonRow.d.ts: code, title, state ('done'|'current'|'locked'), onClick.
 * State is conveyed by icon + text, not colour alone (HANDOFF §8).
 */
export interface LessonRowProps {
  code: string;
  title: string;
  state?: 'done' | 'current' | 'locked';
  onClick?: () => void;
  onPress?: () => void;
}

export function LessonRow({ code, title, state = 'locked', onClick, onPress }: LessonRowProps) {
  const { t, r, dark } = useTheme();
  const done = state === 'done';
  const cur = state === 'current';
  const lock = state === 'locked';
  const tag = done ? 'مكتمل' : cur ? 'ابدأ' : 'مقفل';
  return (
    <Press
      onPress={lock ? undefined : (onPress ?? onClick)}
      disabled={lock}
      label={`${code} ${title} · ${tag}`}
      style={{
        backgroundColor: cur ? t.card : lock ? (dark ? '#102F29' : '#F6F3EA') : t.card,
        borderWidth: cur ? 1.5 : 1,
        borderColor: cur ? t.primary : t.line,
        borderRadius: r(18),
        paddingVertical: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
      }}>
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: done || cur ? t.primary : t.lockBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {lock ? (
          <LockIcon color={t.muted} />
        ) : (
          <Txt size={17} color={dark ? '#0E2A25' : '#FFFFFF'}>
            {done ? '✓' : '▶'}
          </Txt>
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt size={14} weight={600} color={cur ? t.goldInk : t.muted} ltr style={{ alignSelf: 'flex-start' }}>
          {code}
        </Txt>
        <Txt size={17} weight={600} color={lock ? t.muted : t.ink}>
          {title}
        </Txt>
      </View>
      <Txt size={13} weight={600} color={done ? t.primary : cur ? t.goldInk : t.muted}>
        {tag}
      </Txt>
    </Press>
  );
}
