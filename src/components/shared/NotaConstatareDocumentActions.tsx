import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { downloadNotaConstatareTemplate } from '@/lib/exportNotaConstatarePdf';

interface NotaConstatareDocumentActionsProps {
  signedInputId: string;
  signedDocumentId?: string;
  onViewSigned?: () => void;
  disabled?: boolean;
}

export function NotaConstatareDocumentActions({
  signedInputId,
  signedDocumentId,
  onViewSigned,
  disabled,
}: NotaConstatareDocumentActionsProps) {
  return (
    <div className="rounded-lg border border-corporate-gold/50 bg-gradient-to-br from-amber-50/90 to-white p-4 space-y-3 sm:col-span-2">
      <div>
        <p className="text-sm font-semibold text-corporate-dark">Notă de constatare — formular oficial</p>
        <p className="text-xs text-corporate-muted mt-1">
          Descărcați PDF-ul, completați pe hârtie, semnați cu angajatul, apoi încărcați scanul aici.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 rounded-lg border border-corporate-border/60 bg-white p-3 space-y-2">
          <p className="text-xs font-medium text-corporate-dark">1. Descarcă formularul gol</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void downloadNotaConstatareTemplate()}
          >
            Descarcă PDF oficial
          </Button>
        </div>

        <div className="flex-1 rounded-lg border border-corporate-border/60 bg-white p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium text-corporate-dark">2. Încarcă nota completată și semnată</p>
            {signedDocumentId && <Badge variant="success">Încărcată</Badge>}
          </div>
          <input
            id={signedInputId}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            disabled={disabled}
            className="block w-full text-xs"
          />
          {signedDocumentId && onViewSigned && (
            <Button type="button" variant="ghost" size="sm" onClick={onViewSigned}>
              Vezi scan încărcat
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
