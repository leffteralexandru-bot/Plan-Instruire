import { ErrorLibraryView } from '@/components/errors/ErrorLibraryView';

export function ErrorLibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">Bibliotecă Erori</h1>
        <p className="text-corporate-muted mt-1">Lecții învățate și erori frecvente artGRANIT</p>
      </div>
      <ErrorLibraryView />
    </div>
  );
}
