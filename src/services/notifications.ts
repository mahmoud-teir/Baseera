import { surah } from '@/data/quran';
/**
 * Local notifications (native only): prayer times, adhkar reminders and the daily lesson,
 * driven by the settings toggles (تنبيهات الصلاة، تذكير الأذكار، تذكير الدرس اليومي / الإشعارات).
 * Everything is scheduled on the device from the computed prayer times — no push server needed.
 */
import * as Notifications from 'expo-notifications';
import { AndroidAudioContentType, AndroidAudioUsage, AndroidImportance, AndroidNotificationVisibility } from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import Constants from 'expo-constants';

import { HIJRI_EVENTS, HIJRI_MONTHS } from '@/data/structural';
import { useApp } from '@/state/app-store';
import { useConfig } from '@/state/config-store';

import { toHijri } from './hijri';
import { placeOf } from './location';
import { prayerTimesFor } from './prayer';
import { supabase } from './supabase';

export const notificationsSupported = Platform.OS !== 'web';

if (notificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

export async function ensurePermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function ensureChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('prayer_alarm', {
    name: 'أذان مواقيت الصلاة (منبه يصدح في الصامت)',
    importance: AndroidImportance.MAX,
    sound: 'adhan_makkah.mp3',
    audioAttributes: {
      usage: AndroidAudioUsage.ALARM,
      contentType: AndroidAudioContentType.SONIFICATION,
      flags: { enforceAudibility: true, requestHardwareAudioVideoSynchronization: false },
    },
    bypassDnd: true,
    lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
    vibrationPattern: [0, 500, 250, 500],
  });
  await Notifications.setNotificationChannelAsync('prayer', {
    name: 'مواقيت الصلاة (تنبيه عادي)',
    importance: AndroidImportance.HIGH,
  });
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'التذكيرات والورد اليومي',
    importance: AndroidImportance.HIGH,
  });
}

const DAYS_AHEAD = 5;

/** Rebuild the whole local schedule from the current settings and location. */
export async function rescheduleAll(): Promise<{ scheduled: number; reason?: string }> {
  if (!notificationsSupported) return { scheduled: 0, reason: 'web' };
  const st = useApp.getState();
  const get = st.setting;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const wantPrayer = get('prayNotif');
  const wantAdhkar = get('adhkarRem');
  const wantQuran = get('quranRem');
  const wantDaily = get('dailyRem') && get('nDaily');
  const wantSeason = get('nSeason');
  if (!wantPrayer && !wantAdhkar && !wantQuran && !wantDaily && !wantSeason) return { scheduled: 0 };
  if (!(await ensurePermission())) return { scheduled: 0, reason: 'permission' };
  await ensureChannels();

  const now = Date.now();
  let count = 0;
  const at = async (date: Date, title: string, body: string, channelId: string, url?: string, sound?: string) => {
    if (date.getTime() <= now) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: sound ?? (channelId === 'prayer_alarm' ? 'adhan_makkah.mp3' : undefined),
        data: url ? { url } : undefined,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId },
    });
    count++;
  };

  const loc = st.location;
  const settings = { calc: get('calc'), asr: get('asr'), adj: get('adj') };
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const day = new Date();
    day.setDate(day.getDate() + i);

    if (loc && (wantPrayer || wantAdhkar)) {
      const { times } = prayerTimesFor(loc.lat, loc.lon, day, settings, undefined, placeOf(loc));
      for (const p of times) {
        if (p.name === 'الشروق') continue;
        if (wantPrayer) {
          await at(
            p.at,
            `حان وقت صلاة ${p.name} 🕌`,
            loc.label ? `الله أكبر، الله أكبر · حسب موقعك: ${loc.label}` : 'الله أكبر، الله أكبر · الصلاة خير من النوم',
            'prayer_alarm',
            '/prayer'
          );
        }
      }
      if (wantAdhkar) {
        const fajr = times[0].at;
        const asr = times[3].at;
        await at(
          new Date(fajr.getTime() + 25 * 60000),
          'أذكار الصباح ☀️',
          '«أصبحنا وأصبح الملك لله والحمد لله» · ابدأ يومك بذكر الله وحصنه.',
          'reminders',
          '/prayer/adhkar/morning'
        );
        await at(
          new Date(asr.getTime() + 20 * 60000),
          'أذكار المساء 🌙',
          '«أمسينا وأمسى الملك لله والحمد لله» · حصّن نفسك بأذكار المساء.',
          'reminders',
          '/prayer/adhkar/evening'
        );
      }
    } else if (wantAdhkar) {
      // موعد بديل لأذكار الصباح والمساء في حال عدم تفعيل الموقع
      const mD = new Date(day);
      mD.setHours(6, 30, 0, 0);
      await at(mD, 'أذكار الصباح ☀️', '«أصبحنا وأصبح الملك لله والحمد لله» · ابدأ يومك بذكر الله.', 'reminders', '/prayer/adhkar/morning');
      const eD = new Date(day);
      eD.setHours(17, 0, 0, 0);
      await at(eD, 'أذكار المساء 🌙', '«أمسينا وأمسى الملك لله والحمد لله» · حصّن نفسك بأذكار المساء.', 'reminders', '/prayer/adhkar/evening');
    }

    // تذكير الورد القرآني اليومي
    if (wantQuran) {
      const qD = new Date(day);
      qD.setHours(20, 30, 0, 0); // 8:30 PM
      const lr = st.lastRead;
      if (lr) {
        const sMeta = surah(lr.surah);
        await at(
          qD,
          'وردك القرآني اليوم 📖',
          `«اقرأوا القرآن فإنه يأتي يوم القيامة شفيعاً لأصحابه» · تابع من سورة ${sMeta.name} (الآية ${lr.ayah}).`,
          'reminders',
          `/reader/${lr.surah}?ayah=${lr.ayah}`
        );
      } else {
        await at(
          qD,
          'وردك القرآني اليوم 📖',
          '«اقرأوا القرآن فإنه يأتي يوم القيامة شفيعاً لأصحابه» · خصّص وقتاً لتلاوة وردك اليومي.',
          'reminders',
          '/quran'
        );
      }
    }

    if (wantDaily) {
      const d = new Date(day);
      d.setHours(20, 0, 0, 0);
      await at(d, 'درسك اليوم', 'تابع خطتك اليومية في بصيرة.', 'reminders');
    }
  }
  // Seasons and occasions (Hijri events, start of Ramadan and the sacred months) for the next 60 days.
  if (wantSeason) {
    for (let i = 1; i <= 60; i++) {
      const day = new Date();
      day.setDate(day.getDate() + i);
      day.setHours(8, 0, 0, 0);
      const h = toHijri(day);
      const ev = (HIJRI_EVENTS[h.hm - 1] ?? []).find((e) => e.day === h.hd);
      if (ev) await at(day, 'من المواسم', ev.label, 'reminders');
      else if (h.hd === 1 && [1, 7, 11, 12].includes(h.hm)) await at(day, 'من الأشهر الحرم', `دخل شهر ${HIJRI_MONTHS[h.hm - 1]}`, 'reminders');
    }
  }
  return { scheduled: count };
}

/** «نتائج الاختبارات»: remind the user to retake a quiz they did not pass, the next evening. */
export async function remindQuizRetry(code: string) {
  if (!notificationsSupported || !useApp.getState().setting('nQuiz')) return;
  if (!(await ensurePermission())) return;
  await ensureChannels();
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(18, 0, 0, 0);
  await Notifications.scheduleNotificationAsync({
    content: { title: 'أعد المحاولة', body: `راجع الدرس ${code} ثم أعد اختباره.` },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: d, channelId: 'reminders' },
  });
}

/** «تحديثات المحتوى والتصحيحات»: register this device's Expo push token for server-sent updates. */
export async function registerPushToken(): Promise<boolean> {
  if (!notificationsSupported || !supabase) return false;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId || !(await ensurePermission())) return false;
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return false;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const { error } = await supabase.from('push_tokens').upsert({ user_id: s.session.user.id, token, platform: Platform.OS }, { onConflict: 'token' });
  return !error;
}

/** Re-schedules when the relevant settings or the location change. */
export function useNotificationScheduling() {
  const sv = useApp((s) => s.sv);
  const loc = useApp((s) => s.location);
  const cfg = useConfig((s) => s.prayer);
  useEffect(() => {
    if (!notificationsSupported) return;
    const id = setTimeout(() => {
      rescheduleAll().catch(() => {});
      if (useApp.getState().setting('nContent')) registerPushToken().catch(() => {});
    }, 1500);
    return () => clearTimeout(id);
  }, [sv, loc, cfg]);
}
