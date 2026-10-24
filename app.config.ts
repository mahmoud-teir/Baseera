import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Baseerah app config — shared by web, iOS and Android.
 * APP_VARIANT selects development / staging / production identifiers so the three
 * builds can be installed side by side. Secrets never go here: only EXPO_PUBLIC_*
 * values (safe to ship in the bundle) are read by the app at runtime.
 */
const VARIANT = (process.env.APP_VARIANT ?? 'production') as 'development' | 'staging' | 'production';

const ID_SUFFIX = VARIANT === 'production' ? '' : `.${VARIANT === 'development' ? 'dev' : 'staging'}`;
const NAME_SUFFIX = '';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'بصيرة',
  slug: 'baseerah',
  version: '1.2.0',
  orientation: 'default',
  icon: './assets/images/icon.png',
  scheme: 'baseerah',
  userInterfaceStyle: 'automatic',
  backgroundColor: '#FAF8F2',
  ios: {
    bundleIdentifier: `app.baseerah${ID_SUFFIX}`,
    supportsTablet: true,
    infoPlist: {
      CFBundleDevelopmentRegion: 'ar',
      CFBundleLocalizations: ['ar'],
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: `app.baseerah${ID_SUFFIX}`,
    versionCode: 4,
    adaptiveIcon: {
      backgroundColor: '#145C4B',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.REQUEST_INSTALL_PACKAGES',
    ],
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
    name: 'بصيرة · Baseerah',
    shortName: 'بصيرة',
    lang: 'ar',
    themeColor: '#145C4B',
    backgroundColor: '#FAF8F2',
  },
  plugins: [
    'expo-router',
    './plugins/withShortCmakeObjectPaths',
    './plugins/withReleaseSigning',
    './plugins/withExtraProguardRules',
    ['expo-localization', { supportsRTL: true, forcesRTL: true }],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#145C4B',
        image: './assets/images/splash-icon.png',
        imageWidth: 132,
        dark: { backgroundColor: '#0E2A25', image: './assets/images/splash-icon.png' },
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'تستخدم بصيرة موقعك لحساب مواقيت الصلاة واتجاه القبلة على جهازك فقط، ولا يُرسل إلى أي خادم.',
      },
    ],
    ['expo-audio', { enableBackgroundPlayback: true, microphonePermission: false, recordAudioAndroid: false }],
    ['expo-notifications', { color: '#145C4B', defaultChannel: 'prayer' }],
    'expo-font',
    'expo-sharing',
    'expo-web-browser',
    [
      'react-native-android-widget',
      {
        widgets: [
          {
            name: 'PrayerWidget',
            label: 'مواقيت الصلاة — بصيرة',
            minWidth: '250dp',
            minHeight: '110dp',
            targetCellWidth: 4,
            targetCellHeight: 2,
            maxResizeWidth: '500dp',
            maxResizeHeight: '400dp',
            resizeMode: 'horizontal|vertical',
            description: 'عرض الصلاة القادمة والوقت المتبقي وجدول مواقيت اليوم مع التاريخ الهجري',
            previewImage: './assets/images/icon.png',
            updatePeriodMillis: 1800000,
            widgetCategory: 'home_screen|keyguard',
          },
        ],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    variant: VARIANT,
  },
});
