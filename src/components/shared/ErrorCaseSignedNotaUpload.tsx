import { NotaConstatareDocumentPanel } from '@/components/shared/NotaConstatareDocumentPanel';
import type { ErrorCase } from '@/types';

interface ErrorCaseSignedNotaUploadProps {
  errorCase: ErrorCase;
  angajatName: string;
  onUploaded?: () => void;
  compact?: boolean;
}

export function ErrorCaseSignedNotaUpload({
  errorCase,
  onUploaded,
}: ErrorCaseSignedNotaUploadProps) {
  return (
    <NotaConstatareDocumentPanel
      errorCase={errorCase}
      signedDocumentId={errorCase.signedDocumentId}
      onUploaded={onUploaded}
    />
  );
}
