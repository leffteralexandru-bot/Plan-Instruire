import { useLocation } from 'react-router-dom';
import { getDepartmentFromPath } from '@/data/departments';
import { DepartmentGlyph } from '@/components/departments/DepartmentGlyph';

export function DepartmentPlanBanner() {
  const { pathname } = useLocation();
  const dept = getDepartmentFromPath(pathname);

  if (!dept?.planAvailable) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-corporate-border bg-white px-4 py-3 text-sm">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-corporate-gold/30 bg-corporate-gold-light text-corporate-gold">
        <DepartmentGlyph id={dept.id} className="h-4 w-4" />
      </span>
      <div>
        <strong className="text-corporate-dark">{dept.label}</strong>
        <span className="text-corporate-muted"> — {dept.subtitle}</span>
      </div>
    </div>
  );
}
