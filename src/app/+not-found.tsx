import { Button } from '@/components/core/Button';
import { useRouter } from 'expo-router';

import { Lead, Screen, Title } from '@/components/layout/Screen';

export default function NotFound() {
  const router = useRouter();
  return (
    <Screen>
      <Title>الصفحة غير موجودة</Title>
      <Lead>ربما نُقل الرابط أو كُتب خطأً.</Lead>
      <Button size="lg" onPress={() => router.replace('/')}>
        العودة إلى الرئيسية
      </Button>
    </Screen>
  );
}
