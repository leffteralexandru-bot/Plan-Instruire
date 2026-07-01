import type { DevelopmentPlan } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';

interface DevelopmentPlanFormProps {
  existing?: DevelopmentPlan;
  mentorName: string;
  onSave: (plan: Omit<DevelopmentPlan, 'completedAt'>) => void;
  readOnly?: boolean;
}

export function DevelopmentPlanForm({ existing, mentorName, onSave, readOnly }: DevelopmentPlanFormProps) {
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSave({
      obiective6Luni: fd.get('obiective') as string,
      competenteDeDezvoltat: fd.get('competente') as string,
      proiecteTinta: fd.get('proiecte') as string,
      mentorAcord: mentorName,
    });
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">Plan dezvoltare post-instruire</h2>
      <p className="text-sm text-corporate-muted mb-4">Următorii 6 luni — obiective și competențe de dezvoltat</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea id="obiective" name="obiective" label="Obiective 6 luni" required />
        <Textarea id="competente" name="competente" label="Competențe de dezvoltat" required />
        <Textarea id="proiecte" name="proiecte" label="Tipuri proiecte țintă" required />
        <Button type="submit" variant="primary">Salvează plan dezvoltare</Button>
      </form>
    </Card>
  );
}
