import { Card } from '@/components/ui/Card';
import type { RoleDashboardMetrics } from '@/lib/roleDashboard';
import type { ActionInboxRole } from '@/lib/actionInbox';

const ROLE_LABELS: Record<ActionInboxRole, string> = {
  hr: 'Situație generală',
  mentor: 'Rezumat mentor instruire',
  supervisor: 'Rezumat supervizor',
  employee: 'Situația mea',
};

interface RoleSummaryCardsProps {
  role: ActionInboxRole;
  metrics: RoleDashboardMetrics;
}

export function RoleSummaryCards({ role, metrics }: RoleSummaryCardsProps) {
  const cards: { label: string; value: string; highlight?: boolean }[] = [];

  if (role === 'mentor') {
    cards.push(
      { label: 'Stagieri activi', value: String(metrics.subordinatesCount) },
      {
        label: 'Validări pending',
        value: String(metrics.pendingValidations),
        highlight: metrics.pendingValidations > 0,
      },
      {
        label: 'Progres mediu',
        value: metrics.trainingProgressPercent != null ? `${metrics.trainingProgressPercent}%` : '—',
      },
      {
        label: 'Acțiuni urgente',
        value: String(metrics.urgentActions),
        highlight: metrics.urgentActions > 0,
      },
    );
  } else if (role === 'supervisor') {
    cards.push(
      { label: 'Subordonați', value: String(metrics.subordinatesCount) },
      {
        label: 'Evaluări active',
        value: String(metrics.activeEvaluations),
        highlight: metrics.lateEvaluations > 0,
      },
      {
        label: 'Re-instruiri',
        value: String(metrics.activeRetraining),
        highlight: metrics.activeRetraining > 0,
      },
      {
        label: 'Erori luna curentă',
        value: String(metrics.errorsThisMonth),
        highlight: metrics.errorsThisMonth > 0,
      },
    );
  } else if (role === 'employee') {
    if (metrics.trainingProgressPercent != null) {
      cards.push({
        label: 'Progres instruire',
        value: `${metrics.trainingProgressPercent}%`,
      });
    }
    cards.push(
      {
        label: 'Evaluare activă',
        value: metrics.activeEvaluations ? 'Da' : 'Nu',
        highlight: metrics.lateEvaluations > 0,
      },
      {
        label: 'Re-instruire',
        value: metrics.activeRetraining ? 'În curs' : '—',
        highlight: metrics.activeRetraining > 0,
      },
      {
        label: 'Acțiuni urgente',
        value: String(metrics.urgentActions),
        highlight: metrics.urgentActions > 0,
      },
    );
  }

  if (!cards.length) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-corporate-muted uppercase tracking-wide mb-2">
        {ROLE_LABELS[role]}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} padding="sm">
            <p className="text-[10px] uppercase tracking-wide text-corporate-muted">{c.label}</p>
            <p
              className={`text-2xl font-bold mt-1 ${c.highlight ? 'text-amber-600' : 'text-corporate-dark'}`}
            >
              {c.value}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
