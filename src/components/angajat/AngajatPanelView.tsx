import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import { useAuth } from '@/hooks/useAuth';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useUsers } from '@/context/UsersContext';
import { useAccessControl } from '@/hooks/useAccessControl';
import { buildEmployeeTimeline } from '@/lib/timelineBuilder';
import { getAngajatTrainingReport, isTrainingPlanComplete } from '@/lib/hrReport';
import { userStore } from '@/lib/userStore';
import { getDepartmentById, ingineriPath, INGINERI_PLAN_PATH } from '@/data/departments';
import { EVALUATION_STATUS_LABELS } from '@/lib/hrPerformanceStore';
import { getEvaluationWorkflowLabel } from '@/lib/evaluationStages';
import { getRoleDashboardMetrics } from '@/lib/roleDashboard';
import { normalizeReTrainingStatus, RE_TRAINING_STATUS_LABELS } from '@/lib/reTrainingWorkflow';
import { downloadEmployeeDossierPdf } from '@/lib/exportEmployeeDossier';
import { ActionInboxPanel } from '@/components/shared/ActionInboxPanel';
import { RoleSummaryCards } from '@/components/shared/RoleSummaryCards';
import { EmployeeTimeline } from '@/components/admin/performance/EmployeeTimeline';
import { EvaluationStagesFlow } from '@/components/evaluation/EvaluationStagesFlow';
import { TestingHighlightZone } from '@/components/shared/TestingHighlightZone';
import { EmployeeArchivePanel } from '@/components/training/EmployeeArchivePanel';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { useStagiarSelection } from '@/context/StagiarContext';

export function AngajatPanelView() {
  const { user, isMentor } = useAuth();
  const navigate = useNavigate();
  const { setSelectedStagiarId } = useStagiarSelection();
  const { canOpenMentorPanel } = useAccessControl();
  const { users } = useUsers();
  const { profiles, evaluations, downloadDocument, refresh } = useHrPerformance();
  const [pdfLoading, setPdfLoading] = useState(false);

  const activeRetraining = useMemo(
    () =>
      user
        ? trainingSystemStore
            .getReTrainingSessions({ angajatId: user.id })
            .find((s) => normalizeReTrainingStatus(s.status) !== 'finalizat')
        : undefined,
    [user?.id, refresh],
  );

  const employeeMetrics = useMemo(
    () => (user ? getRoleDashboardMetrics(user.id, 'employee') : null),
    [user?.id],
  );

  const currentEval = useMemo(() => {
    if (!user) return undefined;
    const mine = evaluations.filter((e) => e.angajatId === user.id);
    return (
      mine.find((c) => c.status === 'in_curs' || c.status === 'intarziat') ??
      mine.find((c) => c.status === 'planificat') ??
      [...mine].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    );
  }, [evaluations, user?.id]);

  if (!user) return null;

  const profile = profiles.find((p) => p.userId === user.id);
  const enrollment =
    userStore.getActiveEnrollmentForAngajat(user.id) ??
    userStore.getEnrollments().find((e) => e.angajatId === user.id);
  const assignedMentor = enrollment ? users.find((u) => u.id === enrollment.mentorId) : undefined;
  const evaluator = profile?.managerId ? users.find((u) => u.id === profile.managerId) : assignedMentor;

  const evalHistory = evaluations.filter((e) => e.angajatId === user.id);
  const timeline = buildEmployeeTimeline(user.id);

  const trainingReport = getAngajatTrainingReport(user.id);
  const trainingFinished = trainingReport ? isTrainingPlanComplete(trainingReport) : false;
  const today = new Date().toISOString().slice(0, 10);
  const evalActionable =
    currentEval &&
    (currentEval.status === 'in_curs' ||
      currentEval.status === 'intarziat' ||
      (currentEval.status === 'planificat' && currentEval.termenReevaluare <= today));

  const openOwnTrainingPlan = () => {
    if (user) setSelectedStagiarId(user.id);
    navigate(INGINERI_PLAN_PATH);
  };

  const mentorGrantedByHr = isMentor && !user.roles.includes('admin') && !user.roles.includes('hr');

  return (
    <div className="space-y-6">
      <ActionInboxPanel userId={user.id} roles={['employee']} maxItems={5} />

      {employeeMetrics && <RoleSummaryCards role="employee" metrics={employeeMetrics} />}

      {mentorGrantedByHr && (
        <ProfessionalPanel
          variant="mentor"
          icon="mentor"
          eyebrow="Rol extins"
          title="Statut mentor temporar"
          subtitle="Acordat de HR — validări și feedback pentru colegi în instruire"
          headerAction={
            canOpenMentorPanel ? (
              <Link to={ingineriPath('/mentor')}>
                <Button type="button" variant="primary" size="sm">
                  Panou Mentor →
                </Button>
              </Link>
            ) : undefined
          }
        >
          <p className="text-sm text-corporate-stone">
            Accesați Panoul Mentor pentru validări zile cheie și feedback. Statutul poate fi retras
            oricând de Resurse Umane.
          </p>
        </ProfessionalPanel>
      )}

      <ProfessionalPanel
        variant="profile"
        icon="profile"
        eyebrow="Profil angajat"
        title={profile ? `${profile.prenume} ${profile.nume}` : user.name}
        subtitle={profile?.functie ?? 'Angajat artGRANIT'}
        badge={
          <>
            <Badge variant="success">Angajat</Badge>
            {isMentor && <Badge variant="info">Mentor temporar</Badge>}
            {currentEval && (
              <Badge variant={currentEval.status === 'intarziat' ? 'warning' : 'default'}>
                {EVALUATION_STATUS_LABELS[currentEval.status]}
              </Badge>
            )}
          </>
        }
      >
        <p className="text-xs text-corporate-muted -mt-2 mb-1">{user.email}</p>
        {profile && (
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-3 border-t border-corporate-border/60 text-sm">
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
      </ProfessionalPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        {trainingReport && (
          <ProfessionalPanel
            variant={trainingFinished ? 'training-success' : 'training'}
            icon={trainingFinished ? 'certificate' : 'training'}
            eyebrow="Instruire inițială · 4 săptămâni"
            title="Plan de instruire la angajare"
            subtitle={
              enrollment
                ? `${getDepartmentById(enrollment.departmentId)?.label ?? '—'} · Mentor: ${assignedMentor?.name ?? '—'}`
                : `${trainingReport.completedDays}/${trainingReport.totalDays} zile`
            }
            headerAction={
              trainingFinished ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                  onClick={openOwnTrainingPlan}
                >
                  Instruire de succes ✓
                </Button>
              ) : (
                <Button type="button" variant="secondary" size="sm" onClick={openOwnTrainingPlan}>
                  Continuă planul →
                </Button>
              )
            }
          >
            {trainingFinished ? (
              <>
                <p className="text-3xl font-bold text-emerald-800">100%</p>
                <p className="text-xs text-emerald-800">
                  {trainingReport.certificateIssued
                    ? 'Certificat emis — urmează evaluarea tri-lunară.'
                    : 'Toate zilele sunt finalizate — așteptați certificatul de la mentor.'}
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-corporate-dark">{trainingReport.progressPercent}%</p>
                <div className="h-2 rounded-full bg-corporate-surface overflow-hidden">
                  <div
                    className="h-full bg-corporate-gold transition-all"
                    style={{ width: `${trainingReport.progressPercent}%` }}
                  />
                </div>
              </>
            )}
          </ProfessionalPanel>
        )}

        <ProfessionalPanel
          variant="evaluation"
          icon="evaluation"
          eyebrow="Performanță HR · după instruire"
          title="Evaluare tri-lunară"
          subtitle="Cicluri de 90 zile — auto-evaluare, supervizor, validare HR"
          className={!trainingReport ? 'lg:col-span-2' : ''}
          headerAction={
            <Link to={ingineriPath('/evaluari')}>
              <Button type="button" variant="ghost" size="sm">
                Evaluări →
              </Button>
            </Link>
          }
        >
          {!trainingFinished ? (
            <p className="text-sm text-corporate-muted">
              Se programează automat la <strong>90 zile</strong> după finalizarea instruirii inițiale
              (certificat emis). Până atunci, concentrați-vă pe planul de 4 săptămâni.
            </p>
          ) : currentEval ? (
            <>
              <p className="text-sm text-corporate-muted">
                Status: <strong>{EVALUATION_STATUS_LABELS[currentEval.status]}</strong>
              </p>
              <p className="text-xs text-corporate-muted">
                Etapa: <strong>{getEvaluationWorkflowLabel(currentEval)}</strong>
              </p>
              {currentEval.status === 'planificat' && currentEval.termenReevaluare > today && (
                <p className="text-sm text-indigo-900 bg-indigo-50/80 rounded-lg p-3 border border-indigo-100">
                  Prima evaluare tri-lunară programată pentru:{' '}
                  <strong>{currentEval.termenReevaluare}</strong>
                  {' '}(90 zile de la finalizarea instruirii).
                </p>
              )}
              {currentEval.status !== 'evaluat' && currentEval.termenReevaluare <= today && (
                <p className="text-sm text-amber-800">
                  Termen reevaluare: <strong>{currentEval.termenReevaluare}</strong>
                </p>
              )}
              {currentEval.concluzii && (
                <p className="text-sm text-corporate-stone bg-white/70 rounded-lg p-3 border border-indigo-100">
                  {currentEval.concluzii}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-corporate-muted">
              Instruire finalizată — evaluarea tri-lunară se programează la emiterea certificatului de
              către mentor.
            </p>
          )}
          {evalHistory.length > 0 && (
            <p className="text-xs text-corporate-muted">{evalHistory.length} evaluări în istoric</p>
          )}
        </ProfessionalPanel>
      </div>

      {activeRetraining && (
        <ProfessionalPanel
          variant="retraining"
          icon="retraining"
          eyebrow="Remediere competențe"
          title="Re-instruire în curs"
          subtitle={activeRetraining.topicTitle ?? undefined}
        >
          <p className="text-sm text-corporate-stone">{activeRetraining.titlu}</p>
          <p className="text-xs text-corporate-muted mt-1">
            Status: {RE_TRAINING_STATUS_LABELS[normalizeReTrainingStatus(activeRetraining.status)]}
          </p>
        </ProfessionalPanel>
      )}

      {trainingFinished && evalActionable && (
        <TestingHighlightZone zoneId="zone-angajat-eval">
        <EvaluationStagesFlow
          key={`${currentEval.id}-${currentEval.updatedAt}`}
          cycle={currentEval}
          mode="employee"
          actorId={user.id}
          actorName={user.name}
          onDownloadDocument={(id) => void downloadDocument(id)}
          onUpdated={refresh}
        />
        </TestingHighlightZone>
      )}

      <ProfessionalPanel
        variant="activity"
        icon="activity"
        eyebrow="Dosar 360°"
        title="Activitate recentă"
        subtitle="Evenimente instruire, evaluări și documente"
        headerAction={
          <Link to={ingineriPath(`/angajat/${user.id}`)} className="text-xs text-corporate-gold hover:underline">
            Dosar complet →
          </Link>
        }
      >
        {timeline.length > 0 ? (
          <EmployeeTimeline events={timeline} showFilters={false} maxItems={6} />
        ) : (
          <p className="text-sm text-corporate-muted">Nicio activitate înregistrată încă.</p>
        )}
      </ProfessionalPanel>

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
