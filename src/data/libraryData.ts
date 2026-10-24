/**
 * Classical Islamic Library Textbooks (أمهات كتب التراث المقررة).
 * Complete, in-depth authentic texts according to the Sunni curriculum.
 *
 * NOTE: Books are loaded dynamically from Supabase over the internet (published_content)
 * and cached in AsyncStorage at runtime. The local bundle contains NO hardcoded books
 * to keep the application download size minimal and lightweight.
 */
import type { LibraryItem } from '@/state/content-store';

export const DEFAULT_LIBRARY: LibraryItem[] = [];
