import { ALL_DAYS } from '@/data/trainingPlan';
import { THEORETICAL_TEST } from '@/data/theoreticalTest';
import { buildCertificateMetrics } from '@/lib/certificateMetrics';
import type { AppProgress, DayProgress, TrainingEnrollment, User } from '@/types';

export const COMPLETED_TRAINEE_ID = 'u-angajat-instruit';

export const COMPLETED_TRAINEE_USER: User = {
  id: COMPLETED_TRAINEE_ID,
  name: 'Ștefan Radu',
  roles: ['angajat'],
  email: 's.radu@artgranit.ro',
  active: true,
  createdAt: '2026-01-15T00:00:00.000Z',
};

export const COMPLETED_TRAINEE_ENROLLMENT: TrainingEnrollment = {
  id: 'enr-finished-1',
  angajatId: COMPLETED_TRAINEE_ID,
  departmentId: 'ingineri',
  cohortId: 'cohort-2026-i',
  mentorId: 'u-mentor',
  programStart: '2026-02-03',
  status: 'completed',
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-05-30T00:00:00.000Z',
};

const MENTOR_NAME = 'Ing. Maria Ionescu';
const PROGRAM_VERSION = '2026.1';
const CERTIFICATE_DATE = '2026-05-30T10:00:00.000Z';

function buildDayProgress(dayId: string): DayProgress {
  const day = ALL_DAYS.find((d) => d.id === dayId);
  if (!day) {
    return { completedTasks: [], mentorValidated: false };
  }
  const progress: DayProgress = {
    completedTasks: day.tasks.map((t) => t.id),
    mentorValidated: day.requiresMentorValidation,
  };
  if (day.requiresMentorValidation) {
    progress.mentorValidatedAt = '2026-05-28T14:00:00.000Z';
    progress.mentorNotes = 'Validat — progres conform planului';
  }
  if (dayId === THEORETICAL_TEST.dayId) {
    const answers: Record<string, number> = {};
    THEORETICAL_TEST.questions.forEach((q, i) => {
      answers[q.id] = i === 3 ? 0 : q.correctIndex;
    });
    progress.quizResult = {
      score: 9,
      total: 10,
      passed: true,
      completedAt: '2026-05-15T11:30:00.000Z',
      attempts: 1,
      answers,
    };
  }
  return progress;
}

/** Progres complet — 20 zile / 4 săptămâni, certificate, feedback S2/S4 */
export function buildCompletedTrainingProgress(
  userId: string,
  options?: { mentorName?: string; stagiarName?: string; mentorId?: string },
): AppProgress {
  const mentorName = options?.mentorName ?? MENTOR_NAME;
  const stagiarName = options?.stagiarName ?? COMPLETED_TRAINEE_USER.name;
  const mentorId = options?.mentorId ?? 'u-mentor';
  const days: Record<string, DayProgress> = {};
  for (const day of ALL_DAYS) {
    days[day.id] = buildDayProgress(day.id);
  }

  const base: AppProgress = {
    userId,
    schemaVersion: 2,
    days,
    feedbacks: [
      {
        weekNumber: 2,
        autonomieProliner: 4,
        proiectareFaraErori: 4,
        integrareEchipa: 5,
        comentarii:
          'Progres solid în primele 2 săptămâni. A assimilat Proliner și CAD. Continuă cu atenție la detaliile de cant.',
        completedAt: '2026-02-21T16:00:00.000Z',
        mentorName: mentorName,
      },
      {
        weekNumber: 4,
        autonomieProliner: 5,
        proiectareFaraErori: 4,
        integrareEchipa: 5,
        comentarii:
          'Program finalizat cu succes. Autonomie bună pe proiecte standard. Recomandat pentru evaluări tri-lunale.',
        completedAt: '2026-05-30T15:00:00.000Z',
        mentorName: mentorName,
      },
    ],
    acteConstatare: [],
    photos: [],
    auditLog: [
      {
        id: 'audit-finished-cert',
        action: 'certificate_issued',
        actorId: mentorId,
        actorName: mentorName,
        details: 'Certificat instruire generală 4 săptămâni',
        createdAt: CERTIFICATE_DATE,
      },
    ],
    developmentPlan: {
      obiective6Luni: 'Autonomie completă pe proiecte L și U standard, zero erori recurente la măsurători.',
      competenteDeDezvoltat: 'Proiecte complexe cu decupaje speciale, optimizare timp CAD.',
      proiecteTinta: '2 proiecte independente fără revizuire majoră mentor.',
      mentorAcord: 'Da — pregătit pentru flux normal de proiectare.',
      completedAt: '2026-05-29T12:00:00.000Z',
    },
    lastVisitedDayId: 'day-20',
  };

  const metrics = buildCertificateMetrics(base);

  return {
    ...base,
    certificate: {
      issuedAt: CERTIFICATE_DATE,
      mentorName: mentorName,
      stagiarName: stagiarName,
      programVersion: PROGRAM_VERSION,
      certificateNumber: 'AG-2026-0042',
      ...(metrics.nivelLabel && metrics.nivelScore !== null
        ? { nivelLabel: metrics.nivelLabel, nivelScore: metrics.nivelScore }
        : {}),
      ...(metrics.testScoreLabel && metrics.testPercent !== null
        ? {
            testScoreLabel: metrics.testScoreLabel,
            testPercent: metrics.testPercent,
            testPassed: metrics.testPassed ?? undefined,
          }
        : {}),
    },
  };
}
