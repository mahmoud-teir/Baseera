/** خطتك اليوم — `s.plan` (Missing Ideas 1a): 5/15/30-minute plans, per-day completion, calm streak. */
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Segmented, StepMark } from '@/components/core/parts';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { PLAN_TEMPLATES } from '@/data/structural';
import { useAcademy } from '@/features/academy/useAcademy';
import { planStreak } from '@/features/plan/plan';
import { useApp, type PlanMinutes } from '@/state/app-store';
import { useTheme } from '@/theme/theme';
import { dayKey } from '@/utils/date';

export default function Plan() {
  const { t } = useTheme();
  const ac = useAcademy();
  const planMin = useApp((s) => s.planMin);
  const planDone = useApp((s) => s.planDone);
  const set = useApp((s) => s.set);
  const toggle = useApp((s) => s.togglePlan);
  const today = planDone[dayKey()] ?? {};
  const plan = PLAN_TEMPLATES[planMin];
  const done = plan.filter((_, i) => today[`${planMin}:${i}`]).length;
  const pct = Math.round((done / plan.length) * 100);
  return (
    <Screen gap={16} padBottom={28}>
      <BackLink label="الرئيسية" href="/" />
      <Title>خطتك اليوم</Title>
      <Lead>اختر وقتك فنرتّب لك اليوم. لا نقاط ولا منافسة، استمرار هادئ فقط.</Lead>
      <Segmented
        options={([5, 15, 30] as PlanMinutes[]).map((n) => ({ value: n, label: `${n} د` }))}
        value={planMin}
        onChange={(v) => set({ planMin: v })}
        height={48}
        label="مدة الخطة"
      />
      <View style={{ gap: 10 }}>
        {plan.map((x, i) => {
          const on = !!today[`${planMin}:${i}`];
          const sub = ac.cur ? x.sub.replace('{code}', ac.cur.code).replace('{title}', ac.cur.title) : x.sub.replace('{code}', 'حين يُنشر الدرس').replace('{title}', 'الدرس التالي حين يُنشر');
          return (
            <Card
              key={i}
              variant="app"
              pad={0}
              onPress={() => toggle(planMin, i)}
              label={`${x.title}: ${sub} · ${x.min} دقائق · ${on ? 'منجزة' : 'غير منجزة'}`}
              style={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <StepMark done={on} n={i + 1} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt size={18} weight={600}>
                  {x.title}
                </Txt>
                <Txt size={14} color={t.muted}>
                  {sub}
                </Txt>
              </View>
              <Txt size={14} color={t.muted}>
                {x.min} د
              </Txt>
            </Card>
          );
        })}
      </View>
      <Card variant="app" style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt size={16} weight={600}>
            إنجاز اليوم
          </Txt>
          <Txt size={16} weight={600} color={t.primary}>
            {pct}%
          </Txt>
        </View>
        <ProgressBar value={pct} height={10} />
        <Txt size={14} color={t.muted}>
          أيام متتالية: {planStreak(planDone)}
        </Txt>
      </Card>
    </Screen>
  );
}
