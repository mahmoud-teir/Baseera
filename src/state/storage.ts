import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

/** No-op during web static rendering (Node has no window/localStorage). */
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

export const safeStorage: StateStorage = {
  getItem: async (name) => {
    if (isServer) return null;
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    if (isServer) return;
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      // Storage full or blocked (private mode) — the app keeps working in memory.
    }
  },
  removeItem: async (name) => {
    if (isServer) return;
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};
