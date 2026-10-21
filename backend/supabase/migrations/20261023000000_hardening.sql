-- Security hardening after the Supabase security advisor run of 21 Oct 2026.

-- ── 1. Published content without a SECURITY DEFINER view ────────────────────
-- Clients may read only the approved columns of published rows; drafts (`data`) stay private
-- through column privileges + RLS. Staff read full rows through `admin_content()`.
revoke all on public.content_items from anon, authenticated;
grant select (id, kind, slot, published_data, published_at, sort) on public.content_items to anon, authenticated;
drop policy if exists content_staff_read on public.content_items;
drop policy if exists content_public_read on public.content_items;
create policy content_public_read on public.content_items for select to anon, authenticated using (published_data is not null);
alter view public.published_content set (security_invoker = true);

create or replace function public.admin_content() returns setof public.content_items
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.require_perm('view_queues');
  return query select * from public.content_items order by updated_at desc;
end;
$$;

-- ── 2. Fixed search_path on every remaining function ───────────────────────
alter function public.cms_blank(jsonb) set search_path = public;
alter function public.cms_check(text, text, jsonb, boolean) set search_path = public;
alter function public.touch_updated_at() set search_path = public;

-- ── 3. Least-privilege EXECUTE ──────────────────────────────────────────────
-- Nothing in `public` is callable by signed-out clients. Signed-in clients get only the RPCs the
-- app and console call (each admin RPC checks the caller's staff role before doing anything).
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
grant execute on all functions in schema public to service_role;
grant execute on function
  public.is_staff(), public.staff_role(), public.has_perm(text), public.mark_notifications_read(),
  public.admin_content(), public.admin_overview(), public.admin_learner_stats(), public.admin_certificates(),
  public.admin_save_draft(text, text, jsonb), public.admin_delete_content(text), public.admin_transition(text, text, text),
  public.admin_save_config(text, jsonb), public.admin_list_staff(), public.admin_set_staff(text, text), public.admin_remove_staff(uuid),
  public.admin_upsert_reviewer(bigint, text, text, boolean, date), public.admin_delete_reviewer(bigint), public.admin_feedback_mark(bigint, text)
  to authenticated;

-- ── 4. Feedback only through the rate-limited `submit-feedback` function ────
drop policy if exists feedback_insert on public.feedback;
alter table public.feedback add column if not exists client_hash text;
create index if not exists feedback_rate_idx on public.feedback (client_hash, created_at);

-- ── 5. Media uploads: size and type limits ──────────────────────────────────
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    update storage.buckets
      set file_size_limit = 209715200, -- 200 MB
          allowed_mime_types = array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/webm', 'image/png', 'image/jpeg', 'image/webp']
      where id = 'media';
  end if;
end;
$$;
