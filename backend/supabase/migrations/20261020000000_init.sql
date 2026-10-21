-- Baseerah — initial schema. Every table has row-level security enabled.
-- Roles: anon (signed-out app), authenticated (signed-in user), service_role (Edge Functions only).


-- ── Staff (scholarly review team / admins) ─────────────────────────────────
create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('reviewer', 'admin')),
  created_at timestamptz not null default now()
);
alter table public.staff enable row level security;
create policy staff_self_read on public.staff for select to authenticated using (user_id = auth.uid());

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

-- ── Profiles ───────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'طالب العلم' check (char_length(display_name) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy profiles_own_select on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_own_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(left(new.raw_user_meta_data ->> 'display_name', 60), ''), 'طالب العلم'));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ── Synced learning state (local-first snapshot, owner only) ─────────────────
create table public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint user_state_size check (pg_column_size(data) < 2000000)
);
alter table public.user_state enable row level security;
create policy user_state_own_select on public.user_state for select to authenticated using (user_id = auth.uid());
create policy user_state_own_insert on public.user_state for insert to authenticated with check (user_id = auth.uid());
create policy user_state_own_update on public.user_state for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy user_state_own_delete on public.user_state for delete to authenticated using (user_id = auth.uid());

-- ── Lesson answer keys (server-side grading; never readable by clients) ──────
create table public.lesson_keys (
  code text primary key check (code ~ '^[A-Z]{2}-\d{2}$'),
  subject text not null,
  stage int not null default 1,
  pass_pct int not null default 85 check (pass_pct between 1 and 100),
  answers int[] not null
);
alter table public.lesson_keys enable row level security; -- no policies: service role only

-- Expected lesson count per stage (stage 1 = 53 lessons across six subjects).
create table public.stage_requirements (
  stage int primary key,
  lessons int not null
);
alter table public.stage_requirements enable row level security;
create policy stage_requirements_read on public.stage_requirements for select to anon, authenticated using (true);
insert into public.stage_requirements values (1, 53), (2, 0), (3, 0);

-- ── Quiz attempts (inserted only by the grade-quiz function) ───────────────
create table public.quiz_attempts (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null references public.lesson_keys (code),
  answers int[] not null,
  pct int not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);
create index quiz_attempts_user_idx on public.quiz_attempts (user_id, code);
alter table public.quiz_attempts enable row level security;
create policy quiz_attempts_own_select on public.quiz_attempts for select to authenticated using (user_id = auth.uid());

-- ── Certificates (issued by issue-certificate; verified publicly by code) ───
create table public.certificates (
  code text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  stage int not null,
  name text not null check (char_length(name) between 1 and 60),
  issued_at timestamptz not null default now(),
  unique (user_id, stage)
);
alter table public.certificates enable row level security;
create policy certificates_own_select on public.certificates for select to authenticated using (user_id = auth.uid());

-- ── Error reports («أبلغ عن خطأ») ──────────────────────────────────────────
create table public.reports (
  id bigserial primary key,
  where_text text not null check (char_length(where_text) between 1 and 300),
  reason text not null check (reason in ('خطأ في النص', 'مصدر أو تخريج غير صحيح', 'خطأ إملائي أو لغوي', 'محتوى غير مناسب', 'أخرى')),
  note text not null default '' check (char_length(note) <= 2000),
  user_id uuid references auth.users (id) on delete set null,
  client_hash text,
  status text not null default 'new' check (status in ('new', 'triaged', 'fixed', 'rejected')),
  created_at timestamptz not null default now()
);
create index reports_rate_idx on public.reports (client_hash, created_at);
alter table public.reports enable row level security;
create policy reports_staff_select on public.reports for select to authenticated using (public.is_staff());
create policy reports_staff_update on public.reports for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- ── Feedback («تواصل معنا») ────────────────────────────────────────────────
create table public.feedback (
  id bigserial primary key,
  message text not null check (char_length(message) between 5 and 4000),
  contact text check (contact is null or char_length(contact) <= 200),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
create policy feedback_insert on public.feedback for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
create policy feedback_staff_select on public.feedback for select to authenticated using (public.is_staff());

-- ── Published content (books, recordings, …) ───────────────────────────────
create table public.content_items (
  id text primary key,
  kind text not null check (kind in ('book', 'audio', 'lesson', 'quote', 'evidence', 'sharia', 'story', 'adhkar', 'tafsir')),
  category text not null,
  title text not null,
  author text,
  source text,
  chapters jsonb not null default '[]'::jsonb,
  pages int check (pages is null or pages > 0),
  audio_url text check (audio_url is null or audio_url ~ '^https://'),
  size_mb numeric,
  level int check (level is null or level between 1 and 4),
  reviewers text[] not null default '{}',
  reviewed_at date,
  status text not null default 'draft' check (status in ('draft', 'review', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- HANDOFF §1: nothing is published without a documented source.
  constraint published_needs_source check (status <> 'published' or (source is not null and char_length(source) > 0))
);
alter table public.content_items enable row level security;
create policy content_public_read on public.content_items for select to anon, authenticated using (status = 'published');
create policy content_staff_all on public.content_items for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ── Scholarly supervision & change log ─────────────────────────────────────
create table public.reviewers (
  id bigserial primary key,
  subject_id text not null,
  name text not null,
  published boolean not null default false,
  last_review date
);
alter table public.reviewers enable row level security;
create policy reviewers_public_read on public.reviewers for select to anon, authenticated using (published);
create policy reviewers_staff_all on public.reviewers for all to authenticated using (public.is_staff()) with check (public.is_staff());

create table public.changelog (
  id bigserial primary key,
  item text not null,
  summary text not null,
  approved_by text,
  created_at timestamptz not null default now()
);
alter table public.changelog enable row level security;
create policy changelog_public_read on public.changelog for select to anon, authenticated using (true);
create policy changelog_staff_insert on public.changelog for insert to authenticated with check (public.is_staff());

-- ── Push tokens (content-update notifications) ─────────────────────────────
create table public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now()
);
alter table public.push_tokens enable row level security;
create policy push_own_select on public.push_tokens for select to authenticated using (user_id = auth.uid());
create policy push_own_insert on public.push_tokens for insert to authenticated with check (user_id = auth.uid());
create policy push_own_update on public.push_tokens for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_own_delete on public.push_tokens for delete to authenticated using (user_id = auth.uid());

-- ── updated_at maintenance ─────────────────────────────────────────────────
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger content_touch before update on public.content_items for each row execute function public.touch_updated_at();
