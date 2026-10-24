/**
 * معجم المصطلحات والتعريفات الشرعية (لغةً واصطلاحاً)
 * Dedicated Islamic Glossary & Definitions Screen
 */
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  TERM_CATEGORIES,
  type IslamicTerm,
} from '@/data/islamicTermsData';
import { useTermsStore } from '@/services/terms';

export default function IslamicTermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    selectedCategory,
    searchQuery,
    loading,
    bookmarkedIds,
    setCategory,
    setSearchQuery,
    toggleBookmark,
    loadTerms,
    filteredTerms,
  } = useTermsStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadTerms();
  }, [loadTerms]);

  const displayedTerms = filteredTerms();

  const copyTermToClipboard = async (term: IslamicTerm) => {
    const textToCopy = `📖 [${term.term}]
──────────────
🔹 لغةً: ${term.linguisticDef}
📚 المرجع: ${term.linguisticSource}

🌿 اصطلاحاً: ${term.terminologicalDef}
📚 المرجع: ${term.scholarlySource}
${
  term.quranEvidence
    ? `\n📜 الدليل القرآني: {${term.quranEvidence.ayah}} [${term.quranEvidence.surah}: ${term.quranEvidence.ayahNumber}]`
    : ''
}
${
  term.hadithEvidence
    ? `\n✨ الدليل النبوي: «${term.hadithEvidence.text}» (${term.hadithEvidence.source})`
    : ''
}
${
  term.distinctionNote
    ? `\n💡 فائدة وضابط: ${term.distinctionNote}`
    : ''
}
──────────────
عبر تطبيق بصيرة للمصطلحات والعلوم الشرعية`;

    try {
      await Share.share({
        message: textToCopy,
        title: `تعريف: ${term.term}`,
      });
    } catch {}
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, direction: 'rtl' }]}>
      {/* ── Top Header ────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="رجوع"
          style={styles.backBtn}>
          <Text style={styles.backText}>›</Text>
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>معجم المصطلحات الشرعية</Text>
          <Text style={styles.headerSub}>المفاهيم والحدود (لغةً واصطلاحاً)</Text>
        </View>

        <Pressable
          onPress={() => {
            if (selectedCategory === 'bookmarked') {
              setCategory('all');
            } else {
              setCategory('bookmarked');
            }
          }}
          hitSlop={12}
          style={[
            styles.favHeaderBtn,
            selectedCategory === 'bookmarked' && styles.favHeaderBtnActive,
          ]}>
          <Text style={styles.favHeaderIcon}>
            {selectedCategory === 'bookmarked' ? '★' : '☆'}
          </Text>
        </Pressable>
      </View>

      {/* ── Search Bar ─────────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="ابحث عن مصطلح (مثل: الإيمان، التوحيد، البيع...)"
            placeholderTextColor="#8a9990"
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Category Filter Tabs ──────────────────────────────────── */}
      <View style={styles.categoriesWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}>
          {TERM_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={[styles.categoryPill, active && styles.categoryPillActive]}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Stats Bar ─────────────────────────────────────────────── */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {displayedTerms.length} مصطلحاً شرعياً موثقاً
        </Text>
        {loading && <Text style={styles.syncingText}>جاري التحديث من السيرفر...</Text>}
      </View>

      {/* ── Terms FlatList ────────────────────────────────────────── */}
      <FlatList
        data={displayedTerms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadTerms}
            colors={['#145C4B']}
            tintColor="#145C4B"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyTitle}>لا توجد نتائج مطابقة</Text>
            <Text style={styles.emptySub}>
              جرب البحث بكلمة أخرى أو اختر تصنيفاً مختلفاً.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          const isBookmarked = bookmarkedIds.includes(item.id);

          return (
            <View style={styles.card}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.termTitle}>{item.term}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.categoryLabel}</Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <Pressable
                    onPress={() => copyTermToClipboard(item)}
                    hitSlop={10}
                    style={styles.actionBtn}>
                    <Text style={styles.actionBtnIcon}>📋</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => toggleBookmark(item.id)}
                    hitSlop={10}
                    style={styles.actionBtn}>
                    <Text style={[styles.actionBtnIcon, isBookmarked && styles.bookmarkedIcon]}>
                      {isBookmarked ? '★' : '☆'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Linguistic Definition (لغةً) */}
              <View style={styles.defBlockLinguistic}>
                <View style={styles.defBlockHeader}>
                  <View style={styles.defTagLinguistic}>
                    <Text style={styles.defTagTextLinguistic}>لـغـةً</Text>
                  </View>
                  <Text style={styles.defSourceText} numberOfLines={1}>
                    {item.linguisticSource}
                  </Text>
                </View>
                <Text style={styles.defText}>{item.linguisticDef}</Text>
              </View>

              {/* Terminological Definition (اصطلاحاً) */}
              <View style={styles.defBlockTerminological}>
                <View style={styles.defBlockHeader}>
                  <View style={styles.defTagTerminological}>
                    <Text style={styles.defTagTextTerminological}>اصـطـلاحـاً</Text>
                  </View>
                  <Text style={styles.defSourceText} numberOfLines={1}>
                    {item.scholarlySource}
                  </Text>
                </View>
                <Text style={styles.defTextPrimary}>{item.terminologicalDef}</Text>
              </View>

              {/* Expandable Details (Evidence, Pillars, Notes) */}
              {isExpanded && (
                <View style={styles.expandedContent}>
                  {/* Quran Evidence */}
                  {item.quranEvidence && (
                    <View style={styles.evidenceBlock}>
                      <Text style={styles.evidenceTitle}>📜 الدليل من القرآن الكريم:</Text>
                      <Text style={styles.quranText}>
                        «{item.quranEvidence.ayah}»
                      </Text>
                      <Text style={styles.evidenceRef}>
                        [سورة {item.quranEvidence.surah}: الآية {item.quranEvidence.ayahNumber}]
                      </Text>
                    </View>
                  )}

                  {/* Hadith Evidence */}
                  {item.hadithEvidence && (
                    <View style={styles.evidenceBlock}>
                      <Text style={styles.evidenceTitle}>✨ الدليل من السنة المطهرة:</Text>
                      <Text style={styles.hadithText}>
                        «{item.hadithEvidence.text}»
                      </Text>
                      <Text style={styles.evidenceRef}>
                        {item.hadithEvidence.narrator
                          ? `عن ${item.hadithEvidence.narrator} — `
                          : ''}
                        {item.hadithEvidence.source}
                      </Text>
                    </View>
                  )}

                  {/* Pillars / Conditions */}
                  {item.pillarsAndConditions && item.pillarsAndConditions.length > 0 && (
                    <View style={styles.pillarsBlock}>
                      <Text style={styles.evidenceTitle}>📌 الأركان والضوابط:</Text>
                      {item.pillarsAndConditions.map((p, idx) => (
                        <View key={idx} style={styles.pillarRow}>
                          <Text style={styles.pillarBullet}>•</Text>
                          <Text style={styles.pillarText}>{p}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Distinction Note */}
                  {item.distinctionNote && (
                    <View style={styles.noteBlock}>
                      <Text style={styles.noteTitle}>💡 فائدة وضابط دقيق:</Text>
                      <Text style={styles.noteText}>{item.distinctionNote}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Card Footer Toggle */}
              <Pressable
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
                style={styles.expandToggle}>
                <Text style={styles.expandToggleText}>
                  {isExpanded ? 'طيّ التفاصيل والأدلة ▲' : 'عرض الأدلة والضوابط والأركان ▼'}
                </Text>
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E0D2',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3EBD6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 28,
    lineHeight: 30,
    color: '#145C4B',
    textAlign: 'center',
    marginTop: -2,
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Amiri_700Bold',
    color: '#145C4B',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  headerSub: {
    fontSize: 12,
    fontFamily: 'IBMPlexSansArabic_400Regular',
    color: '#6b7770',
    marginTop: 1,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  favHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3EBD6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favHeaderBtnActive: {
    backgroundColor: '#C4A66A',
  },
  favHeaderIcon: {
    fontSize: 20,
    color: '#145C4B',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D0BC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'IBMPlexSansArabic_400Regular',
    color: '#1d2a26',
    textAlign: 'right',
  },
  clearIcon: {
    fontSize: 14,
    color: '#8a9990',
    padding: 4,
  },
  categoriesWrap: {
    paddingVertical: 8,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D0BC',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  categoryPillActive: {
    backgroundColor: '#145C4B',
    borderColor: '#145C4B',
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: 13,
    fontFamily: 'IBMPlexSansArabic_500Medium',
    color: '#1d2a26',
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  statsText: {
    fontSize: 12,
    fontFamily: 'IBMPlexSansArabic_500Medium',
    color: '#6b7770',
  },
  syncingText: {
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic_400Regular',
    color: '#C4A66A',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E0D2',
    padding: 16,
    gap: 12,
    shadowColor: '#145C4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  termTitle: {
    fontSize: 22,
    fontFamily: 'Amiri_700Bold',
    color: '#145C4B',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  categoryBadge: {
    backgroundColor: '#E4F2EC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic_600SemiBold',
    color: '#145C4B',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F6F1E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnIcon: {
    fontSize: 15,
    color: '#6b7770',
  },
  bookmarkedIcon: {
    color: '#C4A66A',
  },
  defBlockLinguistic: {
    backgroundColor: '#FCFAF4',
    borderWidth: 1,
    borderColor: '#F0EADB',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  defBlockTerminological: {
    backgroundColor: '#F3F9F6',
    borderWidth: 1,
    borderColor: '#D4E8DF',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  defBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  defTagLinguistic: {
    backgroundColor: '#C4A66A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defTagTextLinguistic: {
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic_700Bold',
    color: '#FFFFFF',
  },
  defTagTerminological: {
    backgroundColor: '#145C4B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defTagTextTerminological: {
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic_700Bold',
    color: '#FFFFFF',
  },
  defSourceText: {
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic_400Regular',
    color: '#8a9990',
    flexShrink: 1,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  defText: {
    fontSize: 13.5,
    fontFamily: 'IBMPlexSansArabic_400Regular',
    color: '#3d4a45',
    lineHeight: 22,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  defTextPrimary: {
    fontSize: 14,
    fontFamily: 'IBMPlexSansArabic_500Medium',
    color: '#145C4B',
    lineHeight: 23,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#F0EADB',
    paddingTop: 12,
    gap: 10,
  },
  evidenceBlock: {
    backgroundColor: '#FFFFFF',
    borderRightWidth: 3,
    borderRightColor: '#145C4B',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  evidenceTitle: {
    fontSize: 12,
    fontFamily: 'IBMPlexSansArabic_600SemiBold',
    color: '#145C4B',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  quranText: {
    fontSize: 15,
    fontFamily: 'Amiri_700Bold',
    color: '#1d2a26',
    lineHeight: 26,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  hadithText: {
    fontSize: 13.5,
    fontFamily: 'IBMPlexSansArabic_500Medium',
    color: '#1d2a26',
    lineHeight: 22,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  evidenceRef: {
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic_400Regular',
    color: '#8a8f8b',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  pillarsBlock: {
    backgroundColor: '#FAF8F2',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  pillarBullet: {
    fontSize: 14,
    color: '#145C4B',
    lineHeight: 20,
  },
  pillarText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'IBMPlexSansArabic_400Regular',
    color: '#1d2a26',
    lineHeight: 20,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  noteBlock: {
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: '#F3EBD6',
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  noteTitle: {
    fontSize: 12,
    fontFamily: 'IBMPlexSansArabic_600SemiBold',
    color: '#8a6d2b',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  noteText: {
    fontSize: 13,
    fontFamily: 'IBMPlexSansArabic_400Regular',
    color: '#3d4a45',
    lineHeight: 21,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  expandToggle: {
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F6F1E3',
    marginTop: 2,
  },
  expandToggleText: {
    fontSize: 12,
    fontFamily: 'IBMPlexSansArabic_600SemiBold',
    color: '#145C4B',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'IBMPlexSansArabic_600SemiBold',
    color: '#1d2a26',
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'IBMPlexSansArabic_400Regular',
    color: '#6b7770',
    textAlign: 'center',
  },
});
