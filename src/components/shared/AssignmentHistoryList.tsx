import { resolveUserName } from '@/lib/evaluationWeekMentors';
import type { AssignmentHistoryEntry, User } from '@/types';

function formatChangedAt(iso: string): string {
  return new Date(iso).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' });
}

function formatTransition(users: User[], fromId?: string, toId?: string): string {
  const from = fromId ? resolveUserName(users, fromId) : '—';
  const to = toId ? resolveUserName(users, toId) : 'mentor principal (implicit)';
  return `${from} → ${to}`;
}

export function CurrentAssigneeLabel({
  label,
  userId,
  users,
}: {
  label: string;
  userId?: string;
  users: User[];
}) {
  const name = userId ? resolveUserName(users, userId) : '— Nesetat';
  return (
    <p className="text-xs text-corporate-muted mb-1.5">
      {label} (actual): <strong className="text-corporate-dark font-medium">{name}</strong>
    </p>
  );
}

export function AssignmentHistoryList({
  entries,
  users,
  label,
}: {
  entries?: AssignmentHistoryEntry[];
  users: User[];
  label: string;
}) {
  if (!entries?.length) return null;

  return (
    <details className="mt-1">
      <summary className="text-[10px] text-corporate-muted cursor-pointer hover:text-corporate-dark select-none">
        Istoric {label} ({entries.length})
      </summary>
      <ul className="mt-1 pl-2 border-l border-corporate-border space-y-1 max-h-28 overflow-y-auto">
        {[...entries].reverse().map((entry) => (
          <li key={entry.id} className="text-[10px] text-corporate-muted leading-snug">
            <span className="text-corporate-dark">{formatChangedAt(entry.changedAt)}</span>
            {' · '}
            {formatTransition(users, entry.fromUserId, entry.toUserId)}
            {entry.changedByName && (
              <span className="block text-[9px] opacity-75">de {entry.changedByName}</span>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
