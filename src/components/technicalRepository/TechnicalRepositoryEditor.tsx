import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import {
  TECH_REPO_SECTIONS,
  type TechnicalRepositorySection,
} from '@/data/technicalRepository';
import { technicalRepositoryStore } from '@/lib/technicalRepositoryStore';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useTechnicalRepository } from '@/hooks/useTechnicalRepository';
import { formatCatalogLines, parseCatalogLines } from '@/lib/technicalRepositoryParse';
import { TechnicalRepositoryPanel } from '@/components/technicalRepository/TechnicalRepositoryPanel';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AutoSaveStatusText } from '@/components/shared/AutoSaveIndicator';

export function TechnicalRepositoryEditor({ embedded }: { embedded?: boolean } = {}) {
  const { user } = useAuth();
  const { canEditTrainingPlan } = useAccessControl();
  const readOnly = !canEditTrainingPlan;
  const data = useTechnicalRepository();
  const [tab, setTab] = useState<TechnicalRepositorySection>('manuale');
  const [productsIntro, setProductsIntro] = useState('');
  const [productsText, setProductsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const loadFromStore = useCallback(() => {
    const d = technicalRepositoryStore.get();
    setProductsIntro(d.productsIntro ?? '');
    setProductsText(formatCatalogLines(d.products));
    setMessage(null);
  }, []);

  useEffect(() => {
    loadFromStore();
  }, [data.updatedAt, loadFromStore]);

  const repoDraft = useMemo(
    () => ({
      productsIntro,
      productsText,
    }),
    [productsIntro, productsText],
  );

  const repoBaseline = useMemo(() => {
    const d = technicalRepositoryStore.get();
    return {
      productsIntro: d.productsIntro ?? '',
      productsText: formatCatalogLines(d.products),
    };
  }, [data.updatedAt]);

  const persistRepo = useCallback(
    (d: typeof repoDraft) => {
      if (!user) return;
      const current = technicalRepositoryStore.get();
      technicalRepositoryStore.save(
        {
          productsIntro: d.productsIntro,
          products: parseCatalogLines(d.productsText, current.products),
        },
        user,
      );
    },
    [user],
  );

  const { status: autoSaveStatus, flush: flushRepoSave } = useAutoSave({
    draft: repoDraft,
    baseline: repoBaseline,
    enabled: !readOnly && !!user && !preview,
    save: persistRepo,
  });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      await flushRepoSave();
      setMessage('Salvat — angajații văd imediat actualizarea.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Eroare la salvare.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={embedded ? 'mt-4 border-t border-corporate-border pt-5 space-y-4' : 'space-y-4'}>
      <div>
        <h3 className="text-base font-semibold text-corporate-dark">Repository Tehnic — editare HR</h3>
        <p className="text-sm text-corporate-muted mt-1">
          Hub separat de Ghid Operațional. Reguli producător și specificații produse.
        </p>
      </div>

      <nav className="flex flex-wrap gap-1 rounded-xl border border-corporate-border bg-corporate-surface/50 p-1">
        {TECH_REPO_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setTab(s.id);
              setPreview(false);
            }}
            className={[
              'rounded-lg px-2.5 py-2 text-xs sm:text-sm font-medium transition-colors',
              tab === s.id ? 'bg-corporate-black text-white' : 'text-corporate-muted hover:bg-white',
            ].join(' ')}
          >
            {s.label.split(' ').slice(0, 2).join(' ')}
          </button>
        ))}
      </nav>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={preview ? 'ghost' : 'secondary'} size="sm" onClick={() => setPreview(false)}>
          Editare
        </Button>
        <Button type="button" variant={preview ? 'secondary' : 'ghost'} size="sm" onClick={() => setPreview(true)}>
          Previzualizare angajat
        </Button>
      </div>

      {preview && user ? (
        <Card padding="md">
          <TechnicalRepositoryPanel userId={user.id} readOnly />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            {tab === 'produse' && (
              <>
                <Textarea
                  label="Introducere secțiune produse"
                  value={productsIntro}
                  readOnly={readOnly}
                  onChange={(e) => setProductsIntro(e.target.value)}
                  rows={2}
                />
                <Card padding="sm" className="border-dashed bg-corporate-surface/30">
                  <p className="text-sm font-semibold text-corporate-dark">Chiuvete și documentație producător</p>
                  <p className="text-sm text-corporate-muted mt-2 leading-relaxed">
                    Manualele interactive pentru produse (ex. chiuvete Silestone® Integrity) sunt definite
                    în cod și assets din{' '}
                    <code className="text-xs">public/docs/repository/silestone-sinks/</code>. Lista
                    curentă:
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-corporate-dark">
                    {data.productManuals.map((m, i) => (
                      <li key={m.id}>
                        {i + 1}. {m.name} — {m.chapters.length} capitole
                      </li>
                    ))}
                  </ul>
                </Card>
                <Textarea
                  label="Catalog produse (câte un produs pe linie)"
                  value={productsText}
                  readOnly={readOnly}
                  onChange={(e) => setProductsText(e.target.value)}
                  rows={12}
                  placeholder={
                    'Titlu | Categorie | Descriere | URL fișă | greutate:val;montaj:val\nChiuvetă L | Chiuvete | Sub blat | /docs/fisa.pdf | material:Inox'
                  }
                />
              </>
            )}
            {tab === 'manuale' && (
              <Card padding="sm" className="border-dashed bg-corporate-surface/30">
                <p className="text-sm font-semibold text-corporate-dark">Reguli producător & garanție</p>
                <p className="text-sm text-corporate-muted mt-2 leading-relaxed">
                  Documentele cu cerințe oficiale ale producătorilor (pentru rezistență și garanție
                  proiecte) sunt definite în cod și assets din{' '}
                  <code className="text-xs">public/docs/repository/</code>. Lista curentă:
                </p>
                <ul className="mt-3 space-y-1 text-sm text-corporate-dark">
                  {data.manuals.map((m, i) => (
                    <li key={m.id}>
                      {i + 1}. {m.name} — {m.chapters.length} capitole
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {!readOnly && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="primary"
                  disabled={saving || autoSaveStatus === 'saving'}
                  onClick={() => void handleSave()}
                >
                  {saving || autoSaveStatus === 'saving' ? 'Se salvează…' : 'Salvează repository'}
                </Button>
                <AutoSaveStatusText className="hidden @md:block" />
                {message && (
                  <p className={`text-sm ${message.startsWith('Salvat') ? 'text-emerald-700' : 'text-red-600'}`}>
                    {message}
                  </p>
                )}
              </div>
            )}
          </div>

          <Card padding="sm" className="bg-corporate-surface/30 h-fit">
            <p className="text-xs font-semibold uppercase tracking-wide text-corporate-muted mb-2">Format catalog</p>
            <p className="text-sm text-corporate-muted leading-relaxed">
              Fiecare linie: <code className="text-xs">Titlu | Categorie | Descriere | URL | spec1:val;spec2:val</code>
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
