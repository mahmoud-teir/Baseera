/**
 * Error reports («أبلغ عن خطأ») — HANDOFF §7: reports reach the scholarly review team with the
 * textual location («الموضع»). Sent through the `submit-report` Edge Function (validation + rate
 * limit). Offline or without a configured backend, reports are queued on the device and flushed
 * later, so nothing the user writes is lost.
 */
import { z } from 'zod';

import { REPORT_REASONS } from '@/data/structural';
import { useApp } from '@/state/app-store';

import { backendConfigured, supabase } from './supabase';

export const ReportInputSchema = z.object({
  where: z.string().min(1).max(300),
  reason: z.enum(REPORT_REASONS),
  note: z.string().max(2000).default(''),
});
export type ReportInput = z.infer<typeof ReportInputSchema>;

export type ReportResult = { status: 'sent'; id: number } | { status: 'queued' };

async function send(r: ReportInput): Promise<number> {
  if (!supabase) throw new Error('backend-unavailable');
  const { data, error } = await supabase.functions.invoke<{ id: number }>('submit-report', { body: r });
  if (error || !data) throw error ?? new Error('no-data');
  return data.id;
}

export async function submitReport(input: ReportInput): Promise<ReportResult> {
  const r = ReportInputSchema.parse(input);
  if (backendConfigured) {
    try {
      const id = await send(r);
      return { status: 'sent', id };
    } catch {
      // fall through to the offline queue
    }
  }
  useApp.getState().queueReport({ where: r.where, reason: r.reason, note: r.note });
  return { status: 'queued' };
}

/** Retry queued reports (called on reconnect / app start). */
export async function flushReports(): Promise<number> {
  if (!backendConfigured) return 0;
  const pending = useApp.getState().pendingReports;
  let sent = 0;
  for (const p of pending) {
    try {
      const reason = REPORT_REASONS.includes(p.reason as (typeof REPORT_REASONS)[number]) ? p.reason : 'أخرى';
      await send({ where: p.where, reason: reason as ReportInput['reason'], note: p.note });
      useApp.getState().clearReport(p.localId);
      sent++;
    } catch {
      break;
    }
  }
  return sent;
}
