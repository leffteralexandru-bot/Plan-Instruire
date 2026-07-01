import { CompetencyMatrix } from '@/components/competency/CompetencyMatrix';
import { useProgress } from '@/hooks/useProgress';
import { Card } from '@/components/ui/Card';

export function CompetencyPage() {
  const { progress } = useProgress();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">Matrice Competențe</h1>
        <p className="text-corporate-muted mt-1">
          Evaluare pe axe cheie — date din feedback mentor Săpt. II și IV
        </p>
      </div>

      {progress && progress.feedbacks.length === 0 ? (
        <Card>
          <p className="text-sm text-corporate-muted">
            Matricea se completează după feedback-urile de la Săptămâna II și IV.
          </p>
        </Card>
      ) : (
        <CompetencyMatrix />
      )}
    </div>
  );
}
