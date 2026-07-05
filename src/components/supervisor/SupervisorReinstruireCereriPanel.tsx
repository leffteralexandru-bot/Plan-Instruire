import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import {
  REINSTITUIRE_CERERE_MOTIV_LABELS,
  pedagogicReTrainingStore,
} from '@/lib/pedagogicReTraining';
import { userStore } from '@/lib/userStore';
import { useTrainingSystemVersion } from '@/hooks/useTrainingSystemVersion';
import { todayLocalIso } from '@/lib/errorCaseWorkflow';
import { RE_TRAINING_FLOW_SHELL } from '@/lib/reTrainingTheme';

interface SupervisorReinstruireCereriPanelProps {
  supervisorId: string;
}

export function SupervisorReinstruireCereriPanel({ supervisorId }: SupervisorReinstruireCereriPanelProps) {
  useTrainingSystemVersion();
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [trainerByCerere, setTrainerByCerere] = useState<Record<string, string>>({});
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const pending = pedagogicReTrainingStore.getCereri({ supervisorId, status: 'trimisa' });

  const defaultTrainers = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of pending) {
      map[c.id] =
        userStore.getActiveEnrollmentForAngajat(c.angajatId)?.mentorId ??
        userStore.getEnrollmentForAngajat(c.angajatId)?.mentorId ??
        '';
    }
    return map;
  }, [pending]);

  if (pending.length === 0) return null;

  const handleAccept = (cerereId: string) => {
    const trainerId = trainerByCerere[cerereId] ?? defaultTrainers[cerereId];
    const result = pedagogicReTrainingStore.acceptCerere({
      cerereId,
      supervisorId,
      trainerId: trainerId || undefined,
      plannedStartDate: todayLocalIso(),
    });
    if ('error' in result) {
      setMsg((m) => ({ ...m, [cerereId]: result.error }));
      return;
    }
    setMsg((m) => ({ ...m, [cerereId]: 'Cerere acceptată · re-instruire planificată.' }));
  };

  const handleReject = (cerereId: string) => {
    const reason = rejectReason[cerereId] ?? '';
    const result = pedagogicReTrainingStore.rejectCerere({
      cerereId,
      supervisorId,
      reason,
    });
    if ('error' in result) {
      setMsg((m) => ({ ...m, [cerereId]: result.error }));
      return;
    }
    setMsg((m) => ({ ...m, [cerereId]: 'Cerere respinsă.' }));
  };

  return (
    <section className={`space-y-4 ${RE_TRAINING_FLOW_SHELL}`}>
      <div>
        <h2 className="text-lg font-semibold text-corporate-dark">Cereri re-instruire (angajați)</h2>
        <p className="text-sm text-corporate-muted mt-1">
          Acceptați sau respingeți cererile pedagogice. La acceptare, mentorul principal este preselectat.
        </p>
      </div>

      {pending.map((c) => {
        const profile = hrPerformanceStore.getProfile(c.angajatId);
        const name = profile ? `${profile.prenume} ${profile.nume}` : c.angajatId;
        const mentors = userStore.getMentorCandidates(c.angajatId);
        const selectedTrainer = trainerByCerere[c.id] ?? defaultTrainers[c.id] ?? '';

        return (
          <Card key={c.id} padding="sm">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="font-medium text-corporate-dark">{name}</h3>
                <p className="text-sm text-corporate-muted">{c.topicTitle}</p>
              </div>
              <Badge variant="warning">În așteptare</Badge>
            </div>

            <div className="text-sm text-slate-600 space-y-1 mb-4">
              <p>
                <strong>Motiv:</strong> {REINSTITUIRE_CERERE_MOTIV_LABELS[c.motiv]}
              </p>
              {c.mesaj && (
                <p>
                  <strong>Mesaj:</strong> {c.mesaj}
                </p>
              )}
              <p className="text-xs text-slate-400">
                Trimisă: {new Date(c.createdAt).toLocaleString('ro-RO')}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mb-3">
              <div>
                <label className="block text-xs font-medium text-corporate-dark mb-1">
                  Mentor / trainer
                </label>
                <select
                  value={selectedTrainer}
                  onChange={(e) =>
                    setTrainerByCerere((prev) => ({ ...prev, [c.id]: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">— Selectați —</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleAccept(c.id)}
              >
                Acceptă și planifică
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <label className="block text-xs font-medium text-corporate-dark mb-1">
                Motiv respingere (opțional)
              </label>
              <textarea
                value={rejectReason[c.id] ?? ''}
                onChange={(e) =>
                  setRejectReason((prev) => ({ ...prev, [c.id]: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-2"
                rows={2}
                placeholder="Explicație pentru angajat…"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleReject(c.id)}
              >
                Respinge cererea
              </Button>
            </div>

            {msg[c.id] && (
              <p className="text-sm mt-3 text-corporate-muted">{msg[c.id]}</p>
            )}
          </Card>
        );
      })}
    </section>
  );
}
