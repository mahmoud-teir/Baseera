/** القرآن الكريم — `s.quran`: continue card, tajweed, tabs السور / العلامات / الحفظ, 114 surahs. */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Chip } from '@/components/core/Chip';
import { Icon } from '@/components/core/Icon';
import { Diamond, DiamondBullet, EmptyState, Segmented, Pill } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { Hero } from '@/components/layout/Hero';
import { Column, useTopPad } from '@/components/layout/Screen';
import { reciterName, surah, SURAHS } from '@/data/quran';
import { ICON } from '@/data/structural';
import { HIFZ_LABELS, useHifzColors } from '@/features/quran/hifz';
import { useApp, type FolderName } from '@/state/app-store';
import { useTheme } from '@/theme/theme';

type Tab = 'surah' | 'marks' | 'hifz';

export default function Quran() {
  const { t, gc, pc, r } = useTheme();
  const router = useRouter();
  const top = useTopPad();
  const [tab, setTab] = useState<Tab>('surah');
  const [folder, setFolder] = useState<'الكل' | FolderName>('الكل');
  const fold = useApp((s) => s.fold);
  const cycleFold = useApp((s) => s.cycleFold);
  const lastRead = useApp((s) => s.lastRead);
  const hifz = useApp((s) => s.hifz);
  const setting = useApp((s) => s.setting);
  const hifzColors = useHifzColors();

  const last = lastRead ?? { surah: 1, ayah: 1 };
  const ls = surah(last.surah);
  const data =
    tab === 'surah' ? SURAHS : tab === 'marks' ? SURAHS.filter((s) => fold[s.n] && (folder === 'الكل' || fold[s.n] === folder)) : SURAHS;

  const header = (
    <View style={{ gap: 14, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Txt font="display" size={32} weight={700} accessibilityRole="header">
          القرآن الكريم
        </Txt>
        <Txt size={14} color={t.muted}>
          114 سورة · متاح للجميع
        </Txt>
      </View>
      <Hero radius={26} pad={20} gap={14} diamond={{ size: 150, left: -46, top: -46, color: 'rgba(196,166,106,.5)' }} secondDiamond={{ size: 96, left: -20, top: -20, color: 'rgba(196,166,106,.35)' }}>
        <View style={{ gap: 2 }}>
          <Txt size={14} weight={600} color={gc}>
            تابع القراءة
          </Txt>
          <Txt font="display" size={35} weight={700} lh={1.4} color="#FFFFFF">
            سورة {ls.name}
          </Txt>
          <Txt size={14} color="#CFE0DA">
            الآية {last.ayah} من {ls.ayas} · {ls.type}
          </Txt>
        </View>
        <ProgressBar value={(last.ayah / ls.ayas) * 100} light height={5} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Press
            onPress={() => router.push({ pathname: '/reader/[surah]', params: { surah: String(last.surah), ayah: String(last.ayah) } })}
            label="استئناف القراءة"
            style={{ height: 46, borderRadius: r(14), backgroundColor: '#FAF8F2', paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Txt size={14} color={pc}>
              ▶
            </Txt>
            <Txt size={17} weight={700} color={pc}>
              استئناف
            </Txt>
          </Press>
          <Txt size={14} color="#CFE0DA" style={{ flexShrink: 1 }}>
            القارئ: {reciterName(setting('reciter'))}
          </Txt>
        </View>
      </Hero>
      <Press
        onPress={() => router.navigate('/quran/tajweed')}
        label="تعلّم التجويد"
        style={{ backgroundColor: t.goldSoft, borderRadius: r(18), paddingHorizontal: 16, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <DiamondBullet color={gc} />
        <View style={{ flex: 1, gap: 1 }}>
          <Txt size={17} weight={700} color={t.goldInk}>
            تعلّم التجويد
          </Txt>
          <Txt size={14} color={t.goldInk} style={{ opacity: 0.85 }}>
            دروس قصيرة بالاستماع والتطبيق
          </Txt>
        </View>
        <Icon d={ICON.forward} size={18} color={t.goldInk} sw={2.2} directional />
      </Press>
      <Segmented
        options={[
          { value: 'surah', label: 'السور' },
          { value: 'marks', label: 'العلامات' },
          { value: 'hifz', label: 'الحفظ' },
        ]}
        value={tab}
        onChange={setTab}
        label="عرض القرآن"
      />
      {tab === 'hifz' && (
        <Hero radius={20} pad={16} gap={4} diamond={null} lattice={false} onPress={() => router.push({ pathname: '/coach/[surah]', params: { surah: String(last.surah) } })} label="مدرب الحفظ · ابدأ جلسة حفظ">
          <Txt size={14} weight={600} color={gc}>
            مدرب الحفظ
          </Txt>
          <Txt font="display" size={24} weight={700} color="#FFFFFF">
            ابدأ جلسة حفظ
          </Txt>
          <Txt size={14} color="#CFE0DA">
            إخفاء الآيات، تكرار، ثم تقييم ذاتي · سورة {ls.name}
          </Txt>
        </Hero>
      )}
      {tab === 'marks' && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['الكل', 'للحفظ', 'للمراجعة'] as const).map((c) => (
            <Chip key={c} label={c} outline active={folder === c} onPress={() => setFolder(c)} height={36} />
          ))}
        </View>
      )}
      {tab === 'marks' && !data.length && <EmptyState>لا توجد علامات مرجعية. اضغط ☆ بجانب أي سورة.</EmptyState>}
      {tab === 'hifz' && (
        <Txt size={14} color={t.muted}>
          اختر سورة لتبدأ جلسة حفظها، أو غيّر حالتها من «المحفوظات» في حسابي.
        </Txt>
      )}
    </View>
  );

  return (
    <Column>
      <FlatList
        data={data}
        keyExtractor={(s) => String(s.n)}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingTop: top, paddingHorizontal: 20, paddingBottom: 20 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        initialNumToRender={14}
        windowSize={7}
        renderItem={({ item: s }) => {
          const marked = !!fold[s.n];
          const hv = hifz[s.n] ?? 0;
          return (
            <Card variant="app" radius={18} pad={0} style={{ paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Diamond n={s.n} color={gc} />
              <Press
                onPress={() =>
                  tab === 'hifz'
                    ? router.push({ pathname: '/coach/[surah]', params: { surah: String(s.n) } })
                    : router.push({ pathname: '/reader/[surah]', params: { surah: String(s.n) } })
                }
                label={`سورة ${s.name} · ${s.type} · ${s.ayas} آية`}
                style={{ flex: 1, gap: 2 }}>
                <Txt font="display" size={23} weight={700} lh={1.3}>
                  سورة {s.name}
                </Txt>
                <Txt size={14} color={t.muted}>
                  {s.type} · {s.ayas} آية{fold[s.n] ? ` · ${fold[s.n]}` : ''}
                </Txt>
              </Press>
              {tab === 'hifz' ? (
                <Pill label={HIFZ_LABELS[hv]} bg={hifzColors[hv].bg} fg={hifzColors[hv].fg} size={13} />
              ) : (
                <Press
                  onPress={() => cycleFold(s.n)}
                  accessibilityRole="button"
                  label={marked ? `علامة مرجعية: ${fold[s.n]} — اضغط للتغيير` : 'إضافة علامة مرجعية'}
                  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt size={22} color={marked ? gc : t.muted}>
                    {marked ? '★' : '☆'}
                  </Txt>
                </Press>
              )}
            </Card>
          );
        }}
      />
    </Column>
  );
}
