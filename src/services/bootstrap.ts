import { updatePrayerWidget } from '@/widgets/updateWidget';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
/** Long-lived background work started once by the root layout. */
import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';

import { AppState } from 'react-native';

import { loadRemoteConfig } from '@/state/config-store';
import { useContent } from '@/state/content-store';

import { flushReports } from './reports';
import { startSync } from './sync';
import { useNotificationScheduling } from './notifications';

export function useBackgroundServices() {
  useEffect(() => {
    flushReports().catch(() => {});
    loadRemoteConfig().catch(() => {});
    // Published content: on launch, on reconnect and whenever the app comes back to the foreground.
    const refresh = () => {
      useContent.getState().refresh().catch(() => {});
      updatePrayerWidget();
    };
    refresh();
    const appState = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    const unsub = NetInfo.addEventListener((s) => {
      if (s.isConnected) {
        flushReports().catch(() => {});
        refresh();
      }
    });
    const stopSync = startSync();
    const notifSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === 'string') {
        router.push(url as any);
      }
    });
    return () => {
      appState.remove();
      unsub();
      stopSync();
      notifSub.remove();
    };
  }, []);
  useNotificationScheduling();
}
