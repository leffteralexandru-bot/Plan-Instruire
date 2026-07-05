import { Fragment, useMemo, useState } from 'react';

import { Card } from '@/components/ui/Card';

import { Button } from '@/components/ui/Button';

import { RegisterErrorCaseForm } from '@/components/shared/RegisterErrorCaseForm';

import { HrErrorReTrainingPanel } from '@/components/admin/performance/HrErrorReTrainingPanel';
import { isHistoryOnlyError } from '@/lib/errorReTrainingDisplay';

import { useHrPerformance } from '@/hooks/useHrPerformance';

import { useUsers } from '@/context/UsersContext';

import { ERROR_MOTIV_LABELS } from '@/lib/hrPerformanceStore';

import { userStore } from '@/lib/userStore';

import { formatEvaluationShortDate } from '@/lib/evaluationDisplay';

import {

  ERROR_CASE_HR_STATUS_LABELS,

  normalizeErrorHrStatus,

} from '@/lib/errorCaseWorkflow';

import { Badge } from '@/components/ui/Badge';

function KpiTrendChart({ snapshots }: { snapshots: { luna: string; eroriLuna: number }[] }) {

  const max = Math.max(...snapshots.map((s) => s.eroriLuna), 1);

  return (

    <div className="flex items-end gap-3 h-32 pt-4">

      {snapshots.map((s) => (

        <div key={s.luna} className="flex-1 flex flex-col items-center gap-1">

          <span className="text-xs font-medium text-corporate-dark">{s.eroriLuna}</span>

          <div

            className="w-full max-w-[3rem] rounded-t bg-corporate-gold/80 transition-all"

            style={{ height: `${Math.max(8, (s.eroriLuna / max) * 100)}%` }}

          />

          <span className="text-[10px] text-corporate-muted">{s.luna.slice(5)}</span>

        </div>

      ))}

    </div>

  );

}



function resolveUserName(id: string | undefined, users: { id: string; name: string }[]): string {
  if (!id) return '—';
  return userStore.getUserById(id)?.name ?? users.find((u) => u.id === id)?.name ?? '—';
}



export function ErrorsKpiPanel() {

  const { errorCases, kpiSnapshots, profiles, refresh } = useHrPerformance();

  const { users } = useUsers();

  const [showForm, setShowForm] = useState(false);

  const [success, setSuccess] = useState('');

  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);



  const luna = new Date().toISOString().slice(0, 7);

  const eroriLuna = errorCases.filter((e) => e.data.startsWith(luna)).length;

  const planuriDeschise = errorCases.filter((e) => normalizeErrorHrStatus(e) !== 'aprobat_hr').length;

  const pendingHr = errorCases.filter((e) => normalizeErrorHrStatus(e) === 'trimis_hr').length;



  const trend = useMemo(

    () => kpiSnapshots.slice(-6).map((s) => ({ luna: s.luna, eroriLuna: s.eroriLuna })),

    [kpiSnapshots],

  );



  const history = useMemo(

    () =>
      [...errorCases]
        .filter(isHistoryOnlyError)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 50),

    [errorCases],

  );



  return (

    <div className="space-y-4">

      <HrErrorReTrainingPanel />



      <div className="grid gap-4 sm:grid-cols-3">

        <Card padding="sm">

          <p className="text-xs text-corporate-muted uppercase">Erori luna curentă</p>

          <p className="text-2xl font-bold">{eroriLuna}</p>

        </Card>

        <Card padding="sm">

          <p className="text-xs text-corporate-muted uppercase">În așteptare HR / active</p>

          <p className="text-2xl font-bold text-amber-600">{planuriDeschise}</p>

          {pendingHr > 0 && (

            <p className="text-xs text-amber-700 mt-1">{pendingHr} de confirmat acum</p>

          )}

        </Card>

        <Card padding="sm">

          <p className="text-xs text-corporate-muted uppercase">Total înregistrate</p>

          <p className="text-2xl font-bold">{errorCases.length}</p>

        </Card>

      </div>



      {trend.length > 0 && (

        <Card>

          <h2 className="text-sm font-semibold text-corporate-dark mb-2">Trend erori (lunar)</h2>

          <p className="text-xs text-corporate-muted mb-3">

            Scăderea indică eficiența instruirii și a planurilor de acțiune.

          </p>

          <KpiTrendChart snapshots={trend} />

        </Card>

      )}



      <Card>

        <div className="flex flex-wrap justify-between gap-3 mb-4">

          <div>

            <h2 className="text-lg font-semibold text-corporate-dark">Istoric erori</h2>

            <p className="text-sm text-corporate-muted">

              {errorCases.length === 0

                ? 'Nicio înregistrare arhivată. Erorile active sunt în „Erori + re-instruirea lor” de sus.'

                : `${errorCases.length} înregistrări — apăsați pe un rând pentru detalii.`}

            </p>

          </div>

          <Button type="button" variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>

            {showForm ? 'Închide formular' : '+ Înregistrare eroare'}

          </Button>

        </div>



        {showForm && (

          <div className="mb-6">

            <RegisterErrorCaseForm

              profiles={profiles}

              onSuccess={(msg) => {

                setShowForm(false);

                setSuccess(msg);

                refresh();

              }}

            />

          </div>

        )}



        {history.length === 0 ? (

          <p className="text-sm text-corporate-muted py-6 text-center border border-dashed border-corporate-border rounded-xl">

            Istoricul este gol. După înregistrare, erorile apar aici și în panoul de confirmare de sus.

          </p>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="border-b border-corporate-border text-left text-corporate-muted">

                  <th className="py-2 pr-3">Data</th>

                  <th className="py-2 pr-3">Angajat</th>

                  <th className="py-2 pr-3">Motiv</th>

                  <th className="py-2 pr-3">Mentor</th>

                  <th className="py-2">Status flux HR</th>

                </tr>

              </thead>

              <tbody>

                {history.map((err) => {

                  const hrStatus = normalizeErrorHrStatus(err);

                  const expanded = expandedHistoryId === err.id;

                  const mentorName = resolveUserName(err.reTrainingProposal?.trainerId, users);

                  const badgeVariant =

                    hrStatus === 'aprobat_hr'

                      ? 'success'

                      : hrStatus === 'trimis_hr'

                        ? 'warning'

                        : 'default';



                  return (

                    <Fragment key={err.id}>

                      <tr

                        className="border-b border-corporate-border/60 align-top cursor-pointer hover:bg-corporate-surface/40"

                        onClick={() => setExpandedHistoryId(expanded ? null : err.id)}

                      >

                        <td className="py-2 pr-3 text-corporate-muted">

                          {err.data ? formatEvaluationShortDate(err.data) : '—'}

                        </td>

                        <td className="py-2 pr-3 font-medium">

                          {resolveUserName(err.angajatId, users)}

                        </td>

                        <td className="py-2 pr-3">{ERROR_MOTIV_LABELS[err.motiv]}</td>

                        <td className="py-2 pr-3">{mentorName}</td>

                        <td className="py-2">

                          <Badge variant={badgeVariant}>{ERROR_CASE_HR_STATUS_LABELS[hrStatus]}</Badge>

                        </td>

                      </tr>

                      {expanded && (

                        <tr className="border-b border-corporate-border/60 bg-corporate-surface/30">

                          <td colSpan={5} className="py-3 px-2 text-xs text-corporate-muted space-y-1">

                            <p>

                              <strong className="text-corporate-dark">Înregistrat de:</strong>{' '}

                              {err.raportatDeNume || resolveUserName(err.raportatDe, users)}

                            </p>

                            <p>

                              <strong className="text-corporate-dark">Lecție:</strong>{' '}

                              {err.reTrainingProposal?.topicTitle || '—'}

                            </p>

                            <p>

                              <strong className="text-corporate-dark">Start instruire:</strong>{' '}

                              {err.reTrainingProposal?.plannedStartDate

                                ? formatEvaluationShortDate(err.reTrainingProposal.plannedStartDate)

                                : '—'}

                            </p>

                            {err.descriere ? (

                              <p>

                                <strong className="text-corporate-dark">Descriere:</strong> {err.descriere}

                              </p>

                            ) : null}

                          </td>

                        </tr>

                      )}

                    </Fragment>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </Card>



      {success && <p className="text-sm text-emerald-600">{success}</p>}

    </div>

  );

}


