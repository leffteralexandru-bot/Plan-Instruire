import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useUsers } from '@/context/UsersContext';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { buildEmployeeTimeline } from '@/lib/timelineBuilder';
import { downloadEmployeeDossierPdf } from '@/lib/exportEmployeeDossier';
import { openEvaluationReminderEmail } from '@/lib/emailAlerts';
import { EmployeeTimeline } from '@/components/admin/performance/EmployeeTimeline';
import { EmployeeArchivePanel } from '@/components/training/EmployeeArchivePanel';
import { storage } from '@/store/storage';
import { buildTraineeHrReport } from '@/lib/hrReport';
import { getDepartmentById, ingineriPath } from '@/data/departments';
import {
  EVALUATION_STATUS_LABELS,
  ERROR_MOTIV_LABELS,
  QUICK_NOTE_TYPE_LABELS,
  hrPerformanceStore,
} from '@/lib/hrPerformanceStore';
import { getEvaluationWorkflowLabel } from '@/lib/evaluationStages';
import { THEORETICAL_TEST } from '@/data/theoreticalTest';
import { TheoreticalTestHrPanel } from '@/components/admin/performance/TheoreticalTestHrPanel';
import { EmployeeCertificateSection } from '@/components/certificate/EmployeeCertificateSection';
import type { QuickNoteType } from '@/types';

interface EmployeeDossierViewProps {
  angajatId: string;
  backTo: string;
  backLabel: string;
  title?: string;
}

export function EmployeeDossierView({ angajatId, backTo, backLabel, title }: EmployeeDossierViewProps) {
  const { user } = useAuth();
  const { canEditEmployeeProfile, canExportDossier, canAddNote, canSendReminder } = useAccessControl();
  const { users, allTrainees } = useUsers();
  const {
    profiles,
    evaluations,
    quickNotes,
    errorCases,
    documents,
    updateProfile,
    addQuickNote,
  } = useHrPerformance();

  const [tab, setTab] = useState<'timeline' | 'evaluari' | 'erori' | 'documente' | 'profil'>('timeline');
  const [noteText, setNoteText] = useState('');
  const [noteTip, setNoteTip] = useState<QuickNoteType>('observatie');
  const [success, setSuccess] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const profile = profiles.find((p) => p.userId === angajatId);
  const angajatUser = users.find((u) => u.id === angajatId);
  const manager = users.find((u) => u.id === profile?.managerId);
  const isSelf = user?.id === angajatId;

  const timeline = useMemo(
    () => buildEmployeeTimeline(angajatId),
    [angajatId, evaluations, quickNotes, errorCases, documents],
  );

  const evals = evaluations.filter((e) => e.angajatId === angajatId);
  const notes = quickNotes.filter((n) => n.angajatId === angajatId);
  const errors = errorCases.filter((e) => e.angajatId === angajatId);

  const trainee = allTrainees.find((t) => t.id === angajatId);
  const trainingRow = trainee ? buildTraineeHrReport(trainee, storage.getProgress(angajatId)) : null;
  const quizResult = storage.getProgress(angajatId).days[THEORETICAL_TEST.dayId]?.quizResult;

  if (!profile || !angajatUser) {
    return (
      <Card>
        <p className="text-sm text-corporate-muted">Profil negăsit.</p>
        <Link to={backTo} className="text-corporate-gold text-sm mt-2 inline-block">
          ← {backLabel}
        </Link>
      </Card>
    );
  }

  const currentEval = hrPerformanceStore.getCurrentEvaluation(angajatId);
  const showProfileEdit = canEditEmployeeProfile && !isSelf;
  const showQuickNote = canAddNote(angajatId);

  const handleNote = () => {
    if (!user || !noteText.trim()) return;
    addQuickNote({
      angajatId,
      autorId: user.id,
      autorNume: user.name,
      autorRol: user.roles.includes('hr') ? 'hr' : user.roles.includes('admin') ? 'admin' : 'mentor',
      text: noteText.trim(),
      tip: noteTip,
    });
    setNoteText('');
    setSuccess('Observație salvată.');
  };

  const tabs = [
    { id: 'timeline' as const, label: 'Timeline' },
    { id: 'evaluari' as const, label: 'Evaluări' },
    { id: 'erori' as const, label: 'Erori' },
    { id: 'documente' as const, label: 'Arhivă' },
    ...(showProfileEdit ? [{ id: 'profil' as const, label: 'Profil' }] : []),
  ];

  return (
    <div className="space-y-6">
      <Link to={backTo} className="text-sm text-corporate-gold hover:underline">
        ← {backLabel}
      </Link>

      <Card>
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-corporate-dark">
              {title ?? `${profile.prenume} ${profile.nume}`}
            </h1>
            <p className="text-sm text-corporate-gold mt-0.5">{profile.functie}</p>
            <p className="text-xs text-corporate-muted mt-1">
              {getDepartmentById(profile.departamentId)?.label} · Angajat {profile.dataAngajarii}
              {!isSelf && <> · Evaluator: {manager?.name ?? '—'}</>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-start">
            {currentEval && (
              <Badge variant={currentEval.status === 'intarziat' ? 'warning' : 'default'}>
                {EVALUATION_STATUS_LABELS[currentEval.status]}
              </Badge>
            )}
            {trainingRow && <Badge variant="success">Instruire {trainingRow.progressPercent}%</Badge>}
            {trainingRow?.certificateIssued && (
              <EmployeeCertificateSection angajatId={angajatId} compact />
            )}
            {canExportDossier(angajatId) && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={pdfLoading}
                onClick={async () => {
                  setPdfLoading(true);
                  try {
                    await downloadEmployeeDossierPdf(profile);
                  } finally {
                    setPdfLoading(false);
                  }
                }}
              >
                {pdfLoading ? 'PDF…' : 'Export PDF dosar'}
              </Button>
            )}
            {canSendReminder && currentEval && currentEval.status !== 'evaluat' && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => openEvaluationReminderEmail(angajatId)}
              >
                Reminder email
              </Button>
            )}
            {isSelf && trainingRow && (
              <Link to={ingineriPath()}>
                <Button type="button" size="sm" variant="primary">
                  Plan instruire →
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {trainingRow?.certificateIssued && (
        <EmployeeCertificateSection angajatId={angajatId} />
      )}

      {canExportDossier(angajatId) && (
        <TheoreticalTestHrPanel
          employeeName={`${profile.prenume} ${profile.nume}`.trim()}
          quizResult={quizResult}
        />
      )}

      <div className="flex gap-1 overflow-x-auto rounded-lg border border-corporate-border bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === t.id ? 'bg-corporate-black text-white' : 'text-corporate-muted hover:bg-corporate-surface',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'timeline' && (
        <Card>
          <h2 className="text-sm font-semibold text-corporate-dark mb-1">Linie temporală 360°</h2>
          <p className="text-xs text-corporate-muted mb-4">
            Instruire · evaluări · erori · re-instruire · documente · activitate — filtrare pe categorie.
          </p>
          <EmployeeTimeline events={timeline} />
        </Card>
      )}

      {tab === 'evaluari' && (
        <Card>
          <h2 className="text-sm font-semibold text-corporate-dark mb-4">
            {isSelf ? 'Evaluările mele' : 'Istoric evaluări'}
          </h2>
          <ul className="space-y-3">
            {evals.map((ev) => (
              <li key={ev.id} className="rounded-lg border border-corporate-border px-3 py-2 text-sm">
                <div className="flex justify-between gap-2">
                  <Badge variant={ev.status === 'evaluat' ? 'success' : 'default'}>
                    {EVALUATION_STATUS_LABELS[ev.status]}
                  </Badge>
                  <span className="text-xs text-corporate-muted">
                    {ev.perioadaStart} — {ev.perioadaEnd}
                  </span>
                </div>
                {ev.termenReevaluare && ev.status !== 'evaluat' && (
                  <p className="text-xs text-amber-700 mt-1">Termen: {ev.termenReevaluare}</p>
                )}
                {ev.status !== 'evaluat' && (
                  <p className="text-xs text-corporate-muted mt-1">Etapa: {getEvaluationWorkflowLabel(ev)}</p>
                )}
                {ev.concluzii && <p className="mt-2 text-corporate-muted">{ev.concluzii}</p>}
              </li>
            ))}
            {!evals.length && (
              <p className="text-corporate-muted text-sm">Nicio evaluare înregistrată.</p>
            )}
          </ul>
        </Card>
      )}

      {tab === 'erori' && (
        <Card>
          <h2 className="text-sm font-semibold text-corporate-dark mb-4">Erori & planuri acțiune</h2>
          <ul className="space-y-3">
            {errors.map((err) => (
              <li key={err.id} className="rounded-lg border border-corporate-border px-3 py-2 text-sm">
                <p className="font-medium">
                  {ERROR_MOTIV_LABELS[err.motiv]} — {err.data}
                </p>
                <p className="text-corporate-muted text-xs mt-1">{err.descriere}</p>
                <p className="text-xs mt-2 bg-corporate-surface rounded p-2">
                  <strong>Plan:</strong> {err.planActiune.pasi}
                </p>
              </li>
            ))}
            {!errors.length && <p className="text-corporate-muted text-sm">Nicio eroare înregistrată.</p>}
          </ul>
        </Card>
      )}

      {tab === 'documente' && <EmployeeArchivePanel angajatId={angajatId} showPlanLink={isSelf} />}

      {tab === 'profil' && showProfileEdit && (
        <Card>
          <h2 className="text-sm font-semibold text-corporate-dark mb-4">Profil HR</h2>
          <div className="grid gap-3 sm:grid-cols-2 max-w-lg">
            <Input
              label="Prenume"
              value={profile.prenume}
              onChange={(e) => updateProfile(angajatId, { prenume: e.target.value })}
            />
            <Input
              label="Nume"
              value={profile.nume}
              onChange={(e) => updateProfile(angajatId, { nume: e.target.value })}
            />
            <Input
              label="Funcție"
              value={profile.functie}
              onChange={(e) => updateProfile(angajatId, { functie: e.target.value })}
            />
            <Input
              label="Data angajării"
              type="date"
              value={profile.dataAngajarii}
              onChange={(e) => updateProfile(angajatId, { dataAngajarii: e.target.value })}
            />
          </div>
        </Card>
      )}

      {isSelf && (
        <Card padding="sm" className="border-corporate-border bg-corporate-surface/50">
          <h3 className="text-sm font-semibold text-corporate-dark mb-2">Date personale</h3>
          <dl className="grid gap-2 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-corporate-muted text-xs">Nume complet</dt>
              <dd>
                {profile.prenume} {profile.nume}
              </dd>
            </div>
            <div>
              <dt className="text-corporate-muted text-xs">Funcție</dt>
              <dd>{profile.functie}</dd>
            </div>
            <div>
              <dt className="text-corporate-muted text-xs">Email</dt>
              <dd>{angajatUser.email}</dd>
            </div>
            <div>
              <dt className="text-corporate-muted text-xs">Data angajării</dt>
              <dd>{profile.dataAngajarii}</dd>
            </div>
          </dl>
        </Card>
      )}

      {showQuickNote && (
        <Card className="border-corporate-gold/25 bg-corporate-gold-light/20">
          <h3 className="text-sm font-semibold text-corporate-dark mb-2">Observație rapidă</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {(['observatie', 'apreciere', 'atentionare'] as QuickNoteType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNoteTip(t)}
                className={[
                  'text-xs rounded-full px-2.5 py-1 border',
                  noteTip === t ? 'border-corporate-gold bg-white' : 'border-transparent bg-white/50',
                ].join(' ')}
              >
                {QUICK_NOTE_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <textarea
            className="w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[70px] mb-2"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Notă scurtă înainte de evaluarea oficială…"
          />
          <Button type="button" size="sm" variant="secondary" onClick={handleNote} disabled={!noteText.trim()}>
            Salvează observația
          </Button>
          {notes.length > 0 && (
            <ul className="mt-4 space-y-2">
              {notes.slice(0, 5).map((n) => (
                <li key={n.id} className="text-xs text-corporate-stone bg-white/60 rounded p-2">
                  <strong>{QUICK_NOTE_TYPE_LABELS[n.tip]}</strong> — {n.autorNume}: {n.text}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {success && <p className="text-sm text-emerald-600">{success}</p>}
    </div>
  );
}
