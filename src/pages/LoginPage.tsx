import { useMemo, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getPostLoginPath } from '@/lib/accessControl';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ViewportPreviewMenu } from '@/components/layout/ViewportPreviewMenu';
import { userStore, repairDemoProfiles, repairLoginCredentials } from '@/lib/userStore';
import { credentials } from '@/lib/credentials';
import {
  DEMO_ANGAJAT_ID,
  DEMO_ANGAJAT_PASSWORD,
  MINIMAL_DEMO_ANGAJAT,
} from '@/lib/seedMinimalDemo';
import type { User } from '@/types';

const DEMO_NUME = 'Angajat';

function DemoAngajatCard({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full text-left rounded-xl transition-colors hover:ring-2 hover:ring-corporate-gold/40 disabled:opacity-60"
      title="Conectare rapidă ca angajat demo"
    >
      <div className="rounded-xl border border-corporate-border bg-corporate-surface/50 p-3.5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
            🎓
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-corporate-gold">
              Demo angajat
            </p>
            <p className="text-sm font-medium text-corporate-dark mt-0.5">{MINIMAL_DEMO_ANGAJAT.name}</p>
            <p className="text-xs text-corporate-muted">
              Vizualizare panou angajat — acces public
            </p>
            <p className="text-xs text-corporate-muted/90 mt-1">Nume: {DEMO_NUME}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

export function LoginPage() {
  const { login, isAuthenticated, loading, user } = useAuth();
  const [error, setError] = useState('');
  const [nume, setNume] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [profileTick, setProfileTick] = useState(0);

  useEffect(() => {
    repairLoginCredentials();
    repairDemoProfiles();
    setProfileTick((t) => t + 1);
  }, []);

  const demoAngajat = useMemo(() => {
    return (
      userStore.getTemporaryLoginProfiles().find((u) => u.id === DEMO_ANGAJAT_ID) ??
      MINIMAL_DEMO_ANGAJAT
    );
  }, [profileTick]);

  const leftoverProfiles = useMemo(() => {
    const temps = userStore.getTemporaryLoginProfiles().filter((u) => u.id !== DEMO_ANGAJAT_ID);
    return (
      userStore.getAdministratorProfiles().length +
        userStore.getHrProfiles().length +
        temps.length >
      0
    );
  }, [profileTick]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-corporate-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-corporate-gold border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated && user) return <Navigate to={getPostLoginPath(user)} replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const ok = await login(nume.trim(), password);
    setSubmitting(false);
    if (!ok) {
      setError('Nume sau parolă incorectă.');
    }
  };

  const loginAsDemoAngajat = async () => {
    const profile: User = demoAngajat;
    const pwd = credentials.getPassword(profile.id) ?? DEMO_ANGAJAT_PASSWORD;
    setNume(DEMO_NUME);
    setPassword(pwd);
    setError('');
    setSubmitting(true);
    const ok = await login(DEMO_NUME, pwd);
    setSubmitting(false);
    if (!ok) {
      setError('Nu s-a putut deschide contul demo angajat. Apăsați din nou cardul.');
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="absolute left-3 top-3 z-20 @md:left-4 @md:top-4">
        <ViewportPreviewMenu tone="light" layout="dots" />
      </div>
      <div className="login-hero relative px-4 py-10 text-center text-white @md:py-14">
        <div className="relative z-10 mx-auto w-full space-y-4 px-2 @md:max-w-2xl @xl:max-w-screen-xl">
          <BrandLogo tone="light" className="mx-auto h-[18px] @md:h-8" />
          <p className="text-sm text-corporate-gold font-medium tracking-wide uppercase">
            Plan de Instruire și Adaptare Profesională
          </p>
          <h1 className="text-xl font-light leading-snug text-white/95 @md:text-2xl">
            Transformăm cunoștințele în{' '}
            <span className="font-semibold text-corporate-gold">proiecte de excelență</span>
          </h1>
          <p className="text-xs text-white/50">Platformă internă · artgranit.ro</p>
        </div>
      </div>

      <div className="relative z-10 -mt-6 flex-1 px-4 pb-10">
        <div className="mx-auto w-full space-y-4 @md:max-w-2xl @xl:max-w-screen-xl">
          <Card className="shadow-neural-lg border-corporate-border">
            <h2 className="text-lg font-semibold text-corporate-black mb-1">Autentificare</h2>
            <p className="text-sm text-corporate-muted mb-4">
              Apăsați cardul demo sau introduceți numele și parola.
            </p>

            <p className="text-xs font-semibold uppercase tracking-wide text-corporate-muted mb-2">
              Cont demo (public)
            </p>
            <div className="mb-5">
              <DemoAngajatCard disabled={submitting} onClick={() => void loginAsDemoAngajat()} />
            </div>

            {leftoverProfiles && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-medium">Au mai rămas profile vechi în acest browser.</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    repairDemoProfiles();
                    setProfileTick((t) => t + 1);
                  }}
                >
                  Restaurează demo angajat
                </Button>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <Input
                id="nume"
                label="Nume"
                type="text"
                value={nume}
                onChange={(e) => setNume(e.target.value)}
                placeholder="Nume"
                required
                autoComplete="username"
              />
              <Input
                id="password"
                type="password"
                label="Parolă"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
                {submitting ? 'Se conectează…' : 'Conectare'}
              </Button>
            </form>

            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

            <p className="text-xs text-corporate-muted mt-4 border-t border-corporate-border pt-3">
              Demo: nume <code className="text-corporate-dark">{DEMO_NUME}</code>
              {' · '}
              parolă <code className="text-corporate-dark">{DEMO_ANGAJAT_PASSWORD}</code>
            </p>
          </Card>

          <p className="text-center text-xs text-corporate-muted">
            PWA · funcționează offline după prima încărcare
          </p>
        </div>
      </div>
    </div>
  );
}
