-- artGRANIT — schema MVP (dezvoltare / demo)
-- Pentru producție folosiți schema-production.sql

create table if not exists user_progress (
  user_id text primary key,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists user_progress_updated_idx on user_progress (updated_at desc);

-- Performanță HR (profile, evaluări, erori, KPI — metadata JSON)
create table if not exists hr_performance (
  id text primary key,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists hr_performance_updated_idx on hr_performance (updated_at desc);

alter table user_progress enable row level security;
alter table hr_performance enable row level security;

drop policy if exists "Allow anon read write for MVP" on user_progress;
create policy "Allow anon read write for MVP"
  on user_progress for all
  using (true)
  with check (true);

drop policy if exists "Allow anon hr performance MVP" on hr_performance;
create policy "Allow anon hr performance MVP"
  on hr_performance for all
  using (true)
  with check (true);
