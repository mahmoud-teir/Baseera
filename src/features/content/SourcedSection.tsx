/** A published, sourced section (stories, encyclopedia) — or the «بانتظار التوثيق» slot while none is published. */
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { EvidenceActions, PendingSlot } from '@/components/core/parts';
import { Txt } from '@/components/core/Txt';
import type { SectionsData } from '@/data/content';
import { useTheme } from '@/theme/theme';

type Sourced = SectionsData['sections'][string];

export function SourcedSection({ heading, data, where, pending, actions }: { heading: string; data?: Sourced; where: string; pending: ReactNode; actions?: boolean }) {
  const { t, lhBody } = useTheme();
  return (
    <Card variant="app" radius={18} pad={14} style={{ gap: 8 }}>
      <Txt size={16} weight={700} color={t.primary}>
        {heading}
      </Txt>
      {data ? (
        <>
          <Txt size={17} lh={lhBody}>
            {data.text}
          </Txt>
          <Txt size={13} color={t.muted}>
            {data.source}
            {data.ref ? ` · ${data.ref}` : ''}
          </Txt>
          {data.explain ? (
            <View style={{ backgroundColor: t.soft, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 }}>
              <Txt size={13} color={t.primary} lh={1.7}>
                <Txt size={13} weight={700} color={t.primary}>
                  شرح المسألة:{' '}
                </Txt>
                {data.explain}
              </Txt>
            </View>
          ) : null}
          {data.wajh ? (
            <View style={{ backgroundColor: t.goldSoft, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 }}>
              <Txt size={13} color={t.goldInk} lh={1.7}>
                <Txt size={13} weight={700} color={t.goldInk}>
                  وجه الاستدلال:{' '}
                </Txt>
                {data.wajh}
              </Txt>
            </View>
          ) : null}
        </>
      ) : (
        <PendingSlot>{pending}</PendingSlot>
      )}
      {actions || data ? <EvidenceActions where={where} data={data ?? {}} /> : null}
    </Card>
  );
}
