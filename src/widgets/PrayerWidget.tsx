'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface PrayerItem {
  name: string;
  time: string;
  isCurrent: boolean;
  isNext: boolean;
}

export interface PrayerWidgetProps {
  hijriDate: string;
  locationLabel: string;
  nextPrayerName: string;
  nextPrayerTime: string;
  timeRemaining: string;
  isCompact?: boolean;
  times: PrayerItem[];
}

export function PrayerWidget({
  hijriDate,
  locationLabel,
  nextPrayerName,
  nextPrayerTime,
  timeRemaining,
  isCompact = false,
  times,
}: PrayerWidgetProps) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'baseerah://prayer' }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#071F1A',
        borderRadius: 22,
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
      {/* رأس الودجة: التاريخ الهجري والموقع الجغرافي */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 2,
        }}>
        <TextWidget
          text={hijriDate}
          style={{
            fontSize: 12,
            color: '#C4A66A',
            fontWeight: 'bold',
          }}
        />
        <TextWidget
          text={locationLabel || 'بصيرة'}
          style={{
            fontSize: 12,
            color: '#8CA99F',
            fontWeight: '600',
          }}
        />
      </FlexWidget>

      {/* بطاقة الصلاة القادمة والعد التنازلي */}
      <FlexWidget
        style={{
          width: 'match_parent',
          backgroundColor: '#11382E',
          borderRadius: 14,
          paddingVertical: isCompact ? 8 : 10,
          paddingHorizontal: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginVertical: 4,
        }}>
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text={`الصلاة القادمة: ${nextPrayerName}`}
            style={{
              fontSize: 15,
              fontWeight: 'bold',
              color: '#F4D48E',
            }}
          />
          <TextWidget
            text={timeRemaining}
            style={{
              fontSize: 12,
              color: '#D2E3DD',
              fontWeight: '500',
            }}
          />
        </FlexWidget>

        <TextWidget
          text={nextPrayerTime}
          style={{
            fontSize: isCompact ? 18 : 22,
            fontWeight: 'bold',
            color: '#FFFFFF',
          }}
        />
      </FlexWidget>

      {/* جدول مواقيت الصلوات الخمس */}
      {!isCompact && (
        <FlexWidget
          style={{
            width: 'match_parent',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 2,
          }}>
          {times.map((p, idx) => (
            <FlexWidget
              key={idx}
              style={{
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: p.isNext
                  ? '#C4A66A'
                  : p.isCurrent
                  ? '#17473B'
                  : '#0D2B24',
                borderRadius: 10,
                paddingVertical: 4,
                paddingHorizontal: 2,
                marginHorizontal: 2,
              }}>
              <TextWidget
                text={p.name}
                style={{
                  fontSize: 11,
                  fontWeight: p.isNext ? 'bold' : 'normal',
                  color: p.isNext ? '#071F1A' : '#A3C2B9',
                }}
              />
              <TextWidget
                text={p.time}
                style={{
                  fontSize: 10,
                  fontWeight: p.isNext ? 'bold' : '500',
                  color: p.isNext ? '#071F1A' : '#FFFFFF',
                }}
              />
            </FlexWidget>
          ))}
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
