/**
 * UpdateModal — Pop-up dialog notifying the user of an available APK update
 * with live progress bar and one-tap direct installation.
 */
import * as Linking from 'expo-linking';
import { Modal, ScrollView, View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Icon } from '@/components/core/Icon';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { ICON } from '@/data/structural';
import { CURRENT_APP_VERSION } from '@/services/updater';
import { useTheme } from '@/theme/theme';

import { useAppUpdater } from './useAppUpdater';

export function UpdateModal() {
  const { t, pc, gc, r, dark } = useTheme();
  const modalVisible = useAppUpdater((s) => s.modalVisible);
  const updateData = useAppUpdater((s) => s.updateData);
  const isDownloading = useAppUpdater((s) => s.isDownloading);
  const downloadProgress = useAppUpdater((s) => s.downloadProgress);
  const downloadedBytes = useAppUpdater((s) => s.downloadedBytes);
  const totalBytes = useAppUpdater((s) => s.totalBytes);
  const dismissModal = useAppUpdater((s) => s.dismissModal);
  const startDownloadAndInstall = useAppUpdater((s) => s.startDownloadAndInstall);

  if (!modalVisible || !updateData) return null;

  const totalMb = totalBytes > 0 ? (totalBytes / (1024 * 1024)).toFixed(1) : null;
  const downloadedMb = downloadedBytes > 0 ? (downloadedBytes / (1024 * 1024)).toFixed(1) : '0';
  const pct = Math.round(downloadProgress * 100);

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="fade"
      onRequestClose={dismissModal}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
        <Card
          variant="app"
          radius={24}
          pad={0}
          label="تحديث جديد لتطبيق بصيرة"
          style={{
            width: '100%',
            maxWidth: 420,
            maxHeight: '85%',
            borderWidth: 2,
            borderColor: gc,
            overflow: 'hidden',
          }}>
          {/* Header */}
          <View
            style={{
              paddingVertical: 18,
              paddingHorizontal: 20,
              backgroundColor: dark ? '#0E261F' : '#EAF7F0',
              borderBottomWidth: 1,
              borderBottomColor: dark ? '#183D32' : '#D1E6DD',
              alignItems: 'center',
              gap: 8,
            }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: t.goldSoft,
                borderWidth: 1.5,
                borderColor: gc,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon d={ICON.sparkle} size={26} color={t.goldInk} sw={2} />
            </View>

            <Txt font="display" size={22} weight={700} color={t.ink} align="center">
              تحديث جديد متاح لتطبيق «بصيرة»
            </Txt>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  backgroundColor: t.soft,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 12,
                }}>
                <Txt size={12} color={t.muted} ltr>
                  {`الحالي: v${CURRENT_APP_VERSION}`}
                </Txt>
              </View>

              <Icon d={ICON.forward} size={14} color={gc} sw={2.2} directional />

              <View
                style={{
                  backgroundColor: t.goldSoft,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: gc,
                }}>
                <Txt size={12} weight={700} color={t.goldInk} ltr>
                  {`الجديد: v${updateData.latestVersion}`}
                </Txt>
              </View>
            </View>

            {updateData.isMandatory && (
              <View
                style={{
                  backgroundColor: '#FEE2E2',
                  paddingHorizontal: 12,
                  paddingVertical: 2,
                  borderRadius: 8,
                  marginTop: 2,
                }}>
                <Txt size={11} weight={700} color="#DC2626">
                  تحديث إلزامي هام لمتابعة الاستخدام
                </Txt>
              </View>
            )}
          </View>

          {/* Body: Release Notes & Download Progress */}
          <ScrollView style={{ padding: 18 }} contentContainerStyle={{ gap: 14 }}>
            <View style={{ gap: 4 }}>
              <Txt size={15} weight={700} color={t.ink}>
                ما الجديد في هذا التحديث:
              </Txt>
              <View
                style={{
                  backgroundColor: t.soft,
                  borderRadius: r(14),
                  padding: 12,
                  borderWidth: 1,
                  borderColor: t.line,
                }}>
                <Txt size={13} color={t.body} lh={1.7}>
                  {updateData.releaseNotes || 'تحسينات عامة في الأداء وإصلاحات وتحديثات للمحتوى.'}
                </Txt>
              </View>
            </View>

            {/* Download Progress Bar */}
            {isDownloading && (
              <View
                style={{
                  backgroundColor: dark ? '#0C1E18' : '#F0F9F5',
                  borderRadius: r(14),
                  padding: 14,
                  borderWidth: 1.5,
                  borderColor: gc,
                  gap: 8,
                }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Txt size={13} weight={700} color={t.goldInk}>
                    جارٍ تنزيل حزمة التحديث...
                  </Txt>
                  <Txt size={14} weight={700} color={t.primary} ltr>
                    {`${pct}%`}
                  </Txt>
                </View>

                <ProgressBar value={pct} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Txt size={11} color={t.muted} ltr>
                    {totalMb ? `${downloadedMb} MB / ${totalMb} MB` : `${downloadedMb} MB`}
                  </Txt>
                  <Txt size={11} color={t.muted}>
                    سيفتح التثبيت فور الانتهاء
                  </Txt>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View
            style={{
              padding: 16,
              gap: 10,
              borderTopWidth: 1,
              borderTopColor: t.line,
              backgroundColor: t.card,
            }}>
            <Press
              onPress={startDownloadAndInstall}
              disabled={isDownloading}
              label="تنزيل وتثبيت التحديث"
              style={{
                height: 48,
                borderRadius: r(14),
                backgroundColor: isDownloading ? t.soft : pc,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}>
              <Icon d={ICON.download} size={18} color="#FFFFFF" sw={2.2} />
              <Txt size={15} weight={700} color="#FFFFFF">
                {isDownloading ? `جارٍ التنزيل (${pct}%)…` : 'تنزيل وتثبيت التحديث الآن ⬇️'}
              </Txt>
            </Press>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Press
                onPress={() => Linking.openURL(updateData.apkUrl)}
                label="التحميل عبر المتصفح"
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: r(12),
                  backgroundColor: t.soft,
                  borderWidth: 1,
                  borderColor: t.line,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Txt size={13} weight={600} color={t.primary}>
                  التحميل عبر المتصفح 🌐
                </Txt>
              </Press>

              {!updateData.isMandatory && !isDownloading && (
                <Press
                  onPress={dismissModal}
                  label="تذكيري لاحقاً"
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: r(12),
                    backgroundColor: t.soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Txt size={13} color={t.muted}>
                    تذكيري لاحقاً ✕
                  </Txt>
                </Press>
              )}
            </View>
          </View>
        </Card>
      </View>
    </Modal>
  );
}
