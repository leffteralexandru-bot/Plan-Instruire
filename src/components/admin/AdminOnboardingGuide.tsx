import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { isSupabaseConfigured } from '@/store/storage';
import { isSupabaseAuthEnabled } from '@/lib/authService';

const STEPS = [
  {
    title: '1. Pornire aplicație',
    body: 'Rulați npm run dev sau accesați PWA instalată. Conturi demo artGRANIT pe pagina de login.',
  },
  {
    title: '2. Export rapoarte HR',
    body: 'Folosiți CSV, Excel (.xlsx) sau PDF/Print din secțiunea Export. Datele provin din progresul stagiarilor din acest browser.',
  },
  {
    title: '3. Backup JSON',
    body: 'Exportați backup JSON înainte de migrare sau schimbare browser. Import restaurat progres + setări.',
  },
  {
    title: '4. Supabase cloud (opțional)',
    body: 'Configurați VITE_SUPABASE_URL și VITE_SUPABASE_ANON_KEY în .env.local. Rulați supabase/schema.sql. Vezi supabase/README.md.',
    show: () => !isSupabaseConfigured(),
  },
  {
    title: '5. Auth producție (opțional)',
    body: 'Setați VITE_USE_SUPABASE_AUTH=true după crearea utilizatorilor în Supabase Auth. Parolă demo: artgranit2026 (schimbați în producție).',
    show: () => isSupabaseConfigured() && !isSupabaseAuthEnabled(),
  },
];

export function AdminOnboardingGuide() {
  const [open, setOpen] = useState(false);

  const visibleSteps = STEPS.filter((s) => !s.show || s.show());

  return (
    <Card className="border-corporate-gold/30 bg-corporate-gold-light/30">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-corporate-dark">Ghid Admin HR artGRANIT</h2>
          <p className="text-sm text-corporate-muted">Pași recomandați pentru operare zilnică</p>
        </div>
        <Button variant="ghost" size="sm" type="button" onClick={() => setOpen((v) => !v)}>
          {open ? 'Ascunde' : 'Afișează ghid'}
        </Button>
      </div>
      {open && (
        <ol className="mt-4 space-y-3 text-sm text-slate-700 list-decimal list-inside">
          {visibleSteps.map((s) => (
            <li key={s.title}>
              <strong>{s.title}</strong>
              <p className="ml-5 mt-0.5 text-corporate-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
