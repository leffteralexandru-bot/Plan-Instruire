import { Link } from 'react-router-dom';
import { TRAINING_PLAN } from '@/data/trainingPlan';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { ingineriPath } from '@/data/departments';

export function DocumentatieBazaPage() {
  const { user } = useAuth();
  if (!user) return null;

  const archive = trainingSystemStore.getPlanArchive(user.id);

  if (!archive) {
    return (
      <Card>
        <h1 className="text-xl font-bold text-corporate-dark mb-2">Documentație de bază</h1>
        <p className="text-sm text-corporate-muted mb-4">
          Această secțiune devine disponibilă după finalizarea completă a planului de instruire.
          Materialele rămân accesibile permanent ca referință pentru măsurători și proiectare.
        </p>
        <Link to={ingineriPath('/plan-instruire')}>
          <Button type="button" variant="primary" size="sm">
            Continuă planul →
          </Button>
        </Link>
      </Card>
    );
  }

  const byWeek = TRAINING_PLAN.map((week) => ({
    week,
    entries: archive.index.filter((e) => e.weekId === week.id),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="success" className="mb-2">
          Plan finalizat
        </Badge>
        <h1 className="text-2xl font-bold text-corporate-dark">Documentație de bază</h1>
        <p className="text-sm text-corporate-muted mt-1">
          Arhivat {new Date(archive.completedAt).toLocaleDateString('ro-RO')} · referință permanentă
        </p>
      </div>

      {byWeek.map(({ week, entries }) => (
        <Card key={week.id}>
          <h2 className="font-semibold text-corporate-dark mb-3">
            Săptămâna {week.weekNumber}: {week.title}
          </h2>
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.dayId} className="rounded-lg border border-corporate-border p-3">
                <p className="font-medium text-corporate-dark">
                  Ziua {entry.dayNumber}: {entry.dayTitle}
                </p>
                {entry.instructions.length > 0 && (
                  <ul className="mt-2 text-sm text-corporate-muted list-disc pl-5 space-y-0.5">
                    {entry.instructions.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                )}
                {entry.materials.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.materials.map((m) => (
                      <a
                        key={m.id}
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-corporate-gold hover:underline"
                      >
                        {m.title}
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
