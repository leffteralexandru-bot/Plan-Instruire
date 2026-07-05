import { useMemo, useState } from 'react';

import { Card } from '@/components/ui/Card';

import { Button } from '@/components/ui/Button';

import { Badge } from '@/components/ui/Badge';

import { RegisterErrorCaseForm } from '@/components/shared/RegisterErrorCaseForm';

import { ErrorCaseCompletionPanel } from '@/components/shared/ErrorCaseCompletionPanel';

import { useAuth } from '@/hooks/useAuth';

import { useHrPerformance } from '@/hooks/useHrPerformance';

import { canManageUsers } from '@/lib/roles';

import { ERROR_MOTIV_LABELS } from '@/lib/hrPerformanceStore';

import { normalizeErrorHrStatus, ERROR_CASE_HR_STATUS_LABELS } from '@/lib/errorCaseWorkflow';

import { getSupervisedEmployeeIds, isSupervisorOf } from '@/lib/supervisor';



const RECENT_ERRORS_LIMIT = 12;



interface SupervisorErrorRegistrationPanelProps {

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

  const [focusErrorId, setFocusErrorId] = useState<string | null>(null);



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

            <strong>1.</strong> Completați toate câmpurile, încărcați nota semnată și apăsați{' '}
            <strong>„Confirmă înregistrarea și trimite la HR”</strong> — o singură etapă.

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

          onSuccess={(msg, createdId) => {

            setSuccess(msg);

            setShowForm(false);

            if (createdId) setFocusErrorId(createdId);

            refresh();

            setTimeout(() => setSuccess(''), 8000);

          }}

        />

      )}



      {success && <p className="text-sm text-emerald-600 mt-3">{success}</p>}

      <div className="mt-5 pt-4 border-t border-corporate-border/60">

        <h4 className="text-sm font-semibold text-corporate-dark mb-1">Înregistrări erori</h4>

        <p className="text-xs text-corporate-muted mb-3">

          Deschideți înregistrările trimise sau respinse de HR.

        </p>



        {recentErrors.length === 0 ? (

          <p className="text-sm text-corporate-muted">Nicio eroare înregistrată încă.</p>

        ) : (

          <ul className="space-y-3">

            {recentErrors.map((err) => (

              <li key={err.id}>

                <div className="flex flex-wrap items-center gap-2 mb-1 px-1">

                  <span className="text-sm font-medium text-corporate-dark">

                    {profileNameById[err.angajatId]} · {ERROR_MOTIV_LABELS[err.motiv]}

                  </span>

                  <Badge variant="default">

                    {ERROR_CASE_HR_STATUS_LABELS[normalizeErrorHrStatus(err)]}

                  </Badge>

                </div>

                <ErrorCaseCompletionPanel

                  errorCase={err}

                  angajatName={profileNameById[err.angajatId] ?? err.angajatId}

                  defaultExpanded={err.id === focusErrorId}

                  onUpdated={refresh}
                  onDeleted={refresh}

                />

              </li>

            ))}

          </ul>

        )}

      </div>

    </>

  );



  if (embedded) return content;



  return <Card>{content}</Card>;

}

