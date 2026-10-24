/**
 * الأدعية وأنواعها — Classified Islamic Duas from Quran and authentic Sunnah.
 * Includes search, categorized filtering, favorites, sharing, and virtues.
 */
import { useMemo, useState } from 'react';
import { ScrollView, Share, TextInput, View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Icon } from '@/components/core/Icon';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { Hero } from '@/components/layout/Hero';
import { RoundBackHeader, Screen } from '@/components/layout/Screen';
import { DUA_CATEGORIES, DUAS_LIST, type DuaItem } from '@/data/duasData';
import { ICON } from '@/data/structural';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

export default function DuasScreen() {
  const { t, pc, gc, r } = useTheme();
  const flash = useUi((s) => s.flash);
  const favDuas = useApp((s) => s.favDuas);
  const toggleFavDua = useApp((s) => s.toggleFavDua);

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredDuas = useMemo(() => {
    const favs = favDuas ?? [];
    return DUAS_LIST.filter((item) => {
      if (activeCategory === 'favorites' && !favs.includes(item.id)) return false;
      if (activeCategory !== 'all' && activeCategory !== 'favorites' && item.category !== activeCategory) return false;
      if (!query.trim()) return true;
      const q = query.trim();
      return (
        item.title.includes(q) ||
        item.text.includes(q) ||
        item.source.includes(q) ||
        item.virtue.includes(q)
      );
    });
  }, [query, activeCategory, favDuas]);

  const handleShare = async (dua: DuaItem) => {
    try {
      await Share.share({
        message: `${dua.title}\n\n«${dua.text}»\n\nالمصدر: ${dua.source} · ${dua.ref}\nالفضل: ${dua.virtue}\n\n— عبر تطبيق بصيرة`,
      });
    } catch {
      flash('تعذر مشاركة الدعاء');
    }
  };

  return (
    <Screen gap={14}>
      <RoundBackHeader
        title="الأدعية وأنواعها"
        href="/more"
        size={28}
        right={
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICON.dua} size={24} color={t.goldInk} sw={2} />
          </View>
        }
      />

      {/* Hero Header */}
      <Hero radius={22} pad={16} gap={6} diamond={{ size: 100, left: -20, top: -20, color: 'rgba(196,166,106,.4)' }} lattice={false}>
        <Txt size={13} weight={600} color={gc}>
          فضل الدعاء في الإسلام
        </Txt>
        <Txt font="display" size={20} weight={700} color="#FFFFFF" lh={1.6}>
          «الدُّعَاءُ هُوَ الْعِبَادَةُ»
        </Txt>
        <Txt size={13} color="#CFE0DA">
          صحيح أبي داود والترمذي · وقال ربكم ادعوني أستجب لكم.
        </Txt>
      </Hero>

      {/* Search Input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: t.card,
          borderWidth: 1,
          borderColor: t.line,
          borderRadius: r(16),
          paddingHorizontal: 14,
          height: 48,
          gap: 10,
        }}>
        <Icon d={ICON.search} size={18} color={t.muted} sw={2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ابحث في الأدعية ومواطنها وفضائلها…"
          placeholderTextColor={t.muted}
          style={{ flex: 1, fontSize: 15, color: t.ink, textAlign: 'right' }}
        />
        {query ? (
          <Press onPress={() => setQuery('')} label="مسح البحث" style={{ padding: 4 }}>
            <Txt size={14} color={t.muted}>
              ✕
            </Txt>
          </Press>
        ) : null}
      </View>

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {DUA_CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <Press
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              label={cat.name}
              style={{
                paddingHorizontal: 14,
                height: 36,
                borderRadius: r(12),
                backgroundColor: active ? pc : t.soft,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Txt size={13} weight={active ? 700 : 500} color={active ? '#FFFFFF' : t.ink}>
                {cat.id === 'favorites' ? `★ المفضلة (${favDuas?.length ?? 0})` : cat.name}
              </Txt>
            </Press>
          );
        })}
      </ScrollView>

      {/* Count summary */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt size={14} color={t.muted}>
          عرض {filteredDuas.length} دعاء
        </Txt>
      </View>

      {/* Duas List */}
      <View style={{ gap: 12 }}>
        {filteredDuas.map((dua) => {
          const isFav = !!favDuas?.includes(dua.id);
          return (
            <Card key={dua.id} variant="app" radius={20} pad={16} style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ backgroundColor: t.soft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: r(8) }}>
                  <Txt size={13} weight={700} color={t.primary}>
                    {dua.title}
                  </Txt>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Press
                    onPress={() => handleShare(dua)}
                    label="مشاركة الدعاء"
                    style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon d={ICON.share} size={16} color={t.muted} sw={2} />
                  </Press>
                  <Press
                    onPress={() => {
                      toggleFavDua(dua.id);
                      flash(isFav ? `أُزيل الدعاء من المفضلة` : `أُضيف الدعاء للمفضلة`);
                    }}
                    label="تفضيل الدعاء"
                    style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
                    <Txt size={18} color={isFav ? t.goldInk : t.muted}>
                      {isFav ? '★' : '☆'}
                    </Txt>
                  </Press>
                </View>
              </View>

              {/* Main Dua Text with Harakat */}
              <Txt font="display" size={21} weight={700} lh={2.1} color={t.ink}>
                {dua.text}
              </Txt>

              {/* Source & Ref */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Icon d={ICON.book} size={14} color={t.muted} sw={2} />
                <Txt size={12} color={t.muted}>
                  {dua.source} · {dua.ref}
                </Txt>
              </View>

              {/* Virtue Box */}
              {dua.virtue ? (
                <View style={{ backgroundColor: t.goldSoft, borderRadius: r(12), padding: 12, gap: 4 }}>
                  <Txt size={13} weight={700} color={t.goldInk}>
                    فضل الدعاء وثمرته:
                  </Txt>
                  <Txt size={13} lh={1.8} color={t.goldInk}>
                    {dua.virtue}
                  </Txt>
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
