import { useState } from 'react';

import { Button } from '@/components/ui/Button';

import { useHrPerformance } from '@/hooks/useHrPerformance';

import { useAuth } from '@/hooks/useAuth';

import { canRegisterErrorCase } from '@/lib/accessControl';

import { ERROR_MOTIV_LABELS, hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { scheduleHrCloudPush } from '@/lib/hrPerformanceSync';

import {

  buildInitialNotaState,

  NotaConstatareRefacereForm,

  validateRegisterErrorSubmission,

} from '@/components/shared/NotaConstatareRefacereForm';

import type { EmployeeProfile, ErrorCase } from '@/types';



interface RegisterErrorCaseFormProps {

  profiles: EmployeeProfile[];

  onSuccess?: (message: string, createdErrorId?: string) => void;

  compact?: boolean;

}



export function RegisterErrorCaseForm({

  profiles,

  onSuccess,

  compact,

}: RegisterErrorCaseFormProps) {

  const { uploadDocument, refresh } = useHrPerformance();

  const { user } = useAuth();



  const [angajatId, setAngajatId] = useState('');

  const [formState, setFormState] = useState(() => buildInitialNotaState(user?.name ?? ''));

  const [error, setError] = useState('');

  const [saving, setSaving] = useState(false);



  const signedNotaInputId = `signed-nota-register-${compact ? 'compact' : 'full'}`;

  const lessonFilesInputId = `lesson-files-register-${compact ? 'compact' : 'full'}`;



  const resetForm = () => {

    setAngajatId('');

    setFormState(buildInitialNotaState(user?.name ?? ''));

  };



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!user) return;

    setError('');



    const signedInput = document.getElementById(signedNotaInputId) as HTMLInputElement;

    const lessonInput = document.getElementById(lessonFilesInputId) as HTMLInputElement;

    const signedFile = signedInput?.files?.[0];

    const lessonFiles = lessonInput?.files;

    const hasLessonFiles = !!lessonFiles?.length;



    const validationError = validateRegisterErrorSubmission(

      formState,

      angajatId,

      !!signedFile,

      hasLessonFiles,

    );

    if (validationError) {

      setError(validationError);

      return;

    }

    if (!canRegisterErrorCase(user, angajatId)) {

      setError('Nu puteți înregistra erori pentru acest angajat.');

      return;

    }



    setSaving(true);

    const errorId = hrPerformanceStore.nextErrorCaseId();

    const now = new Date().toISOString();

    const motivLabel = ERROR_MOTIV_LABELS[formState.motiv];



    try {

      const signedDoc = await uploadDocument({

        file: signedFile!,

        tip: 'nota_constatare',

        angajatId,

        uploadedBy: user.id,

        uploadedByNume: user.name,

        errorCaseId: errorId,

      });



      const lessonDocumentIds: string[] = [];

      if (lessonFiles?.length) {

        for (let i = 0; i < lessonFiles.length; i++) {

          const file = lessonFiles[i];

          if (!file) continue;

          const doc = await uploadDocument({

            file,

            tip: 're_instruire',

            angajatId,

            uploadedBy: user.id,

            uploadedByNume: user.name,

            errorCaseId: errorId,

            folder: 'istoric_instruire',

            dayId: formState.topicDayId,

          });

          lessonDocumentIds.push(doc.id);

        }

      }



      const item: ErrorCase = {

        id: errorId,

        angajatId,

        raportatDe: user.id,

        raportatDeNume: user.name,

        data: formState.dataNota,

        motiv: formState.motiv,

        descriere: motivLabel,

        signedDocumentId: signedDoc.id,

        hrStatus: 'trimis_hr',

        reTrainingProposal: {

          topicDayId: formState.topicDayId,

          topicTitle: formState.topicTitle,

          trainerId: formState.mentorRecomandatId,

          lessonNotes: formState.lessonNotes.trim(),

          lessonDocumentIds,

          plannedStartDate: formState.dataInceputInstruire,

          submittedAt: now,

          submittedBy: user.id,

        },

        planActiune: {

          pasi: `Re-instruire: ${formState.topicTitle} · start ${formState.dataInceputInstruire}`,

          responsabilId: user.id,

          termenLimita: formState.dataInceputInstruire,

          status: 'deschis',

        },

        createdAt: now,

        updatedAt: now,

      };



      hrPerformanceStore.saveErrorCase(item);

      refresh();

      scheduleHrCloudPush();

      resetForm();

      if (signedInput) signedInput.value = '';

      if (lessonInput) lessonInput.value = '';

      onSuccess?.('Înregistrare trimisă la HR. Așteptați confirmarea.', errorId);

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Eroare la salvare.');

    } finally {

      setSaving(false);

    }

  };



  if (!profiles.length) {

    return (

      <p className="text-sm text-corporate-muted">

        Nu aveți angajați desemnați ca supervizor pentru înregistrare erori.

      </p>

    );

  }



  return (

    <form

      onSubmit={(e) => void handleSubmit(e)}

      className={[

        'grid gap-3 sm:grid-cols-2',

        compact ? 'p-3 rounded-xl bg-corporate-surface/60' : 'p-4 rounded-xl bg-corporate-surface',

      ].join(' ')}

    >

      <NotaConstatareRefacereForm

        profiles={profiles}

        angajatId={angajatId}

        onAngajatIdChange={setAngajatId}

        state={formState}

        onChange={setFormState}

        signedNotaInputId={signedNotaInputId}

        lessonFilesInputId={lessonFilesInputId}

      />



      <div className="sm:col-span-2">

        <Button type="submit" variant="primary" size="sm" disabled={saving}>

          {saving ? 'Se trimite la HR…' : 'Confirmă înregistrarea și trimite la HR'}

        </Button>

      </div>

      {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}

    </form>

  );

}


