import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RegisterErrorCaseForm } from '@/components/shared/RegisterErrorCaseForm';
import { useAuth } from '@/hooks/useAuth';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { canManageUsers } from '@/lib/roles';
import { ERROR_MOTIV_LABELS } from '@/lib/hrPerformanceStore';
import { getSupervisedEmployeeIds, isSupervisorOf } from '@/lib/supervisor';
import type { ErrorActionPlan } from '@/types';

const PLAN_STATUS_LABELS: Record<ErrorActionPlan['status'], string> = {
  deschis: 'Deschis',
  in_lucru: 'În lucru',
  inchis: 'Închis',
};

const PLAN_STATUS_VARIANT: Record<
  ErrorActionPlan['status'],
  'warning' | 'default' | 'success'
> = {
  deschis: 'warning',
  in_lucru: 'default',
  inchis: 'success',
};

const RECENT_ERRORS_LIMIT = 12;

interface SupervisorErrorRegistrationPanelProps {
  /** HR în panoul admin poate înregistra pentru orice angajat */
  allowAllEmployees?: boolean;
  embedded?: boolean;
}

export function SupervisorErrorRegistrationPanel({
  allowAllEmployees = false,
  embedded,
}: SupervisorErrorRegistrationPanelProps) {
  const { user } = useAuth();
  const { profiles, errorCases, refresh } = useHrPerformance();
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState('');

  const isHr = !!user && canManageUsers(user);

  const allowedProfiles = useMemo(() => {
    if (!user) return [];
    if (allowAllEmployees && isHr) return profiles;
    return profiles.filter((p) => isSupervisorOf(user.id, p.userId));
  }, [user, profiles, allowAllEmployees, isHr]);

  const allowedIds = useMemo(
    () => new Set(allowedProfiles.map((p) => p.userId)),
    [allowedProfiles],
  );

  const profileNameById = useMemo(
    () =>
      Object.fromEntries(
        allowedProfiles.map((p) => [p.userId, `${p.prenume} ${p.nume}`]),
      ),
    [allowedProfiles],
  );

  const recentErrors = useMemo(
    () =>
      errorCases
        .filter((e) => allowedIds.has(e.angajatId))
        .sort((a, b) => b.data.localeCompare(a.data) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, RECENT_ERRORS_LIMIT),
    [errorCases, allowedIds],
  );

  const supervisedCount = user ? getSupervisedEmployeeIds(user.id).length : 0;

  if (!user) return null;
  if (!isHr && supervisedCount === 0) return null;

  const content = (
    <>
      <div className="flex flex-wrap justify-between gap-3 mb-3">
        <div>
          <h3 className={embedded ? 'text-base font-semibold text-corporate-dark' : 'text-lg font-semibold text-corporate-dark'}>
            Înregistrare eroare — subordonați
          </h3>
          <p className="text-sm text-corporate-muted mt-1">
            Documentați greșelile angajaților pe care îi supervizați. La a 2-a eroare de același tip în
            90 zile se declanșează automat fluxul de re-instruire.
          </p>
        </div>
        <Button type="button" variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Închide formular' : '+ Înregistrare eroare'}
        </Button>
      </div>

      {showForm && (
        <RegisterErrorCaseForm
          profiles={allowedProfiles}
          compact
          onSuccess={(msg) => {
            setSuccess(msg);
            setShowForm(false);
            refresh();
            setTimeout(() => setSuccess(''), 5000);
          }}
        />
      )}

      {success && <p className="text-sm text-emerald-600 mt-3">{success}</p>}

      <div className="mt-5 pt-4 border-t border-corporate-border/60">
        <h4 className="text-sm font-semibold text-corporate-dark mb-1">
          Erori recente — subordonați
        </h4>
        <p className="text-xs text-corporate-muted mb-3">
          Ultimele {RECENT_ERRORS_LIMIT} înregistrări pentru angajații pe care îi supervizați.
        </p>

        {recentErrors.length === 0 ? (
          <p className="text-sm text-corporate-muted">Nicio eroare înregistrată încă.</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-corporate-border text-left text-corporate-muted text-xs">
                  <th className="py-2 pr-3 font-medium">Data</th>
                  <th className="py-2 pr-3 font-medium">Angajat</th>
                  <th className="py-2 pr-3 font-medium">Motiv</th>
                  <th className="py-2 pr-3 font-medium">Proiect</th>
                  <th className="py-2 pr-3 font-medium">Plan acțiune</th>
                  <th className="py-2 font-medium">Raportat de</th>
                </tr>
              </thead>
              <tbody>
                {recentErrors.map((err) => (
                  <tr key={err.id} className="border-b border-corporate-border/60 align-top">
                    <td className="py-2 pr-3 text-corporate-muted whitespace-nowrap">{err.data}</td>
                    <td className="py-2 pr-3 font-medium">
                      {profileNameById[err.angajatId] ?? err.angajatId}
                    </td>
                    <td className="py-2 pr-3">{ERROR_MOTIV_LABELS[err.motiv]}</td>
                    <td className="py-2 pr-3 text-corporate-muted">{err.proiectNume ?? '—'}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={PLAN_STATUS_VARIANT[err.planActiune.status]}>
                        {PLAN_STATUS_LABELS[err.planActiune.status]}
                      </Badge>
                      <p className="text-xs text-corporate-muted mt-1 line-clamp-2 max-w-[220px]">
                        {err.planActiune.pasi}
                      </p>
                    </td>
                    <td className="py-2 text-corporate-muted text-xs">{err.raportatDeNume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  if (embedded) return content;

  return <Card>{content}</Card>;
}
