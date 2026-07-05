import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { getBaseTrainingTopics } from '@/lib/trainingSystemStore';
import {
  REINSTITUIRE_CERERE_MOTIV_LABELS,
  REINSTITUIRE_CERERE_STATUS_LABELS,
  pedagogicReTrainingStore,
} from '@/lib/pedagogicReTraining';
import { useTrainingSystemVersion } from '@/hooks/useTrainingSystemVersion';
import type { ReinstruireCerereMotiv } from '@/types';

const MOTIV_OPTIONS: ReinstruireCerereMotiv[] = ['eroare', 'neintelegere', 'uitare', 'altele'];

interface ReinstruireCerereFormProps {
  angajatId: string;
}

export function ReinstruireCerereForm({ angajatId }: ReinstruireCerereFormProps) {
  useTrainingSystemVersion();
  const profile = hrPerformanceStore.getProfile(angajatId);
  const departmentId = profile?.departamentId ?? 'ingineri';
  const topics = useMemo(() => getBaseTrainingTopics(departmentId), [departmentId]);

  const [topicDayId, setTopicDayId] = useState('');
  const [motiv, setMotiv] = useState<ReinstruireCerereMotiv>('neintelegere');
  const [mesaj, setMesaj] = useState('');
  const [msg, setMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const cereri = pedagogicReTrainingStore.getCereri({ angajatId });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setSuccess(false);
    if (!topicDayId) {
      setMsg('Selectați lecția pentru care solicitați re-instruirea.');
      return;
    }
    const result = pedagogicReTrainingStore.submitCerere({
      angajatId,
      topicDayId,
      motiv,
      mesaj,
      departmentId,
    });
    if ('error' in result) {
      setMsg(result.error);
      return;
    }
    setSuccess(true);
    setTopicDayId('');
    setMesaj('');
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <section id="cerere-reinstruire" className="space-y-4">
      <Card>
        <h2 className="text-lg font-semibold text-corporate-dark mb-1">Cerere de re-instruire</h2>
        <p className="text-sm text-corporate-muted mb-5">
          Solicitați supervizorului re-evaluarea unei lecții din plan — pentru erori, neînțelegeri sau uitare.
          Cererea merge la supervizor (fără HR la început); după finalizare, HR primește raportul.
        </p>

        {success && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
            Cererea a fost trimisă supervizorului.
          </div>
        )}
        {msg && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cerere-topic" className="block text-sm font-medium text-corporate-dark mb-1">
              Lecție din plan
            </label>
            <select
              id="cerere-topic"
              value={topicDayId}
              onChange={(e) => setTopicDayId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            >
              <option value="">— Selectați lecția —</option>
              {topics.map((t) => (
                <option key={t.dayId} value={t.dayId}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="block text-sm font-medium text-corporate-dark mb-2">Motiv</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {MOTIV_OPTIONS.map((m) => (
                <label
                  key={m}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${
                    motiv === m ? 'border-corporate-gold bg-amber-50' : 'border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="cerere-motiv"
                    value={m}
                    checked={motiv === m}
                    onChange={() => setMotiv(m)}
                    className="accent-corporate-gold"
                  />
                  {REINSTITUIRE_CERERE_MOTIV_LABELS[m]}
                </label>
              ))}
            </div>
          </fieldset>

          <Textarea
            id="cerere-mesaj"
            name="mesaj"
            label="Mesaj pentru supervizor (opțional)"
            value={mesaj}
            onChange={(e) => setMesaj(e.target.value)}
            placeholder="Detalii suplimentare despre ce nu ați înțeles sau ce ați uitat…"
          />

          <Button type="submit" variant="primary">
            Trimite cererea
          </Button>
        </form>
      </Card>

      {cereri.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-corporate-dark">Cererile mele</h3>
          {cereri.map((c) => (
            <Card key={c.id} padding="sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-corporate-dark">{c.topicTitle}</p>
                  <p className="text-xs text-corporate-muted mt-0.5">
                    {REINSTITUIRE_CERERE_MOTIV_LABELS[c.motiv]}
                    {c.topicWeekNumber != null && ` · S${c.topicWeekNumber} Z${c.topicDayNumber}`}
                  </p>
                </div>
                <Badge
                  variant={c.status === 'acceptata' ? 'success' : c.status === 'respinsa' ? 'warning' : 'info'}
                >
                  {REINSTITUIRE_CERERE_STATUS_LABELS[c.status]}
                </Badge>
              </div>
              {c.mesaj && <p className="text-sm text-slate-600 mt-2">{c.mesaj}</p>}
              {c.status === 'respinsa' && c.rejectReason && (
                <p className="text-sm text-red-600 mt-2">
                  <strong>Motiv respingere:</strong> {c.rejectReason}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-2">
                Trimisă: {new Date(c.createdAt).toLocaleString('ro-RO')}
              </p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
