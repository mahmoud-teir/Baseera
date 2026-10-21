/**
 * Library content (books and recordings). HANDOFF: «لا تُعرض كتب أو تسجيلات إلا بعد توثيق مصدرها»
 * — only items published by the review team through the console appear (`published_content`,
 * kinds book/audio, read via the content store). No demo items are ever added.
 */
import { AUDIO_CATEGORIES, BOOK_CATEGORIES } from '@/data/structural';
import { useContent, type LibraryItem } from '@/state/content-store';

export type { LibraryItem } from '@/state/content-store';

export function cachedItem(id: string): LibraryItem | undefined {
  return useContent.getState().library.find((x) => x.id === id);
}

export function useLibrary() {
  const items = useContent((s) => s.library);
  const status = useContent((s) => s.status);
  const refresh = useContent((s) => s.refresh);
  return { items, loading: status === 'loading', error: status === 'error', reload: refresh };
}

export function useLibraryItem(id: string) {
  const { items, loading, error, reload } = useLibrary();
  return { item: items.find((x) => x.id === id), loading, error, reload };
}

export const folderId = (kind: 'books' | 'audio', index: number) => `${kind}-${index}`;
export function parseFolder(id: string): { kind: 'books' | 'audio'; name: string } {
  const [k, i] = id.split('-');
  const kind = k === 'audio' ? 'audio' : 'books';
  const list = kind === 'audio' ? AUDIO_CATEGORIES : BOOK_CATEGORIES;
  return { kind, name: list[Number(i)] ?? list[0] };
}
