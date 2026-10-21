import { View } from 'react-native';

import { useTheme } from '@/theme/theme';

import { Txt } from './Txt';

/**
 * EvidenceBlock — components/core/EvidenceBlock.{d.ts,jsx,prompt.md}
 * «كتلة دليل: موثّقة بنص ومصدر، أو فارغة بإطار منقّط. لا يُعرض نص بلا مصدر.»
 * Props from EvidenceBlock.d.ts: label, text, source, reference.
 * Text without a source is never shown (HANDOFF §1): it falls back to the dashed slot.
 */
export interface EvidenceBlockProps {
  label: string;
  text?: string | null;
  source?: string;
  reference?: string;
}

export function EvidenceBlock({ label, text, source, reference }: EvidenceBlockProps) {
  const { t, gc, r } = useTheme();
  if (!text || !source) {
    return (
      <View style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: gc, borderRadius: r(12), padding: 10 }}>
        <Txt size={15} color={t.goldInk} lh={1.7}>
          موضع {label}: يُدرج النص من مصدر موثّق مع رقمه وتخريجه.
        </Txt>
      </View>
    );
  }
  return (
    <View style={{ backgroundColor: t.card, borderRadius: r(14), padding: 12, gap: 6 }}>
      <Txt size={13} weight={600} color={t.goldInk}>
        {label}
      </Txt>
      <Txt font="display" size={22} lh={2} color={t.ink}>
        {text}
      </Txt>
      <Txt size={14} color={t.muted}>
        {source}
        {reference ? ` · ${reference}` : ''}
      </Txt>
    </View>
  );
}
