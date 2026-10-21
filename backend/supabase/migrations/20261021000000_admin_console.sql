-- Baseerah Console (Baseerah Dashboard.dc.html) — staff roles, audit log, app configuration,
-- staff management, feedback inbox and learner notifications. Content publishing lives in the
-- next migration (cms). Every write goes through a security-definer RPC that checks the caller's
-- role against the permission matrix shown in the console's «Roles & audit» view.

-- ── Roles: content · scholar · mod · analytics · admin ──────────────────────
alter table public.staff drop constraint if exists staff_role_check;
update public.staff set role = 'scholar' where role = 'reviewer';
alter table public.staff add constraint staff_role_check check (role in ('content', 'scholar', 'mod', 'analytics', 'admin'));

create or replace function public.staff_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.staff where user_id = auth.uid();
$$;

-- Permission matrix (rows = permissions, columns = content, scholar, mod, analytics, admin).
create or replace function public.has_perm(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select case p
    when 'view_queues'      then public.staff_role() in ('content', 'scholar', 'mod', 'analytics', 'admin')
    when 'edit_lessons'     then public.staff_role() in ('content', 'admin')
    when 'approve_evidence' then public.staff_role() in ('scholar', 'admin')
    when 'triage_reports'   then public.staff_role() in ('mod', 'admin')
    when 'see_analytics'    then public.staff_role() in ('analytics', 'admin')
    when 'manage_roles'     then public.staff_role() = 'admin'
    else false end;
$$;

create or replace function public.require_perm(p text) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not coalesce(public.has_perm(p), false) then raise exception 'forbidden' using errcode = '42501'; end if;
end;
$$;

-- ── Reports: New → Triaged → Fixed → Notified (changed only through admin_transition) ──
alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports add constraint reports_status_check check (status in ('new', 'triaged', 'fixed', 'notified', 'rejected'));
drop policy if exists reports_staff_update on public.reports;

-- ── Audit log ──────────────────────────────────────────────────────────────
create table public.audit_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor uuid references auth.users (id) on delete set null,
  actor_role text,
  item text not null,
  action text not null
);
create index audit_log_item_idx on public.audit_log (item, at desc);
alter table public.audit_log enable row level security;
create policy audit_staff_read on public.audit_log for select to authenticated using (public.is_staff());

create or replace function public.audit(p_item text, p_action text) returns void
language sql security definer set search_path = public as $$
  insert into public.audit_log (actor, actor_role, item, action) values (auth.uid(), public.staff_role(), p_item, p_action);
$$;
revoke execute on function public.audit(text, text) from public, anon, authenticated;

-- ── App configuration (read by every client) ───────────────────────────────
create table public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;
create policy app_config_public_read on public.app_config for select to anon, authenticated using (true);
insert into public.app_config (key, value) values
  -- Prayer & calendar defaults (until the user changes them).
  ('prayer', '{"method":"Muslim World League","hijriAdj":0,"notifications":true,"highLatitude":false,"dst":true}'),
  -- Planned lessons per subject in stage 1 (the design's curriculum outline) and the default pass mark.
  ('curriculum', '{"stage1":{"aqeedah":8,"fiqh":11,"tafsir":8,"hadith":8,"seerah":10,"tazkiyah":8},"passPct":85}');

create or replace function public.admin_save_config(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare total int;
begin
  perform public.require_perm('manage_roles');
  if p_key = 'prayer' then
    if not (p_value ? 'method' and p_value ? 'hijriAdj' and (p_value->>'hijriAdj')::int between -2 and 2) then raise exception 'invalid_config'; end if;
  elsif p_key = 'curriculum' then
    select sum(v::int) into total from jsonb_each_text(p_value->'stage1') as e(k, v);
    if total is null or total < 1 or coalesce((p_value->>'passPct')::int, 0) not between 50 and 100 then raise exception 'invalid_config'; end if;
    update public.stage_requirements set lessons = total where stage = 1;
  else
    raise exception 'unknown_key';
  end if;
  insert into public.app_config (key, value, updated_at) values (p_key, p_value, now())
    on conflict (key) do update set value = excluded.value, updated_at = now();
  perform public.audit('config:' || p_key, 'updated');
end;
$$;

-- ── Staff management (admins only; there is always at least one admin) ─────
create or replace function public.admin_list_staff()
returns table (user_id uuid, email text, display_name text, role text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.require_perm('manage_roles');
  return query
    select s.user_id, u.email::text, p.display_name, s.role, s.created_at
    from public.staff s join auth.users u on u.id = s.user_id left join public.profiles p on p.id = s.user_id
    order by s.created_at;
end;
$$;

create or replace function public.admin_set_staff(p_email text, p_role text) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid; old text;
begin
  perform public.require_perm('manage_roles');
  if p_role not in ('content', 'scholar', 'mod', 'analytics', 'admin') then raise exception 'invalid_role'; end if;
  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then raise exception 'no_such_user'; end if;
  select role into old from public.staff where user_id = uid;
  if old = 'admin' and p_role <> 'admin' and (select count(*) from public.staff where role = 'admin') = 1 then raise exception 'last_admin'; end if;
  insert into public.staff (user_id, role) values (uid, p_role) on conflict (user_id) do update set role = excluded.role;
  perform public.audit('staff:' || uid, coalesce(old, '—') || ' → ' || p_role);
  return uid;
end;
$$;

create or replace function public.admin_remove_staff(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare old text;
begin
  perform public.require_perm('manage_roles');
  select role into old from public.staff where user_id = p_user;
  if old is null then raise exception 'not_found'; end if;
  if old = 'admin' and (select count(*) from public.staff where role = 'admin') = 1 then raise exception 'last_admin'; end if;
  delete from public.staff where user_id = p_user;
  perform public.audit('staff:' || p_user, old || ' → —');
end;
$$;

-- ── Published reviewers («الإشراف العلمي») ───────────────────────────────────
create or replace function public.admin_upsert_reviewer(p_id bigint, p_subject text, p_name text, p_published boolean, p_last_review date) returns bigint
language plpgsql security definer set search_path = public as $$
declare rid bigint;
begin
  perform public.require_perm('manage_roles');
  if char_length(trim(coalesce(p_name, ''))) not between 2 and 120 then raise exception 'invalid_name'; end if;
  if p_subject not in ('aqeedah', 'fiqh', 'tafsir', 'hadith', 'seerah', 'tazkiyah') then raise exception 'invalid_subject'; end if;
  if p_id is null then
    insert into public.reviewers (subject_id, name, published, last_review) values (p_subject, trim(p_name), p_published, p_last_review) returning id into rid;
  else
    update public.reviewers set subject_id = p_subject, name = trim(p_name), published = p_published, last_review = p_last_review where id = p_id returning id into rid;
    if rid is null then raise exception 'not_found'; end if;
  end if;
  perform public.audit('reviewer:' || rid, 'saved');
  return rid;
end;
$$;

create or replace function public.admin_delete_reviewer(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.require_perm('manage_roles');
  delete from public.reviewers where id = p_id;
  perform public.audit('reviewer:' || p_id, 'deleted');
end;
$$;
drop policy if exists reviewers_staff_all on public.reviewers;
create policy reviewers_staff_read on public.reviewers for select to authenticated using (public.is_staff());
drop policy if exists changelog_staff_insert on public.changelog;

-- ── Feedback inbox («تواصل معنا») ───────────────────────────────────────────
alter table public.feedback add column status text not null default 'new' check (status in ('new', 'read', 'done'));

create or replace function public.admin_feedback_mark(p_id bigint, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.require_perm('triage_reports');
  if p_status not in ('new', 'read', 'done') then raise exception 'invalid_status'; end if;
  update public.feedback set status = p_status where id = p_id;
  if not found then raise exception 'not_found'; end if;
  perform public.audit('feedback:' || p_id, p_status);
end;
$$;

-- ── Learner notifications (written only by the server) ─────────────────────
create table public.user_notifications (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  report_id bigint references public.reports (id) on delete set null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index user_notifications_user_idx on public.user_notifications (user_id, created_at desc);
alter table public.user_notifications enable row level security;
create policy user_notifications_own_read on public.user_notifications for select to authenticated using (user_id = auth.uid());

create or replace function public.mark_notifications_read() returns void
language sql security definer set search_path = public as $$
  update public.user_notifications set read_at = now() where user_id = auth.uid() and read_at is null;
$$;

-- ── Read models for the console ────────────────────────────────────────────
create or replace function public.admin_learner_stats()
returns table (code text, learners bigint, avg_progress int, pass_rate int)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.require_perm('see_analytics');
  return query
    select k.code,
           count(distinct a.user_id),
           coalesce(round(avg(a.pct))::int, 0),
           coalesce(round(100.0 * count(*) filter (where a.passed) / nullif(count(a.id), 0))::int, 0)
    from public.lesson_keys k left join public.quiz_attempts a on a.code = k.code
    group by k.code order by k.code;
end;
$$;

create or replace function public.admin_certificates()
returns table (code text, name text, stage int, issued_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.require_perm('see_analytics');
  return query select c.code, c.name, c.stage, c.issued_at from public.certificates c order by c.issued_at desc limit 500;
end;
$$;

grant execute on function public.admin_save_config(text, jsonb), public.admin_list_staff(), public.admin_set_staff(text, text), public.admin_remove_staff(uuid),
  public.admin_upsert_reviewer(bigint, text, text, boolean, date), public.admin_delete_reviewer(bigint), public.admin_feedback_mark(bigint, text),
  public.mark_notifications_read(), public.admin_learner_stats(), public.admin_certificates(), public.staff_role(), public.has_perm(text) to authenticated;
