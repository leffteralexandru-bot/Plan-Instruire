import { storage } from '@/store/storage';
import { buildHrAggregateReport } from '@/lib/hrReport';
import { getMentorWorkload } from '@/lib/hrAnalytics';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';
import { userStore } from '@/lib/userStore';
import type { EvaluationScores, KpiSnapshot, TraineeProfile } from '@/types';

export const MANAGEMENT_TREND_MONTHS = 12;

/** Etichetă lună consistentă între dashboard și raport PDF */
export function formatManagementTrendMonth(
  luna: string,
  style: 'compact' | 'full' = 'full',
): string {
  const [year, month] = luna.slice(0, 7).split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  if (style === 'compact') {
    return d.toLocaleDateString('ro-RO', { month: 'short' });
  }
  return d.toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' });
}

export interface ManagementTrendPoint {
  luna: string;
  eroriLuna: number;
  progresMediu: number;
  evaluariFinalizate: number;
}

export interface DevelopmentGapRow {
  angajatId: string;
  angajatName: string;
  scorMediu: number;
  motiv: string;
  evaluationId: string;
}

export interface ManagementDashboardMetrics {
  totalAngajati: number;
  angajatiInInstruire: number;
  progresInstruireMediu: number;
  rataFinalizareInstruire: number;
  certificateEmise: number;
  evaluariLaTimp: number;
  evaluariIntarziate: number;
  evaluariInCurs: number;
  rataEvaluariLaTimp: number;
  eroriLunaCurenta: number;
  planuriActiuneDeschise: number;
  reInstruiriActive: number;
  validariMentorPending: number;
  trend: ManagementTrendPoint[];
  developmentGaps: DevelopmentGapRow[];
}

function averageScores(scoruri: EvaluationScores): number {
  const vals = [scoruri.calitate, scoruri.autonomie, scoruri.colaborare, scoruri.respectProceduri];
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function profileName(userId: string): string {
  const p = hrPerformanceStore.getProfile(userId);
  if (p) return `${p.prenume} ${p.nume}`.trim();
  return userStore.getUserById(userId)?.name ?? userId;
}

function buildDevelopmentGaps(): DevelopmentGapRow[] {
  const gaps: DevelopmentGapRow[] = [];
  const evaluations = hrPerformanceStore.getEvaluations();

  for (const ev of evaluations) {
    if (ev.status !== 'evaluat' || !ev.scoruri) continue;
    const avg = averageScores(ev.scoruri);
    const missingPlan = !ev.planDezvoltare?.trim();
    if (avg < 3.5 || missingPlan) {
      gaps.push({
        angajatId: ev.angajatId,
        angajatName: profileName(ev.angajatId),
        scorMediu: Math.round(avg * 10) / 10,
        motiv:
          avg < 3.5 && missingPlan
            ? 'Scor sub 3,5 · plan dezvoltare lipsă'
            : avg < 3.5
              ? 'Scor mediu sub 3,5'
              : 'Plan de dezvoltare necompletat',
        evaluationId: ev.id,
      });
    }
  }

  return gaps.sort((a, b) => a.scorMediu - b.scorMediu).slice(0, 12);
}

function mapTrend(snapshots: KpiSnapshot[]): ManagementTrendPoint[] {
  return snapshots.slice(-MANAGEMENT_TREND_MONTHS).map((s) => ({
    luna: s.luna,
    eroriLuna: s.eroriLuna,
    progresMediu: s.progresInstruireMediu,
    evaluariFinalizate: s.evaluariFinalizate,
  }));
}

function syncCurrentMonthTrend(
  trend: ManagementTrendPoint[],
  live: {
    luna: string;
    eroriLunaCurenta: number;
    progresInstruireMediu: number;
    evaluariFinalizateLuna: number;
  },
): ManagementTrendPoint[] {
  const hasCurrent = trend.some((p) => p.luna === live.luna);
  const synced = trend.map((point) =>
    point.luna === live.luna
      ? {
          ...point,
          eroriLuna: live.eroriLunaCurenta,
          progresMediu: live.progresInstruireMediu,
          evaluariFinalizate: live.evaluariFinalizateLuna,
        }
      : point,
  );

  if (!hasCurrent) {
    synced.push({
      luna: live.luna,
      eroriLuna: live.eroriLunaCurenta,
      progresMediu: live.progresInstruireMediu,
      evaluariFinalizate: live.evaluariFinalizateLuna,
    });
    synced.sort((a, b) => a.luna.localeCompare(b.luna));
  }

  return synced.slice(-MANAGEMENT_TREND_MONTHS);
}

export function computeManagementDashboardMetrics(
  trainees: TraineeProfile[],
  programVersion: string,
): ManagementDashboardMetrics {
  hrPerformanceStore.generateMonthlySnapshot();

  const getProgress = (id: string) => storage.getProgress(id);
  const report = buildHrAggregateReport(trainees, getProgress, programVersion);
  const profiles = hrPerformanceStore.getProfiles();
  const evaluations = hrPerformanceStore.getEvaluations();
  const errorCases = hrPerformanceStore.getErrorCases();
  const luna = new Date().toISOString().slice(0, 7);

  const activeEvals = evaluations.filter((e) => e.status !== 'evaluat');
  const evaluariIntarziate = activeEvals.filter((e) => e.status === 'intarziat').length;
  const evaluariInCurs = activeEvals.filter(
    (e) => e.status === 'in_curs' || e.status === 'planificat',
  ).length;
  const evaluariLaTimp = activeEvals.length - evaluariIntarziate;
  const rataEvaluariLaTimp =
    activeEvals.length > 0 ? Math.round((evaluariLaTimp / activeEvals.length) * 100) : 100;

  const workload = getMentorWorkload(trainees, getProgress);
  const validariMentorPending = workload.reduce((n, w) => n + w.pendingDayNumbers.length, 0);

  const reInstruiriActive = trainingSystemStore
    .getReTrainingSessions()
    .filter((s) => normalizeReTrainingStatus(s.status) !== 'finalizat').length;

  const rataFinalizareInstruire =
    report.summary.totalTrainees > 0
      ? Math.round((report.summary.fullyCompleted / report.summary.totalTrainees) * 100)
      : 0;

  const progresInstruireMediu = report.trainees.length
    ? Math.round(
        report.trainees.reduce((s, t) => s + t.progressPercent, 0) / report.trainees.length,
      )
    : 0;

  const eroriLunaCurenta = errorCases.filter((e) => e.data.startsWith(luna)).length;
  const evaluariFinalizateLuna = evaluations.filter(
    (e) => e.status === 'evaluat' && e.dataEvaluare?.startsWith(luna),
  ).length;

  const trend = syncCurrentMonthTrend(mapTrend(hrPerformanceStore.getKpiSnapshots()), {
    luna,
    eroriLunaCurenta,
    progresInstruireMediu,
    evaluariFinalizateLuna,
  });

  return {
    totalAngajati: profiles.length,
    angajatiInInstruire: report.summary.totalTrainees,
    progresInstruireMediu,
    rataFinalizareInstruire,
    certificateEmise: report.summary.certificatesIssued,
    evaluariLaTimp,
    evaluariIntarziate,
    evaluariInCurs,
    rataEvaluariLaTimp,
    eroriLunaCurenta,
    planuriActiuneDeschise: errorCases.filter((e) => e.planActiune.status !== 'inchis').length,
    reInstruiriActive,
    validariMentorPending,
    trend,
    developmentGaps: buildDevelopmentGaps(),
  };
}
