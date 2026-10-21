/**
 * When signed in, every finished quiz is also graded by the `grade-quiz` Edge Function, which
 * holds the answer keys server-side. Certificates are issued only from these server records.
 */
import { supabase } from './supabase';

export async function gradeOnServer(code: string, answers: number[]): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  await supabase.functions.invoke('grade-quiz', { body: { code, answers } });
}
