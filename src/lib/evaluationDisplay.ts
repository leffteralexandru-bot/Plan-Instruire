import { DESIGNER_COMPETENCY_LEVEL_PROFILES } from '@/data/designerCompetencyMatrix';
import { userStore } from '@/lib/userStore';
import type { EvaluationCycle } from '@/types';

export function formatEvaluationShortDate(iso: string): string {
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatEvaluationRoDate(iso: string): string {
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function evaluationOrdinalLabel(n: number): string {
  if (n === 1) return 'Prima evaluare tri-lunară';
  return `A ${n}-a evaluare tri-lunară`;
}

export function resolveEvaluationEvaluatorName(cycle: EvaluationCycle): string | undefined {
  const supervisorStage = cycle.stages?.find((s) => s.id === 'evaluare_mentor');
  if (supervisorStage?.completedByName) return supervisorStage.completedByName;
  return userStore.getUserById(cycle.evaluatorId)?.name;
}

export interface CompletedEvaluationSummary {
  id: string;
  ordinal: number;
  date?: string;
  evaluatorName?: string;
  nivelLabel: string;
  incadrare: string;
  total: number;
  autonomie?: string;
  responsabilitate?: string;
  potrivitPentru?: string;
}

export function formatEvaluationHistoryLine(item: CompletedEvaluationSummary): string {
  const parts: string[] = [];
  if (item.evaluatorName && item.date) {
    parts.push(
      `Evaluat de ${item.evaluatorName} la data de ${formatEvaluationRoDate(item.date)}`,
    );
  } else if (item.date) {
    parts.push(`Evaluat la data de ${formatEvaluationRoDate(item.date)}`);
  }
  parts.push(`${item.nivelLabel} ${item.incadrare} · Total ${item.total} / 40`);
  if (item.autonomie && item.responsabilitate) {
    parts.push(`Autonomie: ${item.autonomie} · Responsabilitate: ${item.responsabilitate}`);
  }
  return parts.join(' · ');
}

export function buildCompletedEvaluationSummaries(cycles: EvaluationCycle[]): CompletedEvaluationSummary[] {
  return cycles
    .filter((e) => e.status === 'evaluat' && e.competencyResult)
    .sort((a, b) => (a.dataEvaluare ?? a.updatedAt).localeCompare(b.dataEvaluare ?? b.updatedAt))
    .map((cycle, index) => {
      const result = cycle.competencyResult!;
      const levelProfile = DESIGNER_COMPETENCY_LEVEL_PROFILES.find((p) => p.level === result.nivel);
      return {
        id: cycle.id,
        ordinal: index + 1,
        date: cycle.dataEvaluare,
        evaluatorName: resolveEvaluationEvaluatorName(cycle),
        nivelLabel: result.nivelLabel,
        incadrare: result.incadrare,
        total: result.total,
        autonomie: levelProfile?.autonomie,
        responsabilitate: levelProfile?.responsabilitate,
        potrivitPentru: levelProfile?.potrivitPentru,
      };
    });
}
