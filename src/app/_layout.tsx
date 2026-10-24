import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, I18nManager, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/overlays/OfflineBanner';
import { EvidenceChainSheet, ReportSheet, Toast } from '@/components/overlays/GlobalSheets';
import { UpdateModal } from '@/features/updater/UpdateModal';
import { useAppUpdater } from '@/features/updater/useAppUpdater';
import { useBackgroundServices } from '@/services/bootstrap';
import { useApp } from '@/state/app-store';
import { useConfig } from '@/state/config-store';
import { useContent } from '@/state/content-store';
import { FONT_ASSETS } from '@/theme/fonts';
import { ThemeProvider, useTheme } from '@/theme/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Arabic-only app: make sure native layout is RTL even when the OS language is not Arabic.
// (The expo-localization plugin's `forcesRTL` already sets this at launch for native builds.)
if (Platform.OS !== 'web' && !I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

/** Routes outside the tab navigator never show the tab bar (prototype's hide list). */
const TABBED_PREFIXES = ['/', '/academy', '/quran', '/library', '/account', '/prayer', '/hijri', '/paths', '/stories', '/sharia', '/quotes', '/plan', '/review'];

function Shell() {
  const { t, dark } = useTheme();
  const pathname = usePathname();
  useBackgroundServices();

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let lastCheck = 0;
    const check = () => {
      if (Date.now() - lastCheck < 5 * 60 * 1000) return;
      lastCheck = Date.now();
      void useAppUpdater.getState().checkUpdate(true);
    };
    const timer = setTimeout(check, 2500);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  const hasTabBar = TABBED_PREFIXES.some((p) => (p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(p + '/')));
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg }, animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="lesson/[code]/quiz" options={{ gestureEnabled: false }} />
        <Stack.Screen name="lesson/[code]/result" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="khushu/[code]" options={{ animation: 'fade' }} />
      </Stack>
      <EvidenceChainSheet />
      <ReportSheet />
      <Toast hasTabBar={hasTabBar} />
      <UpdateModal />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Persisted state is restored after mount so web static HTML and the first client render match.
    Promise.all([useApp.persist.rehydrate(), useConfig.persist.rehydrate(), useContent.persist.rehydrate()]).finally(() => setHydrated(true));
  }, []);

  const ready = (fontsLoaded || !!fontError) && (hydrated || Platform.OS === 'web');
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready && Platform.OS !== 'web') return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Shell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
