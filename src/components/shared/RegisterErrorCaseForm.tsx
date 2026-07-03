import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useUsers } from '@/context/UsersContext';
import { useAuth } from '@/hooks/useAuth';
import { ERROR_MOTIV_LABELS } from '@/lib/hrPerformanceStore';
import { canRegisterErrorCase } from '@/lib/accessControl';
import type { EmployeeProfile, ErrorMotiv } from '@/types';

interface RegisterErrorCaseFormProps {
  /** Angajații pentru care se poate înregistra o eroare */
  profiles: EmployeeProfile[];
  onSuccess?: (message: string) => void;
  compact?: boolean;
}

export function RegisterErrorCaseForm({
  profiles,
  onSuccess,
  compact,
}: RegisterErrorCaseFormProps) {
  const { addErrorCase, uploadDocument } = useHrPerformance();
  const { mentors } = useUsers();
  const { user } = useAuth();

  const [angajatId, setAngajatId] = useState('');
  const [motiv, setMotiv] = useState<ErrorMotiv>('neatentie');
  const [descriere, setDescriere] = useState('');
  const [proiectNume, setProiectNume] = useState('');
  const [pasi, setPasi] = useState('');
  const [termenLimita, setTermenLimita] = useState('');
  const [responsabilId, setResponsabilId] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setAngajatId('');
    setMotiv('neatentie');
    setDescriere('');
    setProiectNume('');
    setPasi('');
    setTermenLimita('');
    setResponsabilId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !angajatId) return;
    setError('');
    if (!canRegisterErrorCase(user, angajatId)) {
      setError('Nu puteți înregistra erori pentru acest angajat.');
      return;
    }
    if (pasi.trim().length < 20) {
      setError('Planul „Cum evităm pe viitor" necesită min. 20 caractere.');
      return;
    }

    const fileInput = document.getElementById(`error-doc-${compact ? 'compact' : 'full'}`) as HTMLInputElement;
    const file = fileInput?.files?.[0];

    const created = addErrorCase({
      angajatId,
      raportatDe: user.id,
      raportatDeNume: user.name,
      data: new Date().toISOString().slice(0, 10),
      proiectNume: proiectNume || undefined,
      motiv,
      descriere: descriere.trim(),
      planActiune: {
        pasi: pasi.trim(),
        responsabilId: responsabilId || user.id,
        termenLimita:
          termenLimita || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        status: 'deschis',
      },
    });

    if (file) {
      await uploadDocument({
        file,
        tip: 'nota_constatare',
        angajatId,
        uploadedBy: user.id,
        uploadedByNume: user.name,
        errorCaseId: created.id,
      });
    }

    resetForm();
    if (fileInput) fileInput.value = '';
    onSuccess?.('Eroare înregistrată. La repetare se poate declanșa re-instruirea.');
  };

  if (!profiles.length) {
    return (
      <p className="text-sm text-corporate-muted">
        Nu aveți angajați desemnați ca supervizor pentru înregistrare erori.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className={[
        'grid gap-3 sm:grid-cols-2',
        compact ? 'p-3 rounded-xl bg-corporate-surface/60' : 'p-4 rounded-xl bg-corporate-surface',
      ].join(' ')}
    >
      <label className="block text-sm sm:col-span-2">
        <span className="text-corporate-muted">Angajat *</span>
        <select
          className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
          value={angajatId}
          onChange={(e) => setAngajatId(e.target.value)}
          required
        >
          <option value="">Selectează…</option>
          {profiles.map((p) => (
            <option key={p.userId} value={p.userId}>
              {p.prenume} {p.nume} — {p.functie}
            </option>
          ))}
        </select>
      </label>
      <Input label="Proiect" value={proiectNume} onChange={(e) => setProiectNume(e.target.value)} />
      <label className="block text-sm">
        <span className="text-corporate-muted">Motiv *</span>
        <select
          className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
          value={motiv}
          onChange={(e) => setMotiv(e.target.value as ErrorMotiv)}
        >
          {Object.entries(ERROR_MOTIV_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm sm:col-span-2">
        <span className="text-corporate-muted">Descriere *</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[60px]"
          value={descriere}
          onChange={(e) => setDescriere(e.target.value)}
          required
        />
      </label>
      <label className="block text-sm sm:col-span-2">
        <span className="text-corporate-muted">Cum evităm pe viitor *</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[80px]"
          value={pasi}
          onChange={(e) => setPasi(e.target.value)}
          required
          placeholder="Pași concreți, responsabilități, proceduri de urmat…"
        />
      </label>
      <label className="block text-sm">
        <span className="text-corporate-muted">Responsabil plan</span>
        <select
          className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
          value={responsabilId}
          onChange={(e) => setResponsabilId(e.target.value)}
        >
          <option value="">Implicit (dvs.)</option>
          {mentors.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      <Input
        label="Termen plan acțiune"
        type="date"
        value={termenLimita}
        onChange={(e) => setTermenLimita(e.target.value)}
      />
      <label className="block text-sm sm:col-span-2">
        <span className="text-corporate-muted">Notă constatare (scan PDF/imagine)</span>
        <input
          id={`error-doc-${compact ? 'compact' : 'full'}`}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="mt-1 block text-sm"
        />
      </label>
      <div className="sm:col-span-2">
        <Button type="submit" variant="primary" size="sm">
          Salvează eroarea
        </Button>
      </div>
      {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
