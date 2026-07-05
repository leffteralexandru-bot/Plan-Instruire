import { useMemo, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getPostLoginPath } from '@/lib/accessControl';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { userStore, repairDemoProfiles, repairLoginCredentials, DEMO_LOGIN_HINTS } from '@/lib/userStore';
import { credentials, DEFAULT_PLATFORM_PASSWORD } from '@/lib/credentials';
import { ROLE_LABELS, formatUserRoles, isAngajatUser, isMentorUser } from '@/lib/roles';
import type { User } from '@/types';

function OrgProfileCard({
  emoji,
  title,
  subtitle,
  name,
  email,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  name: string;
  email: string;
}) {
  return (
    <div className="rounded-xl border border-corporate-border bg-corporate-surface/50 p-3.5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
          {emoji}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-corporate-gold">{title}</p>
          <p className="text-sm font-medium text-corporate-dark mt-0.5">{name}</p>
          <p className="text-xs text-corporate-muted">{subtitle}</p>
          <p className="text-xs text-corporate-muted/90 truncate mt-1">{email}</p>
        </div>
      </div>
    </div>
  );
}

function profilePassword(user: User): string {
  return credentials.getPassword(user.id) ?? DEFAULT_PLATFORM_PASSWORD;
}

function tempProfileSubtitle(user: User): string {
  if (isAngajatUser(user) && isMentorUser(user)) {
    return 'Angajat · Mentor temporar (HR)';
  }
  if (isMentorUser(user)) return 'Mentor — validări & feedback';
  if (isAngajatUser(user)) return 'Panou Angajat · plan instruire';
  return formatUserRoles(user);
}

function tempProfileEmoji(user: User): string {
  if (isAngajatUser(user) && isMentorUser(user)) return '🎓👤';
  if (isMentorUser(user)) return '👤';
  return '🎓';
}

export function LoginPage() {
  const { login, isAuthenticated, loading, user } = useAuth();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [profileTick, setProfileTick] = useState(0);

  useEffect(() => {
    repairLoginCredentials();
    setProfileTick((t) => t + 1);
  }, []);

  const admins = useMemo(() => userStore.getAdministratorProfiles(), [profileTick]);
  const hrProfiles = useMemo(() => userStore.getHrProfiles(), [profileTick]);
  const tempProfiles = useMemo(() => userStore.getTemporaryLoginProfiles(), [profileTick]);

  const hasOrgProfiles = admins.length > 0 || hrProfiles.length > 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-corporate-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-corporate-gold border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated && user) return <Navigate to={getPostLoginPath(user)} replace />;

  const applyProfile = (profile: User) => {
    setEmail(profile.email);
    setPassword(profilePassword(profile));
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const ok = await login(email.trim(), password);
    setSubmitting(false);
    if (!ok) {
      setError(
        'Profil sau parolă incorectă. Parola demo: artgranit2026. Dacă nu apar carduri, apăsați „Restaurează scenariu test”.',
      );
    }
  };

  const quickLogin = async (profile: User) => {
    const pwd = profilePassword(profile);
    applyProfile(profile);
    setError('');
    setSubmitting(true);
    const ok = await login(profile.email, pwd);
    setSubmitting(false);
    if (!ok) {
      setError(
        'Nu s-a putut conecta acest profil. Apăsați „Restaurează scenariu test” sau folosiți parola artgranit2026.',
      );
    }
  };

  const renderProfileButton = (
    profile: User,
    card: { emoji: string; title: string; subtitle: string },
  ) => (
    <button
      key={profile.id}
      type="button"
      disabled={submitting}
      onClick={() => void quickLogin(profile)}
      className="text-left rounded-xl transition-colors hover:ring-2 hover:ring-corporate-gold/40 disabled:opacity-60"
      title={`Conectare: ${profile.email} · parolă demo`}
    >
      <OrgProfileCard
        emoji={card.emoji}
        title={card.title}
        subtitle={card.subtitle}
        name={profile.name}
        email={profile.email}
      />
    </button>
  );

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
        <div className="mx-auto w-full max-w-lg space-y-4">
          <Card className="shadow-neural-lg border-corporate-border">
            <h2 className="text-lg font-semibold text-corporate-black mb-1">Autentificare</h2>
            <p className="text-sm text-corporate-muted mb-4">Platformă internă artGRANIT</p>

            <div className="mb-5 rounded-xl border border-corporate-gold/25 bg-corporate-gold-light/30 p-3 text-xs text-corporate-stone space-y-1.5">
              <p>
                <strong>Ierarhie acces:</strong> Administrator → creează profile HR → HR creează
                angajați și acordă statut mentor temporar.
              </p>
              <p>
                Apăsați un card — email și parolă demo se completează automat și vă conectați.
              </p>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide text-corporate-muted mb-2">
              Profile organizaționale
            </p>
            <div className="grid gap-2 sm:grid-cols-2 mb-5">
              {admins.map((a) =>
                renderProfileButton(a, {
                  emoji: '⚙️',
                  title: ROLE_LABELS.admin,
                  subtitle: 'Acces complet · HR & setări',
                }),
              )}
              {hrProfiles.map((h) =>
                renderProfileButton(h, {
                  emoji: '📋',
                  title: ROLE_LABELS.hr,
                  subtitle: 'Panou HR · angajați & evaluări',
                }),
              )}
            </div>

            {tempProfiles.length > 0 && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-corporate-muted mb-2">
                  Profile temporare (demo)
                </p>
                <div className="grid gap-2 sm:grid-cols-2 mb-5">
                  {tempProfiles.map((p) =>
                    renderProfileButton(p, {
                      emoji: tempProfileEmoji(p),
                      title: formatUserRoles(p),
                      subtitle: tempProfileSubtitle(p),
                    }),
                  )}
                </div>
              </>
            )}

            {!hasOrgProfiles && tempProfiles.length === 0 && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-medium">Nu apar profile demo în browserul curent.</p>
                <p className="mt-1 text-amber-800">
                  Apăsați butonul de mai jos sau introduceți manual un email din listă.
                </p>
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
                  Restaurează scenariu test (1 angajat + supervizor + mentor)
                </Button>
              </div>
            )}

            <details className="mb-5 text-xs text-corporate-muted">
              <summary className="cursor-pointer font-medium text-corporate-stone hover:text-corporate-dark">
                Lista conturi demo (email + parolă)
              </summary>
              <ul className="mt-2 space-y-1 border-t border-corporate-border pt-2">
                {DEMO_LOGIN_HINTS.map((h) => (
                  <li key={h.email} className="flex flex-wrap gap-x-2 gap-y-0.5">
                    <button
                      type="button"
                      className="text-corporate-gold hover:underline text-left"
                      onClick={() => {
                        setEmail(h.email);
                        setPassword(DEFAULT_PLATFORM_PASSWORD);
                        setError('');
                      }}
                    >
                      {h.email}
                    </button>
                    <span>— {h.rol}</span>
                  </li>
                ))}
                <li className="pt-1">
                  Parolă pentru toate:{' '}
                  <code className="text-corporate-dark">{DEFAULT_PLATFORM_PASSWORD}</code>
                </li>
              </ul>
            </details>

            <form onSubmit={handleLogin} className="space-y-3">
              <Input
                id="email"
                label="Profil (email artGRANIT)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@artgranit.ro"
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
              Parolă demo (toate profilele):{' '}
              <code className="text-corporate-dark">{DEFAULT_PLATFORM_PASSWORD}</code>
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
