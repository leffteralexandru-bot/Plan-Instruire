import { ERROR_LIBRARY } from '@/data/errorLibrary';
import { useUsers } from '@/context/UsersContext';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/store/storage';
import { buildErrorHeatmap, aggregateCohortErrorHeatmap } from '@/lib/errorAnalytics';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const FREQ_COLORS: Record<string, 'warning' | 'info' | 'default'> = {
  ridicată: 'warning',
  medie: 'info',
  scăzută: 'default',
};

export function ErrorLibraryView() {
  const { progress } = useProgress();
  const { visibleTrainees } = useUsers();
  const { canAccessMentor } = useAuth();
  const acte = progress?.acteConstatare ?? [];

  const personalHeatmap = buildErrorHeatmap(acte);
  const cohortHeatmap =
    canAccessMentor
      ? aggregateCohortErrorHeatmap(visibleTrainees.map((s) => storage.getProgress(s.id).acteConstatare))
      : null;

  const maxCount = Math.max(...personalHeatmap.map((h) => h.count), 1);

  return (
    <div className="space-y-6">
      {acte.length > 0 && (
        <Card className="border-amber-100 bg-amber-50/30">
          <h2 className="font-semibold text-corporate-dark">Heatmap — actele voastre</h2>
          <p className="text-sm text-corporate-muted mt-1 mb-3">{acte.length} acte mapate la biblioteca artGRANIT</p>
          <div className="space-y-2">
            {personalHeatmap
              .filter((h) => h.count > 0)
              .map((h) => (
                <div key={h.errorId}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span>{h.title}</span>
                    <span>{h.count}×</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${(h.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            {!personalHeatmap.some((h) => h.count > 0) && (
              <p className="text-xs text-corporate-muted">Nicio potrivire automată — verificați descrierile din acte.</p>
            )}
          </div>
        </Card>
      )}

      {cohortHeatmap && cohortHeatmap.some((h) => h.count > 0) && (
        <Card>
          <h2 className="font-semibold text-corporate-dark">Heatmap cohortă (toți stagiarii)</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {cohortHeatmap
              .filter((h) => h.count > 0)
              .map((h) => (
                <Badge key={h.errorId} variant="warning">
                  {h.category}: {h.count}×
                </Badge>
              ))}
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {ERROR_LIBRARY.map((e) => {
          const hit = personalHeatmap.find((h) => h.errorId === e.id);
          return (
            <Card key={e.id} padding="sm">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="info">{e.category}</Badge>
                <Badge variant={FREQ_COLORS[e.frequency] ?? 'default'}>{e.frequency}</Badge>
                {hit && hit.count > 0 && (
                  <Badge variant="warning">{hit.count} în actele voastre</Badge>
                )}
              </div>
              <h3 className="font-semibold text-corporate-dark">{e.title}</h3>
              <p className="text-sm text-corporate-muted mt-1">{e.description}</p>
              <p className="text-sm text-emerald-700 mt-2">
                <strong>Prevenție:</strong> {e.preventie}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
