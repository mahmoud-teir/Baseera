-- ── Baseerah: معجم المصطلحات والتعريفات الشرعية (لغةً واصطلاحاً) ──────────────────
-- Classical Islamic Dictionary & Definitions: Linguistic & Terminological

create table if not exists public.islamic_terms (
  id text primary key,
  term text not null,
  category text not null check (category in ('aqeedah', 'fiqh', 'hadith', 'quran', 'muamalat', 'tazkiyah')),
  category_label text not null,
  linguistic_def text not null,
  linguistic_source text not null default 'لسان العرب / معجم مقاييس اللغة',
  terminological_def text not null,
  scholarly_source text not null default 'كتاب التعريفات للجرجاني / كتب السلف',
  quran_evidence jsonb,
  hadith_evidence jsonb,
  distinction_note text,
  pillars_and_conditions text[] not null default '{}',
  tags text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexing for fast search
create index if not exists idx_islamic_terms_category on public.islamic_terms (category);
create index if not exists idx_islamic_terms_term on public.islamic_terms (term);

-- Row Level Security
alter table public.islamic_terms enable row level security;

-- Everyone (anon and authenticated) can read terms
drop policy if exists terms_public_read on public.islamic_terms;
create policy terms_public_read on public.islamic_terms
  for select to anon, authenticated
  using (true);

-- Only staff / admin can insert, update or delete terms
drop policy if exists terms_staff_write on public.islamic_terms;
create policy terms_staff_write on public.islamic_terms
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Automatically touch updated_at
drop trigger if exists terms_touch on public.islamic_terms;
create trigger terms_touch
  before update on public.islamic_terms
  for each row execute function public.touch_updated_at();
