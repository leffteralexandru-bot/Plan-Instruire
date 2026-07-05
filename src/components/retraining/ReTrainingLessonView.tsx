import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDayById } from '@/data/trainingPlan';
import { INGINERI_ANGAJAT_PANEL_PATH } from '@/data/departments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TaskChecklist } from '@/components/day/TaskChecklist';
import { MaterialsPanel } from '@/components/day/MaterialsPanel';
import { useAuth } from '@/hooks/useAuth';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { userStore } from '@/lib/userStore';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import {
  COMPREHENSION_LABELS,
  RE_TRAINING_MATERIALS_TASK_ID,
  canTraineeEditReTrainingLesson,
  isReTrainingLessonComplete,
  normalizeReTrainingStatus,
  RE_TRAINING_STATUS_LABELS,
} from '@/lib/reTrainingWorkflow';
import {
  extractLessonNotesFromDescription,
  getReTrainingDay,
  getReTrainingSupplementaryDocs,
} from '@/lib/reTrainingLesson';
import type { ReTrainingSession, Task } from '@/types';
import { getErrorsForSession } from '@/lib/errorReTrainingDisplay';

interface ReTrainingLessonViewProps {
  session: ReTrainingSession;
  readOnly?: boolean;
  backLink?: string;
  backLabel?: string;
  /** Ascunde linkul de sus când e încorporat în planul de instruire */
  embedded?: boolean;
  /** În modul focalizat din plan — fără titlu duplicat */
  hideHeader?: boolean;
  onProgressChange?: () => void;
}

export function ReTrainingLessonView({
  session,
  readOnly,
  backLink = INGINERI_ANGAJAT_PANEL_PATH,
  backLabel = '← Înapoi la panou',
  embedded = false,
  hideHeader = false,
  onProgressChange,
}: ReTrainingLessonViewProps) {
  const { user } = useAuth();
  const { downloadDocument } = useHrPerformance();
  const [tick, setTick] = useState(0);
  const [msg, setMsg] = useState('');

  const live = useMemo(
    () => trainingSystemStore.getSessionById(session.id) ?? session,
    [session, tick],
  );

  const day = getReTrainingDay(live) ?? (live.topicDayId ? getDayById(live.topicDayId) : undefined);
  const lessonNotes = extractLessonNotesFromDescription(live);
  const extraDocs = getReTrainingSupplementaryDocs(live);
  const status = normalizeReTrainingStatus(live.status);
  const progress = live.lessonProgress ?? { completedTasks: [], mentorValidated: false };
  const checklistTasks: Task[] =
    day && day.tasks.length > 0
      ? day.tasks
      : [
          {
            id: RE_TRAINING_MATERIALS_TASK_ID,
            label: 'Am parcurs materialele și explicațiile lecției de re-instruire',
          },
        ];
  const totalTasks = checklistTasks.length;
  const tasksDone = isReTrainingLessonComplete(live, totalTasks);
  const isTrainee = user?.id === live.angajatId;
  const canEditLesson = isTrainee && !readOnly && canTraineeEditReTrainingLesson(live);
  const canComplete = canEditLesson;

  const supervisorName = useMemo(() => {
    if (live.supervisorId) {
      const name = userStore.getUserById(live.supervisorId)?.name;
      if (name) return name;
    }
    const profile = hrPerformanceStore.getProfile(live.angajatId);
    const fallbackId = profile?.supervisorId ?? profile?.managerId;
    if (fallbackId) return userStore.getUserById(fallbackId)?.name ?? '—';
    return '—';
  }, [live.supervisorId, live.angajatId]);

  const mentorName = useMemo(() => {
    const id = live.trainerId ?? live.mentorId;
    if (!id) return '—';
    return userStore.getUserById(id)?.name ?? '—';
  }, [live.trainerId, live.mentorId]);

  const notaDocId = useMemo(() => {
    const linked = getErrorsForSession(live);
    return linked.map((e) => e.signedDocumentId).find(Boolean) ?? linked.map((e) => e.documentId).find(Boolean);
  }, [live]);

  const refresh = () => setTick((n) => n + 1);

  const handleToggle = (taskId: string) => {
    if (!canEditLesson) return;
    const updated = trainingSystemStore.toggleReTrainingLessonTask(live.id, taskId);
    if (!updated) {
      setMsg('Nu s-a putut salva progresul. Reîncărcați pagina.');
      return;
    }
    setMsg('');
    refresh();
    onProgressChange?.();
  };

  const handleComplete = () => {
    if (!user || !tasksDone) {
      setMsg('Bifați toate activitățile înainte de finalizare.');
      return;
    }
    const updated = trainingSystemStore.markReTrainingTraineeComplete(live.id, user.id);
    if (updated) {
      setMsg('Lecție finalizată. Mentorul va confirma înțelegerea.');
      refresh();
      onProgressChange?.();
    }
  };

  return (
    <div className="space-y-6">
      {!hideHeader && (
      <div>
        {!embedded && (
          <Link to={backLink} className="text-sm text-corporate-accent-blue hover:underline mb-3 inline-block">
            {backLabel}
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="warning">Re-instruire</Badge>
          {day && <Badge variant="info">Ziua {day.dayNumber}</Badge>}
          <Badge variant="default">{RE_TRAINING_STATUS_LABELS[status]}</Badge>
          {live.traineeCompletedAt && <Badge variant="success">Lecție parcursă</Badge>}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">
          {live.topicTitle ?? day?.title ?? live.titlu}
        </h1>
        <p className="text-sm text-corporate-muted mt-2 max-w-2xl">{live.descriere.split('\n\nLecție')[0]}</p>
      </div>
      )}

      <Card className="border-indigo-100 bg-indigo-50/30">
        <h2 className="text-sm font-semibold text-corporate-dark mb-3">Responsabili re-instruire</h2>
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-xs text-corporate-muted uppercase tracking-wide">Supervizorul dvs.</dt>
            <dd className="font-medium text-corporate-dark mt-0.5">{supervisorName}</dd>
            <p className="text-xs text-corporate-muted mt-1">A înregistrat eroarea și coordonează remedierea</p>
          </div>
          <div>
            <dt className="text-xs text-corporate-muted uppercase tracking-wide">Mentor care vă instruiește</dt>
            <dd className="font-medium text-corporate-dark mt-0.5">{mentorName}</dd>
            <p className="text-xs text-corporate-muted mt-1">
              Confirmă la final dacă ați înțeles lecția
            </p>
          </div>
        </dl>
      </Card>

      {notaDocId && (
        <Card className="border-amber-100 bg-amber-50/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-corporate-dark">Nota de constatare</h2>
              <p className="text-xs text-corporate-muted mt-0.5">Documentul legat de eroarea remediată</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => void downloadDocument(notaDocId)}>
              Deschide nota
            </Button>
          </div>
        </Card>
      )}

      {lessonNotes && (
        <Card>
          <h2 className="text-sm font-semibold text-corporate-dark mb-2">Detalii lecție (supervizor)</h2>
          <p className="text-sm text-corporate-stone whitespace-pre-wrap">{lessonNotes}</p>
        </Card>
      )}

      {day ? (
        <>
          <TaskChecklist
            tasks={checklistTasks}
            completedTasks={progress.completedTasks}
            onToggle={handleToggle}
            readOnly={!canEditLesson}
          />
          <MaterialsPanel materials={day.materials} />
        </>
      ) : (
        <>
          <TaskChecklist
            tasks={checklistTasks}
            completedTasks={progress.completedTasks}
            onToggle={handleToggle}
            readOnly={!canEditLesson}
          />
          <Card>
            <p className="text-sm text-corporate-muted">
              Lecția nu este legată de o zi din plan — parcurgeți materialele încărcate de supervizor și bifați
              activitatea de mai sus.
            </p>
          </Card>
        </>
      )}

      {extraDocs.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-corporate-dark mb-3">Materiale suplimentare</h2>
          <ul className="space-y-2">
            {extraDocs.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  className="text-sm text-corporate-accent hover:underline"
                  onClick={() => void downloadDocument(doc.id)}
                >
                  {doc.nume}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {live.trainerReport?.comprehension && (
        <Card className="border-orange-200 bg-orange-50/40">
          <p className="text-sm font-medium text-corporate-dark">
            Confirmare mentor: {COMPREHENSION_LABELS[live.trainerReport.comprehension]}
          </p>
          <p className="text-sm text-corporate-stone mt-2 whitespace-pre-wrap">{live.trainerReport.text}</p>
        </Card>
      )}

      {canComplete && (
        <Card className="border-amber-200 bg-amber-50/30">
          <p className="text-sm text-corporate-muted mb-3">
            După parcurgerea materialelor și bifarea activităților, marcați lecția ca finalizată.{' '}
            <strong>{mentorName}</strong> va confirma dacă ați înțeles conținutul.
          </p>
          <Button type="button" variant="primary" size="sm" disabled={!tasksDone} onClick={handleComplete}>
            Am finalizat re-instruirea
          </Button>
          {msg && <p className="text-xs text-red-600 mt-2">{msg}</p>}
        </Card>
      )}

      {live.traineeCompletedAt && isTrainee && status === 'in_curs' && (
        <p className="text-sm text-emerald-700">
          Ați finalizat lecția. Așteptați confirmarea mentorului <strong>{mentorName}</strong>.
        </p>
      )}
    </div>
  );
}
