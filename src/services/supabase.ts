/**
 * Supabase client shared by web, iOS and Android. Configuration comes from EXPO_PUBLIC_* env
 * vars (public by design — row-level security protects the data). When they are missing the app
 * runs fully local and every backend feature reports itself as unavailable instead of failing.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const isServer = Platform.OS === 'web' && typeof window === 'undefined';

export const backendConfigured = !!(url && anon && !url.includes('YOUR-PROJECT'));

export const supabase: SupabaseClient | null =
  backendConfigured && !isServer
    ? createClient(url!, anon!, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: Platform.OS === 'web',
          flowType: 'pkce',
        },
      })
    : null;

// Refresh tokens only while the app is in the foreground (Supabase React Native guidance).
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://baseerah.app';
