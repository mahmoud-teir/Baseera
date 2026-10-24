/** الأذكار — `s.adhkar`: published adhkar of a category (text, count, source), with counters saved per day. */
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Card } from '@/components/core/Card';
import { Icon } from '@/components/core/Icon';
import { EvidenceActions, PendingSlot, Ring } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { ADHKAR, ICON } from '@/data/structural';
import { DEFAULT_ADHKAR } from '@/data/defaults';
import { useAcademy } from '@/features/academy/useAcademy';
import { TodayLesson } from '@/features/prayer/TodayLesson';
import { useApp } from '@/state/app-store';
import { useContent } from '@/state/content-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';
import { dayKey } from '@/utils/date';

export function generateStaticParams() {
  return ADHKAR.map((a) => ({ cat: a.id }));
}

export default function Adhkar() {
  const { cat } = useLocalSearchParams<{ cat: string }>();
  const c = ADHKAR.find((a) => a.id === cat) ?? ADHKAR[0];
  const { t, pc, gc, r } = useTheme();
  const ac = useAcademy();
  const counts = useApp((s) => s.adC[dayKey()]) ?? {};
  const tap = useApp((s) => s.tapDhikr);
  const resetDhikr = useApp((s) => s.resetDhikr);
  const resetCategoryAdhkar = useApp((s) => s.resetCategoryAdhkar);
  const flash = useUi((s) => s.flash);
  const published = useContent((s) => s.adhkar[c.id]?.items);
  const list = published && published.length ? published : (DEFAULT_ADHKAR[c.id]?.items ?? []);
  const items = list.map((x) => ({ ...x, n: counts[`${c.id}:${x.id}`] ?? 0 }));
  const allDone = items.length > 0 && items.every((x) => x.n >= x.count);

  return (
    <Screen gap={14}>
      <BackLink label="الصلاة والأذكار" href="/prayer" />
      <Title size={30}>{c.name}</Title>
      {items.length ? (
        <Lead size={14}>اضغط الدائرة لعدّ التكرار. يُحفظ العدّ لليوم على جهازك. اضغط مطوّلاً لإعادة عدّ أي ذكر.</Lead>
      ) : (
        <PendingSlot>نصوص {c.name} وأعدادها تُدرج هنا من مصدر موثّق مع تخريجها بعد المراجعة العلمية.</PendingSlot>
      )}
      {items.map((x, i) => {
        const isDone = x.n >= x.count;
        const current = Math.min(x.n, x.count);
        const pct = Math.min(100, Math.round((current / x.count) * 100));

        return (
          <Card key={x.id} variant="app" style={{ gap: 10 }} pad={14}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Txt font="display" size={20} lh={2}>
                  {x.text}
                </Txt>
                <Txt size={13} color={t.muted}>
                  {x.source}
                  {x.ref ? ` · ${x.ref}` : ''}
                </Txt>
              </View>
              <Press
                onPress={() => {
                  if (x.n < x.count) {
                    tap(c.id, x.id);
                  } else {
                    flash('أتممت هذا الذكر بحمد الله · اضغط مطوّلاً لإعادة العدّ');
                  }
                }}
                onLongPress={() => {
                  if (x.n > 0) {
                    resetDhikr(c.id, x.id);
                    flash('تمت إعادة عدّ هذا الذكر');
                  }
                }}
                delayLongPress={300}
                label={isDone ? `تم إتمام الذكر ${i + 1} (${x.count} مرة). اضغط مطولاً للبدء من جديد.` : `عدّ الذكر ${i + 1}: ${current} من ${x.count}`}
                accessibilityRole="button"
                style={{ borderRadius: 38 }}>
                <Ring pct={pct} size={72} stroke={6} color={pc} track={t.line}>
                  <View
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 29,
                      backgroundColor: isDone ? t.soft : t.card,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 2,
                    }}>
                    {isDone ? (
                      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <Icon d={ICON.check} size={20} color={pc} sw={2.8} />
                        <Txt size={10} weight={700} color={pc} ltr numberOfLines={1}>
                          {x.count}
                        </Txt>
                      </View>
                    ) : x.count >= 10 ? (
                      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <Txt size={15} weight={700} color={current > 0 ? pc : t.ink} ltr numberOfLines={1}>
                          {current}
                        </Txt>
                        <Txt size={10} weight={600} color={t.muted} ltr numberOfLines={1}>
                          {`/${x.count}`}
                        </Txt>
                      </View>
                    ) : (
                      <Txt size={15} weight={700} color={current > 0 ? pc : t.ink} ltr numberOfLines={1}>
                        {`${current}/${x.count}`}
                      </Txt>
                    )}
                  </View>
                </Ring>
              </Press>
            </View>
            {x.virtue ? (
              <Txt size={14} color={t.goldInk} lh={1.8}>
                {x.virtue}
              </Txt>
            ) : null}
            {x.explain ? (
              <View style={{ backgroundColor: t.soft, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 }}>
                <Txt size={13} color={t.primary} lh={1.7}>
                  <Txt size={13} weight={700} color={t.primary}>
                    شرح المسألة:{' '}
                  </Txt>
                  {x.explain}
                </Txt>
              </View>
            ) : null}
            {x.wajh ? (
              <View style={{ backgroundColor: t.goldSoft, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 }}>
                <Txt size={13} color={t.goldInk} lh={1.7}>
                  <Txt size={13} weight={700} color={t.goldInk}>
                    وجه الاستدلال:{' '}
                  </Txt>
                  {x.wajh}
                </Txt>
              </View>
            ) : null}
            <EvidenceActions
              where={`${c.name} · الذكر ${i + 1}`}
              data={{
                text: x.text,
                source: x.source,
                ref: x.ref,
                wajh: x.wajh,
                explain: x.explain,
                level: x.level ?? 1,
                reviewers: x.reviewers ?? ['هيئة التدقيق العلمي'],
                reviewedAt: x.reviewedAt ?? '1448 هـ',
              }}
            />
          </Card>
        );
      })}
      {allDone && (
        <View style={{ gap: 12 }}>
          <View style={{ backgroundColor: t.soft, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, gap: 4 }} accessibilityLiveRegion="polite">
            <Txt size={16} weight={700} color={t.primary}>
              أتممت هذه الأذكار. تقبّل الله منك.
            </Txt>
            <Txt size={13} color={t.muted}>
              جميع أذكار هذا القسم مكتملة لليوم. تقبل الله طاعتكم وصالح أعمالكم.
            </Txt>
          </View>
          <Button
            variant="secondary"
            onPress={() => {
              resetCategoryAdhkar(c.id);
              flash('تمت إعادة ضبط عدادات هذا القسم');
            }}>
            إعادة ضبط عدّ أذكار {c.name}
          </Button>
          <TodayLesson pc={pc} gc={gc} r={r} ac={ac} />
        </View>
      )}
    </Screen>
  );
}
