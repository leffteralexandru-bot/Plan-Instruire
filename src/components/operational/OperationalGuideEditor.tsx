import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import {
  OPERATIONAL_GUIDE_TASK_ORDER,
  OPERATIONAL_GUIDE_LABELS,
  OPERATIONAL_GUIDE_TASK_COUNT,
  type OperationalGuideTaskId,
} from '@/data/operationalGuide';
import { operationalGuideStore } from '@/lib/operationalGuideStore';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useOperationalGuide } from '@/hooks/useOperationalGuide';
import { OperationalGuideTaskView } from '@/components/operational/OperationalGuideTaskView';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AutoSaveStatusText } from '@/components/shared/AutoSaveIndicator';

function linesFromText(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function textFromLines(lines: string[]): string {
  return lines.join('\n');
}

interface TaskDraft {
  categorySubtitle: string;
  videoUrl: string;
  videoTitle: string;
  introText: string;
  preMeasurementText: string;
  equipmentText: string;
  stepsText: string;
}

function draftFromTask(id: OperationalGuideTaskId): TaskDraft {
  const task = operationalGuideStore.getTask(id);
  return {
    categorySubtitle: task.categorySubtitle ?? '',
    videoUrl: task.videoUrl ?? '',
    videoTitle: task.videoTitle ?? '',
    introText: task.introText ?? '',
    preMeasurementText: textFromLines(task.preMeasurementConditions),
    equipmentText: textFromLines(task.equipment),
    stepsText: textFromLines(task.steps),
  };
}

export function OperationalGuideEditor({ embedded }: { embedded?: boolean } = {}) {
  const { user } = useAuth();
  const { canEditTrainingPlan } = useAccessControl();
  const readOnly = !canEditTrainingPlan;
  const tasks = useOperationalGuide();
  const [activeId, setActiveId] = useState<OperationalGuideTaskId>('blat');
  const [categorySubtitle, setCategorySubtitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [introText, setIntroText] = useState('');
  const [preMeasurementText, setPreMeasurementText] = useState('');
  const [equipmentText, setEquipmentText] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const loadTask = useCallback((id: OperationalGuideTaskId) => {
    const draft = draftFromTask(id);
    setCategorySubtitle(draft.categorySubtitle);
    setVideoUrl(draft.videoUrl);
    setVideoTitle(draft.videoTitle);
    setIntroText(draft.introText);
    setPreMeasurementText(draft.preMeasurementText);
    setEquipmentText(draft.equipmentText);
    setStepsText(draft.stepsText);
    setMessage(null);
  }, []);

  useEffect(() => {
    loadTask(activeId);
  }, [activeId, tasks, loadTask]);

  const draft = useMemo<TaskDraft>(
    () => ({
      categorySubtitle,
      videoUrl,
      videoTitle,
      introText,
      preMeasurementText,
      equipmentText,
      stepsText,
    }),
    [categorySubtitle, videoUrl, videoTitle, introText, preMeasurementText, equipmentText, stepsText],
  );

  const baseline = useMemo(() => draftFromTask(activeId), [activeId, tasks]);

  const { status: autoSaveStatus, flush } = useAutoSave({
    draft,
    baseline,
    enabled: !readOnly && !!user && !preview,
    debounceMs: 1500,
    save: (d) => {
      if (!user) return;
      operationalGuideStore.saveTask(
        activeId,
        {
          categorySubtitle: d.categorySubtitle,
          videoUrl: d.videoUrl,
          videoTitle: d.videoTitle,
          introText: d.introText,
          preMeasurementConditions: linesFromText(d.preMeasurementText),
          equipment: linesFromText(d.equipmentText),
          steps: linesFromText(d.stepsText),
        },
        user,
      );
    },
  });

  const switchTask = (id: OperationalGuideTaskId) => {
    void flush();
    setActiveId(id);
    setPreview(false);
  };

  const handleManualSave = async () => {
    if (!user) return;
    setMessage(null);
    try {
      await flush();
      setMessage('Salvat — inginerii văd imediat actualizarea.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Eroare la salvare.');
    }
  };

  const activeTask = operationalGuideStore.getTask(activeId);

  return (
    <div className={embedded ? 'mt-4 border-t border-corporate-border pt-5 space-y-4' : 'space-y-4'}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-corporate-dark">Ghid Operațional — editare HR</h3>
          <p className="text-sm text-corporate-muted mt-1">
            {OPERATIONAL_GUIDE_TASK_COUNT} categorii de măsurare. Checklist pre-măsurare, echipament, pași și video —
            {readOnly ? ' consultare per categorie (fără salvare).' : ' editabile per categorie.'}
          </p>
        </div>
        {!readOnly && <AutoSaveStatusText className="hidden @md:block shrink-0" />}
      </div>

      <nav
        aria-label="Selectare task măsurare"
        className="flex flex-wrap gap-1 rounded-xl border border-corporate-border bg-corporate-surface/50 p-1"
      >
        {OPERATIONAL_GUIDE_TASK_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => switchTask(id)}
            className={[
              'rounded-lg px-2.5 py-2 text-xs sm:text-sm font-medium transition-colors',
              activeId === id
                ? 'bg-corporate-black text-white shadow-sm'
                : 'text-corporate-muted hover:text-corporate-dark hover:bg-white',
            ].join(' ')}
          >
            {OPERATIONAL_GUIDE_LABELS[id]}
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
          <OperationalGuideTaskView task={activeTask} userId={user.id} readOnly />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Input
              label="Subtitlu categorie"
              value={categorySubtitle}
              readOnly={readOnly}
              onChange={(e) => setCategorySubtitle(e.target.value)}
              placeholder="Ex.: Blat / șorț"
            />
            <Textarea
              label="Condiții obligatorii — înainte de măsurare (câte o regulă pe linie)"
              value={preMeasurementText}
              readOnly={readOnly}
              onChange={(e) => setPreMeasurementText(e.target.value)}
              rows={8}
              placeholder={'Prezența persoanei cu putere de decizie\nAcces liber pentru măsurare\n…'}
            />
            <Textarea
              label="Explicații generale (sub titlu)"
              value={introText}
              readOnly={readOnly}
              onChange={(e) => setIntroText(e.target.value)}
              rows={3}
              placeholder="Context pentru inginer — ce verifică înainte de plecare…"
            />
            <Textarea
              label="Echipament tehnic (câte un element pe linie)"
              value={equipmentText}
              readOnly={readOnly}
              onChange={(e) => setEquipmentText(e.target.value)}
              rows={4}
              placeholder={'Proliner\nRuletă 5 m\nNivellă'}
            />
            <Textarea
              label="Pași de măsurare (câte un pas pe linie)"
              value={stepsText}
              readOnly={readOnly}
              onChange={(e) => setStepsText(e.target.value)}
              rows={6}
              placeholder={'Verificați accesul\nMăsurați perimetrul\n…'}
            />
            <Input
              label="URL video"
              value={videoUrl}
              readOnly={readOnly}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="YouTube, link .mp4 sau /docs/…"
            />
            <Input
              label="Titlu video (opțional)"
              value={videoTitle}
              readOnly={readOnly}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Demonstrație măsurare"
            />
            {!readOnly && (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="primary"
                disabled={autoSaveStatus === 'saving'}
                onClick={() => void handleManualSave()}
              >
                {autoSaveStatus === 'saving' ? 'Se salvează…' : `Salvează — ${OPERATIONAL_GUIDE_LABELS[activeId]}`}
              </Button>
              {message && (
                <p className={`text-sm ${message.startsWith('Salvat') ? 'text-emerald-700' : 'text-red-600'}`}>
                  {message}
                </p>
              )}
            </div>
            )}
          </div>

          <Card padding="sm" className="bg-corporate-surface/30 h-fit">
            <p className="text-xs font-semibold uppercase tracking-wide text-corporate-muted mb-2">Indicii HR</p>
            <ul className="text-sm text-corporate-muted space-y-2 list-disc list-inside">
              <li>
                <strong>Condiții pre-măsurare</strong> — reguli obligatorii (fără bifă); inginerul verifică
                personal înainte de plecare. Dacă o regulă nu e respectată — nu pleacă la măsurare.
              </li>
              <li>Responsabil: persoana care planifică măsurarea. Conținut editabil de HR.</li>
              <li>Echipamentul și pașii apar dedesubt, în ordinea afișată angajatului.</li>
              <li>Modificările se salvează automat după 1,5 s de pauză.</li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
