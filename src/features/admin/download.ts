/** Console exports: a file download on the web, the share sheet on native. */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export async function download(name: string, text: string, type: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof document === 'undefined') return false;
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  }
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  f.write(text);
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(f.uri, { mimeType: type, dialogTitle: name });
  return true;
}

const csvCell = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';

export function toCsv(rows: Record<string, unknown>[]): string {
  const keys = Object.keys(rows[0] ?? {});
  return [keys.map(csvCell).join(','), ...rows.map((r) => keys.map((k) => csvCell(r[k])).join(','))].join('\n');
}

/** «Export CSV / JSON» — both files, as in the design. */
export async function exportRows(rows: Record<string, unknown>[], name: string) {
  await download(name + '.json', JSON.stringify(rows, null, 2), 'application/json');
  await download(name + '.csv', toCsv(rows), 'text/csv');
}
