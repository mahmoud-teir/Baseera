/**
 * أسماء الله الحسنى وتفسيرها كاملة — The 99 Beautiful Names of Allah.
 * Features search, category filtering, detailed modal for each name (meaning, proofs, devotional fruits),
 * and favorite toggling.
 */
import { useMemo, useState } from 'react';
import { Modal, TextInput, View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Icon } from '@/components/core/Icon';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { Hero } from '@/components/layout/Hero';
import { RoundBackHeader, Screen } from '@/components/layout/Screen';
import { NAMES_OF_ALLAH, type NameOfAllah } from '@/data/namesOfAllahData';
import { ICON } from '@/data/structural';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

export default function NamesOfAllahScreen() {
  const { t, pc, gc, r } = useTheme();
  const flash = useUi((s) => s.flash);
  const favNames = useApp((s) => s.favNames);
  const toggleFavName = useApp((s) => s.toggleFavName);

  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('الكل');
  const [selectedName, setSelectedName] = useState<NameOfAllah | null>(null);

  const categories = ['الكل', 'المفضلة', 'رحمة', 'عظمة', 'قدرة', 'جمال', 'حكمة', 'علم', 'عدل'];

  const filteredNames = useMemo(() => {
    const favs = favNames ?? [];
    return NAMES_OF_ALLAH.filter((item) => {
      if (selectedCat === 'المفضلة' && !favs.includes(item.id)) return false;
      if (selectedCat !== 'الكل' && selectedCat !== 'المفضلة' && item.category !== selectedCat) return false;
      if (!query.trim()) return true;
      const q = query.trim();
      return (
        item.name.includes(q) ||
        item.meaning.includes(q) ||
        item.proof.includes(q) ||
        item.reflection.includes(q)
      );
    });
  }, [query, selectedCat, favNames]);

  return (
    <Screen gap={14}>
      <RoundBackHeader
        title="أسماء الله الحسنى"
        href="/more"
        size={28}
        right={
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICON.names} size={24} color={t.goldInk} sw={2} />
          </View>
        }
      />

      {/* Prophetic Hadith Header */}
      <Hero radius={22} pad={16} gap={6} diamond={{ size: 100, left: -20, top: -20, color: 'rgba(196,166,106,.4)' }} lattice={false}>
        <Txt size={13} weight={600} color={gc}>
          فضل إحصاء أسماء الله الحسنى
        </Txt>
        <Txt font="display" size={20} weight={700} color="#FFFFFF" lh={1.6}>
          «إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا، مِائَةً إِلَّا وَاحِدًا، مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ»
        </Txt>
        <Txt size={13} color="#CFE0DA">
          متفق عليه · الإحصاء: حفظها وفهم معانيها والتعبد لله بمقتضاها ودعاؤه بها.
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
          placeholder="ابحث في أسماء الله الحسنى ومعانيها…"
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

      {/* Categories Filter Pills */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {categories.map((cat) => {
          const active = selectedCat === cat;
          return (
            <Press
              key={cat}
              onPress={() => setSelectedCat(cat)}
              label={`تصنيف ${cat}`}
              style={{
                paddingHorizontal: 12,
                height: 34,
                borderRadius: r(10),
                backgroundColor: active ? pc : t.soft,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Txt size={13} weight={active ? 700 : 500} color={active ? '#FFFFFF' : t.ink}>
                {cat === 'المفضلة' ? `★ المفضلة (${favNames?.length ?? 0})` : cat}
              </Txt>
            </Press>
          );
        })}
      </View>

      {/* Results Count */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt size={14} color={t.muted}>
          عرض {filteredNames.length} من أصل 99 اسمًا
        </Txt>
      </View>

      {/* Names Grid */}
      <View style={{ gap: 10 }}>
        {filteredNames.map((item) => {
          const isFav = !!favNames?.includes(item.id);
          return (
            <Card
              key={item.id}
              variant="app"
              radius={18}
              pad={14}
              onPress={() => setSelectedName(item)}
              label={`${item.name} · اضغط لعرض التفسير الكامل`}
              style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: t.soft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Txt size={13} weight={700} color={t.primary} ltr>
                      {item.id}
                    </Txt>
                  </View>
                  <Txt font="display" size={24} weight={700} color={t.primary}>
                    {item.name}
                  </Txt>
                </View>

                <Press
                  onPress={() => {
                    toggleFavName(item.id);
                    flash(isFav ? `أُزيل ${item.name} من المفضلة` : `أُضيف ${item.name} للمفضلة`);
                  }}
                  label="تفضيل الاسم"
                  style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt size={18} color={isFav ? t.goldInk : t.muted}>
                    {isFav ? '★' : '☆'}
                  </Txt>
                </Press>
              </View>

              <Txt size={14} color={t.ink} lh={1.8} numberOfLines={2}>
                {item.meaning}
              </Txt>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
                <Txt size={12} color={t.muted} numberOfLines={1} style={{ flex: 1 }}>
                  {item.proof}
                </Txt>
                <Txt size={13} weight={600} color={t.goldInk}>
                  التفاصيل والآثار ‹
                </Txt>
              </View>
            </Card>
          );
        })}
      </View>

      {/* Name Detail Modal */}
      <Modal visible={!!selectedName} transparent animationType="slide" onRequestClose={() => setSelectedName(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.65)', justifyContent: 'flex-end' }}>
          <View
            style={{
              maxHeight: '85%',
              backgroundColor: t.card,
              borderTopLeftRadius: r(28),
              borderTopRightRadius: r(28),
              padding: 24,
              gap: 16,
              borderTopWidth: 1,
              borderColor: t.line,
            }}>
            {selectedName && (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
                      <Txt size={15} weight={700} color={t.primary} ltr>
                        {selectedName.id}
                      </Txt>
                    </View>
                    <Txt font="display" size={32} weight={700} color={t.primary}>
                      {selectedName.name}
                    </Txt>
                  </View>
                  <Press onPress={() => setSelectedName(null)} label="إغلاق" style={{ padding: 6 }}>
                    <Txt size={18} color={t.muted}>
                      ✕
                    </Txt>
                  </Press>
                </View>

                {/* Doctrinal & Linguistic Meaning */}
                <View style={{ backgroundColor: t.bg, borderRadius: r(16), padding: 14, gap: 6, borderWidth: 1, borderColor: t.line }}>
                  <Txt size={14} weight={700} color={t.primary}>
                    المعنى اللغوي والبيان العقدي:
                  </Txt>
                  <Txt size={15} lh={1.9} color={t.ink}>
                    {selectedName.meaning}
                  </Txt>
                </View>

                {/* Scriptural Proof */}
                <View style={{ backgroundColor: t.goldSoft, borderRadius: r(16), padding: 14, gap: 6 }}>
                  <Txt size={14} weight={700} color={t.goldInk}>
                    الدليل من الكتاب والسنة:
                  </Txt>
                  <Txt font="display" size={17} lh={1.8} color={t.goldInk}>
                    {selectedName.proof}
                  </Txt>
                </View>

                {/* Practical Reflection & Devotional Action */}
                <View style={{ backgroundColor: t.soft, borderRadius: r(16), padding: 14, gap: 6 }}>
                  <Txt size={14} weight={700} color={t.primary}>
                    أثر الإيمان بالاسم والتعبد به:
                  </Txt>
                  <Txt size={14} lh={1.9} color={t.ink}>
                    {selectedName.reflection}
                  </Txt>
                </View>

                {/* Bottom Actions */}
                <View style={{ flexDirection: 'row', gap: 12, paddingTop: 4 }}>
                  <Press
                    onPress={() => {
                      toggleFavName(selectedName.id);
                      flash(favNames.includes(selectedName.id) ? `أُزيل ${selectedName.name} من المفضلة` : `أُضيف ${selectedName.name} للمفضلة`);
                    }}
                    label="المفضلة"
                    style={{ flex: 1, height: 44, borderRadius: r(14), backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
                    <Txt size={14} weight={600} color={t.primary}>
                      {favNames.includes(selectedName.id) ? '★ في المفضلة' : '☆ أضف للمفضلة'}
                    </Txt>
                  </Press>
                  <Press
                    onPress={() => setSelectedName(null)}
                    label="تم"
                    style={{ flex: 1, height: 44, borderRadius: r(14), backgroundColor: pc, alignItems: 'center', justifyContent: 'center' }}>
                    <Txt size={15} weight={700} color="#FFFFFF">
                      تم
                    </Txt>
                  </Press>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
