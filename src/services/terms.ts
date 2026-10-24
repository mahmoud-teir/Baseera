/**
 * Service & Store for Islamic Terms & Definitions (معجم المصطلحات الشرعية)
 * Local-first with Supabase live synchronization.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import {
  DEFAULT_ISLAMIC_TERMS,
  type IslamicTerm,
  type TermCategory,
} from '@/data/islamicTermsData';
import { supabase } from '@/services/supabase';

const CACHE_KEY = '@baseera:islamic_terms:v1';

export type CategoryFilter = TermCategory | 'all' | 'bookmarked';

interface TermsState {
  terms: IslamicTerm[];
  selectedCategory: CategoryFilter;
  searchQuery: string;
  loading: boolean;
  bookmarkedIds: string[];
  selectedTerm: IslamicTerm | null;

  setCategory: (c: CategoryFilter) => void;
  setSearchQuery: (q: string) => void;
  setSelectedTerm: (t: IslamicTerm | null) => void;
  toggleBookmark: (id: string) => void;
  loadTerms: () => Promise<void>;
  filteredTerms: () => IslamicTerm[];
}

export const useTermsStore = create<TermsState>((set, get) => ({
  terms: DEFAULT_ISLAMIC_TERMS,
  selectedCategory: 'all',
  searchQuery: '',
  loading: false,
  bookmarkedIds: [],
  selectedTerm: null,

  setCategory: (selectedCategory) => set({ selectedCategory }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedTerm: (selectedTerm) => set({ selectedTerm }),

  toggleBookmark: (id) => {
    const { bookmarkedIds } = get();
    const next = bookmarkedIds.includes(id)
      ? bookmarkedIds.filter((x) => x !== id)
      : [...bookmarkedIds, id];
    set({ bookmarkedIds: next });
    AsyncStorage.setItem('@baseera:term_bookmarks', JSON.stringify(next)).catch(() => {});
  },

  loadTerms: async () => {
    // 1. Load bookmarks
    try {
      const bm = await AsyncStorage.getItem('@baseera:term_bookmarks');
      if (bm) set({ bookmarkedIds: JSON.parse(bm) });
    } catch {}

    // 2. Load cached terms
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as IslamicTerm[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          set({ terms: parsed });
        }
      }
    } catch {}

    // 3. Sync from Supabase server if available
    if (!supabase) return;
    set({ loading: true });
    try {
      // 1. Fetch from Supabase CMS published_content (slot: 'islamic-terms-glossary')
      const { data: cmsItem, error: cmsErr } = await supabase
        .from('published_content')
        .select('data')
        .eq('slot', 'islamic-terms-glossary')
        .maybeSingle();

      if (!cmsErr && cmsItem?.data) {
        const payload = cmsItem.data as { terms?: IslamicTerm[] };
        const remoteTerms = payload.terms || [];
        if (remoteTerms.length > 0) {
          set({ terms: remoteTerms, loading: false });
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(remoteTerms));
          return;
        }
      }

      // 2. Direct table `islamic_terms` fallback
      const { data, error } = await supabase
        .from('islamic_terms')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        const remoteTerms: IslamicTerm[] = data.map((row) => ({
          id: row.id,
          term: row.term,
          category: row.category as TermCategory,
          categoryLabel: row.category_label,
          linguisticDef: row.linguistic_def,
          linguisticSource: row.linguistic_source,
          terminologicalDef: row.terminological_def,
          scholarlySource: row.scholarly_source,
          quranEvidence: row.quran_evidence,
          hadithEvidence: row.hadith_evidence,
          distinctionNote: row.distinction_note,
          pillarsAndConditions: row.pillars_and_conditions || [],
          tags: row.tags || [],
        }));

        set({ terms: remoteTerms, loading: false });
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(remoteTerms));
        return;
      }

      set({ loading: false });
    } catch {
      set({ loading: false });
    }
  },

  filteredTerms: () => {
    const { terms, selectedCategory, searchQuery, bookmarkedIds } = get();
    const query = searchQuery.trim().toLowerCase();

    return terms.filter((item) => {
      // Category filter
      if (selectedCategory === 'bookmarked') {
        if (!bookmarkedIds.includes(item.id)) return false;
      } else if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (!query) return true;

      const inTerm = item.term.toLowerCase().includes(query);
      const inLinguistic = item.linguisticDef.toLowerCase().includes(query);
      const inTerminological = item.terminologicalDef.toLowerCase().includes(query);
      const inTags = item.tags.some((tag) => tag.toLowerCase().includes(query));
      const inCategory = item.categoryLabel.toLowerCase().includes(query);

      return inTerm || inLinguistic || inTerminological || inTags || inCategory;
    });
  },
}));
