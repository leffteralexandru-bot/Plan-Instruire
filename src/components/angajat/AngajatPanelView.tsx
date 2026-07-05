import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import { useAuth } from '@/hooks/useAuth';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useUsers } from '@/context/UsersContext';
import { useAccessControl } from '@/hooks/useAccessControl';
import { buildEmployeeTimeline } from '@/lib/timelineBuilder';
import { getAngajatTrainingReport, isTrainingPlanComplete } from '@/lib/hrReport';
import { userStore } from '@/lib/userStore';
import { getDepartmentById, ingineriPath, INGINERI_PLAN_PATH, traineePlanPath } from '@/data/departments';
import { getRoleDashboardMetrics } from '@/lib/roleDashboard';
import { sortReTrainingSessionsNewestFirst } from '@/lib/errorReTrainingDisplay';
import { isReTrainingVisibleToTrainee, normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';
import { downloadEmployeeDossierPdf } from '@/lib/exportEmployeeDossier';
import { ActionInboxPanel } from '@/components/shared/ActionInboxPanel';
import { RoleSummaryCards } from '@/components/shared/RoleSummaryCards';
import { EmployeeTimeline } from '@/components/admin/performance/EmployeeTimeline';
import { EmployeeArchivePanel } from '@/components/training/EmployeeArchivePanel';
import { EmployeeProfileCard } from '@/components/angajat/EmployeeProfileCard';
import { EmployeeParcursModulesRow } from '@/components/angajat/EmployeeParcursModulesRow';
import { EmployeeReferenceModulesRow } from '@/components/angajat/EmployeeReferenceModulesRow';
import { DESIGNER_COMPETENCY_LEVEL_PROFILES } from '@/data/designerCompetencyMatrix';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { useStagiarSelection } from '@/context/StagiarContext';
import { storage } from '@/store/storage';
import { useActionFocusEffect, useActionFocusParams } from '@/hooks/useActionFocus';
import { evaluationsLink } from '@/lib/actionFocus';

export function AngajatPanelView({ viewAsId }: { viewAsId?: string } = {}) {
  const { user, isMentor } = useAuth();
  const navigate = useNavigate();
  const { setSelectedStagiarId } = useStagiarSelection();
  const { canOpenMentorPanel, canExportDossier } = useAccessControl();
  const { users } = useUsers();
  const { profiles, evaluations, refresh, updateProfile } = useHrPerformance();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [dossier360Expanded, setDossier360Expanded] = useState(false);

  const subjectId = viewAsId && user && viewAsId !== user.id ? viewAsId : user?.id;
  const isPreview = !!viewAsId && !!user && viewAsId !== user.id;

  const retrainingSessions = useMemo(
    () =>
      subjectId
        ? sortReTrainingSessionsNewestFirst(
            trainingSystemStore.getReTrainingSessions({ angajatId: subjectId }),
          )
        : [],
    [subjectId, refresh],
  );

  const activeRetrainings = useMemo(
    () => retrainingSessions.filter((s) => isReTrainingVisibleToTrainee(s)),
    [retrainingSessions],
  );

  const completedRetrainings = useMemo(
    () => retrainingSessions.filter((s) => normalizeReTrainingStatus(s.status) === 'finalizat'),
    [retrainingSessions],
  );

  const employeeMetrics = useMemo(
    () => (subjectId ? getRoleDashboardMetrics(subjectId, 'employee') : null),
    [subjectId],
  );

  const [parcursExpand, setParcursExpand] = useState<'training' | 'retraining' | 'evaluation' | null>(
    null,
  );
  const { section } = useActionFocusParams();

  const currentEval = useMemo(() => {
    if (!subjectId) return undefined;
    const mine = evaluations.filter((e) => e.angajatId === subjectId);
    return (
      mine.find((c) => c.status === 'in_curs' || c.status === 'intarziat') ??
      mine.find((c) => c.status === 'planificat') ??
      [...mine].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    );
  }, [evaluations, subjectId]);

  useActionFocusEffect(
    {
      'self-assessment': () => {
        navigate(
          currentEval?.id
            ? evaluationsLink({ angajatId: subjectId!, evalId: currentEval.id })
            : ingineriPath('/evaluari'),
        );
      },
      parcurs: () => {
        if (section === 'training' || section === 'retraining' || section === 'evaluation') {
          setParcursExpand(section);
        }
      },
    },
    [currentEval?.id, subjectId, section],
  );

  const trainingReport = subjectId ? getAngajatTrainingReport(subjectId) : undefined;
  const trainingFinished = trainingReport ? isTrainingPlanComplete(trainingReport) : false;
  const certificate = subjectId ? storage.getProgress(subjectId).certificate : undefined;

  const lastCompletedEvalCycle = useMemo(() => {
    if (!subjectId) return undefined;
    return evaluations
      .filter((e) => e.angajatId === subjectId && e.status === 'evaluat' && e.competencyResult)
      .sort((a, b) =>
        (a.dataEvaluare ?? a.updatedAt).localeCompare(b.dataEvaluare ?? b.updatedAt),
      )
      .at(-1);
  }, [evaluations, subjectId]);

  if (!user || !subjectId) return null;

  const subjectUser = users.find((u) => u.id === subjectId);
  const profile = profiles.find((p) => p.userId === subjectId);
  const enrollment =
    userStore.getActiveEnrollmentForAngajat(subjectId) ??
    userStore.getEnrollments().find((e) => e.angajatId === subjectId);
  const assignedMentor = enrollment ? users.find((u) => u.id === enrollment.mentorId) : undefined;
  const departmentLabel = enrollment
    ? getDepartmentById(enrollment.departmentId)?.label
    : undefined;
  const supervisorId = profile?.supervisorId ?? profile?.managerId;
  const supervisor = supervisorId ? users.find((u) => u.id === supervisorId) : undefined;

  const timeline = buildEmployeeTimeline(subjectId);

  const today = new Date().toISOString().slice(0, 10);
  const evalInProgress =
    currentEval?.status === 'in_curs' || currentEval?.status === 'intarziat';

  const evalActionable =
    currentEval &&
    (currentEval.status === 'in_curs' ||
      currentEval.status === 'intarziat' ||
      (currentEval.status === 'planificat' && currentEval.termenReevaluare <= today));

  const openOwnTrainingPlan = () => {
    setSelectedStagiarId(subjectId);
    navigate(isPreview ? traineePlanPath(subjectId) : INGINERI_PLAN_PATH);
  };

  const openActiveRetrainingInPlan = (sessionId: string) => {
    setSelectedStagiarId(subjectId);
    const base = isPreview ? traineePlanPath(subjectId) : INGINERI_PLAN_PATH;
    navigate(`${base}?retrain=${sessionId}`);
  };

  const openActiveEvaluation = () => {
    navigate(isPreview ? ingineriPath(`/evaluari?viewAs=${subjectId}`) : ingineriPath('/evaluari'));
  };

  const completedEvaluations = useMemo(
    () => evaluations.filter((e) => e.angajatId === subjectId),
    [evaluations, subjectId],
  );

  const mentorGrantedByHr =
    !isPreview && isMentor && !user.roles.includes('admin') && !user.roles.includes('hr');

  const receivedCompetencyNivel =
    lastCompletedEvalCycle?.competencyResult?.nivel ?? profile?.nivelCompetenta;
  const receivedCompetencyTitle = receivedCompetencyNivel
    ? DESIGNER_COMPETENCY_LEVEL_PROFILES.find((p) => p.level === receivedCompetencyNivel)?.title
    : undefined;
  const receivedCompetencyDate = lastCompletedEvalCycle?.dataEvaluare;

  const profileDisplayName = profile
    ? `${profile.prenume} ${profile.nume}`.trim()
    : subjectUser?.name ?? user.name;

  const handleProfilePhotoChange = async (photoUrl: string | undefined) => {
    updateProfile(subjectId, { photoUrl });
  };

  return (
    <div className="space-y-6">
      {!isPreview && (
        <ActionInboxPanel userId={subjectId} roles={['employee']} maxItems={5} />
      )}

      <EmployeeReferenceModulesRow userId={subjectId} readOnly={isPreview} />

      {!isPreview && employeeMetrics && (
        <RoleSummaryCards role="employee" metrics={employeeMetrics} userId={subjectId} />
      )}

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

      <EmployeeProfileCard
        profileDisplayName={profileDisplayName}
        email={subjectUser?.email ?? user.email}
        profile={profile}
        supervisor={supervisor}
        mentor={assignedMentor}
        photoUrl={profile?.photoUrl}
        photoEditable={!isPreview}
        onPhotoChange={handleProfilePhotoChange}
        isMentor={isMentor}
        isPreview={isPreview}
        currentEval={currentEval}
        trainingFinished={trainingFinished}
        evaluations={evaluations}
        subjectId={subjectId}
        lastCompletedEvalCycle={lastCompletedEvalCycle}
        competencyLevel={receivedCompetencyNivel}
        competencyTitle={receivedCompetencyTitle}
        competencyDate={receivedCompetencyDate}
        trainingReport={trainingReport}
        departmentLabel={departmentLabel}
        certificate={certificate}
        retrainingSessions={retrainingSessions}
        users={users}
      />

      <EmployeeParcursModulesRow
        subjectId={subjectId}
        isPreview={isPreview}
        trainingReport={trainingReport}
        trainingFinished={trainingFinished}
        enrollmentDepartmentId={enrollment?.departmentId}
        assignedMentor={assignedMentor}
        activeRetrainings={activeRetrainings}
        completedRetrainings={completedRetrainings}
        completedEvaluations={completedEvaluations}
        currentEval={currentEval}
        evalInProgress={evalInProgress}
        evalActionable={!!evalActionable}
        receivedCompetencyTitle={receivedCompetencyTitle}
        receivedCompetencyDate={receivedCompetencyDate}
        onOpenTrainingPlan={openOwnTrainingPlan}
        onOpenActiveRetrainingInPlan={openActiveRetrainingInPlan}
        onOpenActiveEvaluation={openActiveEvaluation}
        expandModule={parcursExpand}
      />

      <ProfessionalPanel
        variant="activity"
        icon="activity"
        eyebrow="Dosar 360°"
        title="Activitate recentă"
        subtitle="Evenimente instruire, evaluări și documente"
        collapsible
        expanded={dossier360Expanded}
        onToggle={() => setDossier360Expanded((v) => !v)}
        toggleLabels={{ expanded: 'Restrânge dosarul 360°', collapsed: 'Deschide dosar 360°' }}
        headerAction={
          <Link
            to={ingineriPath(`/angajat/${subjectId}`)}
            className="text-xs text-corporate-gold hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Dosar complet →
          </Link>
        }
        collapsedPeek={
          <p className="text-sm text-corporate-muted">
            {timeline.length > 0
              ? `${timeline.length} evenimente în linia temporală`
              : 'Nicio activitate înregistrată'}
            {' — apăsați pentru a deschide.'}
          </p>
        }
        footer={
          dossier360Expanded ? (
            <div className="flex flex-wrap gap-2">
              <Link to={ingineriPath(`/angajat/${subjectId}`)}>
                <Button type="button" variant="secondary" size="sm">
                  Dosar personal 360°
                </Button>
              </Link>
              {profile && canExportDossier(subjectId) && (
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
          ) : undefined
        }
      >
        {timeline.length > 0 ? (
          <EmployeeTimeline events={timeline} showFilters={false} />
        ) : (
          <p className="text-sm text-corporate-muted">Nicio activitate înregistrată încă.</p>
        )}
      </ProfessionalPanel>

      <EmployeeArchivePanel
        angajatId={subjectId}
        showPlanLink={!!trainingSystemStore.getPlanArchive(subjectId)}
        collapsible
        defaultExpanded={false}
      />
    </div>
  );
}
