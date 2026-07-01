import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { EmployeeArchiveFolder } from '@/types';
import { ARCHIVE_FOLDER_DESCRIPTIONS, ARCHIVE_FOLDER_LABELS } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { useAuth } from '@/hooks/useAuth';
import { canAccessEmployeeArchive } from '@/lib/accessControl';
import { ingineriPath } from '@/data/departments';
import { ERROR_MOTIV_LABELS } from '@/lib/hrPerformanceStore';

const FOLDERS: EmployeeArchiveFolder[] = [
  'documentatie_baza',
  'istoric_evaluari',
  'istoric_instruire',
];

interface EmployeeArchivePanelProps {
  angajatId: string;
  showPlanLink?: boolean;
}

export function EmployeeArchivePanel({ angajatId, showPlanLink }: EmployeeArchivePanelProps) {
  const { user } = useAuth();
  const { downloadDocument } = useHrPerformance();
  const [activeFolder, setActiveFolder] = useState<EmployeeArchiveFolder>('documentatie_baza');

  if (!canAccessEmployeeArchive(user, angajatId)) {
    return (
      <Card>
        <p className="text-sm text-corporate-muted">Nu aveți acces la arhiva acestui angajat.</p>
      </Card>
    );
  }

  const planArchive = trainingSystemStore.getPlanArchive(angajatId);
  const docs = trainingSystemStore.getDocumentsByFolder(angajatId, activeFolder);
  const reTraining = trainingSystemStore.getReTrainingSessions({ angajatId });

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-corporate-dark">Arhivă angajat</h2>
          <p className="text-sm text-corporate-muted">
            Documentație de bază, evaluări tri-lunale și istoric re-instruire.
          </p>
        </div>
        {showPlanLink && planArchive && (
          <Link to={ingineriPath('/documentatie-baza')}>
            <Button type="button" variant="secondary" size="sm">
              Documentație de bază →
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {FOLDERS.map((folder) => (
          <button
            key={folder}
            type="button"
            onClick={() => setActiveFolder(folder)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFolder === folder
                ? 'bg-corporate-gold text-white'
                : 'bg-corporate-surface text-corporate-dark hover:bg-corporate-border/50'
            }`}
          >
            {ARCHIVE_FOLDER_LABELS[folder]}
          </button>
        ))}
      </div>

      <p className="text-sm text-corporate-muted mb-4">{ARCHIVE_FOLDER_DESCRIPTIONS[activeFolder]}</p>

      {activeFolder === 'documentatie_baza' && (
        <div className="space-y-3">
          {!planArchive ? (
            <p className="text-sm text-corporate-muted italic">
              Documentația de bază se generează automat la finalizarea planului de instruire.
            </p>
          ) : (
            <>
              <p className="text-xs text-corporate-muted">
                Arhivat la {new Date(planArchive.completedAt).toLocaleDateString('ro-RO')} ·{' '}
                {planArchive.index.length} zile indexate
              </p>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {planArchive.index.map((entry) => (
                  <div
                    key={entry.dayId}
                    className="rounded-lg border border-corporate-border px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-corporate-dark">
                      S{entry.weekNumber} · Ziua {entry.dayNumber}: {entry.dayTitle}
                    </p>
                    <p className="text-xs text-corporate-muted mt-1">
                      {entry.materials.length} materiale · {entry.instructions.length} instrucțiuni
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeFolder === 'istoric_instruire' && reTraining.length > 0 && (
        <ul className="space-y-2 mb-4">
          {reTraining.map((s) => (
            <li key={s.id} className="rounded-lg border border-corporate-border px-3 py-2 text-sm">
              <div className="flex justify-between gap-2">
                <strong>{s.titlu}</strong>
                <Badge variant={s.status === 'finalizat' ? 'success' : 'warning'}>{s.status}</Badge>
              </div>
              <p className="text-xs text-corporate-muted mt-1">
                {ERROR_MOTIV_LABELS[s.errorMotiv]} · termen {s.termenLimita}
              </p>
            </li>
          ))}
        </ul>
      )}

      {docs.length === 0 && activeFolder !== 'documentatie_baza' ? (
        <p className="text-sm text-corporate-muted italic">Niciun document în acest folder.</p>
      ) : (
        activeFolder !== 'documentatie_baza' && (
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-corporate-border px-3 py-2 text-sm"
              >
                <span>{doc.nume}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => void downloadDocument(doc.id)}>
                  Descarcă
                </Button>
              </li>
            ))}
          </ul>
        )
      )}
    </Card>
  );
}
