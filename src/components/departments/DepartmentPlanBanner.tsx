import { Link, useLocation } from 'react-router-dom';
import { getDepartmentFromPath } from '@/data/departments';

export function DepartmentPlanBanner() {
  const { pathname } = useLocation();
  const dept = getDepartmentFromPath(pathname);

  if (!dept?.planAvailable) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-corporate-border bg-white px-4 py-3 text-sm">
      <div>
        <span className="text-corporate-muted">Departament: </span>
        <strong className="text-corporate-dark">{dept.label}</strong>
        <span className="text-corporate-muted"> — {dept.subtitle}</span>
      </div>
      <Link to="/" className="text-corporate-gold font-medium hover:underline text-xs">
        Schimbă departamentul
      </Link>
    </div>
  );
}
