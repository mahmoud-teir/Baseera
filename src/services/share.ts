/** Share a rendered card as an image (native) or as text (web Share API / clipboard). */
import * as Sharing from 'expo-sharing';
import type { ComponentRef, RefObject } from 'react';
import { Platform, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export async function shareCard(ref: RefObject<ComponentRef<typeof View> | null>, text: string): Promise<'shared' | 'copied' | 'unavailable'> {
  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }) : null;
    if (nav?.share) {
      try {
        await nav.share({ text });
        return 'shared';
      } catch {
        return 'unavailable';
      }
    }
    if (nav?.clipboard) {
      await nav.clipboard.writeText(text);
      return 'copied';
    }
    return 'unavailable';
  }
  if (!ref.current || !(await Sharing.isAvailableAsync())) return 'unavailable';
  const uri = await captureRef(ref as never, { format: 'png', quality: 1, result: 'tmpfile' });
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'مشاركة القول' });
  return 'shared';
}
