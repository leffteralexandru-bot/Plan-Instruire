import { useMemo, useState } from 'react';
import type { FeedbackForm } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea, Select } from '@/components/ui/Input';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AutoSaveStatusText } from '@/components/shared/AutoSaveIndicator';

const RATING_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({
  value: n,
  label: `${n} — ${['Slab', 'Sub medie', 'Mediu', 'Bun', 'Excelent'][n - 1]}`,
}));

interface FeedbackFormProps {
  weekNumber: 2 | 4;
  existing?: FeedbackForm;
  mentorName: string;
  onSave: (feedback: FeedbackForm) => void;
  formIdPrefix?: string;
}

type FeedbackDraft = {
  autonomieProliner: FeedbackForm['autonomieProliner'];
  proiectareFaraErori: FeedbackForm['proiectareFaraErori'];
  integrareEchipa: FeedbackForm['integrareEchipa'];
  comentarii: string;
};

export function MentorFeedbackForm({ weekNumber, existing, mentorName, onSave, formIdPrefix = '' }: FeedbackFormProps) {
  const [submitted, setSubmitted] = useState(!!existing);
  const [autonomieProliner, setAutonomieProliner] = useState<FeedbackForm['autonomieProliner']>(
    existing?.autonomieProliner ?? 3,
  );
  const [proiectareFaraErori, setProiectareFaraErori] = useState<FeedbackForm['proiectareFaraErori']>(
    existing?.proiectareFaraErori ?? 3,
  );
  const [integrareEchipa, setIntegrareEchipa] = useState<FeedbackForm['integrareEchipa']>(
    existing?.integrareEchipa ?? 3,
  );
  const [comentarii, setComentarii] = useState(existing?.comentarii ?? '');

  const draft = useMemo<FeedbackDraft>(
    () => ({ autonomieProliner, proiectareFaraErori, integrareEchipa, comentarii }),
    [autonomieProliner, proiectareFaraErori, integrareEchipa, comentarii],
  );

  const baseline = useMemo<FeedbackDraft>(
    () => ({
      autonomieProliner: existing?.autonomieProliner ?? 3,
      proiectareFaraErori: existing?.proiectareFaraErori ?? 3,
      integrareEchipa: existing?.integrareEchipa ?? 3,
      comentarii: existing?.comentarii ?? '',
    }),
    [existing],
  );

  const { status: autoSaveStatus, flush } = useAutoSave({
    draft,
    baseline,
    enabled: !submitted,
    save: (d) => {
      if (!d.comentarii.trim()) return;
      onSave({
        weekNumber,
        autonomieProliner: d.autonomieProliner,
        proiectareFaraErori: d.proiectareFaraErori,
        integrareEchipa: d.integrareEchipa,
        comentarii: d.comentarii,
        mentorName,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!comentarii.trim()) return;
    await flush();
    setSubmitted(true);
  };

  const weekLabel = weekNumber === 2 ? 'Săptămâna II — Practică Asistată' : 'Săptămâna IV — Evaluare Finală';

  return (
    <Card>
      <h3 className="text-lg font-semibold text-corporate-dark mb-1">
        Feedback Evaluare — {weekLabel}
      </h3>
      <p className="text-sm text-corporate-muted mb-5">
        Criterii: autonomie Proliner, proiectare fără erori, integrare echipă
      </p>

      {existing && submitted ? (
        <FeedbackSummary feedback={existing} />
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <Select
            id={`${formIdPrefix}autonomie-${weekNumber}`}
            name="autonomieProliner"
            label="Autonomie utilizare Proliner"
            options={RATING_OPTIONS}
            value={autonomieProliner}
            onChange={(e) => setAutonomieProliner(Number(e.target.value) as FeedbackForm['autonomieProliner'])}
            required
          />
          <Select
            id={`${formIdPrefix}proiectare-${weekNumber}`}
            name="proiectareFaraErori"
            label="Proiectare fără erori"
            options={RATING_OPTIONS}
            value={proiectareFaraErori}
            onChange={(e) => setProiectareFaraErori(Number(e.target.value) as FeedbackForm['proiectareFaraErori'])}
            required
          />
          <Select
            id={`${formIdPrefix}echipa-${weekNumber}`}
            name="integrareEchipa"
            label="Integrare în echipă"
            options={RATING_OPTIONS}
            value={integrareEchipa}
            onChange={(e) => setIntegrareEchipa(Number(e.target.value) as FeedbackForm['integrareEchipa'])}
            required
          />
          <Textarea
            id={`${formIdPrefix}comentarii-${weekNumber}`}
            name="comentarii"
            label="Comentarii suplimentare"
            placeholder="Puncte forte, zone de îmbunătățire, recomandări..."
            value={comentarii}
            onChange={(e) => setComentarii(e.target.value)}
            required
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="secondary" disabled={!comentarii.trim() || autoSaveStatus === 'saving'}>
              {autoSaveStatus === 'saving' ? 'Se salvează…' : 'Salvează feedback'}
            </Button>
            <AutoSaveStatusText className="hidden @md:block" />
          </div>
        </form>
      )}
    </Card>
  );
}

function FeedbackSummary({ feedback }: { feedback: FeedbackForm }) {
  const criteria = [
    { label: 'Autonomie Proliner', value: feedback.autonomieProliner },
    { label: 'Proiectare fără erori', value: feedback.proiectareFaraErori },
    { label: 'Integrare echipă', value: feedback.integrareEchipa },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {criteria.map((c) => (
          <div key={c.label} className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-2xl font-bold text-corporate-accent">{c.value}/5</p>
            <p className="text-xs text-corporate-muted mt-1">{c.label}</p>
          </div>
        ))}
      </div>
      {feedback.comentarii && (
        <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4">{feedback.comentarii}</p>
      )}
      {feedback.completedAt && (
        <p className="text-xs text-slate-400">
          Completat la {new Date(feedback.completedAt).toLocaleString('ro-RO')}
          {feedback.mentorName && ` · ${feedback.mentorName}`}
        </p>
      )}
    </div>
  );
}

export { FeedbackSummary };
