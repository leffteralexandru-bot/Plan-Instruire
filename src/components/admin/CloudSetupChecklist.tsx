import { Card } from '@/components/ui/Card';
import { isSupabaseConfigured } from '@/store/storage';
import { isSupabaseAuthEnabled } from '@/lib/authService';

const STEPS = [
  {
    id: 'project',
    label: 'Proiect Supabase creat pe supabase.com',
    hint: 'Plan free e suficient la start.',
  },
  {
    id: 'schema',
    label: 'Schema SQL rulată',
    hint: 'schema-production.sql apoi schema-hr-performance.sql',
  },
  {
    id: 'env',
    label: '.env.local configurat',
    hint: 'VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY',
  },
  {
    id: 'auth',
    label: 'Utilizatori în Supabase Auth',
    hint: 'Cont separat per HR / mentor / supervizor / angajat',
  },
  {
    id: 'auth-env',
    label: 'VITE_USE_SUPABASE_AUTH=true',
    hint: 'Login email + parolă cloud',
  },
  {
    id: 'sync',
    label: 'Sync complet rulat o dată',
    hint: 'Setări → Sync complet → cloud',
  },
  {
    id: 'multi-pc',
    label: 'Test pe al doilea PC',
    hint: 'Același .env + login → date identice după sync',
  },
];

export function CloudSetupChecklist() {
  const configured = isSupabaseConfigured();
  const authOn = isSupabaseAuthEnabled();

  return (
    <Card className={configured ? 'border-emerald-200/50' : 'border-amber-200/60 bg-amber-50/30'}>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">
        Faza 0 — Cloud Supabase (model B)
      </h2>
      <p className="text-sm text-corporate-muted mb-4">
        Aplicația rămâne sursa master; Supabase partajează datele între PC-uri. Detalii în{' '}
        <code className="text-xs bg-slate-100 px-1 rounded">supabase/README.md</code>.
      </p>

      <ol className="space-y-2 mb-4">
        {STEPS.map((step, idx) => {
          let done = false;
          if (step.id === 'project' || step.id === 'schema') done = configured;
          if (step.id === 'env') done = configured;
          if (step.id === 'auth') done = configured;
          if (step.id === 'auth-env') done = authOn;
          if (step.id === 'sync') done = false;

          return (
            <li
              key={step.id}
              className="flex gap-3 text-sm rounded-lg border border-corporate-border/60 px-3 py-2"
            >
              <span
                className={[
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600',
                ].join(' ')}
              >
                {done ? '✓' : idx + 1}
              </span>
              <div>
                <p className="font-medium text-corporate-dark">{step.label}</p>
                <p className="text-xs text-corporate-muted">{step.hint}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-2 items-center">
        <span
          className={[
            'text-xs font-medium px-2 py-1 rounded-full',
            configured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900',
          ].join(' ')}
        >
          {configured ? 'Supabase detectat în .env' : 'Mod local — configurați .env.local'}
        </span>
        {configured && (
          <span className="text-xs text-corporate-muted">
            Auth cloud: {authOn ? 'activ' : 'opțional — setați VITE_USE_SUPABASE_AUTH'}
          </span>
        )}
      </div>

      {!configured && (
        <p className="text-xs text-amber-900 mt-3">
          Copiați <code className="bg-white/80 px-1 rounded">.env.example</code> →{' '}
          <code className="bg-white/80 px-1 rounded">.env.local</code> și reporniți dev server.
        </p>
      )}
    </Card>
  );
}
