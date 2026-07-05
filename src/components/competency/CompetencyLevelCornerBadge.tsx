import {
  competencyLevelShortLabel,
  getCompetencyLevelTheme,
} from '@/lib/competencyLevelTheme';

interface CompetencyLevelCornerBadgeProps {
  level: number;
  title?: string;
  className?: string;
  /** Afișat atașat în stânga (ex. „În curs de evaluare” când dosarul e restrâns) */
  evaluationStatus?: string;
  evaluationUrgent?: boolean;
}

/** Nivel competență — colț dreapta, culoare per nivel (1–4). */
export function CompetencyLevelCornerBadge({
  level,
  title,
  className = '',
  evaluationStatus,
  evaluationUrgent = false,
}: CompetencyLevelCornerBadgeProps) {
  const theme = getCompetencyLevelTheme(level);
  if (!theme) return null;

  const shortLabel = competencyLevelShortLabel(title, level);

  const levelBlock = (
    <div
      className={[
        'inline-flex min-w-[4.5rem] flex-col items-end px-2.5 py-1.5 text-right',
        evaluationStatus ? 'flex-1' : '',
        evaluationStatus ? '' : 'rounded-lg border shadow-sm ring-1',
        evaluationStatus ? '' : theme.shell,
        className,
      ].join(' ')}
      title={title ?? `Nivel ${level}`}
    >
      <p className={['text-[9px] font-semibold uppercase tracking-[0.14em]', theme.label].join(' ')}>
        Nivel
      </p>
      <p className={['text-lg font-bold tabular-nums leading-none mt-0.5', theme.number].join(' ')}>
        {level}
      </p>
      <p
        className={[
          'text-[10px] font-medium leading-tight mt-1 line-clamp-2 max-w-[6.5rem]',
          theme.label,
        ].join(' ')}
      >
        {shortLabel}
      </p>
    </div>
  );

  if (!evaluationStatus) return levelBlock;

  return (
    <div
      className={[
        'inline-flex items-stretch rounded-lg border shadow-sm ring-1 overflow-hidden max-w-[11rem]',
        theme.shell,
        className,
      ].join(' ')}
      title={`${evaluationStatus} · ${title ?? `Nivel ${level}`}`}
    >
      <div
        className={[
          'flex flex-col justify-center px-2 py-1.5 border-r shrink-0 min-w-[4.25rem]',
          evaluationUrgent
            ? 'bg-amber-50/95 border-amber-200/80'
            : 'bg-white/70 border-slate-200/70',
        ].join(' ')}
      >
        <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-corporate-muted leading-tight">
          Evaluare
        </p>
        <p
          className={[
            'text-[9px] font-semibold leading-snug mt-0.5 line-clamp-3',
            evaluationUrgent ? 'text-amber-900' : 'text-corporate-dark',
          ].join(' ')}
        >
          {evaluationStatus}
        </p>
      </div>
      {levelBlock}
    </div>
  );
}
