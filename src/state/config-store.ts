/**
 * App-wide defaults set from the console's «Prayer & calendar» view (`public.app_config`).
 * They apply until the user changes the matching setting. The last fetched copy is cached so
 * the app keeps the same defaults offline.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { SUBJECTS } from '@/data/structural';
import { supabase } from '@/services/supabase';

export const PrayerConfigSchema = z.object({
  method: z.enum(['Muslim World League', 'Umm al-Qura', 'Egyptian General Authority', 'Karachi', 'ISNA']),
  hijriAdj: z.number().int().min(-2).max(2),
  notifications: z.boolean(),
  highLatitude: z.boolean(),
  dst: z.boolean(),
});
export type PrayerConfig = z.infer<typeof PrayerConfigSchema>;

export const PRAYER_CONFIG_DEFAULTS: PrayerConfig = { method: 'Muslim World League', hijriAdj: 0, notifications: true, highLatitude: false, dst: true };

/** Console method names → the app's calculation-method setting values. */
export const METHOD_LABEL: Record<PrayerConfig['method'], string> = {
  'Muslim World League': 'رابطة العالم الإسلامي',
  'Umm al-Qura': 'أم القرى',
  'Egyptian General Authority': 'الهيئة المصرية',
  Karachi: 'كراتشي',
  ISNA: 'أمريكا الشمالية',
};

/** Planned lessons per subject in stage 1 (`app_config.curriculum`, edited by admins) and the default pass mark. */
export const CurriculumSchema = z.object({ stage1: z.record(z.string(), z.number().int().min(0)), passPct: z.number().int().min(50).max(100) });
export type Curriculum = z.infer<typeof CurriculumSchema>;
export const CURRICULUM_DEFAULTS: Curriculum = { stage1: Object.fromEntries(SUBJECTS.map((s) => [s.id, s.count])), passPct: 85 };

/** Planned lesson count for a subject and for the whole of stage 1. */
export const plannedCount = (c: Curriculum, subjectId: string) => c.stage1[subjectId] ?? 0;
export const stage1Total = (c: Curriculum) => SUBJECTS.reduce((a, s) => a + plannedCount(c, s.id), 0);

interface ConfigState {
  prayer: PrayerConfig;
  curriculum: Curriculum;
  setPrayer: (p: PrayerConfig) => void;
  setCurriculum: (c: Curriculum) => void;
}

export const useConfig = create<ConfigState>()(
  persist(
    (set) => ({
      prayer: PRAYER_CONFIG_DEFAULTS,
      curriculum: CURRICULUM_DEFAULTS,
      setPrayer: (prayer) => set({ prayer }),
      setCurriculum: (curriculum) => set({ curriculum }),
    }),
    { name: 'baseerah-config', storage: createJSONStorage(() => AsyncStorage), skipHydration: true },
  ),
);

/** Fetch the published defaults (public read). Invalid or missing rows keep the cached copy. */
export async function loadRemoteConfig(): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.from('app_config').select('key, value').in('key', ['prayer', 'curriculum']);
  for (const row of data ?? []) {
    if (row.key === 'prayer') {
      const p = PrayerConfigSchema.safeParse(row.value);
      if (p.success) useConfig.getState().setPrayer(p.data);
    } else {
      const c = CurriculumSchema.safeParse(row.value);
      if (c.success) useConfig.getState().setCurriculum(c.data);
    }
  }
}
