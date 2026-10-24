import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { buildPrayerWidgetProps } from './buildPrayerWidgetProps';
import { PrayerWidget } from './PrayerWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetAction, widgetInfo, renderWidget } = props;

  if (widgetInfo.widgetName === 'PrayerWidget') {
    switch (widgetAction) {
      case 'WIDGET_ADDED':
      case 'WIDGET_UPDATE':
      case 'WIDGET_RESIZED': {
        const widgetProps = await buildPrayerWidgetProps(widgetInfo.width, widgetInfo.height);
        renderWidget(<PrayerWidget {...widgetProps} />);
        break;
      }
      case 'WIDGET_CLICK':
      case 'WIDGET_DELETED':
      default:
        break;
    }
  }
}
