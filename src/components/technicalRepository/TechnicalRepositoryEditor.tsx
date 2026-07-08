import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import {
  TECH_REPO_SECTIONS,
  WARRANTY_MATERIAL_LABELS,
  type TechnicalRepositorySection,
  type WarrantyMaterialId,
} from '@/data/technicalRepository';
import { technicalRepositoryStore } from '@/lib/technicalRepositoryStore';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useTechnicalRepository } from '@/hooks/useTechnicalRepository';
import {
  formatCatalogLines,
  listFromLines,
  linesFromList,
  parseCatalogLines,
} from '@/lib/technicalRepositoryParse';
import { TechnicalRepositoryPanel } from '@/components/technicalRepository/TechnicalRepositoryPanel';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AutoSaveStatusText } from '@/components/shared/AutoSaveIndicator';

export function TechnicalRepositoryEditor({ embedded }: { embedded?: boolean } = {}) {
  const { user } = useAuth();
  const { canEditTrainingPlan } = useAccessControl();
  const readOnly = !canEditTrainingPlan;
  const data = useTechnicalRepository();
  const [tab, setTab] = useState<TechnicalRepositorySection>('produse');
  const [productsIntro, setProductsIntro] = useState('');
  const [materialsIntro, setMaterialsIntro] = useState('');
  const [warrantyIntro, setWarrantyIntro] = useState('');
  const [productsText, setProductsText] = useState('');
  const [materialsText, setMaterialsText] = useState('');
  const [warrantyMd, setWarrantyMd] = useState<Record<WarrantyMaterialId, string>>({
    quartz: '',
    granit: '',
    marmura: '',
    ceramica: '',
  });
  const [warrantyCheck, setWarrantyCheck] = useState<Record<WarrantyMaterialId, string>>({
    quartz: '',
    granit: '',
    marmura: '',
    ceramica: '',
  });
  const [warrantyUrl, setWarrantyUrl] = useState<Record<WarrantyMaterialId, string>>({
    quartz: '',
    granit: '',
    marmura: '',
    ceramica: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const loadFromStore = useCallback(() => {
    const d = technicalRepositoryStore.get();
    setProductsIntro(d.productsIntro ?? '');
    setMaterialsIntro(d.materialsIntro ?? '');
    setWarrantyIntro(d.warrantyIntro ?? '');
    setProductsText(formatCatalogLines(d.products));
    setMaterialsText(formatCatalogLines(d.materials));
    const md: Record<WarrantyMaterialId, string> = { quartz: '', granit: '', marmura: '', ceramica: '' };
    const chk: Record<WarrantyMaterialId, string> = { quartz: '', granit: '', marmura: '', ceramica: '' };
    const url: Record<WarrantyMaterialId, string> = { quartz: '', granit: '', marmura: '', ceramica: '' };
    for (const w of d.warranty) {
      md[w.id] = w.markdown;
      chk[w.id] = linesFromList(w.checklist);
      url[w.id] = w.mdUrl ?? '';
    }
    setWarrantyMd(md);
    setWarrantyCheck(chk);
    setWarrantyUrl(url);
    setMessage(null);
  }, []);

  useEffect(() => {
    loadFromStore();
  }, [data.updatedAt, loadFromStore]);

  const repoDraft = useMemo(
    () => ({
      productsIntro,
      materialsIntro,
      warrantyIntro,
      productsText,
      materialsText,
      warrantyMd,
      warrantyCheck,
      warrantyUrl,
    }),
    [
      productsIntro,
      materialsIntro,
      warrantyIntro,
      productsText,
      materialsText,
      warrantyMd,
      warrantyCheck,
      warrantyUrl,
    ],
  );

  const repoBaseline = useMemo(() => {
    const d = technicalRepositoryStore.get();
    const md: Record<WarrantyMaterialId, string> = { quartz: '', granit: '', marmura: '', ceramica: '' };
    const chk: Record<WarrantyMaterialId, string> = { quartz: '', granit: '', marmura: '', ceramica: '' };
    const url: Record<WarrantyMaterialId, string> = { quartz: '', granit: '', marmura: '', ceramica: '' };
    for (const w of d.warranty) {
      md[w.id] = w.markdown;
      chk[w.id] = linesFromList(w.checklist);
      url[w.id] = w.mdUrl ?? '';
    }
    return {
      productsIntro: d.productsIntro ?? '',
      materialsIntro: d.materialsIntro ?? '',
      warrantyIntro: d.warrantyIntro ?? '',
      productsText: formatCatalogLines(d.products),
      materialsText: formatCatalogLines(d.materials),
      warrantyMd: md,
      warrantyCheck: chk,
      warrantyUrl: url,
    };
  }, [data.updatedAt]);

  const persistRepo = useCallback(
    (d: typeof repoDraft) => {
      if (!user) return;
      const current = technicalRepositoryStore.get();
      technicalRepositoryStore.save(
        {
          productsIntro: d.productsIntro,
          materialsIntro: d.materialsIntro,
          warrantyIntro: d.warrantyIntro,
          products: parseCatalogLines(d.productsText, current.products),
          materials: parseCatalogLines(d.materialsText, current.materials),
          warranty: (Object.keys(WARRANTY_MATERIAL_LABELS) as WarrantyMaterialId[]).map((id) => ({
            id,
            label: WARRANTY_MATERIAL_LABELS[id],
            markdown: d.warrantyMd[id],
            mdUrl: d.warrantyUrl[id].trim() || undefined,
            checklist: listFromLines(d.warrantyCheck[id]),
          })),
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
          Hub separat de Ghid Operațional. Produse, materiale și reguli garanție (.md).
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
            {tab === 'materiale' && (
              <>
                <Textarea
                  label="Introducere secțiune materiale"
                  value={materialsIntro}
                  readOnly={readOnly}
                  onChange={(e) => setMaterialsIntro(e.target.value)}
                  rows={2}
                />
                <Textarea
                  label="Catalog materiale (câte un material pe linie)"
                  value={materialsText}
                  readOnly={readOnly}
                  onChange={(e) => setMaterialsText(e.target.value)}
                  rows={12}
                  placeholder={
                    'Quartz 20mm | Quartz | Compozit | | greutate:26 kg/m²;debitare:disc diamant'
                  }
                />
              </>
            )}
            {tab === 'garantie' && (
              <>
                <Textarea
                  label="Introducere certificare garanție"
                  value={warrantyIntro}
                  readOnly={readOnly}
                  onChange={(e) => setWarrantyIntro(e.target.value)}
                  rows={2}
                />
                {(Object.keys(WARRANTY_MATERIAL_LABELS) as WarrantyMaterialId[]).map((id) => (
                  <div key={id} className="rounded-xl border border-corporate-border p-3 space-y-2">
                    <p className="text-sm font-semibold text-corporate-dark">{WARRANTY_MATERIAL_LABELS[id]}</p>
                    <Input
                      label="URL fișier .md (opțional)"
                      value={warrantyUrl[id]}
                      readOnly={readOnly}
                      onChange={(e) => setWarrantyUrl((prev) => ({ ...prev, [id]: e.target.value }))}
                      placeholder={`/docs/repository/warranty/${id}.md`}
                    />
                    <Textarea
                      label="Reguli Markdown"
                      value={warrantyMd[id]}
                      readOnly={readOnly}
                      onChange={(e) => setWarrantyMd((prev) => ({ ...prev, [id]: e.target.value }))}
                      rows={5}
                    />
                    <Textarea
                      label="Checklist (câte un punct pe linie)"
                      value={warrantyCheck[id]}
                      readOnly={readOnly}
                      onChange={(e) => setWarrantyCheck((prev) => ({ ...prev, [id]: e.target.value }))}
                      rows={4}
                    />
                  </div>
                ))}
              </>
            )}
            {!readOnly && (
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="primary" disabled={saving || autoSaveStatus === 'saving'} onClick={() => void handleSave()}>
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
            <p className="text-xs text-corporate-muted mt-3">
              Garanție: Markdown editabil sau fișier .md în <code>/public/docs/repository/warranty/</code>
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
