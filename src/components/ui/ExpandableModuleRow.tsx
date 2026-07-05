import type { CSSProperties, ReactNode } from 'react';

interface ExpandableModuleRowProps {
  columnCount: number;
  /** Indexul coloanei active (0-based), pentru săgeata conector */
  activeColumnIndex: number | null;
  headers: ReactNode[];
  expandedContent: ReactNode | null;
  /** Etichetă discretă deasupra zonei încastrate */
  expandLabel?: string;
}

export function ExpandableModuleRow({
  columnCount,
  activeColumnIndex,
  headers,
  expandedContent,
  expandLabel,
}: ExpandableModuleRowProps) {
  const gridCols =
    columnCount >= 3 ? 'lg:grid-cols-3' : columnCount === 2 ? 'sm:grid-cols-2' : 'grid-cols-1';

  const connectorStyle: CSSProperties | undefined =
    activeColumnIndex !== null && columnCount > 0
      ? {
          left: `calc((100% / ${columnCount}) * ${activeColumnIndex} + (100% / ${columnCount}) / 2)`,
          transform: 'translateX(-50%)',
        }
      : undefined;

  return (
    <div className="rounded-xl border border-corporate-border/90 bg-gradient-to-b from-corporate-surface/35 via-white to-white shadow-sm">
      <div className={['grid gap-3 p-3 items-stretch', gridCols].join(' ')}>
        {headers.map((header, index) => (
          <div key={index} className="min-w-0 h-full flex flex-col">
            {header}
          </div>
        ))}
      </div>

      {activeColumnIndex !== null && expandedContent && (
        <div className="relative px-3 pb-3 pt-2">
          <div
            className="absolute top-0 z-10 flex flex-col items-center -translate-x-1/2"
            style={connectorStyle}
            aria-hidden
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-corporate-gold/50 bg-white text-[10px] font-bold text-corporate-gold shadow-sm">
              ▲
            </span>
          </div>

          <div className="rounded-xl border border-corporate-gold/30 bg-white shadow-[inset_0_2px_14px_rgba(15,23,42,0.05)] ring-1 ring-corporate-border/50">
            {expandLabel ? (
              <div className="border-b border-corporate-border/50 bg-corporate-surface/30 px-4 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-corporate-muted">
                  {expandLabel}
                </p>
              </div>
            ) : null}
            <div className="p-4 sm:p-5">{expandedContent}</div>
          </div>
        </div>
      )}
    </div>
  );
}
