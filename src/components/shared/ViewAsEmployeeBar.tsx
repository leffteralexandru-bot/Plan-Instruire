import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { traineeAngajatPanelPath, traineePlanPath } from '@/data/departments';

interface ViewAsEmployeeBarProps {
  angajatId: string;
  angajatName?: string;
  /** În panouri expand — butoane mai mici, fără titlu lung */
  compact?: boolean;
}

/** Linkuri rapide: plan + panou angajat, ca în contul angajatului */
export function ViewAsEmployeeBar({ angajatId, angajatName, compact }: ViewAsEmployeeBarProps) {
  const planPath = traineePlanPath(angajatId);
  const panelPath = traineeAngajatPanelPath(angajatId);

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-corporate-gold/25 bg-corporate-gold-light/10 px-3 py-2">
        <span className="text-xs text-corporate-muted mr-auto">Vedere ca angajatul:</span>
        <Link to={planPath}>
          <Button type="button" variant="primary" size="sm">
            Plan instruire
          </Button>
        </Link>
        <Link to={panelPath}>
          <Button type="button" variant="secondary" size="sm">
            Panou angajat
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-corporate-gold/30 bg-corporate-gold-light/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-corporate-dark">Vedere ca angajatul</p>
        <p className="text-xs text-corporate-muted mt-0.5">
          {angajatName
            ? `Deschide planul și panoul exact cum le vede ${angajatName} în contul său.`
            : 'Deschide planul și panoul din perspectiva angajatului.'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <Link to={planPath}>
          <Button type="button" variant="primary" size="sm">
            Plan instruire →
          </Button>
        </Link>
        <Link to={panelPath}>
          <Button type="button" variant="secondary" size="sm">
            Panou angajat →
          </Button>
        </Link>
      </div>
    </div>
  );
}
