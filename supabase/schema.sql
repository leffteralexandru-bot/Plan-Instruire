-- artGRANIT — schema MVP (dezvoltare / demo)
-- Pentru producție folosiți schema-production.sql

create table if not exists user_progress (
  user_id text primary key,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists user_progress_updated_idx on user_progress (updated_at desc);

alter table user_progress enable row level security;

drop policy if exists "Allow anon read write for MVP" on user_progress;
create policy "Allow anon read write for MVP"
  on user_progress for all
  using (true)
  with check (true);
