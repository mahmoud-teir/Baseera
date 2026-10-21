/** Whether to offer the console link in Settings: signed-in staff only (requires a configured backend). */
import { useEffect, useState } from 'react';

import { useSession } from '@/services/auth';
import { supabase } from '@/services/supabase';

export function useIsStaff(): boolean {
  const { session } = useSession();
  const uid = session?.user.id ?? null;
  const [staffFor, setStaffFor] = useState<string | null>(null);
  useEffect(() => {
    if (!supabase || !uid) return;
    let alive = true;
    supabase.rpc('staff_role').then(({ data }) => {
      if (alive && data) setStaffFor(uid);
    });
    return () => {
      alive = false;
    };
  }, [uid]);
  if (!supabase) return false;
  return !!uid && staffFor === uid;
}
