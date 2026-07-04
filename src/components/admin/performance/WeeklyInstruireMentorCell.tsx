import { useState } from 'react';
import { useUsers } from '@/context/UsersContext';
import { userStore } from '@/lib/userStore';
import {
  getWeeklyInstruirePlan,
  inferCurrentTrainingWeekFromProgress,
  resolveUserName,
} from '@/lib/evaluationWeekMentors';
import type { AppProgress, EmployeeProfile } from '@/types';

interface WeeklyInstruireMentorCellProps {
  profile: EmployeeProfile;
  progress: AppProgress | null | undefined;
  inTraining: boolean;
}

/** Mentor principal vizibil; planificarea S1–S4 expandabilă (doar citire) */
export function WeeklyInstruireMentorCell({ profile, progress, inTraining }: WeeklyInstruireMentorCellProps) {
  const { users } = useUsers();
  const [open, setOpen] = useState(false);

  if (!inTraining) {
    return <span className="text-xs text-corporate-muted">N/A</span>;
  }

  const principalMentorId = userStore.getActiveEnrollmentForAngajat(profile.userId)?.mentorId;
  const principalName = principalMentorId ? resolveUserName(users, principalMentorId) : '—';
  const currentWeek = inferCurrentTrainingWeekFromProgress(progress);
  const plan = getWeeklyInstruirePlan(profile);
  const hasOverrides = plan.some((row) => row.isOverride);

  return (
    <div className="min-w-[120px]">
      <p className="text-xs font-medium text-corporate-dark">{principalName}</p>
      <p className="text-[10px] text-corporate-muted mt-0.5">Mentor principal</p>

      <button
        type="button"
        className="mt-1 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] leading-tight text-corporate-muted hover:text-corporate-dark hover:bg-corporate-surface transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Ascunde ▲' : `S1–S4${hasOverrides ? ' · planificat' : ''} ▼`}
      </button>

      {open && (
        <ul className="mt-1.5 space-y-0.5 rounded-lg border border-corporate-border bg-corporate-surface/60 px-2 py-1.5">
          {plan.map((row) => {
            const name = resolveUserName(users, row.mentorId);
            const isCurrent = row.weekNumber === currentWeek;
            return (
              <li
                key={row.weekNumber}
                className={`text-[10px] leading-snug ${
                  isCurrent ? 'font-semibold text-corporate-gold' : 'text-corporate-muted'
                }`}
              >
                S{row.weekNumber}: {name}
                {row.isOverride && (
                  <span className="ml-1 font-normal text-corporate-muted">(planificat)</span>
                )}
                {!row.isOverride && row.mentorId && (
                  <span className="ml-1 font-normal text-corporate-muted/80">(Setări)</span>
                )}
                {isCurrent && <span className="ml-1">← acum</span>}
              </li>
            );
          })}
          <li className="text-[10px] text-corporate-muted/80 pt-0.5 italic">Modificare în Setări</li>
        </ul>
      )}
    </div>
  );
}
