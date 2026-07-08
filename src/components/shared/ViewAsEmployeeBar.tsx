import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { traineeAngajatPanelPath, traineePlanPath } from '@/data/departments';
import { usePhoneLayout } from '@/hooks/usePhoneLayout';

interface ViewAsEmployeeBarProps {
  angajatId: string;
  angajatName?: string;
  /** În panouri expand — butoane mai mici, fără titlu lung */
  compact?: boolean;
}

const PHONE_ACTION_BTN =
  '!min-h-0 !h-auto w-full !px-1 !py-1.5 !text-[9px] !leading-tight !rounded-md';

/** Linkuri rapide: plan + panou angajat, ca în contul angajatului */
export function ViewAsEmployeeBar({ angajatId, angajatName, compact }: ViewAsEmployeeBarProps) {
  const phoneLayout = usePhoneLayout();
  const planPath = traineePlanPath(angajatId);
  const panelPath = traineeAngajatPanelPath(angajatId);

  if (compact && phoneLayout) {
    return (
      <div className="grid grid-cols-3 items-stretch gap-1 rounded-lg border border-corporate-gold/25 bg-corporate-gold-light/10 px-2 py-1.5">
        <span className="self-center text-[9px] leading-tight text-corporate-muted">
          Vedere ca angajatul:
        </span>
        <Link to={planPath} className="min-w-0">
          <Button type="button" variant="primary" size="sm" className={PHONE_ACTION_BTN}>
            Plan instruire
          </Button>
        </Link>
        <Link to={panelPath} className="min-w-0">
          <Button type="button" variant="secondary" size="sm" className={PHONE_ACTION_BTN}>
            Panou angajat
          </Button>
        </Link>
      </div>
    );
  }

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
        {!phoneLayout && (
          <p className="text-xs text-corporate-muted mt-0.5">
            {angajatName
              ? `Deschide planul și panoul exact cum le vede ${angajatName} în contul său.`
              : 'Deschide planul și panoul din perspectiva angajatului.'}
          </p>
        )}
      </div>
      <div
        className={
          phoneLayout
            ? 'grid w-full grid-cols-2 gap-1 shrink-0'
            : 'flex flex-wrap gap-2 shrink-0'
        }
      >
        <Link to={planPath} className={phoneLayout ? 'min-w-0' : undefined}>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className={phoneLayout ? PHONE_ACTION_BTN : undefined}
          >
            {phoneLayout ? 'Plan instruire' : 'Plan instruire →'}
          </Button>
        </Link>
        <Link to={panelPath} className={phoneLayout ? 'min-w-0' : undefined}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={phoneLayout ? PHONE_ACTION_BTN : undefined}
          >
            {phoneLayout ? 'Panou angajat' : 'Panou angajat →'}
          </Button>
        </Link>
      </div>
    </div>
  );
}
