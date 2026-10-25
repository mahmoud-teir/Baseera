/** Baseerah Native Admin Console — staff review workflows, books, updates and system defaults. */
import { useLocalSearchParams } from 'expo-router';

import { MobileAdminDashboard } from '@/features/admin/MobileAdminDashboard';
import { VIEW_IDS } from '@/features/admin/strings';

export function generateStaticParams() {
  return VIEW_IDS.map((view) => ({ view }));
}

const TAB_MAP: Record<string, string> = {
  queue: 'approvals',
  catalog: 'library',
  updates: 'updates',
  overview: 'overview',
  vocabulary: 'terms',
  people: 'system',
  settings: 'system',
};

export default function AdminView() {
  const { view } = useLocalSearchParams<{ view: string }>();
  const tab = (view && TAB_MAP[view]) || view || 'overview';
  return <MobileAdminDashboard initialTab={tab} />;
}
