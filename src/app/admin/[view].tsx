/** Baseerah Console (`Baseerah Dashboard.dc.html`) — staff review workflows, analytics and app defaults. */
import { useLocalSearchParams } from 'expo-router';

import { Console } from '@/features/admin/Console';
import { VIEW_IDS, type ViewId } from '@/features/admin/strings';

export function generateStaticParams() {
  return VIEW_IDS.map((view) => ({ view }));
}

export default function AdminView() {
  const { view } = useLocalSearchParams<{ view: string }>();
  return <Console view={(VIEW_IDS as string[]).includes(view) ? (view as ViewId) : 'queue'} />;
}
