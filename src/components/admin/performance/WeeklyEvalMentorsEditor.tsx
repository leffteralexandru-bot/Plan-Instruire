import { useMemo } from 'react';
import { useUsers } from '@/context/UsersContext';
import { userStore } from '@/lib/userStore';
import { getWeeklyMentorHistoryForWeek } from '@/lib/assignmentHistory';
import {
  EVALUATION_WEEK_LABELS,
  resolveUserName,
  resolveWeeklyInstruireMentor,
} from '@/lib/evaluationWeekMentors';
import {
  AssignmentHistoryList,
  CurrentAssigneeLabel,
} from '@/components/shared/AssignmentHistoryList';
import { SearchablePersonSelect } from '@/components/shared/SearchablePersonSelect';
import type { EmployeeProfile } from '@/types';

interface WeeklyEvalMentorsEditorProps {
  profile: EmployeeProfile;
  compact?: boolean;
  draftMode?: boolean;
  weeklyDraft?: Record<number, string>;
  principalMentorId?: string;
  onWeeklyDraftChange?: (weekNumber: number, mentorId: string) => void;
}

/** Editor mentori S1–S4 — folosit doar în Setări */
export function WeeklyEvalMentorsEditor({
  profile,
  compact,
  draftMode,
  weeklyDraft,
  principalMentorId,
  onWeeklyDraftChange,
}: WeeklyEvalMentorsEditorProps) {
  const { users, mentorCandidates } = useUsers();

  const mentorOptions = useMemo(
    () => mentorCandidates.filter((m) => m.id !== profile.userId),
    [mentorCandidates, profile.userId],
  );

  const savedPrincipalMentorId =
    userStore.getActiveEnrollmentForAngajat(profile.userId)?.mentorId;
  const draftPrincipalId = principalMentorId ?? savedPrincipalMentorId;
  const principalName = draftPrincipalId ? resolveUserName(users, draftPrincipalId) : null;

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3 p-4 rounded-xl bg-corporate-surface border border-corporate-border'}>
      {!compact && (
        <div>
          <h4 className="text-sm font-semibold text-corporate-dark">Mentori instruire per săptămână</h4>
          <p className="text-xs text-corporate-muted mt-0.5">
            Mentorul principal vine din înscriere. Aici setați mentori diferiți pe S1–S4, dacă e nevoie.
          </p>
        </div>
      )}
      {compact && principalName && (
        <p className="text-[10px] text-corporate-muted">
          Gol = mentor principal: <strong>{principalName}</strong>
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {EVALUATION_WEEK_LABELS.map(({ weekNumber, title }) => {
          const savedOverride =
            profile.weeklyEvalMentors?.find((w) => w.weekNumber === weekNumber)?.mentorId ?? '';
          const draftOverride = draftMode ? (weeklyDraft?.[weekNumber] ?? '') : savedOverride;
          const { mentorId: savedEffectiveMentorId } = resolveWeeklyInstruireMentor(profile, weekNumber);
          const draftEffectiveMentorId = draftOverride || draftPrincipalId;

          const weekHistory = getWeeklyMentorHistoryForWeek(
            profile.assignmentHistory,
            weekNumber,
          );

          return (
            <div key={weekNumber} className="block text-sm">
              <span className="text-corporate-muted text-xs">
                Săpt. {weekNumber} — {title}
              </span>
              <CurrentAssigneeLabel
                label={`S${weekNumber}`}
                userId={savedEffectiveMentorId}
                users={users}
              />
              {draftMode && draftEffectiveMentorId !== savedEffectiveMentorId && (
                <p className="text-[10px] text-amber-700 -mt-1 mb-1">
                  Nou: {draftEffectiveMentorId ? resolveUserName(users, draftEffectiveMentorId) : '—'}
                </p>
              )}
              <SearchablePersonSelect
                value={draftOverride}
                options={mentorOptions}
                onChange={(mentorId) => {
                  if (draftMode && onWeeklyDraftChange) {
                    onWeeklyDraftChange(weekNumber, mentorId);
                  }
                }}
                placeholder="Caută mentor pentru săptămână…"
                allowEmpty
                emptyLabel={principalName ? `Implicit: ${principalName}` : '— Mentor principal —'}
                disabled={!draftMode}
                resetKey={`${profile.userId}-s${weekNumber}`}
              />
              <AssignmentHistoryList
                entries={weekHistory}
                users={users}
                label={`S${weekNumber}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
