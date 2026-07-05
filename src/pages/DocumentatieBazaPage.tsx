import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { ingineriPath } from '@/data/departments';
import { PlanArchiveDayList } from '@/components/training/PlanArchiveDayList';

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

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="success" className="mb-2">
          Plan finalizat
        </Badge>
        <h1 className="text-2xl font-bold text-corporate-dark">Documentație de bază</h1>
        <p className="text-sm text-corporate-muted mt-1">
          Arhivat {new Date(archive.completedAt).toLocaleDateString('ro-RO')} · referință permanentă ·
          apăsați pe o zi pentru fișiere, video și fotografii
        </p>
      </div>

      <Card>
        <PlanArchiveDayList angajatId={user.id} entries={archive.index} groupByWeek />
      </Card>
    </div>
  );
}
