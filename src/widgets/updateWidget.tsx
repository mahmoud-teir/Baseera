import React from 'react';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { buildPrayerWidgetProps } from './buildPrayerWidgetProps';
import { PrayerWidget } from './PrayerWidget';

export function updatePrayerWidget() {
  if (Platform.OS !== 'android') return;
  try {
    requestWidgetUpdate({
      widgetName: 'PrayerWidget',
      renderWidget: async (widgetInfo) => {
        const props = await buildPrayerWidgetProps(widgetInfo.width, widgetInfo.height);
        return <PrayerWidget {...props} />;
      },
    }).catch(() => {});
  } catch {
    // best-effort
  }
}
