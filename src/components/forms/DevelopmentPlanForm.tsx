import { useMemo, useState } from 'react';
import type { DevelopmentPlan } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AutoSaveStatusText } from '@/components/shared/AutoSaveIndicator';

interface DevelopmentPlanFormProps {
  existing?: DevelopmentPlan;
  mentorName: string;
  onSave: (plan: Omit<DevelopmentPlan, 'completedAt'>) => void;
  readOnly?: boolean;
}

const EMPTY_DRAFT = {
  obiective6Luni: '',
  competenteDeDezvoltat: '',
  proiecteTinta: '',
};

export function DevelopmentPlanForm({ existing, mentorName, onSave, readOnly }: DevelopmentPlanFormProps) {
  const [obiective, setObiective] = useState('');
  const [competente, setCompetente] = useState('');
  const [proiecte, setProiecte] = useState('');

  const draft = useMemo(
    () => ({ obiective6Luni: obiective, competenteDeDezvoltat: competente, proiecteTinta: proiecte }),
    [obiective, competente, proiecte],
  );

  const { status: autoSaveStatus, flush } = useAutoSave({
    draft,
    baseline: EMPTY_DRAFT,
    enabled: !readOnly && !existing,
    save: (d) => {
      if (!d.obiective6Luni.trim() || !d.competenteDeDezvoltat.trim() || !d.proiecteTinta.trim()) return;
      onSave({ ...d, mentorAcord: mentorName });
    },
  });

  if (existing) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-corporate-dark mb-4">Plan dezvoltare 6 luni</h2>
        <div className="space-y-3 text-sm text-slate-700">
          <p><strong>Obiective:</strong> {existing.obiective6Luni}</p>
          <p><strong>Competențe:</strong> {existing.competenteDeDezvoltat}</p>
          <p><strong>Proiecte țintă:</strong> {existing.proiecteTinta}</p>
          <p><strong>Acord mentor:</strong> {existing.mentorAcord}</p>
        </div>
      </Card>
    );
  }

  if (readOnly) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await flush();
  };

  const canSave = obiective.trim() && competente.trim() && proiecte.trim();

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">Plan dezvoltare post-instruire</h2>
      <p className="text-sm text-corporate-muted mb-4">Următorii 6 luni — obiective și competențe de dezvoltat</p>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <Textarea
          id="obiective"
          name="obiective"
          label="Obiective 6 luni"
          value={obiective}
          onChange={(e) => setObiective(e.target.value)}
          required
        />
        <Textarea
          id="competente"
          name="competente"
          label="Competențe de dezvoltat"
          value={competente}
          onChange={(e) => setCompetente(e.target.value)}
          required
        />
        <Textarea
          id="proiecte"
          name="proiecte"
          label="Tipuri proiecte țintă"
          value={proiecte}
          onChange={(e) => setProiecte(e.target.value)}
          required
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" disabled={!canSave || autoSaveStatus === 'saving'}>
            {autoSaveStatus === 'saving' ? 'Se salvează…' : 'Salvează plan dezvoltare'}
          </Button>
          <AutoSaveStatusText className="hidden @md:block" />
        </div>
      </form>
    </Card>
  );
}
