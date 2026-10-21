/** المسارات الموضوعية — `s.paths`. */
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Pill } from '@/components/core/parts';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { PATHS } from '@/data/structural';
import { useContent } from '@/state/content-store';
import { useApp } from '@/state/app-store';
import { useTheme } from '@/theme/theme';

export default function Paths() {
  const { t } = useTheme();
  const router = useRouter();
  const pathDone = useApp((s) => s.pathDone);
  const paths = useContent((s) => s.paths);
  return (
    <Screen gap={14}>
      <BackLink label="الرئيسية" href="/" />
      <Title>المسارات الموضوعية</Title>
      <Lead>رحلات قصيرة تجمع دروسًا وأحكامًا وكتبًا وصوتيات في موضوع واحد، بترتيب يناسب المبتدئ.</Lead>
      {PATHS.map((p) => {
        const steps = paths[p.id]?.steps ?? [];
        const dn = steps.filter((_, i) => pathDone[`${p.id}:${i}`]).length;
        const pct = steps.length ? Math.round((dn / steps.length) * 100) : 0;
        const minutes = paths[p.id]?.minutes;
        return (
          <Card key={p.id} variant="app" onPress={() => router.navigate(`/paths/${p.id}`)} label={`${p.title} · ${pct}%`} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt font="display" size={23} weight={700}>
                {p.title}
              </Txt>
              <Pill label={p.tag} bg={t.goldSoft} fg={t.goldInk} size={13} />
            </View>
            <Txt size={14} color={t.muted}>
              {steps.length ? `${steps.length} خطوات${minutes ? ` · نحو ${minutes} دقيقة` : ''}` : 'الخطوات بانتظار التوثيق'}
            </Txt>
            <ProgressBar value={pct} height={5} />
          </Card>
        );
      })}
    </Screen>
  );
}
