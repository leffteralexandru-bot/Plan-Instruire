import { Card } from '@/components/ui/Card';

interface OperationalGuideChecklistProps {
  items: string[];
  checked: boolean[];
  onToggle: (index: number) => void;
  readOnly?: boolean;
  emptyMessage: string;
  accent?: 'gold' | 'emerald';
  compact?: boolean;
}

export function OperationalGuideChecklist({
  items,
  checked,
  onToggle,
  readOnly = false,
  emptyMessage,
  accent = 'emerald',
  compact = false,
}: OperationalGuideChecklistProps) {
  if (items.length === 0) {
    return (
      <Card padding="sm" className="border-dashed bg-corporate-surface/40">
        <p className="text-sm text-corporate-muted">{emptyMessage}</p>
      </Card>
    );
  }

  const checkedBorder = accent === 'gold' ? 'border-corporate-gold/40 bg-corporate-gold-light/30' : 'border-emerald-200 bg-emerald-50/60';
  const checkedText = accent === 'gold' ? 'text-amber-900 line-through decoration-corporate-gold/50' : 'text-emerald-900 line-through decoration-emerald-400/60';

  return (
    <ul className={compact ? 'space-y-1' : 'space-y-2'}>
      {items.map((item, index) => {
        const isChecked = checked[index] ?? false;
        return (
          <li key={`chk-${index}-${item.slice(0, 24)}`}>
            <label
              className={[
                'flex items-start gap-2 rounded-lg border transition-colors',
                compact ? 'px-2.5 py-1.5' : 'gap-3 rounded-xl px-4 py-3',
                isChecked ? checkedBorder : 'border-corporate-border bg-white hover:border-corporate-gold/30',
                readOnly ? 'cursor-default' : 'cursor-pointer',
              ].join(' ')}
            >
              <input
                type="checkbox"
                className={[
                  'shrink-0 rounded border-corporate-border text-corporate-gold focus:ring-corporate-gold/30',
                  compact ? 'mt-0.5 h-3.5 w-3.5' : 'mt-0.5 h-4 w-4',
                ].join(' ')}
                checked={isChecked}
                disabled={readOnly}
                onChange={() => onToggle(index)}
              />
              <span
                className={[
                  'leading-snug',
                  compact ? 'text-[11px]' : 'text-sm leading-relaxed',
                  isChecked ? checkedText : 'text-corporate-dark',
                ].join(' ')}
              >
                {item}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
