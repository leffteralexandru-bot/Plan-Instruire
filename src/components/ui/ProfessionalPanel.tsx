import type { ReactNode } from 'react';

export type ProfessionalPanelVariant =
  | 'training'
  | 'training-success'
  | 'evaluation'
  | 'profile'
  | 'mentor'
  | 'inbox'
  | 'activity'
  | 'retraining'
  | 'retraining-success'
  | 'neutral';

interface PanelTheme {
  shell: string;
  accent: string;
  header: string;
  headerBorder: string;
  iconWrap: string;
  iconColor: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  footerBorder: string;
}

/** Teme deschise — bandă colorată + fundal alb, fără header întunecat */
const THEMES: Record<ProfessionalPanelVariant, PanelTheme> = {
  training: {
    shell: 'border-amber-200/70 bg-white',
    accent: 'bg-amber-400',
    header: 'bg-amber-50/50',
    headerBorder: 'border-amber-100',
    iconWrap: 'bg-amber-100 ring-amber-200/80',
    iconColor: 'text-amber-800',
    eyebrow: 'text-amber-700/90',
    title: 'text-corporate-dark',
    subtitle: 'text-corporate-muted',
    body: 'bg-white',
    footerBorder: 'border-amber-100/80',
  },
  'training-success': {
    shell: 'border-emerald-200/80 bg-white',
    accent: 'bg-emerald-500',
    header: 'bg-emerald-50/60',
    headerBorder: 'border-emerald-100',
    iconWrap: 'bg-emerald-100 ring-emerald-200/80',
    iconColor: 'text-emerald-800',
    eyebrow: 'text-emerald-700/90',
    title: 'text-corporate-dark',
    subtitle: 'text-corporate-muted',
    body: 'bg-white',
    footerBorder: 'border-emerald-100',
  },
  evaluation: {
    shell: 'border-indigo-200/70 bg-white',
    accent: 'bg-indigo-400',
    header: 'bg-indigo-50/50',
    headerBorder: 'border-indigo-100',
    iconWrap: 'bg-indigo-100 ring-indigo-200/80',
    iconColor: 'text-indigo-800',
    eyebrow: 'text-indigo-700/90',
    title: 'text-corporate-dark',
    subtitle: 'text-corporate-muted',
    body: 'bg-white',
    footerBorder: 'border-indigo-100',
  },
  profile: {
    shell: 'border-slate-200 bg-white',
    accent: 'bg-slate-400',
    header: 'bg-slate-50/80',
    headerBorder: 'border-slate-100',
    iconWrap: 'bg-slate-100 ring-slate-200',
    iconColor: 'text-slate-700',
    eyebrow: 'text-slate-500',
    title: 'text-corporate-dark',
    subtitle: 'text-corporate-muted',
    body: 'bg-white',
    footerBorder: 'border-slate-100',
  },
  mentor: {
    shell: 'border-corporate-gold/30 bg-white',
    accent: 'bg-corporate-gold',
    header: 'bg-corporate-gold-light/35',
    headerBorder: 'border-corporate-gold/15',
    iconWrap: 'bg-corporate-gold-light ring-corporate-gold/25',
    iconColor: 'text-amber-900',
    eyebrow: 'text-amber-800/80',
    title: 'text-corporate-dark',
    subtitle: 'text-corporate-muted',
    body: 'bg-white',
    footerBorder: 'border-corporate-gold/15',
  },
  inbox: {
    shell: 'border-amber-200/60 bg-white',
    accent: 'bg-orange-400',
    header: 'bg-orange-50/40',
    headerBorder: 'border-orange-100',
    iconWrap: 'bg-orange-100 ring-orange-200/70',
    iconColor: 'text-orange-800',
    eyebrow: 'text-orange-700/85',
    title: 'text-corporate-dark',
    subtitle: 'text-corporate-muted',
    body: 'bg-white',
    footerBorder: 'border-orange-100',
  },
  activity: {
    shell: 'border-slate-200 bg-white',
    accent: 'bg-sky-400',
    header: 'bg-sky-50/40',
    headerBorder: 'border-sky-100',
    iconWrap: 'bg-sky-100 ring-sky-200/70',
    iconColor: 'text-sky-800',
    eyebrow: 'text-sky-700/85',
    title: 'text-corporate-dark',
    subtitle: 'text-corporate-muted',
    body: 'bg-white',
    footerBorder: 'border-sky-100',
  },
  retraining: {
    shell: 'border-orange-200/70 bg-orange-50/20',
    accent: 'bg-orange-500',
    header: 'bg-orange-50/55',
    headerBorder: 'border-orange-100',
    iconWrap: 'bg-orange-100 ring-orange-200/70',
    iconColor: 'text-orange-900',
    eyebrow: 'text-orange-800/85',
    title: 'text-corporate-dark',
    subtitle: 'text-corporate-muted',
    body: 'bg-orange-50/25',
    footerBorder: 'border-orange-100',
  },
  'retraining-success': {
    shell: 'border-orange-300/75 bg-orange-50/30',
    accent: 'bg-orange-500',
    header: 'bg-orange-50/75',
    headerBorder: 'border-orange-200/80',
    iconWrap: 'bg-orange-100 ring-orange-300/60',
    iconColor: 'text-orange-900',
    eyebrow: 'text-orange-800/90',
    title: 'text-corporate-dark',
    subtitle: 'text-corporate-muted',
    body: 'bg-orange-50/30',
    footerBorder: 'border-orange-200/70',
  },
  neutral: {
    shell: 'border-corporate-border bg-white',
    accent: 'bg-corporate-gold/80',
    header: 'bg-corporate-surface/50',
    headerBorder: 'border-corporate-border/80',
    iconWrap: 'bg-corporate-surface ring-corporate-border',
    iconColor: 'text-corporate-stone',
    eyebrow: 'text-corporate-muted',
    title: 'text-corporate-dark',
    subtitle: 'text-corporate-muted',
    body: 'bg-white',
    footerBorder: 'border-corporate-border/80',
  },
};

export type ProfessionalPanelIcon =
  | 'training'
  | 'evaluation'
  | 'profile'
  | 'mentor'
  | 'inbox'
  | 'activity'
  | 'certificate'
  | 'retraining'
  | 'chart';

function PanelIcon({ name, className }: { name: ProfessionalPanelIcon; className?: string }) {
  const cn = className ?? 'h-5 w-5';
  switch (name) {
    case 'training':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'evaluation':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h4" strokeLinecap="round" />
        </svg>
      );
    case 'profile':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" strokeLinecap="round" />
        </svg>
      );
    case 'mentor':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
        </svg>
      );
    case 'inbox':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M22 12h-6l-2 3H10l-2-3H4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
      );
    case 'activity':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" strokeLinecap="round" />
        </svg>
      );
    case 'certificate':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="8" r="6" />
          <path d="M8.21 13.89 7 22l5-3 5 3-1.21-8.11" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'retraining':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M21 2v6h-6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 22v-6h6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'chart':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M3 3v18h18" strokeLinecap="round" />
          <path d="M7 16V9M12 16V5M17 16v-3" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export interface ProfessionalPanelProps {
  variant: ProfessionalPanelVariant;
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon?: ProfessionalPanelIcon;
  /** Înlocuiește iconița implicită (ex. poză profil) */
  headerIcon?: ReactNode;
  badge?: ReactNode;
  headerAction?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  compact?: boolean;
  /** Header devine acordeon — săgeți deschid/închid conținutul */
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  /** Conținut vizibil când panoul e restrâns (ex. bară progres compactă) */
  collapsedPeek?: ReactNode;
  toggleLabels?: { expanded: string; collapsed: string };
  /** Doar header-ul rămâne în celulă — conținutul se randă separat de părinte */
  bodyDetached?: boolean;
  /** Înălțime egală pentru tile-uri header (ex. rândul cu 3 module) */
  headerTile?: boolean;
}

export function ProfessionalPanel({
  variant,
  eyebrow,
  title,
  subtitle,
  icon,
  headerIcon,
  badge,
  headerAction,
  footer,
  children,
  className = '',
  bodyClassName = '',
  compact = false,
  collapsible = false,
  expanded = true,
  onToggle,
  collapsedPeek,
  toggleLabels,
  bodyDetached = false,
  headerTile = false,
}: ProfessionalPanelProps) {
  const theme = THEMES[variant];
  const pad = compact ? 'p-4' : 'p-5';

  const headerTitleBlock = (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      {headerIcon ?? (icon && (
        <div
          className={[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1',
            theme.iconWrap,
          ].join(' ')}
        >
          <PanelIcon name={icon} className={`h-[18px] w-[18px] ${theme.iconColor}`} />
        </div>
      ))}
      <div className="min-w-0">
        <p
          className={[
            'text-[10px] font-semibold uppercase tracking-[0.12em]',
            headerTile
              ? 'lg:text-[9px] lg:tracking-[0.08em] lg:truncate lg:whitespace-nowrap'
              : '',
            theme.eyebrow,
          ].join(' ')}
        >
          {eyebrow}
        </p>
        <h2
          className={[
            'font-semibold leading-snug',
            headerTile
              ? 'text-sm sm:text-[13px] lg:text-sm lg:leading-tight lg:whitespace-nowrap lg:truncate'
              : 'text-base',
            theme.title,
          ].join(' ')}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={[
              'mt-0.5',
              headerTile
                ? 'text-[11px] leading-snug lg:min-h-[2rem] lg:line-clamp-2'
                : 'text-xs max-w-prose',
              theme.subtitle,
            ].join(' ')}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  const headerActionsBlock =
    badge || headerAction ? (
      <div
        className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto sm:justify-end"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {badge}
        {headerAction}
      </div>
    ) : null;

  const headerLayout = headerActionsBlock ? (
    <div
      className={[
        'flex flex-col sm:flex-row sm:flex-wrap items-start justify-between gap-3 w-full',
        headerTile ? 'h-full' : '',
      ].join(' ')}
    >
      {collapsible && onToggle ? (
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={
            expanded
              ? (toggleLabels?.expanded ?? 'Restrânge panoul')
              : (toggleLabels?.collapsed ?? 'Deschide panoul')
          }
        >
          {headerTitleBlock}
        </button>
      ) : (
        <div className="min-w-0 flex-1">{headerTitleBlock}</div>
      )}
      {headerActionsBlock}
    </div>
  ) : collapsible && onToggle ? (
    <button
      type="button"
      className="w-full text-left"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={
        expanded
          ? (toggleLabels?.expanded ?? 'Restrânge panoul')
          : (toggleLabels?.collapsed ?? 'Deschide panoul')
      }
    >
      {headerTitleBlock}
    </button>
  ) : (
    headerTitleBlock
  );

  return (
    <section
      className={[
        'artgranit-panel overflow-hidden rounded-xl border shadow-sm flex',
        headerTile ? 'h-full' : '',
        theme.shell,
        collapsible && headerTile && expanded && bodyDetached
          ? 'relative z-10 rounded-b-none border-b-0 shadow-md ring-2 ring-corporate-gold/35'
          : '',
        className,
      ].join(' ')}
    >
      <div className={['w-1 shrink-0', theme.accent].join(' ')} aria-hidden />

      <div className={['min-w-0 flex-1', headerTile ? 'flex flex-col' : ''].join(' ')}>
        {collapsible && onToggle ? (
          <div
            className={[
              'w-full transition-colors hover:bg-black/[0.02]',
              headerTile ? 'flex-1 min-h-0 lg:min-h-[7.25rem] border-b-0' : 'border-b',
              'px-5 py-4',
              theme.header,
              headerTile ? '' : theme.headerBorder,
              collapsible && headerTile && expanded && bodyDetached ? 'pb-3' : '',
            ].join(' ')}
          >
            {headerLayout}
          </div>
        ) : (
          <div className={['border-b px-5 py-4', theme.header, theme.headerBorder].join(' ')}>
            {headerLayout}
          </div>
        )}

        {collapsible && headerTile && expanded && bodyDetached && (
          <div className="px-5 pb-2" aria-hidden>
            <div className={['h-1 rounded-full opacity-80', theme.accent].join(' ')} />
          </div>
        )}

        {collapsible && !expanded && collapsedPeek && !bodyDetached && (
          <div className={[pad, theme.body, bodyClassName].join(' ')}>{collapsedPeek}</div>
        )}

        {(!collapsible || expanded) && children && !bodyDetached && (
          <div className={[pad, 'space-y-4', theme.body, bodyClassName].join(' ')}>
            {children}
          </div>
        )}

        {footer && (
          <div
            className={[
              'px-5 py-3 text-xs text-corporate-muted border-t',
              theme.footerBorder,
              theme.header,
            ].join(' ')}
          >
            {footer}
          </div>
        )}
      </div>
    </section>
  );
}

export function PanelSubsection({
  label,
  children,
  className = '',
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wide text-corporate-muted mb-3">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

export function PanelHighlight({
  variant = 'default',
  label,
  children,
}: {
  variant?: 'default' | 'success' | 'info';
  label?: string;
  children: ReactNode;
}) {
  const styles = {
    default: 'border-slate-200 bg-slate-50/80',
    success: 'border-emerald-200 bg-emerald-50/70',
    info: 'border-sky-200 bg-sky-50/60',
  };
  return (
    <div className={['rounded-xl border px-4 py-3', styles[variant]].join(' ')}>
      {label && (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-corporate-muted mb-2">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}
