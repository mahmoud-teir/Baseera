/**
 * In-App APK Auto-Updater for Baseerah (نظام التحديث التلقائي المباشر لتطبيق بصيرة).
 * Allows the owner/admin to publish an update from within the app,
 * and allows users to receive, download, and install the new APK directly inside the app.
 */
import * as Application from 'expo-application';
import { File, Paths } from 'expo-file-system';
import { getContentUriAsync } from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { supabase } from '@/services/supabase';

export interface AppUpdateData {
  latestVersion: string; // e.g. "1.1.0"
  latestVersionCode: number; // e.g. 2
  apkUrl: string; // Direct APK download URL
  releaseNotes: string; // Arabic description of new features
  isMandatory: boolean; // Must update to proceed
  releasedAt?: string; // ISO date
  fileSizeBytes?: number; // Optional size in bytes
}

export const CURRENT_APP_VERSION = Application.nativeApplicationVersion ?? '1.0.0';
export const CURRENT_VERSION_CODE = Number(Application.nativeBuildVersion ?? 1);

/**
 * Compare two semver-like strings (e.g. "1.1.0" vs "1.0.0").
 * Returns true if remote is strictly greater than local.
 */
export function isNewerVersion(remoteVer: string, localVer: string): boolean {
  const rParts = remoteVer.replace(/^v/, '').split('.').map((n) => Number(n) || 0);
  const lParts = localVer.replace(/^v/, '').split('.').map((n) => Number(n) || 0);

  const len = Math.max(rParts.length, lParts.length);
  for (let i = 0; i < len; i++) {
    const r = rParts[i] ?? 0;
    const l = lParts[i] ?? 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

/** Check if a remote update is available. Returns null if up-to-date or on error. */
export async function checkRemoteUpdate(): Promise<AppUpdateData | null> {
  try {
    if (!supabase) return null;

    let update: AppUpdateData | null = null;

    // 1. Try reading from CMS published_content (slot: 'app_update')
    const { data: pubData } = await supabase
      .from('published_content')
      .select('data')
      .eq('slot', 'app_update')
      .maybeSingle();

    if (pubData?.data) {
      const d = pubData.data as Record<string, unknown>;
      update = (d.updateInfo as AppUpdateData | undefined) ?? (d as unknown as AppUpdateData);
    }

    // 2. Fallback to app_config table
    if (!update || !update.latestVersion) {
      const { data: cfgData } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'app_update')
        .maybeSingle();

      if (cfgData?.value) {
        update = cfgData.value as AppUpdateData;
      }
    }

    if (!update || !update.latestVersion || !update.apkUrl) return null;

    const hasNewVersion = isNewerVersion(update.latestVersion, CURRENT_APP_VERSION);
    const hasNewBuild = update.latestVersionCode > CURRENT_VERSION_CODE;

    if (hasNewVersion || hasNewBuild) {
      return update;
    }
    return null;
  } catch {
    return null;
  }
}

/** Publish a new update to Supabase (Admin only). */
export async function publishRemoteUpdate(
  update: AppUpdateData,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'الاتصال بالسحابة (Supabase) غير مهيأ.' };
    }

    const payload: AppUpdateData = {
      ...update,
      releasedAt: update.releasedAt ?? new Date().toISOString(),
    };

    // 1. Ensure authenticated staff session for CMS publishing
    const { data: sessionData } = await supabase.auth.getSession();
    const currentEmail = sessionData?.session?.user?.email;

    if (!currentEmail) {
      return { success: false, error: 'يجب تسجيل الدخول كمسؤول لنشر التحديثات.' };
    }

    // 2. Publish via CMS RPC pipeline (authorized for admin)
    const bookData = {
      ...payload,
      id: 'app_update',
      title: `تحديث تطبيق بصيرة v${payload.latestVersion}`,
      author: 'فريق بصيرة',
      source: 'بصيرة',
      category: 'نظام',
      url: payload.apkUrl,
      chapters: [{ title: 'ملاحظات الإصدار', paragraphs: [payload.releaseNotes] }],
      updateInfo: payload,
    };

    const { data: draftId, error: draftErr } = await supabase.rpc('admin_save_draft', {
      p_kind: 'book',
      p_slot: 'app_update',
      p_data: bookData,
    });

    if (draftErr) {
      return { success: false, error: 'فشل حفظ مسودة التحديث: ' + draftErr.message };
    }

    if (draftId) {
      const { error: sendErr } = await supabase.rpc('admin_transition', {
        p_kind: 'ct',
        p_id: draftId,
        p_action: 'send',
      });
      if (sendErr) {
        return { success: false, error: 'فشل إرسال التحديث للمراجعة: ' + sendErr.message };
      }

      const { error: appErr } = await supabase.rpc('admin_transition', {
        p_kind: 'ct',
        p_id: draftId,
        p_action: 'approve',
      });
      if (appErr) {
        return { success: false, error: 'فشل اعتماد التحديث ونشره: ' + appErr.message };
      }

      return { success: true };
    }

    return { success: false, error: 'تعذر الحصول على معرّف المسودة.' };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Automatically cleans up any leftover downloaded update APK file in cache.
 */
export function cleanupDownloadedApk(): void {
  try {
    if (Platform.OS === 'android') {
      const destination = new File(Paths.cache, 'baseerah-update.apk');
      if (destination.exists) {
        destination.delete();
      }
    }
  } catch {
    // Ignore cleanup error
  }
}

/**
 * Downloads the APK with progress callback and triggers installation on Android.
 */
export async function downloadAndInstallApk(
  apkUrl: string,
  onProgress?: (progress: number, written: number, total: number) => void,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (Platform.OS !== 'android') {
      // Fallback for Web/iOS: open link in browser
      await Linking.openURL(apkUrl);
      return { success: true };
    }

    const destination = new File(Paths.cache, 'baseerah-update.apk');

    // Delete existing cached update file if any
    if (destination.exists) {
      destination.delete();
    }

    // Download with progress tracking using modern Expo File API
    const task = File.createDownloadTask(apkUrl, destination, {
      onProgress: ({ bytesWritten, totalBytes }) => {
        const progress = totalBytes > 0 ? bytesWritten / totalBytes : 0;
        onProgress?.(progress, bytesWritten, totalBytes);
      },
    });

    const downloadedFile = await task.downloadAsync();
    if (!downloadedFile || !downloadedFile.uri) {
      return { success: false, error: 'فشل تنزيل ملف التحديث.' };
    }

    // 1. Convert downloaded file URI to Android FileProvider content:// URI
    // Modern Android requires a content:// URI with FLAG_GRANT_READ_URI_PERMISSION
    // so the system PackageInstaller can read the APK file from app's private cache.
    let contentUri: string;
    try {
      contentUri = await getContentUriAsync(downloadedFile.uri);
    } catch (uriErr) {
      console.warn('[Updater] getContentUriAsync failed, using raw uri:', uriErr);
      contentUri = downloadedFile.uri;
    }

    // 2. Primary: Start Android Package Installer intent directly
    // FLAG_GRANT_READ_URI_PERMISSION (1) | FLAG_ACTIVITY_NEW_TASK (0x10000000) = 268435457
    try {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 268435457,
        type: 'application/vnd.android.package-archive',
      });
      return { success: true };
    } catch (intentErr) {
      console.warn('[Updater] IntentLauncher failed:', intentErr);
    }

    // 3. Secondary: Try File.preview if available
    try {
      const canPreview = await File.canPreview(destination);
      if (canPreview) {
        await File.preview(destination, {
          mimeType: 'application/vnd.android.package-archive',
        });
        return { success: true };
      }
    } catch (previewErr) {
      console.warn('[Updater] File.preview failed:', previewErr);
    }

    // 4. Last resort: open APK download link in external browser
    await Linking.openURL(apkUrl);
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
