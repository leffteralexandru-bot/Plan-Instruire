import { ingineriPath, INGINERI_ANGAJAT_PANEL_PATH, INGINERI_PLAN_PATH } from '@/data/departments';
import { ALL_DAYS } from '@/data/trainingPlan';
import { isEmployeeSelfAssessmentStageDone, needsEvaluationWorkflowStart } from '@/lib/evaluationStages';
import { isDayComplete } from '@/lib/progressLogic';
import { DEMO_ANGAJAT_ID } from '@/lib/seedMinimalDemo';
import { getActiveStage } from '@/lib/evaluationStages';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { userStore } from '@/lib/userStore';
import { storage } from '@/store/storage';
import { canManageUsers, isMentorUser } from '@/lib/roles';
import type { TestingStageCategory } from '@/lib/testingStageThemes';
import { getTestingStageCategory } from '@/lib/testingStageThemes';
import type { AdminTab } from '@/components/admin/performance/AdminTabNav';
import type { User } from '@/types';

/** Dezactivați după testare — elimină bordurile galbene */
export const TESTING_VISUAL_GUIDE_ENABLED = true;

export type TestingZoneId =
  | 'zone-plan-dashboard'
  | 'zone-hr-planning'
  | 'zone-mentor-validari'
  | 'zone-mentor-feedback-s2'
  | 'zone-mentor-feedback-s4'
  | 'zone-angajat-eval'
  | 'zone-hr-evaluari'
  | 'zone-supervisor-eval';

export interface TestingStageGuide {
  enabled: boolean;
  stageCode: string;
  category: TestingStageCategory;
  title: string;
  instruction: string;
  roleLabel: string;
  activeZone: TestingZoneId;
  navPath?: string;
  adminTab?: AdminTab;
  /** true dacă utilizatorul autentificat trebuie să acționeze acum */
  isViewerTurn: boolean;
}

export type TestingRoadmapStatus = 'done' | 'current' | 'pending';

export interface TestingRoadmapStep {
  step: number;
  stageCode: string;
  category: TestingStageCategory;
  label: string;
  roleLabel: string;
  status: TestingRoadmapStatus;
}

/** Ordinea etapelor în scenariul demo Andrei Popescu */
export const TESTING_ROADMAP_STEPS: Omit<TestingRoadmapStep, 'status'>[] = [
  { step: 1, stageCode: 'hr-setup', category: 'hr-admin', label: 'Înscriere HR', roleLabel: 'HR' },
  { step: 2, stageCode: 'angajat-instruire', category: 'instruire', label: 'Instruire zilnică', roleLabel: 'Angajat' },
  { step: 3, stageCode: 'mentor-validare', category: 'mentor-validari', label: 'Validări mentor', roleLabel: 'Mentor' },
  { step: 5, stageCode: 'mentor-feedback-s2', category: 'rapoarte', label: 'Feedback S2', roleLabel: 'Mentor' },
  { step: 8, stageCode: 'mentor-feedback-s4', category: 'rapoarte', label: 'Feedback S4', roleLabel: 'Mentor' },
  { step: 9, stageCode: 'hr-start-eval', category: 'evaluare', label: 'Pornire evaluare', roleLabel: 'HR' },
  { step: 10, stageCode: 'angajat-auto-eval', category: 'evaluare', label: 'Auto-evaluare', roleLabel: 'Angajat' },
  { step: 11, stageCode: 'supervisor-eval', category: 'evaluare', label: 'Eval. supervizor', roleLabel: 'Supervizor' },
  { step: 12, stageCode: 'hr-finalize-eval', category: 'evaluare', label: 'Finalizare HR', roleLabel: 'HR' },
];

type StageBase = Omit<TestingStageGuide, 'isViewerTurn'>;

function stage(fields: Omit<StageBase, 'category'>): StageBase {
  return { ...fields, category: getTestingStageCategory(fields.stageCode) };
}

function trainingStageForTrainee(traineeId: string): StageBase | null {
  const enrollment = userStore.getActiveEnrollmentForAngajat(traineeId);
  if (!enrollment) return null;

  const progress = storage.getProgress(traineeId);
  const completedDays = ALL_DAYS.filter((d) =>
    isDayComplete(d, progress.days[d.id] ?? { completedTasks: [], mentorValidated: false }),
  ).length;

  if (completedDays >= ALL_DAYS.length) {
    const needsS2 = !progress.feedbacks.some((f) => f.weekNumber === 2);
    const needsS4 = !progress.feedbacks.some((f) => f.weekNumber === 4);
    if (needsS4 && completedDays >= 15) {
      return stage({
        enabled: true,
        stageCode: 'mentor-feedback-s4',
        title: 'Etapa 8 — Feedback Săpt. IV',
        instruction: 'Mentorul completează evaluarea finală (Panou Mentor → Rapoarte Feedback).',
        roleLabel: 'Mentor',
        activeZone: 'zone-mentor-feedback-s4',
        navPath: ingineriPath('/mentor'),
      });
    }
    if (needsS2 && completedDays >= 5) {
      return stage({
        enabled: true,
        stageCode: 'mentor-feedback-s2',
        title: 'Etapa 5 — Feedback Săpt. II',
        instruction: 'Mentorul completează feedback-ul de la sfârșitul săptămânii 2.',
        roleLabel: 'Mentor',
        activeZone: 'zone-mentor-feedback-s2',
        navPath: ingineriPath('/mentor'),
      });
    }
    return null;
  }

  const pendingValidation = ALL_DAYS.find((d) => {
    if (!d.requiresMentorValidation) return false;
    const prog = progress.days[d.id] ?? { completedTasks: [], mentorValidated: false };
    if (prog.mentorValidated) return false;
    return d.tasks.every((t) => prog.completedTasks.includes(t.id));
  });

  if (pendingValidation) {
    return stage({
      enabled: true,
      stageCode: 'mentor-validare',
      title: `Etapa mentor — Validare Ziua ${pendingValidation.dayNumber}`,
      instruction: `Mentorul validează ziua ${pendingValidation.dayNumber} în Panou Mentor.`,
      roleLabel: 'Mentor',
      activeZone: 'zone-mentor-validari',
      navPath: ingineriPath('/mentor'),
    });
  }

  const nextDay =
    ALL_DAYS.find((d) => {
      const prog = progress.days[d.id] ?? { completedTasks: [], mentorValidated: false };
      return !isDayComplete(d, prog);
    }) ?? ALL_DAYS[0];

  return stage({
    enabled: true,
    stageCode: 'angajat-instruire',
    title: `Etapa 2 — Instruire Ziua ${nextDay.dayNumber}`,
    instruction: `Angajatul bifează task-urile zilei ${nextDay.dayNumber} în Plan instruire.`,
    roleLabel: 'Angajat',
    activeZone: 'zone-plan-dashboard',
    navPath: INGINERI_PLAN_PATH,
  });
}

function evalStageGuides(): {
  hr?: StageBase;
  angajat?: StageBase;
  supervisor?: StageBase;
} {
  const eval_ = hrPerformanceStore.getCurrentEvaluation(DEMO_ANGAJAT_ID);
  if (!eval_ || eval_.status === 'evaluat') return {};

  const active = getActiveStage(eval_);

  if (needsEvaluationWorkflowStart(eval_)) {
    return {
      hr: stage({
        enabled: true,
        stageCode: 'hr-start-eval',
        title: 'Etapa 9 — Pornire evaluare HR',
        instruction: 'HR apasă „Pornește” la Andrei Popescu (Panou HR → Evaluări).',
        roleLabel: 'HR',
        activeZone: 'zone-hr-evaluari',
        navPath: ingineriPath('/admin'),
        adminTab: 'evaluari',
      }),
    };
  }

  if (active?.id === 'auto_evaluare' && !isEmployeeSelfAssessmentStageDone(eval_)) {
    return {
      angajat: stage({
        enabled: true,
        stageCode: 'angajat-auto-eval',
        title: 'Etapa 10 — Auto-evaluare angajat',
        instruction: 'Andrei completează și trimite auto-evaluarea (Panou Angajat).',
        roleLabel: 'Angajat',
        activeZone: 'zone-angajat-eval',
        navPath: INGINERI_ANGAJAT_PANEL_PATH,
      }),
    };
  }

  if (active?.id === 'evaluare_mentor') {
    return {
      supervisor: stage({
        enabled: true,
        stageCode: 'supervisor-eval',
        title: 'Etapa 11 — Evaluare supervizor',
        instruction: 'Supervizorul validează matricea de competențe (Evaluări sau Panou Supervizor).',
        roleLabel: 'Supervizor',
        activeZone: 'zone-supervisor-eval',
        navPath: ingineriPath('/evaluari'),
      }),
    };
  }

  if (active?.id === 'validare_hr') {
    return {
      hr: stage({
        enabled: true,
        stageCode: 'hr-finalize-eval',
        title: 'Etapa 12 — Finalizare HR',
        instruction: 'HR finalizează evaluarea și confirmă matricea (Panou HR → Evaluări).',
        roleLabel: 'HR',
        activeZone: 'zone-hr-evaluari',
        navPath: ingineriPath('/admin'),
        adminTab: 'evaluari',
      }),
    };
  }

  return {};
}

/** Etapa curentă în fluxul demo — aceeași pentru toți utilizatorii autentificați */
export function resolveGlobalDemoStage(): StageBase | null {
  const traineeId = DEMO_ANGAJAT_ID;
  const enrollment = userStore.getActiveEnrollmentForAngajat(traineeId);
  const completedEnrollment = userStore.getEnrollments().find(
    (e) => e.angajatId === traineeId && e.status === 'completed',
  );

  const evalGuides = evalStageGuides();
  if (evalGuides.hr) return evalGuides.hr;
  if (evalGuides.angajat) return evalGuides.angajat;
  if (evalGuides.supervisor) return evalGuides.supervisor;

  if (!enrollment && !completedEnrollment) {
    return stage({
      enabled: true,
      stageCode: 'hr-setup',
      title: 'Etapa 1 — Înscriere angajat',
      instruction: 'HR creează cont + înscriere + mentor + supervizor (Setări → Utilizatori).',
      roleLabel: 'HR',
      activeZone: 'zone-hr-planning',
      navPath: ingineriPath('/admin'),
      adminTab: 'setari',
    });
  }

  if (enrollment) {
    const training = trainingStageForTrainee(traineeId);
    if (training) return training;
  }

  return null;
}

export function isViewerActorForStage(
  user: User,
  guide: Pick<TestingStageGuide, 'roleLabel'>,
): boolean {
  switch (guide.roleLabel) {
    case 'HR':
      return canManageUsers(user);
    case 'Angajat':
      return user.id === DEMO_ANGAJAT_ID;
    case 'Mentor':
      return (
        isMentorUser(user) ||
        userStore
          .getEnrollments()
          .some((e) => e.mentorId === user.id && e.angajatId === DEMO_ANGAJAT_ID)
      );
    case 'Supervizor': {
      const profile = hrPerformanceStore.getProfile(DEMO_ANGAJAT_ID);
      return profile?.supervisorId === user.id || profile?.managerId === user.id;
    }
    default:
      return false;
  }
}

export function getTestingRoadmap(
  current: Pick<TestingStageGuide, 'stageCode'> | null,
): TestingRoadmapStep[] {
  if (!current) {
    return TESTING_ROADMAP_STEPS.map((s) => ({ ...s, status: 'pending' as const }));
  }

  const currentIdx = TESTING_ROADMAP_STEPS.findIndex((s) => s.stageCode === current.stageCode);

  return TESTING_ROADMAP_STEPS.map((s, i) => ({
    ...s,
    status:
      currentIdx < 0
        ? ('pending' as const)
        : i < currentIdx
          ? ('done' as const)
          : i === currentIdx
            ? ('current' as const)
            : ('pending' as const),
  }));
}

export function resolveTestingStageGuide(user: User | null | undefined): TestingStageGuide | null {
  if (!TESTING_VISUAL_GUIDE_ENABLED || !user) return null;

  const stage = resolveGlobalDemoStage();
  if (!stage) return null;

  return {
    ...stage,
    isViewerTurn: isViewerActorForStage(user, stage),
  };
}

export function isTestingNavTarget(pathname: string, guide: TestingStageGuide | null): boolean {
  if (!guide?.navPath) return false;
  return pathname === guide.navPath || pathname.startsWith(`${guide.navPath}/`);
}
