import { useState } from 'react';

interface OperationalGuidePreMeasurementRulesProps {
  conditions: string[];
  categoryLabel?: string;
  emptyMessage?: string;
  defaultExpanded?: boolean;
}

function MeasurerGuideIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" strokeLinecap="round" />
      <path d="M9 12h6M12 9v6" strokeLinecap="round" />
    </svg>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <span
      className={[
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5 text-white/70 transition-transform duration-200',
        expanded ? 'rotate-180' : '',
      ].join(' ')}
      aria-hidden
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function OperationalGuidePreMeasurementRules({
  conditions,
  categoryLabel,
  emptyMessage = 'HR va completa condițiile obligatorii pentru această categorie.',
  defaultExpanded = false,
}: OperationalGuidePreMeasurementRulesProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (conditions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-corporate-border bg-corporate-surface/50 px-3 py-4 text-center">
        <p className="text-xs text-corporate-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <section
      className="overflow-hidden rounded-xl border border-corporate-black/10 shadow-sm"
      aria-label="Condiții obligatorii înainte de măsurare"
    >
      <button
        type="button"
        className="w-full bg-corporate-black px-3 py-2.5 sm:px-4 flex flex-wrap items-center justify-between gap-2 text-left hover:bg-corporate-black/95 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Restrânge ghidul măsurător' : 'Deschide ghidul măsurător'}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-corporate-gold/15 text-corporate-gold">
            <MeasurerGuideIcon />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-corporate-gold leading-none">
              Ghid măsurător
            </p>
            <p className="text-xs font-medium text-white/90 mt-0.5 leading-snug">
              Condiții obligatorii — înainte de măsurare
              {categoryLabel ? (
                <>
                  <span className="text-white/40"> · </span>
                  <span className="text-corporate-gold/90">{categoryLabel}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-medium tabular-nums text-white/45 hidden sm:inline">
            {conditions.length} {conditions.length === 1 ? 'regulă' : 'reguli'}
          </span>
          <Chevron expanded={expanded} />
        </div>
      </button>

      {!expanded && (
        <div className="border-t border-red-200/60 bg-red-50/80 px-3 py-2 sm:px-4">
          <p className="text-[10px] sm:text-[11px] font-medium text-red-900 leading-snug">
            STOP — verificați condițiile înainte de plecare. Apăsați pentru a deschide {conditions.length}{' '}
            {conditions.length === 1 ? 'regulă' : 'reguli'}.
          </p>
        </div>
      )}

      {expanded && (
        <>
          <div className="border-b border-red-200/80 bg-red-50/90 px-3 py-2 sm:px-4">
            <p className="text-[11px] sm:text-xs font-semibold text-red-900 leading-snug">
              STOP — dacă o singură condiție nu e îndeplinită, nu plecați la măsurare.
            </p>
            <p className="text-[10px] sm:text-[11px] text-red-800/85 mt-0.5 leading-snug">
              Verificați personal înainte de plecare. Responsabil: persoana care planifică măsurarea — reprogramați
              cu planificatorul.
            </p>
          </div>

          <ol className="divide-y divide-corporate-border/70 bg-white">
            {conditions.map((rule, index) => (
              <li
                key={`pre-rule-${index}`}
                className="flex gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5 hover:bg-corporate-surface/40 transition-colors"
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-corporate-black text-[10px] font-bold text-corporate-gold mt-px"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <p className="text-[11px] sm:text-xs text-corporate-dark leading-snug flex-1">{rule}</p>
              </li>
            ))}
          </ol>

          <footer className="border-t border-corporate-gold/20 bg-corporate-gold-light/20 px-3 py-1.5 sm:px-4">
            <p className="text-[10px] text-corporate-stone leading-snug">
              artGRANIT · checklist planificare măsurători — referință obligatorie teren
            </p>
          </footer>
        </>
      )}
    </section>
  );
}
