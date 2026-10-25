/** The signed-in user's staff role (console access), or null for learners, signed-out users and no backend. */
import { useEffect, useState } from 'react';

import { useSession } from '@/services/auth';
import { supabase } from '@/services/supabase';

import { ROLES, type Role } from './strings';

export function useStaffRole(): Role | null {
  const { session } = useSession();
  const uid = session?.user.id ?? null;
  const email = session?.user.email ?? null;
  const isOwner = email === 'mahmoudteirbusiness@gmail.com';
  const [found, setFound] = useState<{ uid: string; role: Role } | null>(null);

  useEffect(() => {
    if (!supabase || !uid) return;
    let alive = true;
    supabase.rpc('staff_role').then(({ data }) => {
      if (alive && ROLES.includes(data as Role)) setFound({ uid, role: data as Role });
    });
    return () => {
      alive = false;
    };
  }, [uid]);

  if (!supabase || !uid) return null;
  if (found?.uid === uid) return found.role;
  if (isOwner) return 'admin';
  return null;
}

/** Whether to offer the console link: signed-in staff only. */
export function useIsStaff(): boolean {
  return useStaffRole() !== null;
}
