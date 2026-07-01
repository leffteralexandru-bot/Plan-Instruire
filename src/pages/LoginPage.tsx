import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { isSupabaseConfigured } from '@/store/storage';

const ROLE_LABELS: Record<string, { label: string; emoji: string }> = {
  stagiar: { label: 'Inginer Stagiar', emoji: '🎓' },
  mentor: { label: 'Mentor / Șef Proiectare', emoji: '👤' },
  admin: { label: 'Admin HR', emoji: '📋' },
};

export function LoginPage() {
  const { login, demoUsers, isAuthenticated, loading, supabaseAuth } = useAuth();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-corporate-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-corporate-gold border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleQuickLogin = async (userEmail: string) => {
    setError('');
    setSubmitting(true);
    const ok = await login(userEmail, supabaseAuth ? password || undefined : undefined);
    setSubmitting(false);
    if (!ok) setError('Autentificare eșuată. Verificați email-ul' + (supabaseAuth ? ' și parola.' : '.'));
  };

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleQuickLogin(email);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="login-hero relative px-4 py-10 sm:py-14 text-center text-white">
        <div className="relative z-10 mx-auto max-w-lg space-y-4">
          <BrandLogo tone="light" height={32} className="mx-auto" />
          <p className="text-sm text-corporate-gold font-medium tracking-wide uppercase">
            Plan de Instruire și Adaptare Profesională
          </p>
          <h1 className="text-xl sm:text-2xl font-light text-white/95 leading-snug">
            Transformăm cunoștințele în{' '}
            <span className="font-semibold text-corporate-gold">proiecte de excelență</span>
          </h1>
          <p className="text-xs text-white/50">Platformă internă · artgranit.ro</p>
        </div>
      </div>

      <div className="flex-1 px-4 pb-10 -mt-6 relative z-10">
        <div className="mx-auto w-full max-w-md">
          <Card className="shadow-neural-lg border-corporate-border">
            <h2 className="text-lg font-semibold text-corporate-black mb-1">Autentificare</h2>
            <p className="text-sm text-corporate-muted mb-5">Platformă internă artGRANIT</p>

            {supabaseAuth && (
              <form onSubmit={handleFormLogin} className="space-y-3 mb-5">
                <Input
                  id="email"
                  label="Email artGRANIT"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="a.popescu@artgranit.ro"
                  required
                />
                <Input
                  id="password"
                  type="password"
                  label="Parolă"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
                  {submitting ? 'Se conectează…' : 'Conectare'}
                </Button>
              </form>
            )}

            <p className="text-sm text-corporate-muted mb-3">
              {supabaseAuth ? 'Sau selectați cont demo:' : 'Selectați un cont demo:'}
            </p>

            <div className="space-y-2">
              {demoUsers.map((u) => {
                const meta = ROLE_LABELS[u.role] ?? ROLE_LABELS.stagiar;
                return (
                  <button
                    key={u.id}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleQuickLogin(u.email)}
                    className="w-full flex items-center gap-4 rounded-xl border border-corporate-border p-3.5 text-left hover:border-corporate-gold hover:bg-corporate-gold-light/40 transition-all group disabled:opacity-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-corporate-surface text-lg">
                      {meta.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-corporate-black group-hover:text-corporate-gold-hover truncate">
                        {u.name}
                      </p>
                      <p className="text-xs text-corporate-muted">{meta.label}</p>
                      <p className="text-xs text-corporate-muted/80 truncate">{u.email}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            {isSupabaseConfigured() && (
              <p className="text-xs text-corporate-gold mt-4">Sync cloud Supabase disponibil</p>
            )}
          </Card>

          <p className="text-center text-xs text-corporate-muted mt-6">
            PWA · funcționează offline după prima încărcare
          </p>
        </div>
      </div>
    </div>
  );
}
