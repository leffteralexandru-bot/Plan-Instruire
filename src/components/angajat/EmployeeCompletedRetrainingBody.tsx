import { useState } from 'react';
import { ReTrainingPlanProgressSection } from '@/components/training/ReTrainingPlanProgressSection';
import type { ReTrainingSession } from '@/types';

interface EmployeeCompletedRetrainingBodyProps {
  angajatId: string;
  sessions: ReTrainingSession[];
}

/** Re-instruiri finalizate — lecție completă expandabilă (mutate din Plan instruire). */
export function EmployeeCompletedRetrainingBody({
  angajatId,
  sessions,
}: EmployeeCompletedRetrainingBodyProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (sessions.length === 0) {
    return <p className="text-sm text-corporate-muted italic">Nicio re-instruire finalizată.</p>;
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <ReTrainingPlanProgressSection
          key={session.id}
          session={session}
          angajatId={angajatId}
          expanded={expandedId === session.id}
          onExpandedChange={(next) => setExpandedId(next ? session.id : null)}
        />
      ))}
    </div>
  );
}
