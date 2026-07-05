import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { downloadNotaConstatareTemplate } from '@/lib/exportNotaConstatarePdf';
import type { ErrorCase } from '@/types';

interface NotaConstatareDocumentPanelProps {
  /** Input file pentru înregistrare nouă — fișierul se încarcă la salvare. */
  signedInputId?: string;
  /** Eroare existentă — încărcare imediată în sistem. */
  errorCase?: ErrorCase;
  signedDocumentId?: string | null;
  editable?: boolean;
  onUploaded?: () => void;
}

export function NotaConstatareDocumentPanel({
  signedInputId,
  errorCase,
  signedDocumentId,
  editable = true,
  onUploaded,
}: NotaConstatareDocumentPanelProps) {
  const { user } = useAuth();
  const { uploadDocument, updateErrorCase, downloadDocument } = useHrPerformance();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const inputId = signedInputId ?? (errorCase ? `signed-nota-${errorCase.id}` : undefined);
  const hasSigned = !!(signedDocumentId ?? errorCase?.signedDocumentId);
  const canUpload = editable && !!errorCase && !!inputId;

  const handleUpload = async () => {
    if (!user || !errorCase || !inputId) return;
    const fileInput = document.getElementById(inputId) as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      setMsg('Selectați fișierul notei completate și semnate (PDF sau imagine).');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const doc = await uploadDocument({
        file,
        tip: 'nota_constatare',
        angajatId: errorCase.angajatId,
        uploadedBy: user.id,
        uploadedByNume: user.name,
        errorCaseId: errorCase.id,
      });
      updateErrorCase(errorCase.id, { signedDocumentId: doc.id });
      if (fileInput) fileInput.value = '';
      setMsg('Notă încărcată cu succes.');
      onUploaded?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Eroare la încărcare.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-corporate-gold/50 bg-gradient-to-br from-amber-50/90 to-white p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-corporate-dark">Notă de constatare — formular PDF</p>
        <p className="text-xs text-corporate-muted mt-1">
          Descărcați șablonul oficial, completați pe hârtie, semnați cu angajatul, apoi încărcați scanul aici.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-corporate-border/70 bg-white p-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-corporate-muted">
            Pas 1 · Descarcă
          </p>
          <p className="text-sm text-corporate-dark">Formular gol Art-Granit (PDF)</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => void downloadNotaConstatareTemplate()}
          >
            Descarcă formular PDF
          </Button>
        </div>

        <div className="rounded-lg border border-corporate-border/70 bg-white p-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-corporate-muted">
            Pas 2 · Încarcă înapoi
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {hasSigned ? (
              <Badge variant="success">Notă încărcată</Badge>
            ) : (
              <Badge variant="warning">De încărcat</Badge>
            )}
            {hasSigned && (signedDocumentId ?? errorCase?.signedDocumentId) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  void downloadDocument((signedDocumentId ?? errorCase?.signedDocumentId)!)
                }
              >
                Vezi fișier
              </Button>
            )}
          </div>
          {editable && inputId ? (
            <>
              <input
                id={inputId}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-corporate-gold/20 file:px-2 file:py-1 file:text-sm"
              />
              {canUpload ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={busy}
                  onClick={() => void handleUpload()}
                >
                  {busy ? 'Se încarcă…' : hasSigned ? 'Înlocuiește nota' : 'Încarcă nota semnată'}
                </Button>
              ) : (
                <p className="text-xs text-corporate-muted">
                  Salvați mai întâi înregistrarea erorii, apoi încărcați nota completată aici sau în
                  lista de mai jos.
                </p>
              )}
            </>
          ) : !editable && !hasSigned ? (
            <p className="text-xs text-corporate-muted">Nota nu a fost încărcată.</p>
          ) : null}
        </div>
      </div>

      {msg && <p className="text-xs text-emerald-700">{msg}</p>}
    </div>
  );
}
