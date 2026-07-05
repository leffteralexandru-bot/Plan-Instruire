import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import {
  EQUIPMENT_GUIDE_SECTIONS,
  type EquipmentDevice,
  type EquipmentGuideSectionId,
} from '@/data/equipmentOperations';
import { equipmentOperationsStore } from '@/lib/equipmentOperationsStore';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useEquipmentOperations } from '@/hooks/useEquipmentOperations';
import {
  createEmptyDevice,
  parseSection,
  sectionTexts,
} from '@/lib/equipmentOperationsParse';
import { EquipmentOperationsPanel } from '@/components/equipment/EquipmentOperationsPanel';

export function EquipmentOperationsEditor({ embedded }: { embedded?: boolean } = {}) {
  const { user } = useAuth();
  const { canEditTrainingPlan } = useAccessControl();
  const readOnly = !canEditTrainingPlan;
  const data = useEquipmentOperations();
  const [intro, setIntro] = useState('');
  const [devices, setDevices] = useState<EquipmentDevice[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<EquipmentGuideSectionId>('curatare');
  const [sectionText, setSectionText] = useState('');
  const [sectionSteps, setSectionSteps] = useState('');
  const [sectionAttachments, setSectionAttachments] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const activeDevice = devices.find((d) => d.id === activeDeviceId) ?? devices[0] ?? null;

  const loadSectionFields = useCallback((device: EquipmentDevice, sectionId: EquipmentGuideSectionId) => {
    const t = sectionTexts(device, sectionId);
    setSectionText(t.text);
    setSectionSteps(t.steps);
    setSectionAttachments(t.attachments);
  }, []);

  const loadFromStore = useCallback(() => {
    const d = equipmentOperationsStore.get();
    setIntro(d.intro ?? '');
    setDevices(d.devices.map((dev) => ({ ...dev })));
    const first = d.devices[0];
    if (first) {
      setActiveDeviceId(first.id);
      loadSectionFields(first, 'curatare');
    }
    setActiveSection('curatare');
    setMessage(null);
  }, [loadSectionFields]);

  useEffect(() => {
    loadFromStore();
  }, [data.updatedAt, loadFromStore]);

  useEffect(() => {
    if (!activeDevice) return;
    loadSectionFields(activeDevice, activeSection);
  }, [activeDeviceId, activeSection, activeDevice, loadSectionFields]);

  const updateActiveDevice = (patch: Partial<EquipmentDevice>) => {
    if (!activeDevice) return;
    setDevices((list) =>
      list.map((d) => (d.id === activeDevice.id ? { ...d, ...patch } : d)),
    );
  };

  const saveSectionToDevice = (): EquipmentDevice[] => {
    if (!activeDevice) return devices;
    const existing = activeDevice[activeSection];
    const section = parseSection(sectionText, sectionSteps, sectionAttachments, existing);
    return devices.map((d) =>
      d.id === activeDevice.id ? { ...d, [activeSection]: section } : d,
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      const withSection = saveSectionToDevice();
      equipmentOperationsStore.save({ intro, devices: withSection }, user);
      setDevices(withSection);
      setMessage('Salvat — angajații văd imediat actualizarea.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Eroare la salvare.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDevice = () => {
    const next = createEmptyDevice();
    const withSection = saveSectionToDevice();
    const list = [...withSection, next];
    setDevices(list);
    setActiveDeviceId(next.id);
    setActiveSection('curatare');
    loadSectionFields(next, 'curatare');
  };

  const handleRemoveDevice = () => {
    if (!activeDevice || devices.length <= 1) return;
    const ok = window.confirm(`Ștergeți aparatul „${activeDevice.name}”?`);
    if (!ok) return;
    const withSection = saveSectionToDevice();
    const list = withSection.filter((d) => d.id !== activeDevice.id);
    setDevices(list);
    const first = list[0];
    if (first) {
      setActiveDeviceId(first.id);
      loadSectionFields(first, activeSection);
    }
  };

  const handleDeviceChange = (id: string) => {
    const withSection = saveSectionToDevice();
    setDevices(withSection);
    setActiveDeviceId(id);
    const dev = withSection.find((d) => d.id === id);
    if (dev) loadSectionFields(dev, activeSection);
  };

  const handleSectionChange = (id: EquipmentGuideSectionId) => {
    const withSection = saveSectionToDevice();
    setDevices(withSection);
    setActiveSection(id);
    const dev = withSection.find((d) => d.id === activeDeviceId);
    if (dev) loadSectionFields(dev, id);
  };

  if (preview) {
    return (
      <div className={embedded ? 'mt-4 border-t border-corporate-border pt-5 space-y-4' : 'space-y-4'}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-corporate-dark">Previzualizare — Mentenanță echipament</h3>
          <Button type="button" variant="ghost" size="sm" onClick={() => setPreview(false)}>
            ← Înapoi la editare
          </Button>
        </div>
        <EquipmentOperationsPanel display="inline" />
      </div>
    );
  }

  return (
    <div className={embedded ? 'mt-4 border-t border-corporate-border pt-5 space-y-4' : 'space-y-4'}>
      <div>
        <h3 className="text-base font-semibold text-corporate-dark">
          Mentenanță și operare echipament — editare HR
        </h3>
        <p className="text-sm text-corporate-muted mt-1">
          Ghiduri per aparat de măsurat: curățare, utilizare și integrare CAD. Text, pași, imagini și PDF-uri.
        </p>
      </div>

      <Textarea
        label="Introducere modul"
        value={intro}
        readOnly={readOnly}
        onChange={(e) => setIntro(e.target.value)}
        rows={2}
      />

      <div className="flex flex-wrap gap-2">
        {!readOnly && (
        <Button type="button" variant="secondary" size="sm" onClick={handleAddDevice}>
          + Adaugă aparat
        </Button>
        )}
        {!readOnly && activeDevice && devices.length > 1 && (
          <Button type="button" variant="ghost" size="sm" onClick={handleRemoveDevice}>
            Șterge aparat
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={() => setPreview(true)}>
          Previzualizare
        </Button>
      </div>

      <nav className="flex flex-wrap gap-1 rounded-xl border border-corporate-border bg-corporate-surface/50 p-1">
        {devices.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => handleDeviceChange(d.id)}
            className={[
              'rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors',
              activeDeviceId === d.id
                ? 'bg-corporate-black text-white shadow-sm'
                : 'text-corporate-muted hover:bg-white hover:text-corporate-dark',
            ].join(' ')}
          >
            {d.name}
          </button>
        ))}
      </nav>

      {activeDevice && (
        <Card padding="sm" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Nume aparat"
              value={activeDevice.name}
              readOnly={readOnly}
              onChange={(e) => updateActiveDevice({ name: e.target.value })}
            />
            <Input
              label="Categorie"
              value={activeDevice.category}
              readOnly={readOnly}
              onChange={(e) => updateActiveDevice({ category: e.target.value })}
            />
          </div>
          <Input
            label="Descriere scurtă"
            value={activeDevice.description ?? ''}
            readOnly={readOnly}
            onChange={(e) => updateActiveDevice({ description: e.target.value })}
          />

          <nav className="flex flex-wrap gap-1 border-t border-corporate-border pt-4">
            {EQUIPMENT_GUIDE_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSectionChange(s.id)}
                className={[
                  'rounded-lg px-3 py-2 text-xs font-medium border transition-colors',
                  activeSection === s.id
                    ? 'bg-corporate-black text-white border-corporate-black'
                    : 'bg-white text-corporate-dark border-corporate-border hover:border-corporate-gold/40',
                ].join(' ')}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <Textarea
            label="Text instrucțiuni (Markdown)"
            value={sectionText}
            readOnly={readOnly}
            onChange={(e) => setSectionText(e.target.value)}
            rows={5}
            placeholder="Titluri ##, liste -, bold **text**"
          />
          <Textarea
            label="Pași (câte unul pe linie)"
            value={sectionSteps}
            readOnly={readOnly}
            onChange={(e) => setSectionSteps(e.target.value)}
            rows={4}
            placeholder="Recomandat pentru protocol de curățare"
          />
          <Textarea
            label="Atașamente (tip | etichetă | url)"
            value={sectionAttachments}
            readOnly={readOnly}
            onChange={(e) => setSectionAttachments(e.target.value)}
            rows={3}
            placeholder="image | Setup | /docs/eq/photo.jpg"
          />
          <p className="text-[10px] text-corporate-muted -mt-2">
            Tipuri: image, pdf, link — ex: pdf | Manual | /docs/manual.pdf
          </p>
        </Card>
      )}

      {!readOnly && (
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? 'Se salvează…' : 'Salvează modificările'}
        </Button>
        {message && (
          <p className={`text-sm ${message.includes('Salvat') ? 'text-emerald-700' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
      )}
    </div>
  );
}
