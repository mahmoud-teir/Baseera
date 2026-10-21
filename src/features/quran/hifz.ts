import { useTheme } from '@/theme/theme';

/** Memorisation states (hs in the prototype). */
export const HIFZ_LABELS = ['لم يبدأ', 'قيد الحفظ', 'محفوظة', 'تحتاج مراجعة'] as const;

export function useHifzColors() {
  const { t } = useTheme();
  return [
    { bg: t.lockBg, fg: t.muted },
    { bg: t.goldSoft, fg: t.goldInk },
    { bg: t.soft, fg: t.primary },
    { bg: t.errBg, fg: t.errInk },
  ];
}
