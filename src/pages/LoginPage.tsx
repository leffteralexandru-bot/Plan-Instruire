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
  const [showPassword, setShowPassword] = useState(false);
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
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-corporate-black">
                  Parolă
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-corporate-border bg-white px-4 py-2.5 pr-11 text-sm placeholder:text-corporate-muted/60 focus:border-corporate-gold focus:outline-none focus:ring-2 focus:ring-corporate-gold/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-corporate-muted hover:text-corporate-dark"
                    aria-label={showPassword ? 'Ascunde parola' : 'Arată parola'}
                    aria-pressed={showPassword}
                    title={showPassword ? 'Ascunde parola' : 'Arată parola'}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
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
