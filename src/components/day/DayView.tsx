import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { DayPlan } from '@/types';
import { getWeekForDay } from '@/data/trainingPlan';
import { ingineriPath, INGINERI_PLAN_PATH } from '@/data/departments';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';
import { useStagiarName } from '@/hooks/useStagiarId';
import { useFieldMode } from '@/context/FieldModeContext';
import { TaskChecklist } from './TaskChecklist';
import { MaterialsPanel } from './MaterialsPanel';
import { TheoreticalTest } from './TheoreticalTest';
import { BitrixQuickLink } from './BitrixQuickLink';
import { BitrixConnectionStatus } from '@/components/bitrix/BitrixConnectionStatus';
import { PhotoUpload } from '@/components/field/PhotoUpload';
import { DevelopmentPlanForm } from '@/components/forms/DevelopmentPlanForm';
import { CertificateIssue } from '@/components/certificate/CertificateGenerator';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { Button } from '@/components/ui/Button';

const FIELD_DAYS = [5, 6, 7, 11, 14];
const BITRIX_DAYS = [5, 7, 11];

interface DayViewProps {
  day: DayPlan;
  readOnly?: boolean;
}

export function DayView({ day, readOnly }: DayViewProps) {
  const { user, isMentor } = useAuth();
  const stagiarName = useStagiarName();
  const { fieldMode } = useFieldMode();
  const {
    progress,
    getDayProgress,
    toggleTask,
    isDayComplete,
    visitDay,
    saveDevelopmentPlan,
    issueCertificate,
  } = useProgress();

  const dayProgress = getDayProgress(day.id);
  const week = getWeekForDay(day.id);
  const tasksPercent = Math.round((dayProgress.completedTasks.length / day.tasks.length) * 100);
  const complete = isDayComplete(day.id);
  const showField = fieldMode || FIELD_DAYS.includes(day.dayNumber);

  useEffect(() => {
    if (!readOnly) visitDay(day.id);
  }, [day.id, readOnly, visitDay]);

  return (
    <div className={`space-y-6 ${fieldMode ? 'field-mode-active' : ''}`}>
      <div>
        <Link to={INGINERI_PLAN_PATH} className="text-sm text-corporate-accent-blue hover:underline mb-3 inline-block">
          ← Înapoi la Dashboard
        </Link>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {week && <Badge variant="info">Săptămâna {week.weekNumber}</Badge>}
          <Badge variant="default">Ziua {day.dayNumber}</Badge>
          {complete && <Badge variant="success">Zi completă</Badge>}
          {showField && <Badge variant="warning">Zi teren</Badge>}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">{day.title}</h1>
        {day.subtitle && <p className="text-corporate-muted mt-1">{day.subtitle}</p>}
      </div>

      <Card padding="sm">
        <ProgressBar percent={tasksPercent} label="Progres activități" size="md" />
      </Card>

      {day.requiresMentorValidation && (
        <Card className={dayProgress.mentorValidated ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30'}>
          <p className="font-medium text-corporate-dark">{day.mentorValidationLabel ?? 'Validare mentor necesară'}</p>
          <p className="text-sm text-corporate-muted mt-1">
            {dayProgress.mentorValidated ? 'Validat de mentor' : 'Așteaptă aprobarea mentorului'}
          </p>
        </Card>
      )}

      {BITRIX_DAYS.includes(day.dayNumber) && (
        <>
          <BitrixConnectionStatus
            dealId={progress?.acteConstatare.find((a) => a.bitrixProjectId)?.bitrixProjectId}
          />
          <BitrixQuickLink dayNumber={day.dayNumber} />
        </>
      )}

      {day.id === 'day-10' && <TheoreticalTest readOnly={readOnly} />}

      <TaskChecklist
        tasks={day.tasks}
        completedTasks={dayProgress.completedTasks}
        onToggle={(taskId) => toggleTask(day.id, taskId)}
        readOnly={readOnly}
      />

      {showField && <PhotoUpload dayId={day.id} readOnly={readOnly} />}

      <MaterialsPanel materials={day.materials} />

      {day.id === 'day-18' && !readOnly && (
        <Card className="border-corporate-gold/30 bg-corporate-gold-light/30">
          <p className="text-sm text-corporate-dark">
            <strong>Act de constatare:</strong>{' '}
            <Link to={ingineriPath('/evaluari')} className="text-corporate-accent-blue underline">Evaluări & Rapoarte</Link>
          </p>
        </Card>
      )}

      {day.id === 'day-20' && (
        <>
          <DevelopmentPlanForm
            existing={progress?.developmentPlan}
            mentorName={user?.name ?? 'Mentor'}
            onSave={saveDevelopmentPlan}
            readOnly={readOnly}
          />
          {(isMentor || readOnly) && (
            <CertificateIssue
              stagiarName={stagiarName}
              mentorName={user?.name ?? 'Mentor'}
              existing={progress?.certificate}
              onIssue={(mentor, stagiar) => issueCertificate({ mentorName: mentor, stagiarName: stagiar })}
            />
          )}
        </>
      )}

      {day.dayNumber < 20 && (
        <Link to={ingineriPath(`/zi/day-${day.dayNumber + 1}`)} className="block">
          <Button variant="secondary" fullWidth disabled={!complete}>
            Ziua următoare →
          </Button>
        </Link>
      )}
    </div>
  );
}
