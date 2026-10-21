/** Learner notifications written by the server (e.g. «أُصلح ما أبلغت عنه» after a report is fixed). */
import { useCallback, useEffect, useState } from 'react';

import { useSession } from './auth';
import { supabase } from './supabase';

export interface InboxItem {
  id: number;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export function useInbox() {
  const { session } = useSession();
  const uid = session?.user.id ?? null;
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (!supabase || !uid) return;
    let alive = true;
    supabase
      .from('user_notifications')
      .select('id, title, body, created_at, read_at')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!alive || error) return;
        setItems((data ?? []) as InboxItem[]);
        setLoadedFor(uid);
      });
    return () => {
      alive = false;
    };
  }, [uid, nonce]);
  const load = useCallback(() => setNonce((n) => n + 1), []);
  const markRead = useCallback(async () => {
    if (!supabase || !uid) return;
    await supabase.rpc('mark_notifications_read');
    setItems((xs) => xs.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })));
  }, [uid]);
  const visible = uid && loadedFor === uid ? items : [];
  return { items: visible, unread: visible.filter((x) => !x.read_at).length, signedIn: !!uid, available: !!supabase, reload: load, markRead };
}
