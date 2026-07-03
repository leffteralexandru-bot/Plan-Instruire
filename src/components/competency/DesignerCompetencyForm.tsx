import { DESIGNER_COMPETENCY_CRITERIA } from '@/data/designerCompetencyMatrix';
import type { DesignerCompetencyCriterionId, DesignerCompetencyLevel, DesignerCompetencyScores } from '@/types';

interface DesignerCompetencyFormProps {
  scores: DesignerCompetencyScores;
  onChange: (scores: DesignerCompetencyScores) => void;
  readOnly?: boolean;
  compact?: boolean;
  /** Persoana întrebărilor din matrice */
  perspective?: 'employee' | 'supervisor';
}

export function DesignerCompetencyForm({
  scores,
  onChange,
  readOnly = false,
  compact = false,
  perspective = 'employee',
}: DesignerCompetencyFormProps) {
  const setLevel = (id: DesignerCompetencyCriterionId, level: DesignerCompetencyLevel) => {
    if (readOnly) return;
    onChange({ ...scores, [id]: level });
  };

  return (
    <div className="space-y-4">
      {DESIGNER_COMPETENCY_CRITERIA.map((criterion, idx) => (
        <fieldset
          key={criterion.id}
          className="rounded-lg border border-corporate-border p-3 sm:p-4"
          disabled={readOnly}
        >
          <legend className="text-sm font-semibold text-corporate-dark px-1">
            {idx + 1}. {criterion.label}
          </legend>
          <p className={`text-xs text-corporate-muted mt-1 mb-3 ${compact ? 'line-clamp-2' : ''}`}>
            {perspective === 'supervisor' ? criterion.supervisorQuestion : criterion.question}
          </p>
          <div className={`grid gap-2 ${compact ? 'sm:grid-cols-4' : 'sm:grid-cols-2'}`}>
            {criterion.options.map((opt) => {
              const checked = scores[criterion.id] === opt.level;
              return (
                <label
                  key={opt.level}
                  className={[
                    'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs cursor-pointer transition-colors',
                    checked
                      ? 'border-corporate-gold bg-corporate-gold-light/30'
                      : 'border-corporate-border/70 hover:border-corporate-gold/50',
                    readOnly && !checked ? 'opacity-50' : '',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name={criterion.id}
                    value={opt.level}
                    checked={checked}
                    onChange={() => setLevel(criterion.id, opt.level)}
                    className="mt-0.5 shrink-0"
                    disabled={readOnly}
                  />
                  <span>
                    <span className="font-semibold text-corporate-dark">N{opt.level}</span>
                    {' — '}
                    {opt.text}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
