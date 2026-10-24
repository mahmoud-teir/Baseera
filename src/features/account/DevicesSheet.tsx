import * as Device from 'expo-device';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Button } from '@/components/core/Button';
import { Card } from '@/components/core/Card';
import { IconTile } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BottomSheet } from '@/components/overlays/BottomSheet';
import { ICON } from '@/data/structural';
import { signOut } from '@/services/auth';
import { useApp, type DeviceEntry } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

export interface DevicesSheetProps {
  visible: boolean;
  onClose: () => void;
  isSignedIn: boolean;
}

let cachedDeviceId: string | null = null;

export async function getPersistentDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  try {
    let id = await AsyncStorage.getItem('@baseerah_device_id');
    if (!id) {
      id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      await AsyncStorage.setItem('@baseerah_device_id', id);
    }
    cachedDeviceId = id;
    return id;
  } catch {
    cachedDeviceId = 'dev_default';
    return cachedDeviceId;
  }
}

export function getDeviceInfo() {
  const isWeb = Platform.OS === 'web';
  const os = Device.osName || (Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web');
  const osVer = Device.osVersion ? ` ${Device.osVersion}` : '';
  const brand = Device.brand ? `${Device.brand} ` : '';
  const model = Device.modelName || Device.deviceName;

  let deviceTypeName = 'هاتف محمول';
  if (Device.deviceType === Device.DeviceType.TABLET) deviceTypeName = 'جهاز لوحي';
  else if (Device.deviceType === Device.DeviceType.DESKTOP || isWeb) deviceTypeName = 'حاسوب / متصفح';

  const title = isWeb ? `متصفح الويب (${os})` : `${brand}${model || 'هاتف محمول'}`.trim();

  return {
    title,
    os: `${os}${osVer}`,
    type: deviceTypeName,
  };
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'نشط الآن';
  if (mins < 60) return `نشط منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `نشط منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `نشط منذ ${days} يوم`;
}

export function DevicesSheet({ visible, onClose, isSignedIn }: DevicesSheetProps) {
  const { t, r } = useTheme();
  const flash = useUi((s) => s.flash);
  const devicesMap = useApp((s) => s.devices);
  const removeDevice = useApp((s) => s.removeDevice);
  const recordDevice = useApp((s) => s.recordDevice);

  const [currentId, setCurrentId] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    getPersistentDeviceId().then((id) => {
      setCurrentId(id);
      const cur = getDeviceInfo();
      recordDevice({
        id,
        title: cur.title,
        os: cur.os,
        type: cur.type,
        lastActive: Date.now(),
      });
    });
  }, [recordDevice]);

  const deviceList = Object.values(devicesMap).sort((a, b) => {
    if (a.id === currentId) return -1;
    if (b.id === currentId) return 1;
    return b.lastActive - a.lastActive;
  });

  const handleSignOutOthers = async () => {
    if (!isSignedIn) {
      flash('سجّل الدخول أولًا.');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await signOut('others');
      if (res.ok) {
        // حذف باقي الأجهزة من القائمة المحلية والسحابية
        if (currentId) {
          const keepCurrent = devicesMap[currentId];
          useApp.setState({ devices: keepCurrent ? { [currentId]: keepCurrent } : {} });
        }
        setMsg('تم تسجيل الخروج بنجاح من جميع الأجهزة الأخرى.');
        flash('سُجّل الخروج من الأجهزة الأخرى.');
      } else {
        setMsg(res.error);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveSingle = (dev: DeviceEntry) => {
    removeDevice(dev.id);
    flash(`أُزيل ${dev.title} من الأجهزة المرتبطة.`);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} label="الأجهزة المرتبطة">
      <View style={{ gap: 14 }}>
        <View style={{ gap: 4 }}>
          <Txt font="display" size={22} weight={700} color={t.ink}>
            الأجهزة المرتبطة والجلسات
          </Txt>
          <Txt size={14} color={t.muted} lh={1.7}>
            {deviceList.length > 1
              ? `حسابك مسجل على ${deviceList.length} أجهزة متزامنة سحابياً.`
              : 'معلومات الجهاز الحالي وإدارة الجلسات المفتوحة لحسابك.'}
          </Txt>
        </View>

        {/* Devices list */}
        <View style={{ gap: 10 }}>
          {deviceList.map((dev) => {
            const isCurrent = dev.id === currentId;
            return (
              <Card key={dev.id} variant="app" radius={18} pad={14} style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <IconTile
                    d={ICON.sync}
                    size={42}
                    iconSize={22}
                    bg={isCurrent ? t.soft : t.card}
                    color={isCurrent ? t.primary : t.muted}
                    radius={14}
                    sw={1.9}
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt size={16} weight={700} color={t.ink}>
                      {dev.title}
                    </Txt>
                    <Txt size={13} color={t.muted}>
                      {dev.type} · {dev.os}
                    </Txt>
                  </View>
                  {!isCurrent && (
                    <Press
                      onPress={() => handleRemoveSingle(dev)}
                      label={`إزالة ${dev.title}`}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: t.errBg,
                      }}>
                      <Txt size={12} weight={600} color={t.errInk}>
                        إزالة
                      </Txt>
                    </Press>
                  )}
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingTop: 6,
                    borderTopWidth: 1,
                    borderColor: t.line,
                  }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: isCurrent ? '#2E7D32' : t.muted,
                    }}
                  />
                  <Txt
                    size={12}
                    weight={600}
                    color={isCurrent ? '#2E7D32' : t.muted}>
                    {isCurrent ? 'هذا الجهاز · متصل الآن' : timeAgo(dev.lastActive)}
                  </Txt>
                </View>
              </Card>
            );
          })}
        </View>

        {/* Security & Sessions info */}
        <View style={{ backgroundColor: t.goldSoft, borderRadius: r(14), padding: 14, gap: 6 }}>
          <Txt size={15} weight={700} color={t.goldInk}>
            أمان الحساب والمزامنة
          </Txt>
          <Txt size={13} color={t.goldInk} lh={1.8}>
            {isSignedIn
              ? 'تتم مزامنة أجهزتك سحابياً بشكل لحظي ومشفّر. إذا لاحظت جهازاً لا تعرفه، يمكنك إزالته فوراً أو إنهاء جميع الجلسات الأخرى بنقرة واحدة.'
              : 'أنت غير مسجّل الدخول حالياً. يتم حفظ بياناتك محلياً على هذا الجهاز فقط.'}
          </Txt>
        </View>

        {msg && (
          <Txt size={14} color={t.primary} weight={600} lh={1.7} align="center">
            {msg}
          </Txt>
        )}

        {isSignedIn && deviceList.length > 1 && (
          <Button variant="secondary" size="lg" disabled={busy} onPress={handleSignOutOthers}>
            {busy ? 'جارٍ تسجيل الخروج…' : 'تسجيل الخروج من جميع الأجهزة الأخرى'}
          </Button>
        )}
      </View>
    </BottomSheet>
  );
}
