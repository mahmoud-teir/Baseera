/**
 * محرك حالة بوابات التوحيد واليقين — Tawheed & Sunnah Gateways Store
 * يوثق تقدم المستخدم عبر بوابات التوحيد السبع واجتياز اختبارات التثبيت وبراهين النجاة
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { safeStorage } from './storage';

export interface TawheedState {
  /** البوابات المفتوحة (البوابة الأولى مفتوحة تلقائياً) */
  unlockedGates: Record<string, boolean>;
  /** البوابات التي تم اجتياز اختبارها بنجاح */
  completedGates: Record<string, boolean>;
  /** درجات اختبارات التثبيت لكل بوابة (النسبة المئوية 0-100) */
  quizScores: Record<string, number>;
  /** هل رأى المستخدم العرض التقديمي للبوابات */
  hasSeenIntro: boolean;
  /** تاريخ الحصول على وسام التوحيد النهائي (إتمام جميع البوابات) */
  completedAllAt: number | null;

  // الإجراءات
  unlockGate: (gateId: string) => void;
  completeGate: (gateId: string, score: number, nextGateId?: string) => void;
  setHasSeenIntro: (seen: boolean) => void;
  resetTawheedProgress: () => void;
}

const INITIAL_TAWHEED_STATE = {
  unlockedGates: { 'gate-1-tawheed-types': true },
  completedGates: {},
  quizScores: {},
  hasSeenIntro: false,
  completedAllAt: null,
};

export const useTawheed = create<TawheedState>()(
  persist(
    (set, get) => ({
      ...INITIAL_TAWHEED_STATE,

      unlockGate: (gateId) => {
        set({
          unlockedGates: {
            ...get().unlockedGates,
            [gateId]: true,
          },
        });
      },

      completeGate: (gateId, score, nextGateId) => {
        const nextUnlocked = { ...get().unlockedGates };
        if (nextGateId) {
          nextUnlocked[nextGateId] = true;
        }

        const nextCompleted = {
          ...get().completedGates,
          [gateId]: true,
        };

        const totalCompleted = Object.keys(nextCompleted).length;
        const completedAll = totalCompleted >= 7;

        set({
          completedGates: nextCompleted,
          unlockedGates: nextUnlocked,
          quizScores: {
            ...get().quizScores,
            [gateId]: score,
          },
          completedAllAt: completedAll ? (get().completedAllAt ?? Date.now()) : null,
        });
      },

      setHasSeenIntro: (seen) => set({ hasSeenIntro: seen }),

      resetTawheedProgress: () => set(INITIAL_TAWHEED_STATE),
    }),
    {
      name: 'baseerah.tawheed.v1',
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
