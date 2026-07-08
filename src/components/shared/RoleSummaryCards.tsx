import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { usePhoneLayout } from '@/hooks/usePhoneLayout';
import type { RoleDashboardMetrics } from '@/lib/roleDashboard';
import type { ActionInboxRole } from '@/lib/actionInbox';
import { PROGRAM_AREA_THEMES, type ProgramArea } from '@/lib/programAreaTheme';
import { INGINERI_PLAN_PATH } from '@/data/departments';
import { angajatPanelLink, evaluationsLink } from '@/lib/actionFocus';

const ROLE_LABELS: Record<ActionInboxRole, string> = {
  hr: 'Situație generală',
  mentor: 'Rezumat mentor instruire',
  supervisor: 'Rezumat supervizor',
  employee: 'Situația mea',
};

interface SummaryCard {
  label: string;
  value: string;
  highlight?: boolean;
  link?: string;
}

interface RoleSummaryCardsProps {
  role: ActionInboxRole;
  metrics: RoleDashboardMetrics;
  userId?: string;
}

export function RoleSummaryCards({ role, metrics, userId }: RoleSummaryCardsProps) {
  const phoneLayout = usePhoneLayout();
  const cards: SummaryCard[] = [];

  if (role === 'mentor') {
    cards.push(
      { label: 'În instruire acum', value: String(metrics.subordinatesCount) },
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
  } else if (role === 'employee' && userId) {
    if (metrics.trainingProgressPercent != null) {
      cards.push({
        label:
          metrics.trainingProgressPercent >= 100 ? 'Instruire finalizată' : 'Progres instruire',
        value: `${metrics.trainingProgressPercent}%`,
        link:
          metrics.trainingProgressPercent >= 100
            ? angajatPanelLink({ focus: 'parcurs', section: 'training' })
            : INGINERI_PLAN_PATH,
      });
    }
    cards.push(
      {
        label: 'Evaluare activă',
        value: metrics.activeEvaluations ? 'Da' : 'Nu',
        highlight: metrics.lateEvaluations > 0,
        link: metrics.activeEvaluations
          ? evaluationsLink({ angajatId: userId })
          : angajatPanelLink({ focus: 'parcurs', section: 'evaluation' }),
      },
      {
        label: 'Re-instruire',
        value: metrics.activeRetraining
          ? 'În curs'
          : metrics.completedRetraining
            ? `${metrics.completedRetraining} finalizate`
            : '—',
        highlight: metrics.activeRetraining > 0,
        link:
          metrics.activeRetraining || metrics.completedRetraining
            ? angajatPanelLink({ focus: 'parcurs', section: 'retraining' })
            : undefined,
      },
      {
        label: 'Acțiuni urgente',
        value: String(metrics.urgentActions),
        highlight: metrics.urgentActions > 0,
      },
    );
  }

  if (!cards.length) return null;

  const cardArea = (label: string): ProgramArea | undefined => {
    if (label.includes('instruire') || label.includes('Instruire')) return 'training';
    if (label.includes('Evaluare')) return 'evaluation';
    if (label.includes('Re-instruire') || label.includes('re-instruire')) return 'retraining';
    return undefined;
  };

  return (
    <div>
      <h2
        className={[
          'mb-2 font-semibold',
          phoneLayout
            ? 'text-sm leading-snug text-corporate-dark'
            : 'text-sm uppercase tracking-wide text-corporate-muted @md:text-base',
        ].join(' ')}
      >
        {ROLE_LABELS[role]}
      </h2>
      <div
        className={[
          'grid gap-2',
          phoneLayout ? 'grid-cols-2' : 'gap-3 sm:grid-cols-2 lg:grid-cols-4',
        ].join(' ')}
      >
        {cards.map((c) => {
          const area = cardArea(c.label);
          const theme = area ? PROGRAM_AREA_THEMES[area] : null;
          const inner = (
            <>
              <p
                className={[
                  'uppercase tracking-wide',
                  phoneLayout ? 'text-[9px] leading-tight' : 'text-[10px]',
                  theme ? theme.summaryLabel : 'text-corporate-muted',
                ].join(' ')}
              >
                {c.label}
              </p>
              <p
                className={[
                  'mt-1 font-bold',
                  phoneLayout ? 'text-lg leading-none' : 'text-2xl',
                  c.highlight
                    ? area === 'retraining'
                      ? 'text-orange-700'
                      : area === 'evaluation'
                        ? 'text-indigo-800'
                        : 'text-amber-600'
                    : 'text-corporate-dark',
                ].join(' ')}
              >
                {c.value}
              </p>
              {c.link && (
                <p
                  className={[
                    'mt-1 font-medium text-corporate-gold',
                    phoneLayout ? 'text-[9px]' : 'text-[10px]',
                  ].join(' ')}
                >
                  Deschide →
                </p>
              )}
            </>
          );

          return (
            <Card
              key={c.label}
              padding="sm"
              className={[
                theme ? `border ${theme.summaryCard}` : undefined,
                c.link ? 'hover:border-corporate-gold/40 transition-colors' : undefined,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {c.link ? (
                <Link to={c.link} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corporate-gold rounded">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
