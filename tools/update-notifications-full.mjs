import fs from 'node:fs';

// 1. Update src/services/notifications.ts
let notif = fs.readFileSync('src/services/notifications.ts', 'utf8');

// Add surah import if not present
if (!notif.includes("import { surah } from '@/data/quran';")) {
  notif = "import { surah } from '@/data/quran';\r\n" + notif;
}

const oldChannels = `async function ensureChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('prayer', { name: 'مواقيت الصلاة', importance: AndroidImportance.HIGH });
  await Notifications.setNotificationChannelAsync('reminders', { name: 'التذكيرات', importance: AndroidImportance.DEFAULT });
}`;

const newChannels = `async function ensureChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('prayer_alarm', {
    name: 'أذان مواقيت الصلاة (منبه يصدح في الصامت)',
    importance: AndroidImportance.MAX,
    sound: 'adhan_makkah.mp3',
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      flags: { enforceAudibility: true },
    },
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
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
}`;

const oldScheduleBody = `  const wantPrayer = get('prayNotif');
  const wantAdhkar = get('adhkarRem');
  const wantDaily = get('dailyRem') && get('nDaily');
  const wantSeason = get('nSeason');
  if (!wantPrayer && !wantAdhkar && !wantDaily && !wantSeason) return { scheduled: 0 };
  if (!(await ensurePermission())) return { scheduled: 0, reason: 'permission' };
  await ensureChannels();

  const now = Date.now();
  let count = 0;
  const at = async (date: Date, title: string, body: string, channelId: string) => {
    if (date.getTime() <= now) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
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
        if (wantPrayer) await at(p.at, \`حان وقت صلاة \${p.name}\`, loc.label ? \`حسب موقعك: \${loc.label}\` : 'حسب موقعك', 'prayer');
      }
      if (wantAdhkar) {
        const fajr = times[0].at;
        const asr = times[3].at;
        await at(new Date(fajr.getTime() + 20 * 60000), 'أذكار الصباح', 'خصّص دقائق لأذكار الصباح.', 'reminders');
        await at(new Date(asr.getTime() + 20 * 60000), 'أذكار المساء', 'خصّص دقائق لأذكار المساء.', 'reminders');
      }
    }
    if (wantDaily) {
      const d = new Date(day);
      d.setHours(20, 0, 0, 0);
      await at(d, 'درسك اليوم', 'تابع خطتك اليومية في بصيرة.', 'reminders');
    }
  }`;

const newScheduleBody = `  const wantPrayer = get('prayNotif');
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
            \`حان وقت صلاة \${p.name} 🕌\`,
            loc.label ? \`الله أكبر، الله أكبر · حسب موقعك: \${loc.label}\` : 'الله أكبر، الله أكبر · الصلاة خير من النوم',
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
          \`«اقرأوا القرآن فإنه يأتي يوم القيامة شفيعاً لأصحابه» · تابع من سورة \${sMeta.name} (الآية \${lr.ayah}).\`,
          'reminders',
          \`/reader/\${lr.surah}?ayah=\${lr.ayah}\`
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
  }`;

const norm = (str) => str.replace(/\r?\n/g, '\n');
const isCRLF = notif.includes('\r\n');
const toFileEnding = (str) => isCRLF ? str.replace(/\n/g, '\r\n') : str.replace(/\r\n/g, '\n');

notif = toFileEnding(norm(notif).replace(norm(oldChannels), norm(newChannels)).replace(norm(oldScheduleBody), norm(newScheduleBody)));
fs.writeFileSync('src/services/notifications.ts', notif);
console.log('notifications.ts updated successfully!');

// 2. Update src/services/bootstrap.ts to add notification response listener
let boot = fs.readFileSync('src/services/bootstrap.ts', 'utf8');
if (!boot.includes('addNotificationResponseReceivedListener')) {
  boot = "import * as Notifications from 'expo-notifications';\r\nimport { router } from 'expo-router';\r\n" + boot;
  const oldEffect = `    const stopSync = startSync();
    return () => {
      appState.remove();
      unsub();
      stopSync();
    };`;
  const newEffect = `    const stopSync = startSync();
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
    };`;
  boot = toFileEnding(norm(boot).replace(norm(oldEffect), norm(newEffect)));
  fs.writeFileSync('src/services/bootstrap.ts', boot);
  console.log('bootstrap.ts updated with notification response navigation!');
}
