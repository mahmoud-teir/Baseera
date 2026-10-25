/**
 * Updater Store & Hook — Manages In-App Auto-Update state, progress, and prompts.
 */
import { create } from 'zustand';

import {
  checkRemoteUpdate,
  cleanupDownloadedApk,
  downloadAndInstallApk,
  type AppUpdateData,
} from '@/services/updater';
import { useUi } from '@/state/ui-store';

interface UpdaterState {
  isChecking: boolean;
  updateAvailable: boolean;
  updateData: AppUpdateData | null;
  isDownloading: boolean;
  downloadProgress: number; // 0 to 1
  downloadedBytes: number;
  totalBytes: number;
  modalVisible: boolean;
  error: string | null;

  checkUpdate: (silent?: boolean) => Promise<boolean>;
  openModal: () => void;
  dismissModal: () => void;
  startDownloadAndInstall: () => Promise<void>;
}

export const useAppUpdater = create<UpdaterState>((set, get) => ({
  isChecking: false,
  updateAvailable: false,
  updateData: null,
  isDownloading: false,
  downloadProgress: 0,
  downloadedBytes: 0,
  totalBytes: 0,
  modalVisible: false,
  error: null,

  checkUpdate: async (silent = true) => {
    cleanupDownloadedApk();
    set({ isChecking: true, error: null });
    try {
      const data = await checkRemoteUpdate();
      if (data) {
        set({
          isChecking: false,
          updateAvailable: true,
          updateData: data,
          modalVisible: true,
        });
        return true;
      } else {
        set({
          isChecking: false,
          updateAvailable: false,
          updateData: null,
        });
        if (!silent) {
          useUi.getState().flash('أنت تستخدم أحدث إصدار من بصيرة ✓');
        }
        return false;
      }
    } catch (err) {
      set({ isChecking: false, error: String(err) });
      if (!silent) {
        useUi.getState().flash('تعذر التحقق من وجود تحديثات في الوقت الحالي.');
      }
      return false;
    }
  },

  openModal: () => set({ modalVisible: true }),
  dismissModal: () => {
    const { updateData } = get();
    // Do not allow dismiss if update is mandatory
    if (updateData?.isMandatory) return;
    set({ modalVisible: false });
  },

  startDownloadAndInstall: async () => {
    const { updateData, isDownloading } = get();
    if (!updateData || isDownloading) return;

    set({
      isDownloading: true,
      downloadProgress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      error: null,
    });

    try {
      const res = await downloadAndInstallApk(
        updateData.apkUrl,
        (progress, written, total) => {
          set({
            downloadProgress: progress,
            downloadedBytes: written,
            totalBytes: total,
          });
        },
      );

      if (!res.success) {
        set({
          isDownloading: false,
          error: res.error ?? 'حدث خطأ أثناء تنزيل التحديث.',
        });
        useUi.getState().flash(res.error ?? 'تعذر تنزيل التحديث، يمكنك فتحه في المتصفح.');
      } else {
        set({ isDownloading: false });
      }
    } catch (err) {
      set({
        isDownloading: false,
        error: String(err),
      });
      useUi.getState().flash('حدث خطأ أثناء تنزيل التحديث.');
    }
  },
}));
