import type {
  EquipmentChapterBlock,
  EquipmentChapterCalloutVariant,
} from '@/data/equipmentOperations';
import { SimpleMarkdown } from '@/lib/simpleMarkdown';
import { EquipmentVideoFigure } from '@/components/equipment/EquipmentVideoFigure';

const CALLOUT_STYLES: Record<
  EquipmentChapterCalloutVariant,
  { box: string; title: string }
> = {
  warning: {
    box: 'border-red-300/80 bg-red-50/90',
    title: 'text-red-800',
  },
  attention: {
    box: 'border-amber-400/80 bg-amber-50/95',
    title: 'text-amber-900',
  },
  tip: {
    box: 'border-corporate-gold/50 bg-corporate-gold-light/40',
    title: 'text-corporate-stone',
  },
  note: {
    box: 'border-corporate-border bg-corporate-surface/50',
    title: 'text-corporate-dark',
  },
};

const CALLOUT_LABELS: Record<EquipmentChapterCalloutVariant, string> = {
  warning: 'Avertisment',
  attention: 'ATENȚIE!',
  tip: 'SFAT',
  note: 'NOTĂ',
};

function ChapterCallout({
  variant,
  title,
  body,
}: {
  variant: EquipmentChapterCalloutVariant;
  title?: string;
  body: string;
}) {
  const styles = CALLOUT_STYLES[variant];
  return (
    <div className={`rounded-xl border px-4 py-3 ${styles.box}`}>
      <p className={`text-xs font-bold uppercase tracking-wide ${styles.title}`}>
        {title ?? CALLOUT_LABELS[variant]}
      </p>
      <div className="mt-1.5 text-sm text-corporate-dark leading-relaxed">
        <SimpleMarkdown source={body} />
      </div>
    </div>
  );
}

interface EquipmentChapterBlocksProps {
  blocks: EquipmentChapterBlock[];
}

/** Randare profesională a conținutului capitol — ca în manualul PDF Prodim. */
export function EquipmentChapterBlocks({ blocks }: EquipmentChapterBlocksProps) {
  return (
    <div className="space-y-4">
      {blocks.map((block) => {
        switch (block.type) {
          case 'markdown':
            return (
              <div
                key={block.id}
                className="rounded-lg bg-corporate-surface/25 px-3 py-3 @lg:px-4 @lg:py-4"
              >
                <SimpleMarkdown source={block.body} />
              </div>
            );

          case 'callout':
            return (
              <ChapterCallout
                key={block.id}
                variant={block.variant}
                title={block.title}
                body={block.body}
              />
            );

          case 'figure':
            return (
              <EquipmentVideoFigure
                key={block.id}
                imageUrl={block.imageUrl}
                alt={block.alt}
                caption={block.caption}
                videoUrl={block.videoUrl}
                videoLabel={block.videoLabel}
              />
            );

          case 'steps':
            return (
              <div key={block.id}>
                {block.title && (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-corporate-muted">
                    {block.title}
                  </p>
                )}
                <ol className="list-decimal list-inside space-y-2.5 text-sm text-corporate-dark">
                  {block.items.map((item, i) => (
                    <li key={i} className="leading-relaxed pl-1">
                      <SimpleMarkdown source={item} />
                    </li>
                  ))}
                </ol>
              </div>
            );

          case 'bullet-list':
            return (
              <div key={block.id}>
                {block.title && (
                  <p className="mb-2 text-sm font-semibold text-corporate-dark">{block.title}</p>
                )}
                <ul className="list-disc list-inside space-y-1.5 text-sm text-corporate-dark">
                  {block.items.map((item, i) => (
                    <li key={i} className="leading-relaxed pl-1">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );

          case 'definitions':
            return (
              <dl key={block.id} className="grid gap-2 rounded-lg border border-corporate-border bg-white px-3 py-3">
                {block.items.map((item) => (
                  <div key={item.term} className="text-sm">
                    <dt className="font-semibold text-corporate-dark">{item.term}</dt>
                    <dd className="mt-0.5 text-corporate-muted leading-relaxed">{item.definition}</dd>
                  </div>
                ))}
              </dl>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
