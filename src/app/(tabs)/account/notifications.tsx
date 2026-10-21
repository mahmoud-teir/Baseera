/** الإشعارات — messages from the content team (for example, when a reported error has been fixed). */
import { useEffect } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/core/Card';
import { EmptyState } from '@/components/core/parts';
import { Txt } from '@/components/core/Txt';
import { BackLink, Screen, Title } from '@/components/layout/Screen';
import { useInbox } from '@/services/inbox';
import { useTheme } from '@/theme/theme';

export default function Notifications() {
  const { t } = useTheme();
  const { items, unread, signedIn, available, markRead } = useInbox();
  useEffect(() => {
    if (unread) markRead().catch(() => {});
  }, [unread, markRead]);
  return (
    <Screen gap={12}>
      <BackLink label="حسابي" href="/account" />
      <Title>الإشعارات</Title>
      {!available || !signedIn ? (
        <EmptyState>تصلك هنا رسائل فريق المحتوى، مثل إصلاح خطأ أبلغت عنه، بعد تسجيل الدخول.</EmptyState>
      ) : !items.length ? (
        <EmptyState>لا توجد إشعارات.</EmptyState>
      ) : (
        items.map((n) => (
          <Card key={n.id} variant="app" style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Txt size={17} weight={700} color={t.primary} style={{ flexShrink: 1 }}>
                {n.title}
              </Txt>
              <Txt size={13} color={t.muted}>
                {new Date(n.created_at).toLocaleDateString('ar')}
              </Txt>
            </View>
            <Txt size={16} lh={1.8}>
              {n.body}
            </Txt>
          </Card>
        ))
      )}
    </Screen>
  );
}
