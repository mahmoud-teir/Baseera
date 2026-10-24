/**
 * AppUpdatesView — Admin Console View for managing and publishing In-App APK Updates.
 * Allows the owner/admin to publish a new APK release to all users worldwide.
 */
import { useEffect, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { useAppUpdater } from '@/features/updater/useAppUpdater';
import { supabase } from '@/services/supabase';
import {
  CURRENT_APP_VERSION,
  CURRENT_VERSION_CODE,
  publishRemoteUpdate,
  type AppUpdateData,
} from '@/services/updater';
import { useUi } from '@/state/ui-store';

import { Btn, C, Card, Checkbox, F, P, T, Title } from './ui';

export function AppUpdatesView() {
  const flash = useUi((s) => s.flash);

  const [activeUpdate, setActiveUpdate] = useState<AppUpdateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // Form State
  const [version, setVersion] = useState('1.1.0');
  const [versionCode, setVersionCode] = useState('2');
  const [apkUrl, setApkUrl] = useState('');
  const [releaseNotes, setReleaseNotes] = useState(
    '• تحديثات هامة وميزات جديدة\n• تحسين أداء البوصلة ومواقيت الصلاة\n• إصلاحات عامة وتحسينات في التصفح',
  );
  const [isMandatory, setIsMandatory] = useState(false);

  const fetchCurrentConfig = async () => {
    if (!supabase) return null;
    const { data } = await supabase
      .from('published_content')
      .select('data')
      .eq('slot', 'app_update')
      .maybeSingle();

    if (data?.data) {
      const d = data.data as Record<string, unknown>;
      return ((d.updateInfo as AppUpdateData | undefined) ?? (d as unknown as AppUpdateData));
    }
    return null;
  };

  const reload = async () => {
    setLoading(true);
    try {
      const val = await fetchCurrentConfig();
      if (val) setActiveUpdate(val);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const val = await fetchCurrentConfig();
        if (active && val) {
          setActiveUpdate(val);
          if (val.latestVersion) setVersion(val.latestVersion);
          if (val.latestVersionCode) setVersionCode(String(val.latestVersionCode + 1));
          if (val.apkUrl) setApkUrl(val.apkUrl);
          if (val.releaseNotes) setReleaseNotes(val.releaseNotes);
          setIsMandatory(!!val.isMandatory);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handlePublish = async () => {
    const trimmedVer = version.trim();
    const codeNum = parseInt(versionCode.trim(), 10);
    const trimmedUrl = apkUrl.trim();

    if (!trimmedVer) {
      flash('يرجى إدخال رقم الإصدار (مثل 1.1.0)');
      return;
    }
    if (isNaN(codeNum) || codeNum <= 0) {
      flash('يرجى إدخال رمز بناء صحيح (رقم صحيح موجب)');
      return;
    }
    if (!trimmedUrl || !trimmedUrl.startsWith('http')) {
      flash('يرجى إدخال رابط تحميل مباشر وصحيح لملف الـ APK يبدأ بـ https://');
      return;
    }

    setPublishing(true);
    try {
      const res = await publishRemoteUpdate({
        latestVersion: trimmedVer,
        latestVersionCode: codeNum,
        apkUrl: trimmedUrl,
        releaseNotes: releaseNotes.trim(),
        isMandatory,
        releasedAt: new Date().toISOString(),
      });

      if (res.success) {
        flash(`تم نشر التحديث v${trimmedVer} لجميع المستخدمين بنجاح! 🚀`);
        const updated = await fetchCurrentConfig();
        if (updated) setActiveUpdate(updated);
      } else {
        flash(res.error ?? 'فشل نشر التحديث');
      }
    } finally {
      setPublishing(false);
    }
  };

  const handlePreview = () => {
    useAppUpdater.setState({
      updateData: {
        latestVersion: version.trim() || '1.1.0',
        latestVersionCode: parseInt(versionCode, 10) || 2,
        apkUrl: apkUrl.trim() || 'https://example.com/baseera.apk',
        releaseNotes: releaseNotes.trim(),
        isMandatory,
      },
      modalVisible: true,
    });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 18, gap: 16 }}>
      <View style={{ gap: 4 }}>
        <Title>مركز إدارة التحديثات ونشر الـ APK</Title>
        <T color={C.sub}>
          نشر التحديثات المباشرة للمستخدمين ليتم تنزيلها وتثبيتها من داخل التطبيق دون الحاجة للمتاجر.
        </T>
      </View>

      {/* Current Device App Info */}
      <Card style={{ padding: 16, gap: 8, backgroundColor: C.white, borderRadius: 14 }}>
        <T w={700} size={15} color={C.green}>
          معلومات هذا الجهاز
        </T>
        <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
          <T size={13} color={C.sub}>
            الإصدار المثبت: <T w={600} color={C.ink}>{`v${CURRENT_APP_VERSION}`}</T>
          </T>
          <T size={13} color={C.sub}>
            رمز البناء: <T w={600} color={C.ink}>{String(CURRENT_VERSION_CODE)}</T>
          </T>
        </View>
      </Card>

      {/* Active Remote Update */}
      <Card style={{ padding: 16, gap: 8, backgroundColor: C.white, borderRadius: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T w={700} size={15} color={C.gold}>
            الإصدار المنشور حالياً في السحابة
          </T>
          <P label="تحديث" onPress={reload} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
            <T size={12} color={C.green}>
              {loading ? 'جارٍ التحميل…' : 'تحديث البيانات ↻'}
            </T>
          </P>
        </View>

        {activeUpdate ? (
          <View style={{ gap: 6, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
              <T size={13} color={C.sub}>
                رقم الإصدار: <T w={700} color={C.green}>{`v${activeUpdate.latestVersion}`}</T>
              </T>
              <T size={13} color={C.sub}>
                رمز البناء: <T w={600} color={C.ink}>{String(activeUpdate.latestVersionCode)}</T>
              </T>
              <T size={13} color={C.sub}>
                النوع: <T w={600} color={activeUpdate.isMandatory ? '#EF4444' : C.green}>{activeUpdate.isMandatory ? 'إلزامي' : 'مستحسن'}</T>
              </T>
            </View>

            <T size={12} color={C.sub} numberOfLines={1}>
              الرابط: <T size={12} color={C.ink}>{activeUpdate.apkUrl}</T>
            </T>

            {activeUpdate.releasedAt && (
              <T size={11} color={C.faint}>
                تاريخ النشر: {new Date(activeUpdate.releasedAt).toLocaleString('ar')}
              </T>
            )}
          </View>
        ) : (
          <T size={13} color={C.sub}>
            {loading ? 'جارٍ فحص السحابة…' : 'لم يتم نشر أي تحديث بعد عبر السحابة.'}
          </T>
        )}
      </Card>

      {/* New Update Form */}
      <Card style={{ padding: 18, gap: 14, backgroundColor: C.white, borderRadius: 14 }}>
        <T w={700} size={16} color={C.ink}>
          إطلاق ونشر تحديث جديد
        </T>

        <View style={{ gap: 12 }}>
          {/* Version & Code */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <T size={13} w={600} color={C.ink}>
                رقم الإصدار الجديد (Version)
              </T>
              <TextInput
                value={version}
                onChangeText={setVersion}
                placeholder="1.1.0"
                style={{
                  borderWidth: 1,
                  borderColor: C.field,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 14,
                  fontFamily: F.ui(400),
                  color: C.ink,
                  textAlign: 'left',
                }}
              />
            </View>

            <View style={{ flex: 1, gap: 4 }}>
              <T size={13} w={600} color={C.ink}>
                رمز البناء (Version Code)
              </T>
              <TextInput
                value={versionCode}
                onChangeText={setVersionCode}
                keyboardType="numeric"
                placeholder="2"
                style={{
                  borderWidth: 1,
                  borderColor: C.field,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 14,
                  fontFamily: F.ui(400),
                  color: C.ink,
                  textAlign: 'left',
                }}
              />
            </View>
          </View>

          {/* APK URL */}
          <View style={{ gap: 4 }}>
            <T size={13} w={600} color={C.ink}>
              رابط تحميل ملف الـ APK المباشر (Direct APK URL)
            </T>
            <TextInput
              value={apkUrl}
              onChangeText={setApkUrl}
              placeholder="https://example.com/baseera-v1.1.0.apk"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: C.field,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontSize: 13,
                fontFamily: F.ui(400),
                color: C.ink,
                textAlign: 'left',
              }}
            />
            <T size={11} color={C.sub}>
              ملاحظة: يمكنك رفع ملف الـ APK على Supabase Storage أو GitHub Releases أو خادمك الخاص ولصق الرابط المباشر هنا.
            </T>
          </View>

          {/* Release Notes */}
          <View style={{ gap: 4 }}>
            <T size={13} w={600} color={C.ink}>
              ما الجديد في هذا التحديث (Release Notes)
            </T>
            <TextInput
              value={releaseNotes}
              onChangeText={setReleaseNotes}
              multiline
              numberOfLines={4}
              placeholder="اكتب هنا التغييرات والميزات الجديدة ليراها المستخدم..."
              style={{
                borderWidth: 1,
                borderColor: C.field,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontSize: 13,
                fontFamily: F.ui(400),
                color: C.ink,
                minHeight: 80,
                textAlign: 'right',
              }}
            />
          </View>

          {/* Mandatory Checkbox */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Checkbox checked={isMandatory} onPress={() => setIsMandatory(!isMandatory)} label="تحديث إلزامي" />
            <T size={13} color={C.ink}>
              تحديث إلزامي (يمنع استخدام التطبيق حتى إتمام التحديث)
            </T>
          </View>
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Btn
            label="نشر التحديث لجميع المستخدمين 🚀"
            kind="p"
            onPress={handlePublish}
            disabled={publishing}
          />
          <Btn
            label="معاينة نافذة التحديث 🧪"
            kind="s"
            onPress={handlePreview}
          />
        </View>
      </Card>
    </ScrollView>
  );
}
