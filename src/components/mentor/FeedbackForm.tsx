import { useState } from 'react';
import type { FeedbackForm } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea, Select } from '@/components/ui/Input';

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

export function MentorFeedbackForm({ weekNumber, existing, mentorName, onSave, formIdPrefix = '' }: FeedbackFormProps) {
  const [submitted, setSubmitted] = useState(!!existing);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSave({
      weekNumber,
      autonomieProliner: Number(fd.get('autonomieProliner')) as FeedbackForm['autonomieProliner'],
      proiectareFaraErori: Number(fd.get('proiectareFaraErori')) as FeedbackForm['proiectareFaraErori'],
      integrareEchipa: Number(fd.get('integrareEchipa')) as FeedbackForm['integrareEchipa'],
      comentarii: fd.get('comentarii') as string,
      mentorName,
    });
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            id={`${formIdPrefix}autonomie-${weekNumber}`}
            name="autonomieProliner"
            label="Autonomie utilizare Proliner"
            options={RATING_OPTIONS}
            defaultValue={existing?.autonomieProliner ?? 3}
            required
          />
          <Select
            id={`${formIdPrefix}proiectare-${weekNumber}`}
            name="proiectareFaraErori"
            label="Proiectare fără erori"
            options={RATING_OPTIONS}
            defaultValue={existing?.proiectareFaraErori ?? 3}
            required
          />
          <Select
            id={`${formIdPrefix}echipa-${weekNumber}`}
            name="integrareEchipa"
            label="Integrare în echipă"
            options={RATING_OPTIONS}
            defaultValue={existing?.integrareEchipa ?? 3}
            required
          />
          <Textarea
            id={`${formIdPrefix}comentarii-${weekNumber}`}
            name="comentarii"
            label="Comentarii suplimentare"
            placeholder="Puncte forte, zone de îmbunătățire, recomandări..."
            defaultValue={existing?.comentarii}
            required
          />
          <Button type="submit" variant="secondary">
            Salvează feedback
          </Button>
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
