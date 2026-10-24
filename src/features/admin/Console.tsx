/** Console shell — Clean Mobile-First Admin Dashboard for Baseerah. */
import { MobileAdminDashboard } from './MobileAdminDashboard';
import type { ViewId } from './strings';

export function Console({ view: _requested }: { view?: ViewId }) {
  return <MobileAdminDashboard />;
}
