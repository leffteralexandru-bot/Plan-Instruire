-- artGRANIT — seed utilizatori demo (rulați DUPĂ crearea conturilor în Supabase Auth)
-- Înlocuiți UUID-urile cu cele reale din Authentication → Users

-- Exemplu creare utilizator Auth (via Dashboard sau Admin API):
-- a.popescu@artgranit.ro, m.ionescu@artgranit.ro, e.vasilescu@artgranit.ro

insert into profiles (id, app_user_id, role, full_name, email, cohort_id) values
  ('00000000-0000-0000-0000-000000000001', 'u-stagiar-1', 'stagiar', 'Alexandru Popescu', 'a.popescu@artgranit.ro', 'cohort-2026-i'),
  ('00000000-0000-0000-0000-000000000002', 'u-stagiar-2', 'stagiar', 'Andrei Dumitrescu', 'a.dumitrescu@artgranit.ro', 'cohort-2026-i'),
  ('00000000-0000-0000-0000-000000000003', 'u-stagiar-3', 'stagiar', 'Cristina Marin', 'c.marin@artgranit.ro', 'cohort-2026-i'),
  ('00000000-0000-0000-0000-000000000004', 'u-mentor', 'mentor', 'Ing. Maria Ionescu', 'm.ionescu@artgranit.ro', null),
  ('00000000-0000-0000-0000-000000000005', 'u-admin', 'admin', 'Elena Vasilescu (HR)', 'e.vasilescu@artgranit.ro', null)
on conflict (app_user_id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  cohort_id = excluded.cohort_id;

-- Parolă demo recomandată la creare Auth: schimbați imediat în producție
