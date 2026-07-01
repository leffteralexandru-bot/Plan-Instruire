-- Schema relațională: sistem instruire modular + evaluări + erori
-- Angajat -> PlanInstruire -> IstoricErori -> DocumenteEvaluare

create table if not exists angajati (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  prenume text not null,
  nume text not null,
  functie text,
  departament_id text not null,
  manager_id text,
  data_angajarii date,
  status text not null default 'activ',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists plan_instruire (
  id uuid primary key default gen_random_uuid(),
  angajat_id text not null references angajati(user_id) on delete cascade,
  department_id text not null,
  enrollment_id text,
  status text not null default 'in_curs' check (status in ('in_curs', 'finalizat', 'suspendat')),
  progress_percent int not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists plan_instruire_index (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plan_instruire(id) on delete cascade,
  week_number int not null,
  week_title text not null,
  day_id text not null,
  day_number int not null,
  day_title text not null,
  materials jsonb not null default '[]',
  instructions jsonb not null default '[]',
  unique (plan_id, day_id)
);

create table if not exists documente_evaluare (
  id uuid primary key default gen_random_uuid(),
  angajat_id text not null references angajati(user_id) on delete cascade,
  evaluation_cycle_id text,
  tip text not null,
  folder text check (folder in ('documentatie_baza', 'istoric_evaluari', 'istoric_instruire')),
  nume text not null,
  mime_type text,
  size_bytes bigint,
  storage_path text,
  uploaded_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists istoric_erori (
  id uuid primary key default gen_random_uuid(),
  angajat_id text not null references angajati(user_id) on delete cascade,
  raportat_de text not null,
  data date not null,
  motiv text not null,
  error_tag text not null,
  descriere text not null,
  document_id uuid references documente_evaluare(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_erori_angajat_motiv on istoric_erori (angajat_id, motiv, data desc);

create table if not exists re_instruire (
  id uuid primary key default gen_random_uuid(),
  angajat_id text not null references angajati(user_id) on delete cascade,
  mentor_id text not null,
  error_motiv text not null,
  error_case_ids jsonb not null default '[]',
  titlu text not null,
  descriere text,
  status text not null default 'obligatoriu',
  termen_limita date not null,
  finalizat_la timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists alerte_eroare_repetata (
  id uuid primary key default gen_random_uuid(),
  angajat_id text not null references angajati(user_id) on delete cascade,
  mentor_id text not null,
  error_motiv text not null,
  error_tag text not null,
  count int not null,
  error_case_ids jsonb not null default '[]',
  re_instruire_id uuid references re_instruire(id),
  severity text not null check (severity in ('warning', 'critical')),
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_alerte_mentor on alerte_eroare_repetata (mentor_id, acknowledged_at);

create table if not exists document_permissions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documente_evaluare(id) on delete cascade,
  user_id text not null,
  role text not null check (role in ('owner', 'mentor', 'hr', 'admin', 'viewer')),
  granted_at timestamptz not null default now(),
  unique (document_id, user_id)
);

create index if not exists idx_doc_perm_user on document_permissions (user_id);

alter table documente_evaluare enable row level security;
alter table istoric_erori enable row level security;
alter table alerte_eroare_repetata enable row level security;
