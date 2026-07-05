import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { EquipmentGuideSection } from '@/data/equipmentOperations';
import { SimpleMarkdown } from '@/lib/simpleMarkdown';

interface EquipmentOperationsSectionViewProps {
  section: EquipmentGuideSection;
  emptyLabel?: string;
}

function AttachmentBlock({
  type,
  label,
  url,
}: {
  type: string;
  label?: string;
  url: string;
}) {
  const title = label || (type === 'pdf' ? 'Document PDF' : type === 'image' ? 'Imagine' : 'Link');

  if (type === 'image') {
    return (
      <figure className="rounded-xl border border-corporate-border overflow-hidden bg-corporate-surface/30">
        <img src={url} alt={title} className="w-full max-h-80 object-contain bg-white" loading="lazy" />
        {label && (
          <figcaption className="px-3 py-2 text-xs text-corporate-muted border-t border-corporate-border/80">
            {label}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-corporate-border bg-white px-3 py-2 text-sm font-medium text-corporate-dark hover:border-corporate-gold/50 hover:bg-corporate-gold-light/10 transition-colors"
    >
      <Badge variant={type === 'pdf' ? 'info' : 'default'}>{type === 'pdf' ? 'PDF' : 'Link'}</Badge>
      <span>{title}</span>
      <span className="text-corporate-gold text-xs">→</span>
    </a>
  );
}

export function EquipmentOperationsSectionView({
  section,
  emptyLabel = 'HR va completa această secțiune.',
}: EquipmentOperationsSectionViewProps) {
  const hasText = !!section.text.trim();
  const hasSteps = section.steps.length > 0;
  const hasAttachments = section.attachments.length > 0;

  if (!hasText && !hasSteps && !hasAttachments) {
    return (
      <Card padding="sm" className="border-dashed bg-corporate-surface/40">
        <p className="text-sm text-corporate-muted">{emptyLabel}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {hasText && (
        <Card padding="sm" className="bg-corporate-surface/20">
          <SimpleMarkdown source={section.text} />
        </Card>
      )}

      {hasSteps && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-corporate-muted mb-2">
            Pași
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-corporate-dark">
            {section.steps.map((step, i) => (
              <li key={i} className="leading-relaxed pl-1">
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {hasAttachments && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-corporate-muted mb-2">
            Materiale atașate
          </p>
          <div className="flex flex-col gap-3">
            {section.attachments.map((att) => (
              <AttachmentBlock key={att.id} type={att.type} label={att.label} url={att.url} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
