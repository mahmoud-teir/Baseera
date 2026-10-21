-- Content publishing for every content slot in the app (HANDOFF §1: nothing is shown before it is
-- verified). Each row is one slot (kind + slot key) with a working copy (`data`) and the last
-- approved copy (`published_data`). Clients read only `published_content`; drafts never leave the
-- console. Writes go through the RPCs below; approval rules:
--   lesson → two different scholars · everything else → one scholar · a source is required for
--   every religious text before it can be approved.

-- ── content_items → generic content slots ──────────────────────────────────
drop policy if exists content_public_read on public.content_items;
drop policy if exists content_staff_all on public.content_items;
drop policy if exists content_staff_read on public.content_items;
alter table public.content_items drop constraint if exists published_needs_source;
alter table public.content_items drop constraint if exists content_items_kind_check;
alter table public.content_items drop constraint if exists content_items_status_check;
alter table public.content_items
  drop column if exists author, drop column if exists chapters, drop column if exists pages, drop column if exists audio_url,
  drop column if exists size_mb, drop column if exists level, drop column if exists reviewers, drop column if exists reviewed_at;
alter table public.content_items
  alter column id set default gen_random_uuid()::text,
  alter column category set default '',
  add column slot text not null default '',
  add column data jsonb not null default '{}'::jsonb,
  add column published_data jsonb,
  add column published_at timestamptz,
  add column approvals uuid[] not null default '{}',
  add column approver_names text[] not null default '{}',
  add column sort int not null default 0,
  add column created_by uuid references auth.users (id) on delete set null,
  add constraint content_items_kind_check check (kind in ('lesson', 'evidence', 'quote', 'story', 'sharia', 'adhkar', 'tafsir', 'tajweed', 'drill', 'path', 'map', 'page', 'book', 'audio')),
  add constraint content_items_status_check check (status in ('draft', 'review', 'published', 'rejected')),
  add constraint content_items_slot_unique unique (kind, slot);
create policy content_staff_read on public.content_items for select to authenticated using (public.is_staff());

-- What the app reads: approved copies only.
create view public.published_content as
  select id, kind, slot, published_data as data, published_at, sort from public.content_items where published_data is not null;
grant select on public.published_content to anon, authenticated;

-- ── Validation ─────────────────────────────────────────────────────────────
create or replace function public.cms_blank(v jsonb) returns boolean
language sql immutable as $$ select v is null or jsonb_typeof(v) <> 'string' or char_length(trim(v #>> '{}')) = 0 $$;

/** Returns an error code, or null when `d` is valid for `k` (and publishable when p_publish). */
create or replace function public.cms_check(k text, slot text, d jsonb, p_publish boolean) returns text
language plpgsql immutable as $$
declare q jsonb; x jsonb; n int; ids text[] := '{}';
begin
  if jsonb_typeof(d) <> 'object' then return 'data_not_object'; end if;
  case k
  when 'lesson' then
    if slot !~ '^(AQ|FQ|TF|HD|SR|TZ)-\d{2}$' then return 'bad_slot'; end if;
    if public.cms_blank(d->'title') then return 'title_required'; end if;
    if coalesce((d#>>'{quiz,passPct}')::int, 0) not between 50 and 100 then return 'pass_pct'; end if;
    for q in select * from jsonb_array_elements(coalesce(d#>'{quiz,questions}', '[]')) loop
      n := jsonb_array_length(coalesce(q->'options', '[]'));
      if public.cms_blank(q->'id') or q->>'id' = any (ids) then return 'question_id'; end if;
      ids := ids || (q->>'id');
      if public.cms_blank(q->'q') or n not between 2 and 6 or coalesce((q->>'answer')::int, -1) not between 0 and n - 1 then return 'question_invalid'; end if;
    end loop;
    if p_publish and (jsonb_array_length(coalesce(d->'objectives', '[]')) = 0 or jsonb_array_length(coalesce(d->'sections', '[]')) = 0
                      or jsonb_array_length(coalesce(d#>'{quiz,questions}', '[]')) = 0) then return 'lesson_incomplete'; end if;
  when 'evidence' then
    if slot !~ '^(AQ|FQ|TF|HD|SR|TZ)-\d{2}/e\d+$' then return 'bad_slot'; end if;
    if p_publish and (public.cms_blank(d->'text') or public.cms_blank(d->'source')) then return 'source_required'; end if;
  when 'quote' then
    if p_publish and (public.cms_blank(d->'text') or public.cms_blank(d->'scholar') or public.cms_blank(d->'source')) then return 'source_required'; end if;
  when 'story', 'sharia' then
    if p_publish then
      n := 0;
      for x in select value from jsonb_each(coalesce(d->'sections', '{}')) loop
        if public.cms_blank(x->'text') or public.cms_blank(x->'source') then return 'source_required'; end if;
        n := n + 1;
      end loop;
      if n = 0 then return 'empty'; end if;
    end if;
  when 'adhkar' then
    for x in select * from jsonb_array_elements(coalesce(d->'items', '[]')) loop
      if public.cms_blank(x->'id') or x->>'id' = any (ids) then return 'item_id'; end if;
      ids := ids || (x->>'id');
      if p_publish and (public.cms_blank(x->'text') or public.cms_blank(x->'source') or coalesce((x->>'count')::int, 0) < 1) then return 'source_required'; end if;
    end loop;
    if p_publish and cardinality(ids) = 0 then return 'empty'; end if;
  when 'tafsir' then
    if slot !~ '^\d{1,3}$' or slot::int not between 1 and 114 then return 'bad_slot'; end if;
    if p_publish and (public.cms_blank(d->'source') or public.cms_blank(d->'tafsir') or coalesce(d->'ayahs', '{}') = '{}') then return 'source_required'; end if;
  when 'tajweed' then
    if p_publish and (public.cms_blank(d->'text') or public.cms_blank(d->'source')) then return 'source_required'; end if;
  when 'drill' then
    for q in select * from jsonb_array_elements(coalesce(d->'questions', '[]')) loop
      n := jsonb_array_length(coalesce(q->'options', '[]'));
      if public.cms_blank(q->'id') or n not between 2 and 6 or coalesce((q->>'answer')::int, -1) not between 0 and n - 1 then return 'question_invalid'; end if;
      if p_publish and (public.cms_blank(q->'audio') or public.cms_blank(q->'source')) then return 'source_required'; end if;
    end loop;
  when 'path' then
    if p_publish and jsonb_array_length(coalesce(d->'steps', '[]')) = 0 then return 'empty'; end if;
  when 'map' then
    if p_publish and jsonb_array_length(coalesce(d->'links', '[]')) = 0 then return 'empty'; end if;
  when 'page' then
    if p_publish and jsonb_array_length(coalesce(d->'sections', '[]')) = 0 then return 'empty'; end if;
  when 'book' then
    if public.cms_blank(d->'title') then return 'title_required'; end if;
    if p_publish and (public.cms_blank(d->'source') or jsonb_array_length(coalesce(d->'chapters', '[]')) = 0) then return 'source_required'; end if;
  when 'audio' then
    if public.cms_blank(d->'title') then return 'title_required'; end if;
    if p_publish and (public.cms_blank(d->'source') or coalesce(d->>'audio_url', '') !~ '^https://') then return 'source_required'; end if;
  else
    return 'unknown_kind';
  end case;
  return null;
end;
$$;

-- ── Drafts ─────────────────────────────────────────────────────────────────
-- Saving always returns the slot to «draft»: edits to published content go live only after a new approval.
create or replace function public.admin_save_draft(p_kind text, p_slot text, p_data jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare err text; rid text; cur text;
begin
  perform public.require_perm('edit_lessons');
  err := public.cms_check(p_kind, p_slot, p_data, false);
  if err is not null then raise exception '%', err using errcode = '22023'; end if;
  select status into cur from public.content_items where kind = p_kind and slot = p_slot for update;
  insert into public.content_items (kind, slot, data, title, category, source, status, approvals, approver_names, created_by)
  values (p_kind, p_slot, p_data, coalesce(nullif(p_data->>'title', ''), p_slot), coalesce(p_data->>'category', ''), p_data->>'source', 'draft', '{}', '{}', auth.uid())
  on conflict (kind, slot) do update set data = excluded.data, title = excluded.title, category = excluded.category, source = excluded.source,
    status = 'draft', approvals = '{}', approver_names = '{}'
  returning id into rid;
  perform public.audit('ct:' || rid, coalesce(cur, 'new') || ' → draft');
  return rid;
end;
$$;

create or replace function public.admin_delete_content(p_id text) returns void
language plpgsql security definer set search_path = public as $$
declare pub jsonb; k text;
begin
  select published_data, kind into pub, k from public.content_items where id = p_id for update;
  if k is null then raise exception 'not_found'; end if;
  -- Removing something learners can see is an admin decision; drafts can be discarded by the content team.
  perform public.require_perm(case when pub is null then 'edit_lessons' else 'manage_roles' end);
  delete from public.content_items where id = p_id;
  perform public.audit('ct:' || p_id, 'deleted');
end;
$$;

-- ── Workflow (content and reports) ─────────────────────────────────────────
create or replace function public.admin_transition(p_kind text, p_id text, p_action text) returns text
language plpgsql security definer set search_path = public as $$
declare
  r public.content_items%rowtype;
  cur text;
  nxt text;
  err text;
  me text;
  need int;
  rep public.reports%rowtype;
begin
  perform public.require_perm('view_queues');

  if p_kind = 'ct' then
    select * into r from public.content_items where id = p_id for update;
    if r.id is null then raise exception 'not_found'; end if;
    cur := r.status;
    if p_action = 'send' and cur = 'draft' then
      perform public.require_perm('edit_lessons');
      err := public.cms_check(r.kind, r.slot, r.data, true);
      if err is not null then raise exception '%', err using errcode = '22023'; end if;
      nxt := 'review';
      update public.content_items set status = nxt, approvals = '{}', approver_names = '{}' where id = p_id;
    elsif p_action = 'approve' and cur = 'review' then
      perform public.require_perm('approve_evidence');
      if auth.uid() = any (r.approvals) then raise exception 'already_approved' using errcode = '42501'; end if;
      err := public.cms_check(r.kind, r.slot, r.data, true);
      if err is not null then raise exception '%', err using errcode = '22023'; end if;
      select coalesce(nullif(p.display_name, ''), u.email::text) into me from auth.users u left join public.profiles p on p.id = u.id where u.id = auth.uid();
      r.approvals := r.approvals || auth.uid();
      r.approver_names := r.approver_names || coalesce(me, '—');
      need := case when r.kind = 'lesson' then 2 else 1 end;
      if cardinality(r.approvals) >= need then
        nxt := 'published';
        update public.content_items set status = nxt, approvals = r.approvals, approver_names = r.approver_names,
          published_data = r.data, published_at = now() where id = p_id;
        insert into public.changelog (item, summary, approved_by)
          values (coalesce(nullif(r.data->>'title', ''), r.kind || ' · ' || r.slot), case when r.published_data is null then 'نُشر' else 'حُدّث' end,
                  array_to_string(r.approver_names, '، '));
        if r.kind = 'lesson' then
          insert into public.lesson_keys (code, subject, stage, pass_pct, answers)
          values (r.slot,
                  case left(r.slot, 2) when 'AQ' then 'aqeedah' when 'FQ' then 'fiqh' when 'TF' then 'tafsir' when 'HD' then 'hadith' when 'SR' then 'seerah' else 'tazkiyah' end,
                  1, (r.data#>>'{quiz,passPct}')::int,
                  array(select (q->>'answer')::int from jsonb_array_elements(r.data#>'{quiz,questions}') with ordinality as t(q, i) order by i))
          on conflict (code) do update set pass_pct = excluded.pass_pct, answers = excluded.answers;
        end if;
      else
        nxt := 'review';
        update public.content_items set approvals = r.approvals, approver_names = r.approver_names where id = p_id;
      end if;
    elsif p_action = 'reject' and cur = 'review' then
      perform public.require_perm('approve_evidence');
      nxt := 'rejected';
      update public.content_items set status = nxt, approvals = '{}', approver_names = '{}' where id = p_id;
    elsif p_action = 'reopen' and cur = 'rejected' then
      perform public.require_perm('edit_lessons');
      nxt := 'draft';
      update public.content_items set status = nxt where id = p_id;
    else
      raise exception 'invalid_transition %→%', cur, p_action using errcode = '42501';
    end if;

  elsif p_kind = 'rp' then
    perform public.require_perm('triage_reports');
    select * into rep from public.reports where id = p_id::bigint for update;
    if rep.id is null then raise exception 'not_found'; end if;
    cur := rep.status;
    nxt := case
      when p_action = 'triage' and cur = 'new' then 'triaged'
      when p_action = 'fixed' and cur = 'triaged' then 'fixed'
      when p_action = 'notify' and cur = 'fixed' then 'notified'
      when p_action = 'reject' and cur in ('new', 'triaged') then 'rejected'
      else null end;
    if nxt is null then raise exception 'invalid_transition %→%', cur, p_action using errcode = '42501'; end if;
    update public.reports set status = nxt where id = rep.id;
    -- «Notify learner»: the reporter (when signed in) gets an in-app notification; push is sent by `notify-reporter`.
    if nxt = 'notified' and rep.user_id is not null then
      insert into public.user_notifications (user_id, report_id, title, body)
      values (rep.user_id, rep.id, 'أُصلح ما أبلغت عنه', 'شكرًا لك. راجع فريق المحتوى بلاغك عن «' || left(rep.where_text, 120) || '» وأصلحه.');
    end if;
  else
    raise exception 'unknown_kind';
  end if;

  perform public.audit(p_kind || ':' || p_id, cur || ' → ' || nxt);
  return nxt;
end;
$$;

-- ── Overview for the console ───────────────────────────────────────────────
create or replace function public.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  perform public.require_perm('view_queues');
  select jsonb_build_object(
    'evidence_review', (select count(*) from public.content_items where kind = 'evidence' and status = 'review'),
    'open_reports', (select count(*) from public.reports where status in ('new', 'triaged', 'fixed')),
    'lessons_review', (select count(*) from public.content_items where kind = 'lesson' and status = 'review'),
    'active_learners', (select count(distinct user_id) from public.quiz_attempts where created_at > now() - interval '30 days'),
    'completion', (select coalesce(round(100.0 * count(distinct (user_id, code)) filter (where passed) /
                     nullif((select count(distinct user_id) from public.quiz_attempts) * (select count(*) from public.lesson_keys), 0)), 0)
                   from public.quiz_attempts),
    'avg_score', (select round(avg(pct)) from public.quiz_attempts),
    'weekly', (select coalesce(jsonb_agg(n order by d), '[]'::jsonb) from (
                 select d, (select count(*) from public.quiz_attempts q where q.passed and q.created_at::date = d::date) as n
                 from generate_series(current_date - 6, current_date, interval '1 day') as g(d)) s),
    'pipeline', jsonb_build_array(
       (select count(*) from public.content_items where status in ('draft', 'rejected')),
       (select count(*) from public.content_items where status = 'review'),
       (select count(*) from public.content_items where published_data is not null))
  ) into r;
  return r;
end;
$$;

grant execute on function public.admin_save_draft(text, text, jsonb), public.admin_delete_content(text), public.admin_transition(text, text, text),
  public.admin_overview() to authenticated;

-- ── Media storage (Supabase Storage; skipped where the storage schema does not exist) ──
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
    execute $p$ create policy media_public_read on storage.objects for select to anon, authenticated using (bucket_id = 'media') $p$;
    execute $p$ create policy media_editor_insert on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.has_perm('edit_lessons')) $p$;
    execute $p$ create policy media_editor_update on storage.objects for update to authenticated using (bucket_id = 'media' and public.has_perm('edit_lessons')) $p$;
    execute $p$ create policy media_editor_delete on storage.objects for delete to authenticated using (bucket_id = 'media' and public.has_perm('edit_lessons')) $p$;
  end if;
end;
$$;
