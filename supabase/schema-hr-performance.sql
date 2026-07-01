-- artGRANIT — date performanță HR (Faza 3)
-- Rulați după schema.sql sau schema-production.sql

create table if not exists hr_performance (
  id text primary key,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists hr_performance_updated_idx on hr_performance (updated_at desc);

alter table hr_performance enable row level security;

-- MVP: policy deschis (ca user_progress demo)
drop policy if exists "Allow anon hr performance MVP" on hr_performance;
create policy "Allow anon hr performance MVP"
  on hr_performance for all
  using (true)
  with check (true);

-- Producție (decomentați și ștergeți policy MVP):
-- create policy "hr_performance_hr_access"
--   on hr_performance for all
--   using (
--     exists (
--       select 1 from profiles p
--       where p.id = auth.uid() and p.role in ('admin', 'hr', 'mentor')
--     )
--   );
