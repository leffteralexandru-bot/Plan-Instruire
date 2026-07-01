-- artGRANIT — schema Supabase PRODUCȚIE
-- Rulați după crearea proiectului Supabase

-- Profiluri legate de auth.users
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  app_user_id text unique not null,
  role text not null check (role in ('stagiar', 'mentor', 'admin')),
  full_name text not null,
  email text not null,
  cohort_id text,
  created_at timestamptz not null default now()
);

create table if not exists user_progress (
  user_id text primary key,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists user_progress_updated_idx on user_progress (updated_at desc);
create index if not exists profiles_app_user_idx on profiles (app_user_id);

alter table profiles enable row level security;
alter table user_progress enable row level security;

-- Helper: app_user_id al utilizatorului autentificat
create or replace function public.current_app_user_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select app_user_id from profiles where id = auth.uid()
$$;

-- Profil: utilizatorul își vede propriul profil
create policy "profiles_select_own"
  on profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on profiles for update
  using (id = auth.uid());

-- Progres: stagiar/mentor/admin — propriul rând sau mentor/admin văd toți (HR)
create policy "progress_select"
  on user_progress for select
  using (
    user_id = public.current_app_user_id()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('mentor', 'admin')
    )
  );

create policy "progress_insert_own"
  on user_progress for insert
  with check (user_id = public.current_app_user_id());

create policy "progress_update_own"
  on user_progress for update
  using (user_id = public.current_app_user_id());

-- Storage bucket field-photos: creați manual + policy similară

-- Seed profiles (rulați după crearea utilizatorilor în Auth):
-- insert into profiles (id, app_user_id, role, full_name, email, cohort_id) values
--   ('uuid-stagiar-1', 'u-stagiar-1', 'stagiar', 'Alexandru Popescu', 'a.popescu@artgranit.ro', 'cohort-2026-i');
