import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useUsers } from '@/context/UsersContext';
import { useAccessControl } from '@/hooks/useAccessControl';
import { buildEmployeeTimeline } from '@/lib/timelineBuilder';
import { buildTraineeHrReport } from '@/lib/hrReport';
import { storage } from '@/store/storage';
import { userStore } from '@/lib/userStore';
import { getDepartmentById, ingineriPath, INGINERI_PLAN_PATH } from '@/data/departments';
import {
  EVALUATION_STATUS_LABELS,
  hrPerformanceStore,
} from '@/lib/hrPerformanceStore';
import { downloadEmployeeDossierPdf } from '@/lib/exportEmployeeDossier';
import { EmployeeTimeline } from '@/components/admin/performance/EmployeeTimeline';
import { EmployeeArchivePanel } from '@/components/training/EmployeeArchivePanel';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { useState } from 'react';

export function AngajatPanelView() {
  const { user, isInTraining, isMentor } = useAuth();
  const { canOpenMentorPanel } = useAccessControl();
  const { users } = useUsers();
  const { profiles, evaluations } = useHrPerformance();
  const [pdfLoading, setPdfLoading] = useState(false);

  if (!user) return null;

  const profile = profiles.find((p) => p.userId === user.id);
  const enrollment = userStore.getActiveEnrollmentForAngajat(user.id);
  const assignedMentor = enrollment ? users.find((u) => u.id === enrollment.mentorId) : undefined;
  const evaluator = profile?.managerId ? users.find((u) => u.id === profile.managerId) : assignedMentor;

  const currentEval = hrPerformanceStore.getCurrentEvaluation(user.id);
  const evalHistory = evaluations.filter((e) => e.angajatId === user.id);
  const timeline = buildEmployeeTimeline(user.id).slice(0, 6);

  const trainee = enrollment
    ? userStore.getTraineeProfiles().find((t) => t.id === user.id)
    : undefined;
  const trainingReport =
    trainee && isInTraining ? buildTraineeHrReport(trainee, storage.getProgress(user.id)) : null;

  const mentorGrantedByHr = isMentor && !user.roles.includes('admin') && !user.roles.includes('hr');

  return (
    <div className="space-y-6">
      {mentorGrantedByHr && (
        <Card className="border-corporate-gold/40 bg-corporate-gold-light/30">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge variant="info" className="mb-2">
                Statut mentor temporar
              </Badge>
              <p className="text-sm text-corporate-stone">
                HR v-a acordat temporar dreptul de a instrui colegi. Accesați{' '}
                <strong>Panoul Mentor</strong> pentru validări și feedback. Statutul poate fi retras
                oricând de Resurse Umane.
              </p>
            </div>
            {canOpenMentorPanel && (
              <Link to={ingineriPath('/mentor')}>
                <Button type="button" variant="primary" size="sm">
                  Panou Mentor →
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-corporate-dark">
              {profile ? `${profile.prenume} ${profile.nume}` : user.name}
            </h2>
            <p className="text-sm text-corporate-gold">{profile?.functie ?? 'Angajat artGRANIT'}</p>
            <p className="text-xs text-corporate-muted mt-2">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2 items-start">
            <Badge variant="success">Angajat</Badge>
            {isMentor && <Badge variant="info">Mentor temporar</Badge>}
            {currentEval && (
              <Badge variant={currentEval.status === 'intarziat' ? 'warning' : 'default'}>
                {EVALUATION_STATUS_LABELS[currentEval.status]}
              </Badge>
            )}
          </div>
        </div>
        {profile && (
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-4 pt-4 border-t border-corporate-border text-sm">
            <div>
              <dt className="text-xs text-corporate-muted">Departament</dt>
              <dd>{getDepartmentById(profile.departamentId)?.label ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-corporate-muted">Data angajării</dt>
              <dd>{profile.dataAngajarii}</dd>
            </div>
            <div>
              <dt className="text-xs text-corporate-muted">Evaluator / manager</dt>
              <dd>{evaluator?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-corporate-muted">Tip</dt>
              <dd>{profile.tipAngajat === 'incepator' ? 'Începător (instruire)' : 'Angajat'}</dd>
            </div>
          </dl>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {isInTraining && trainingReport && (
          <Card>
            <h3 className="text-sm font-semibold text-corporate-dark mb-2">Plan de instruire</h3>
            <p className="text-3xl font-bold text-corporate-dark mb-1">{trainingReport.progressPercent}%</p>
            <p className="text-sm text-corporate-muted mb-3">
              {getDepartmentById(enrollment!.departmentId)?.label} · Mentor: {assignedMentor?.name ?? '—'}
            </p>
            <div className="h-2 rounded-full bg-corporate-surface overflow-hidden mb-4">
              <div
                className="h-full bg-corporate-gold transition-all"
                style={{ width: `${trainingReport.progressPercent}%` }}
              />
            </div>
            <Link to={INGINERI_PLAN_PATH}>
              <Button type="button" variant="secondary" size="sm">
                Continuă planul →
              </Button>
            </Link>
          </Card>
        )}

        <Card className={!isInTraining ? 'lg:col-span-2' : ''}>
          <h3 className="text-sm font-semibold text-corporate-dark mb-2">Evaluare performanță (tri-lunar)</h3>
          {currentEval ? (
            <>
              <p className="text-sm text-corporate-muted mb-1">
                Status: <strong>{EVALUATION_STATUS_LABELS[currentEval.status]}</strong>
              </p>
              {currentEval.status !== 'evaluat' && (
                <p className="text-sm text-amber-800 mb-2">
                  Termen reevaluare: <strong>{currentEval.termenReevaluare}</strong>
                </p>
              )}
              {currentEval.concluzii && (
                <p className="text-sm text-corporate-stone bg-corporate-surface rounded-lg p-3 mb-3">
                  {currentEval.concluzii}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-corporate-muted mb-3">Niciun ciclu de evaluare activ.</p>
          )}
          {evalHistory.length > 0 && (
            <p className="text-xs text-corporate-muted">{evalHistory.length} evaluări în istoric</p>
          )}
          <Link to={ingineriPath('/evaluari')} className="inline-block mt-3">
            <Button type="button" variant="ghost" size="sm">
              Evaluări & rapoarte →
            </Button>
          </Link>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-corporate-dark">Activitate recentă</h3>
          <Link to={ingineriPath(`/angajat/${user.id}`)} className="text-xs text-corporate-gold hover:underline">
            Dosar complet →
          </Link>
        </div>
        {timeline.length > 0 ? (
          <EmployeeTimeline events={timeline} />
        ) : (
          <p className="text-sm text-corporate-muted">Nicio activitate înregistrată încă.</p>
        )}
      </Card>

      <EmployeeArchivePanel angajatId={user.id} showPlanLink={!!trainingSystemStore.getPlanArchive(user.id)} />

      <div className="flex flex-wrap gap-2">
        <Link to={ingineriPath(`/angajat/${user.id}`)}>
          <Button type="button" variant="secondary" size="sm">
            Dosar personal 360°
          </Button>
        </Link>
        <Link to={ingineriPath('/competente')}>
          <Button type="button" variant="ghost" size="sm">
            Matrice competențe
          </Button>
        </Link>
        {profile && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pdfLoading}
            onClick={async () => {
              setPdfLoading(true);
              try {
                await downloadEmployeeDossierPdf(profile);
              } finally {
                setPdfLoading(false);
              }
            }}
          >
            {pdfLoading ? 'PDF…' : 'Export PDF dosar'}
          </Button>
        )}
      </div>
    </div>
  );
}
