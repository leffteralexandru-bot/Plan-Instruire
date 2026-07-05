import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ADMIN_TABS, type AdminTab } from '@/components/admin/performance/AdminTabNav';
import { DepartmentGlyph } from '@/components/departments/DepartmentGlyph';
import { ActionInboxPanel } from '@/components/shared/ActionInboxPanel';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useUsers } from '@/context/UsersContext';
import { useAuth } from '@/hooks/useAuth';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { adminPath } from '@/lib/adminRoutes';
import {
  DEPARTMENTS,
  INGINERI_PLAN_PATH,
  type Department,
  type DepartmentId,
} from '@/data/departments';
import { computeManagementDashboardMetrics } from '@/lib/managementDashboard';
import { computeOrganizationalHealth } from '@/lib/exportManagementDashboardPdf';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { storage } from '@/store/storage';

const MODULE_ICONS: Record<AdminTab | 'plan', string> = {
  management: 'M',
  angajati: 'A',
  responsabilitati: 'R',
  evaluari: 'E',
  supervizor: 'S',
  erori: '!',
  instruire: 'I',
  setari: 'C',
  plan: 'P',
};

const HEALTH_SCORE_ACCENT = {
  ok: 'border-emerald-500/40',
  warn: 'border-amber-500/40',
  alert: 'border-red-500/40',
  neutral: 'border-white/20',
} as const;

const HEALTH_SCORE_VALUE = {
  ok: 'text-emerald-400',
  warn: 'text-amber-400',
  alert: 'text-red-400',
  neutral: 'text-white',
} as const;

function countByDepartment(deptId: DepartmentId): number {
  return hrPerformanceStore.getProfiles().filter((p) => p.departamentId === deptId).length;
}

function HrModuleTile({
  label,
  description,
  to,
  iconKey,
  badge,
  disabled,
}: {
  label: string;
  description: string;
  to?: string;
  iconKey: AdminTab | 'plan';
  badge?: number;
  disabled?: boolean;
}) {
  const inner = (
    <>
      <span
        className={[
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-bold tracking-tight',
          disabled
            ? 'border-white/10 bg-white/[0.03] text-white/30'
            : 'border-corporate-gold/40 bg-corporate-gold/10 text-corporate-gold',
        ].join(' ')}
        aria-hidden
      >
        {MODULE_ICONS[iconKey]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={['text-sm font-semibold truncate', disabled ? 'text-white/40' : 'text-white'].join(' ')}>
            {label}
          </p>
          {badge != null && badge > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>
          )}
        </div>
        <p className={['text-[11px] leading-snug mt-0.5 line-clamp-2', disabled ? 'text-white/25' : 'text-white/50'].join(' ')}>
          {description}
        </p>
      </div>
      {!disabled && (
        <span className="text-corporate-gold/70 text-xs shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden>
          →
        </span>
      )}
    </>
  );

  const className = [
    'group flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200',
    disabled
      ? 'border-white/[0.06] bg-white/[0.02] cursor-not-allowed'
      : 'border-white/10 bg-white/[0.04] hover:border-corporate-gold/50 hover:bg-corporate-gold/[0.06] no-underline',
  ].join(' ');

  if (disabled || !to) {
    return (
      <div className={className} aria-disabled>
        {inner}
      </div>
    );
  }

  return (
    <Link to={to} className={className}>
      {inner}
    </Link>
  );
}

function DepartmentHrSection({
  department,
  employeeCount,
  pendingHrErrors,
}: {
  department: Department;
  employeeCount: number;
  pendingHrErrors: number;
}) {
  const comingSoonPath = `${department.route}/in-curand`;
  const active = department.planAvailable;

  return (
    <section
      className={[
        'rounded-2xl border overflow-hidden artgranit-dark-card',
        active ? 'border-corporate-gold/35' : 'border-white/10',
      ].join(' ')}
      aria-labelledby={`dept-hr-${department.id}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={[
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border',
              active ? 'border-corporate-gold/50 bg-corporate-gold/10 text-corporate-gold' : 'border-white/15 text-white/40',
            ].join(' ')}
          >
            <DepartmentGlyph id={department.id} className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h3 id={`dept-hr-${department.id}`} className="text-base font-semibold text-white truncate">
              {department.label}
            </h3>
            <p className="text-xs text-white/50 truncate">{department.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={active ? 'success' : 'default'} className={active ? '' : 'opacity-60'}>
            {active ? 'HR activ' : 'În pregătire'}
          </Badge>
          <span className="text-xs text-white/45 tabular-nums">
            {employeeCount} {employeeCount === 1 ? 'profil' : 'profile'}
          </span>
        </div>
      </header>

      <div className="p-4 sm:p-5">
        {active ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ADMIN_TABS.map((tab) => (
              <HrModuleTile
                key={tab.id}
                iconKey={tab.id}
                label={tab.label}
                description={tab.description}
                to={adminPath(tab.id)}
                badge={tab.id === 'erori' ? pendingHrErrors : undefined}
              />
            ))}
            <HrModuleTile
              iconKey="plan"
              label="Plan instruire"
              description="Program 20 zile — vizualizare & progres"
              to={INGINERI_PLAN_PATH}
            />
          </div>
        ) : (
          <>
            <p className="text-sm text-white/45 mb-4">{department.description}</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 opacity-70">
              {ADMIN_TABS.map((tab) => (
                <HrModuleTile
                  key={tab.id}
                  iconKey={tab.id}
                  label={tab.label}
                  description={tab.description}
                  disabled
                />
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <Link
                to={comingSoonPath}
                className="text-sm text-corporate-gold hover:underline font-medium"
              >
                Vezi detalii departament →
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function OrgKpi({ label, value, sub, alert }: { label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-white/45">{label}</p>
      <p className={`text-xl font-bold mt-0.5 tabular-nums ${alert ? 'text-amber-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-[11px] text-white/40 mt-0.5">{sub}</p>}
    </div>
  );
}

export function AdministratorCommandCenter() {
  const { user } = useAuth();
  const { allTrainees } = useUsers();
  const { errorCases } = useHrPerformance();
  const settings = storage.getSettings();

  const metrics = useMemo(
    () => computeManagementDashboardMetrics(allTrainees, settings.programVersion),
    [allTrainees, settings.programVersion],
  );

  const health = useMemo(() => computeOrganizationalHealth(metrics), [metrics]);

  const pendingHrErrors = useMemo(
    () => trainingSystemStore.getErrorsPendingHrReview().length,
    [errorCases],
  );

  const deptCounts = useMemo(
    () => Object.fromEntries(DEPARTMENTS.map((d) => [d.id, countByDepartment(d.id)])) as Record<DepartmentId, number>,
    [errorCases],
  );

  return (
    <div className="space-y-6">
      <div className="artgranit-dark-card p-6 sm:p-8">
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-[10px] uppercase tracking-[0.2em] text-corporate-gold font-medium mb-2">
              artGRANIT · Administrator
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Centru de comandă HR
            </h2>
            <p className="text-sm text-white/60 mt-2 leading-relaxed">
              Vizibilitate unificată pe toate departamentele — module HR, indicatori organizaționali și acțiuni prioritare într-un singur loc.
            </p>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
            <div
              className={[
                'rounded-2xl border bg-black/25 px-6 py-4 text-center min-w-[120px]',
                HEALTH_SCORE_ACCENT[health.accent],
              ].join(' ')}
            >
              <p className="text-[10px] uppercase tracking-wider text-white/50">Sănătate org.</p>
              <p className={['text-4xl font-bold tabular-nums', HEALTH_SCORE_VALUE[health.accent]].join(' ')}>
                {health.score}
              </p>
              <p className="text-[10px] text-white/40">/ 100</p>
            </div>
            <p className="text-xs text-white/55 text-center sm:text-right max-w-[200px] leading-snug">{health.label}</p>
          </div>
        </div>

        <div className="relative grid gap-2 grid-cols-2 lg:grid-cols-4 mt-6 pt-6 border-t border-white/10">
          <OrgKpi label="Angajați activi" value={String(metrics.totalAngajati)} />
          <OrgKpi
            label="Progres instruire"
            value={`${metrics.progresInstruireMediu}%`}
            sub={`${metrics.angajatiInInstruire} în program`}
          />
          <OrgKpi
            label="Evaluări la timp"
            value={`${metrics.rataEvaluariLaTimp}%`}
            sub={`${metrics.evaluariIntarziate} întârziate`}
            alert={metrics.evaluariIntarziate > 0}
          />
          <OrgKpi
            label="Erori luna curentă"
            value={String(metrics.eroriLunaCurenta)}
            alert={metrics.eroriLunaCurenta > 0}
          />
        </div>
      </div>

      {user && (
        <ActionInboxPanel userId={user.id} roles={['hr']} maxItems={6} collapsible defaultExpanded />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-corporate-dark">Panouri HR pe departamente</h3>
          <p className="text-sm text-corporate-muted mt-0.5">
            Acces rapid la modulele HR — departamentul Ingineri este activ; celelalte se extind progresiv.
          </p>
        </div>
        <Link
          to={adminPath('management')}
          className="inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 px-3 py-1.5 text-sm bg-corporate-gold text-corporate-black hover:bg-corporate-gold-hover shadow-gold no-underline"
        >
          Panou HR complet →
        </Link>
      </div>

      <div className="space-y-5">
        {DEPARTMENTS.map((dept) => (
          <DepartmentHrSection
            key={dept.id}
            department={dept}
            employeeCount={deptCounts[dept.id]}
            pendingHrErrors={dept.id === 'ingineri' ? pendingHrErrors : 0}
          />
        ))}
      </div>

      <Card padding="sm" className="border-corporate-gold/20 bg-corporate-gold/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-corporate-dark">Management executiv</p>
            <p className="text-xs text-corporate-muted mt-1">
              KPI detaliat, trend 12 luni, gap-uri dezvoltare și export PDF — în tab-ul Management.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={adminPath('management')}
              className="inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 px-3 py-1.5 text-sm bg-corporate-gold text-corporate-black hover:bg-corporate-gold-hover shadow-gold no-underline"
            >
              Dashboard Management
            </Link>
            <Link
              to={adminPath('setari')}
              className="inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 px-3 py-1.5 text-sm bg-corporate-black text-white hover:bg-corporate-darker shadow-sm no-underline"
            >
              Setări organizație
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
