/**
 * مفردات وغريب القرآن الكريم — بيان معاني الكلمات المركزية بأدلتها وتفاسيرها ووجه الاستدلال.
 */
import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Chip } from '@/components/core/Chip';
import { Icon } from '@/components/core/Icon';
import { EmptyState, EvidenceActions, Pill } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { type QuranVocabItem } from '@/data/content';
import { DEFAULT_VOCAB } from '@/data/defaults';
import { ICON } from '@/data/structural';
import { shareCard } from '@/services/share';
import { useContent } from '@/state/content-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

const CATS = ['الكل', 'العقيدة', 'الأحكام', 'العقيدة والأحكام'];

export default function QuranVocab() {
  const { t, r } = useTheme();
  const flash = useUi((s) => s.flash);
  const [cat, setCat] = useState('الكل');
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const publishedVocab = useContent((s) => s.vocab);
  const vocabList = publishedVocab.length ? publishedVocab : DEFAULT_VOCAB;

  const filtered = useMemo(() => {
    return vocabList.filter((item) => {
      const matchCat = cat === 'الكل' || item.category === cat;
      const query = q.trim();
      if (!matchCat) return false;
      if (!query) return true;
      return (
        item.word.includes(query) ||
        (item.root && item.root.includes(query)) ||
        item.meaning.includes(query) ||
        item.ayahs.some((a: any) => a.text.includes(query) || a.tafsir.includes(query))
      );
    });
  }, [vocabList, cat, q]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Screen gap={14}>
      <BackLink label="القرآن الكريم" href="/quran" />
      <Title>مفردات وغريب القرآن</Title>
      <Lead>بيان معاني الكلمات والمفاهيم القرآنية المركزية بالآيات المحكمة، والتفاسير المعتمدة، ووجه الاستدلال، وأقوال أئمة السلف.</Lead>

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
        <Icon d={ICON.search} size={18} color={t.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="ابحث عن كلمة، جذر، أو معنى..."
          placeholderTextColor={t.muted}
          style={{
            flex: 1,
            color: t.ink,
            fontSize: 15,
            textAlign: 'right',
            paddingVertical: 0,
          }}
        />
        {q ? (
          <Press onPress={() => setQ('')} label="مسح البحث" style={{ padding: 4 }}>
            <Txt size={14} color={t.muted}>
              ✕
            </Txt>
          </Press>
        ) : null}
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {CATS.map((c) => (
          <Chip key={c} label={c} outline active={cat === c} onPress={() => setCat(c)} height={40} fontSize={16} />
        ))}
      </ScrollView>

      {/* Count summary */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt size={14} color={t.muted}>
          {filtered.length} مفردة قرآنية محررة وموثقة
        </Txt>
      </View>

      {!filtered.length ? (
        <EmptyState>لا توجد نتائج مطابقة لبحثك في المفردات القرآنية.</EmptyState>
      ) : null}

      {/* Cards */}
      {filtered.map((item) => (
        <VocabCard
          key={item.id}
          item={item}
          isExpanded={expanded[item.id] ?? true}
          onToggle={() => toggleExpand(item.id)}
          onFlash={flash}
        />
      ))}
    </Screen>
  );
}

function VocabCard({
  item,
  isExpanded,
  onToggle,
  onFlash,
}: {
  item: QuranVocabItem;
  isExpanded: boolean;
  onToggle: () => void;
  onFlash: (msg: string) => void;
}) {
  const { t, r } = useTheme();
  const cardRef = useRef<ComponentRef<typeof View>>(null);

  const share = async () => {
    const firstAyah = item.ayahs[0];
    const textMsg = `«${item.word}» في القرآن الكريم:\n\nالمعنى الجامع: ${item.meaning}\n\nالدليل: ﴿${firstAyah.text}﴾ [${firstAyah.surahName}: ${firstAyah.ayah}]\n\nالتفسير: ${firstAyah.tafsir}\n\nوجه الاستدلال: ${firstAyah.wajh}\n\nمن تطبيق بصيرة`;
    const res = await shareCard(cardRef, textMsg);
    if (res === 'copied') onFlash('نُسخت المفردة القرآنية مع تفسيرها');
    else if (res === 'unavailable') onFlash('المشاركة غير متاحة على هذا الجهاز');
  };

  return (
    <Card variant="app" radius={22} pad={18} style={{ gap: 14, overflow: 'hidden' }}>
      {/* Target for image export (Clean without buttons) */}
      <View ref={cardRef} collapsable={false} style={{ gap: 12, backgroundColor: t.card }}>
        {/* Header: Word & Category */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <Txt font="display" size={27} weight={700} color={t.primary} style={{ flexShrink: 1 }}>
              {item.word}
            </Txt>
            {item.root ? (
              <View style={{ backgroundColor: t.soft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Txt size={13} weight={600} color={t.primary}>
                  جذر: {item.root}
                </Txt>
              </View>
            ) : null}
          </View>
          <View style={{ flexShrink: 0, marginTop: 2 }}>
            <Pill label={item.category} bg={t.goldSoft} fg={t.goldInk} />
          </View>
        </View>

        {/* Meaning Box */}
        <View style={{ backgroundColor: t.soft, borderRadius: r(14), padding: 14, gap: 4 }}>
          <Txt size={13} weight={700} color={t.primary}>
            المعنى الجامع المعتمد عند أهل السنة:
          </Txt>
          <Txt size={15} lh={1.8} color={t.ink}>
            {item.meaning}
          </Txt>
        </View>

        {/* Quranic Ayahs */}
        <View style={{ gap: 10 }}>
          <Txt size={15} weight={700} color={t.goldInk}>
            الشواهد والأدلة من القرآن الكريم:
          </Txt>
          {item.ayahs.map((a, i) => (
            <View
              key={i}
              style={{
                backgroundColor: t.bg,
                borderWidth: 1,
                borderColor: t.line,
                borderRadius: r(16),
                padding: 14,
                gap: 8,
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <Txt size={13} weight={700} color={t.goldInk} style={{ flexShrink: 1 }}>
                  سورة {a.surahName} · الآية {a.ayah}
                </Txt>
                <Txt size={12} color={t.muted} style={{ flexShrink: 0 }}>
                  شاهد {i + 1}
                </Txt>
              </View>

              <Txt font="display" size={20} lh={2} color={t.ink}>
                ﴿{a.text}﴾
              </Txt>

              {/* Tafsir */}
              <View style={{ backgroundColor: t.soft, borderRadius: 10, padding: 10, gap: 2 }}>
                <Txt size={13} weight={700} color={t.primary}>
                  التفسير:
                </Txt>
                <Txt size={14} lh={1.8} color={t.ink}>
                  {a.tafsir}
                </Txt>
                <Txt size={12} color={t.muted} style={{ marginTop: 2 }}>
                  المصدر: {a.source}
                </Txt>
              </View>

              {/* Wajh al-Istidlal */}
              <View style={{ backgroundColor: t.goldSoft, borderRadius: 10, padding: 10, gap: 2 }}>
                <Txt size={13} weight={700} color={t.goldInk}>
                  وجه الاستدلال:
                </Txt>
                <Txt size={14} lh={1.8} color={t.goldInk}>
                  {a.wajh}
                </Txt>
              </View>
            </View>
          ))}
        </View>

        {/* Scholars Quotes */}
        {item.quotes && item.quotes.length > 0 && isExpanded ? (
          <View style={{ gap: 8, borderTopWidth: 1, borderColor: t.line, paddingTop: 10 }}>
            <Txt size={15} weight={700} color={t.primary}>
              من أقوال السلف وأئمة التفسير:
            </Txt>
            {item.quotes.map((q, qi) => (
              <View key={qi} style={{ gap: 4, paddingVertical: 4 }}>
                <Txt size={14} weight={700} color={t.ink}>
                  — {q.scholar}:
                </Txt>
                <Txt font="display" size={17} lh={1.9} color={t.ink}>
                  «{q.text}»
                </Txt>
                <Txt size={12} color={t.muted}>
                  {q.source}
                </Txt>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* Action Buttons (outside cardRef so not captured in image) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: t.line, paddingTop: 10, flexWrap: 'wrap', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <EvidenceActions
            where={`مفردة قرآنية · ${item.word}`}
            data={{
              text: `«${item.word}» — ${item.meaning}`,
              source: item.ayahs[0]?.source ?? 'القرآن الكريم وأمهات التفاسير',
              explain: item.meaning,
              wajh: item.ayahs[0]?.wajh,
              level: item.level ?? 1,
              reviewers: item.reviewers ?? ['هيئة التدقيق العلمي'],
              reviewedAt: item.reviewedAt ?? '1448 هـ',
            }}
            reportLabel="أبلغ"
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {item.quotes && item.quotes.length > 0 ? (
            <Press
              onPress={onToggle}
              label={isExpanded ? 'طي الأقوال' : 'عرض أقوال السلف'}
              style={{
                height: 38,
                paddingHorizontal: 12,
                borderRadius: r(12),
                backgroundColor: t.soft,
                justifyContent: 'center',
              }}>
              <Txt size={13} weight={600} color={t.primary}>
                {isExpanded ? 'إخفاء الأقوال' : `أقوال السلف (${item.quotes.length})`}
              </Txt>
            </Press>
          ) : null}

          <Press
            onPress={share}
            label="مشاركة كصورة"
            style={{
              height: 38,
              paddingHorizontal: 14,
              borderRadius: r(12),
              backgroundColor: t.primary,
              justifyContent: 'center',
            }}>
            <Txt size={14} weight={700} color={t.onPrimary}>
              مشاركة كصورة
            </Txt>
          </Press>
        </View>
      </View>
    </Card>
  );
}
