/** Transient UI state shared across screens: the global sheets and the toast. Not persisted. */
import { create } from 'zustand';

import type { ChainData } from '@/data/content';

interface UiState {
  chain: { where: string; d: ChainData } | null;
  report: { where: string } | null;
  reportSeq: number;
  toast: string;
  toastSeq: number;
  openChain: (where: string, d?: ChainData) => void;
  closeChain: () => void;
  openReport: (where: string) => void;
  closeReport: () => void;
  flash: (msg: string) => void;
  clearToast: (seq: number) => void;
}

export const useUi = create<UiState>()((set, get) => ({
  chain: null,
  report: null,
  reportSeq: 0,
  toast: '',
  toastSeq: 0,
  openChain: (where, d = {}) => set({ chain: { where, d } }),
  closeChain: () => set({ chain: null }),
  openReport: (where) => set({ report: { where }, chain: null, reportSeq: get().reportSeq + 1 }),
  closeReport: () => set({ report: null }),
  flash: (msg) => set({ toast: msg, toastSeq: get().toastSeq + 1 }),
  clearToast: (seq) => {
    if (get().toastSeq === seq) set({ toast: '' });
  },
}));
