/** كيف يُموَّل المشروع — funding transparency published by the project management from the console (kind page, slot funding). */
import { Card } from '@/components/core/Card';
import { PendingSlot } from '@/components/core/parts';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { useContent } from '@/state/content-store';
import { useTheme } from '@/theme/theme';

const HEADINGS = ['مصادر التمويل', 'المصروفات', 'التقارير الدورية'];

export default function Funding() {
  const { t, lhBody } = useTheme();
  const page = useContent((s) => s.pages.funding);
  const sections = page?.sections ?? HEADINGS.map((heading) => ({ heading, body: '' }));
  return (
    <Screen gap={12}>
      <BackLink label="الإعدادات" href="/account/settings" />
      <Title>كيف يُموَّل المشروع</Title>
      <Lead>بصيرة مشروع تعليمي مجاني غير ربحي: بلا اشتراكات ولا أسعار ولا إعلانات ولا بيع بيانات.</Lead>
      {sections.map((x) => (
        <Card key={x.heading} variant="app" style={{ gap: 8 }}>
          <Txt size={17} weight={700} color={t.primary}>
            {x.heading}
          </Txt>
          {x.body ? (
            <Txt size={16} lh={lhBody}>
              {x.body}
            </Txt>
          ) : (
            <PendingSlot>تُنشر هنا البيانات المعتمدة من إدارة المشروع.</PendingSlot>
          )}
        </Card>
      ))}
    </Screen>
  );
}
