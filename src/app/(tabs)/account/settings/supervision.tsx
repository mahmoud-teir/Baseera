/** الإشراف العلمي — `s.sup` (Missing Ideas 1c): reviewer per subject and the public change log, read from the backend. */
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Card } from '@/components/core/Card';
import { PendingSlot } from '@/components/core/parts';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { SUBJECTS } from '@/data/structural';
import { supabase } from '@/services/supabase';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

interface Reviewer {
  subject_id: string;
  name: string;
  last_review: string | null;
}
interface Change {
  id: number;
  item: string;
  summary: string;
  approved_by: string | null;
  created_at: string;
}

export default function Supervision() {
  const { t, gc, r } = useTheme();
  const openReport = useUi((s) => s.openReport);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [log, setLog] = useState<Change[]>([]);
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('reviewers')
      .select('subject_id, name, last_review')
      .eq('published', true)
      .then(({ data }) => setReviewers((data as Reviewer[]) ?? []));
    supabase
      .from('changelog')
      .select('id, item, summary, approved_by, created_at')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => setLog((data as Change[]) ?? []));
  }, []);

  return (
    <Screen gap={14} padBottom={28}>
      <BackLink label="الإعدادات" href="/account/settings" />
      <Title>الإشراف العلمي</Title>
      <Lead>لكل مادة مراجع معتمد. تُنشر الأسماء بإذنهم، ويُسجَّل كل تعديل في المحتوى.</Lead>
      {SUBJECTS.map((s) => {
        const rv = reviewers.find((x) => x.subject_id === s.id);
        return (
          <Card key={s.id} variant="app" pad={0} style={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderStyle: rv ? 'solid' : 'dashed', borderColor: gc, alignItems: 'center', justifyContent: 'center' }}>
              {rv && (
                <Txt font="display" size={22} weight={700} color={t.primary}>
                  {rv.name.charAt(0)}
                </Txt>
              )}
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Txt size={17} weight={700}>
                {s.name}
              </Txt>
              <Txt size={14} color={t.muted}>
                المراجع: {rv?.name ?? 'يُدرج بعد التوثيق'}
              </Txt>
              <Txt size={13} color={t.goldInk}>
                آخر مراجعة: {rv?.last_review ? new Date(rv.last_review).toLocaleDateString('ar') : '—'}
              </Txt>
            </View>
          </Card>
        );
      })}
      <Card variant="app" style={{ gap: 8 }}>
        <Txt size={17} weight={700}>
          سجل التعديلات
        </Txt>
        {log.length ? (
          log.map((c) => (
            <View key={c.id} style={{ borderTopWidth: 1, borderColor: t.line, paddingTop: 8, gap: 2 }}>
              <Txt size={15} weight={600}>
                {c.item}
              </Txt>
              <Txt size={14} color={t.body} lh={1.8}>
                {c.summary}
              </Txt>
              <Txt size={13} color={t.muted}>
                {new Date(c.created_at).toLocaleDateString('ar')}
                {c.approved_by ? ` · اعتمده: ${c.approved_by}` : ''}
              </Txt>
            </View>
          ))
        ) : (
          <PendingSlot>ما الذي تغيّر في كل درس ولماذا، مع تاريخه ومن اعتمده.</PendingSlot>
        )}
      </Card>
      <Button variant="secondary" radius={r(16)} onPress={() => openReport('الإشراف العلمي')} style={{ minHeight: 52 }}>
        أبلغ عن خطأ في المحتوى
      </Button>
    </Screen>
  );
}
