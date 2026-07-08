import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { AdminTab } from '@/components/admin/performance/AdminTabNav';
import { useUsers } from '@/context/UsersContext';
import { storage } from '@/store/storage';
import { ingineriPath } from '@/data/departments';
import { adminPath } from '@/lib/adminRoutes';
import {
  computeManagementDashboardMetrics,
} from '@/lib/managementDashboard';
import { downloadManagementDashboardPdf, openManagementDashboardPdf } from '@/lib/exportManagementDashboardPdf';
import { usePhoneLayout } from '@/hooks/usePhoneLayout';
import { ManagementTrendSection } from '@/components/admin/performance/ManagementTrendSection';

export function ManagementDashboardPanel({ onOpenTab }: { onOpenTab?: (tab: AdminTab) => void }) {
  const { allTrainees } = useUsers();
  const phoneLayout = usePhoneLayout();
  const settings = storage.getSettings();
  const [pdfLoading, setPdfLoading] = useState(false);

  const metrics = useMemo(
    () => computeManagementDashboardMetrics(allTrainees, settings.programVersion),
    [allTrainees, settings.programVersion],
  );

  const handleExportPdf = async () => {
    setPdfLoading(true);
    try {
      if (phoneLayout) {
        await openManagementDashboardPdf(metrics, { programVersion: settings.programVersion });
      } else {
        await downloadManagementDashboardPdf(metrics, { programVersion: settings.programVersion });
      }
    } finally {
      setPdfLoading(false);
    }
  };

  const pdfButtonLabel = phoneLayout
    ? pdfLoading
      ? 'Se generează…'
      : 'Raport PDF'
    : pdfLoading
      ? 'Se generează raportul…'
      : 'Descarcă raport PDF';

  return (
    <div className="space-y-4">
      <Card padding="sm">
        {phoneLayout ? (
          <div className="flex items-center justify-between gap-2">
            <h2 className="min-w-0 text-base font-semibold text-corporate-dark">Dashboard Management</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pdfLoading}
              onClick={() => void handleExportPdf()}
              className="!min-h-0 shrink-0 !px-2 !py-1.5 !text-[10px] !leading-tight"
            >
              {pdfButtonLabel}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-corporate-dark">Dashboard Management</h2>
              <p className="text-sm text-corporate-muted mt-1">
                Retenție instruire · evaluări la timp · trend erori · gap-uri dezvoltare.
              </p>
            </div>
            <div className="flex flex-col items-stretch sm:items-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pdfLoading}
                onClick={() => void handleExportPdf()}
              >
                {pdfButtonLabel}
              </Button>
              <p className="text-[10px] text-corporate-muted text-right max-w-[220px] leading-snug">
                Document executiv branduit — KPI, trend, gap-uri și recomandări. Deschide direct în browser sau Acrobat.
              </p>
            </div>
          </div>
        )}
      </Card>

      <div className={phoneLayout ? 'grid grid-cols-2 gap-2' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4'}>
        <Kpi compact={phoneLayout} label="Angajați activi" value={String(metrics.totalAngajati)} />
        <Kpi
          compact={phoneLayout}
          label="Progres instruire mediu"
          value={`${metrics.progresInstruireMediu}%`}
          sub={`${metrics.angajatiInInstruire} în program`}
        />
        <Kpi
          compact={phoneLayout}
          label="Finalizare instruire"
          value={`${metrics.rataFinalizareInstruire}%`}
          sub={`${metrics.certificateEmise} certificate`}
          highlight={metrics.rataFinalizareInstruire < 50}
        />
        <Kpi
          compact={phoneLayout}
          label="Evaluări la timp"
          value={`${metrics.rataEvaluariLaTimp}%`}
          sub={`${metrics.evaluariIntarziate} întârziate`}
          highlight={metrics.evaluariIntarziate > 0}
        />
      </div>

      <div className={phoneLayout ? 'grid grid-cols-2 gap-2' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4'}>
        <Kpi compact={phoneLayout} label="Erori luna curentă" value={String(metrics.eroriLunaCurenta)} />
        <Kpi
          compact={phoneLayout}
          label="Planuri acțiune deschise"
          value={String(metrics.planuriActiuneDeschise)}
          highlight={metrics.planuriActiuneDeschise > 0}
        />
        <Kpi
          compact={phoneLayout}
          label="Re-instruiri active"
          value={String(metrics.reInstruiriActive)}
          highlight={metrics.reInstruiriActive > 0}
        />
        <Kpi
          compact={phoneLayout}
          label="Validări mentor"
          value={String(metrics.validariMentorPending)}
          sub="pending"
          highlight={metrics.validariMentorPending > 0}
        />
      </div>

      {metrics.trend.length > 0 && (
        <Card padding={phoneLayout ? 'sm' : 'md'}>
          <ManagementTrendSection points={metrics.trend} compact={phoneLayout} />
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="sm">
          <h3 className="text-sm font-semibold text-corporate-dark mb-3">Sănătate evaluări 90 zile</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-corporate-muted">La timp / în curs</span>
              <strong className="text-emerald-700">{metrics.evaluariLaTimp}</strong>
            </li>
            <li className="flex justify-between">
              <span className="text-corporate-muted">Întârziate</span>
              <strong className={metrics.evaluariIntarziate ? 'text-amber-700' : ''}>
                {metrics.evaluariIntarziate}
              </strong>
            </li>
            <li className="flex justify-between">
              <span className="text-corporate-muted">Total active</span>
              <strong>{metrics.evaluariInCurs + metrics.evaluariIntarziate}</strong>
            </li>
          </ul>
          {onOpenTab ? (
            <button
              type="button"
              onClick={() => onOpenTab('evaluari')}
              className="text-xs text-corporate-gold hover:underline mt-3 inline-block"
            >
              Detalii → tab Evaluări
            </button>
          ) : (
            <Link to={adminPath('evaluari')} className="text-xs text-corporate-gold hover:underline mt-3 inline-block">
              Detalii → tab Evaluări
            </Link>
          )}
        </Card>

        <Card padding="sm">
          <h3 className="text-sm font-semibold text-corporate-dark mb-3">Operațiuni deschise</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-corporate-muted">Re-instruiri active</span>
              <strong className={metrics.reInstruiriActive ? 'text-amber-700' : ''}>
                {metrics.reInstruiriActive}
              </strong>
            </li>
            <li className="flex justify-between">
              <span className="text-corporate-muted">Validări mentor pending</span>
              <strong className={metrics.validariMentorPending ? 'text-amber-700' : ''}>
                {metrics.validariMentorPending}
              </strong>
            </li>
            <li className="flex justify-between">
              <span className="text-corporate-muted">Planuri acțiune deschise</span>
              <strong>{metrics.planuriActiuneDeschise}</strong>
            </li>
          </ul>
          <div className="flex flex-wrap gap-3 mt-3">
            {onOpenTab ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenTab('supervizor')}
                  className="text-xs text-corporate-gold hover:underline"
                >
                  Re-instruiri →
                </button>
                <button
                  type="button"
                  onClick={() => onOpenTab('instruire')}
                  className="text-xs text-corporate-muted hover:underline"
                >
                  Instruire →
                </button>
              </>
            ) : (
              <>
                <Link to={adminPath('supervizor')} className="text-xs text-corporate-gold hover:underline">
                  Re-instruiri →
                </Link>
                <Link to={adminPath('instruire')} className="text-xs text-corporate-muted hover:underline">
                  Instruire →
                </Link>
              </>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-corporate-dark">Gap-uri dezvoltare (evaluări finalizate)</h3>
          <Badge variant="default">{metrics.developmentGaps.length}</Badge>
        </div>
        <p className="text-xs text-corporate-muted mb-4">
          Angajați cu scor mediu sub 3,5 sau fără plan de dezvoltare — acțiune HR / supervizor.
        </p>
        {metrics.developmentGaps.length === 0 ? (
          <p className="text-sm text-emerald-700">Niciun gap identificat în evaluările finalizate.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-corporate-border text-left text-xs text-corporate-muted">
                  <th className="py-2 pr-3">Angajat</th>
                  <th className="py-2 pr-3">Scor mediu</th>
                  <th className="py-2 pr-3">Motiv</th>
                  <th className="py-2">Fișă</th>
                </tr>
              </thead>
              <tbody>
                {metrics.developmentGaps.map((g) => (
                  <tr key={g.evaluationId} className="border-b border-corporate-border/60">
                    <td className="py-2 pr-3 font-medium">{g.angajatName}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={g.scorMediu < 3 ? 'warning' : 'default'}>{g.scorMediu}/5</Badge>
                    </td>
                    <td className="py-2 pr-3 text-xs text-corporate-muted">{g.motiv}</td>
                    <td className="py-2">
                      <Link
                        to={ingineriPath(`/angajat/${g.angajatId}`)}
                        className="text-corporate-gold text-xs font-medium hover:underline"
                      >
                        Deschide →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  highlight,
  compact,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  compact?: boolean;
}) {
  return (
    <Card padding="sm" className={compact ? '!p-2.5' : ''}>
      <p
        className={
          compact
            ? 'text-[8px] leading-tight uppercase tracking-wide text-corporate-muted'
            : 'text-[10px] uppercase tracking-wide text-corporate-muted'
        }
      >
        {label}
      </p>
      <p
        className={[
          compact ? 'text-lg' : 'text-2xl',
          'font-bold mt-0.5',
          highlight ? 'text-amber-600' : 'text-corporate-dark',
        ].join(' ')}
      >
        {value}
      </p>
      {sub && (
        <p
          className={
            compact
              ? 'text-[9px] leading-tight text-corporate-muted mt-0.5'
              : 'text-xs text-corporate-muted mt-0.5'
          }
        >
          {sub}
        </p>
      )}
    </Card>
  );
}
