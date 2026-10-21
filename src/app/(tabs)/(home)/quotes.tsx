/** أقوال العلماء — `s.quotes`: quote of the day (verified only), category filter, verified / pending cards. */
import { useRef, useState, type ComponentRef } from 'react';
import { ScrollView, View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Chip } from '@/components/core/Chip';
import { EmptyState, EvidenceActions, Pill } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Note, Screen, Title } from '@/components/layout/Screen';
import { isVerifiedQuote } from '@/data/content';
import { useContent } from '@/state/content-store';
import { shareCard } from '@/services/share';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

const CATS = ['الكل', 'العقيدة', 'الفقه', 'التفسير', 'الحديث', 'التزكية'];

export default function Quotes() {
  const { t, pc, gc, r } = useTheme();
  const [cat, setCat] = useState('الكل');
  const saved = useApp((s) => s.savedQ);
  const toggleSaved = useApp((s) => s.toggleSavedQuote);
  const flash = useUi((s) => s.flash);
  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const quotes = useContent((s) => s.quotes);
  const list = quotes.filter((q) => cat === 'الكل' || q.cat === cat);
  // «قول اليوم» rotates daily through verified quotes only — nothing is shown before verification.
  const verified = quotes.filter(isVerifiedQuote);
  const [dayIndex] = useState(() => Math.floor(Date.now() / 86400000));
  const qotd = verified.length ? verified[dayIndex % verified.length] : null;

  const share = async () => {
    if (!qotd) return;
    const res = await shareCard(cardRef, `«${qotd.text}»\n— ${qotd.scholar}، ${qotd.source}\n\nمن تطبيق بصيرة`);
    if (res === 'copied') flash('نُسخ القول مع مصدره');
    else if (res === 'unavailable') flash('المشاركة غير متاحة على هذا الجهاز');
  };

  return (
    <Screen gap={14}>
      <BackLink label="الرئيسية" href="/" />
      <Title>أقوال العلماء</Title>
      <Lead>أقوال مختارة من كتب أهل العلم، تُنشر بعد التحقق من النص ونسبته وموضعه في الكتاب.</Lead>
      <View ref={cardRef} collapsable={false} style={{ backgroundColor: pc, borderRadius: r(22), padding: 18, gap: 10 }}>
        <Txt size={14} weight={600} color={gc}>
          قول اليوم
        </Txt>
        {qotd ? (
          <>
            <Txt font="display" size={22} lh={2} color="#FFFFFF">
              {qotd.text}
            </Txt>
            <Txt size={14} color="#CFE0DA">
              {qotd.scholar} · {qotd.source}
            </Txt>
          </>
        ) : (
          <Txt size={15} color="#CFE0DA" lh={1.8}>
            يظهر هنا قول يومي بعد توثيق أول قول. لا يُعرض شيء قبل التحقق منه.
          </Txt>
        )}
        <Press
          onPress={share}
          disabled={!qotd}
          label="مشاركة كصورة"
          style={{ alignSelf: 'flex-start', height: 42, paddingHorizontal: 18, borderRadius: r(14), backgroundColor: '#FAF8F2', justifyContent: 'center', opacity: qotd ? 1 : 0.45 }}>
          <Txt size={16} weight={700} color={pc}>
            مشاركة كصورة
          </Txt>
        </Press>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {CATS.map((c) => (
          <Chip key={c} label={c} outline active={cat === c} onPress={() => setCat(c)} height={40} fontSize={16} />
        ))}
      </ScrollView>
      {!list.length ? <EmptyState>{cat === 'الكل' ? 'لا توجد أقوال منشورة بعد. تظهر هنا بعد توثيق نصها ونسبتها وموضعها.' : `لا توجد أقوال منشورة في «${cat}» بعد.`}</EmptyState> : null}
      {list.map((q) => {
        const on = saved.includes(q.id);
        const where = `قول · ${q.scholar} · ${q.cat}`;
        return (
          <Card key={q.id} variant="app" radius={22} pad={18} style={{ gap: 12, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Txt font="display" size={58} color={gc} style={{ height: 30, lineHeight: 62 }}>
                “
              </Txt>
              <Pill label="موثّق" bg={t.soft} fg={t.primary} size={13} />
            </View>
            <Txt font="display" size={23} lh={2}>
              {q.text}
            </Txt>
            <View style={{ gap: 2, borderTopWidth: 1, borderColor: t.line, paddingTop: 10 }}>
              <Txt size={16} weight={700}>
                {q.scholar}
              </Txt>
              <Txt size={14} color={t.muted}>
                {q.source}
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Pill label={q.cat} bg={t.goldSoft} fg={t.goldInk} />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <EvidenceActions where={where} data={{ text: q.text, source: q.source ?? '' }} reportLabel="أبلغ" />
              </View>
              <Press
                onPress={() => toggleSaved(q.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                label="حفظ القول"
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={22} color={on ? gc : t.muted}>
                  {on ? '★' : '☆'}
                </Txt>
              </Press>
            </View>
          </Card>
        );
      })}
      <Note>لا تُعرض أقوال إلا مع اسم القائل والكتاب والجزء والصفحة.</Note>
    </Screen>
  );
}
