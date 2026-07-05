import type { WeekPlan } from '@/types';
import { trainingPlanStore } from '@/lib/trainingPlanStore';

export const TRAINING_PLAN: WeekPlan[] = [
  {
    id: 'week-1',
    weekNumber: 1,
    title: 'Inițiere Teoretică',
    description: 'Familiarizare cu procesele, materialele și instrumentele artGRANIT.',
    days: [
      {
        id: 'day-1',
        dayNumber: 1,
        title: 'Introducere în companie',
        subtitle: 'Orientare organizațională și flux de lucru',
        tasks: [
          { id: 'd1-t1', label: 'Prezentare structură organizațională artGRANIT' },
          { id: 'd1-t2', label: 'Prezentare flux complet proiect (măsurare → montaj)' },
          { id: 'd1-t3', label: 'Familiarizare cu standardele interne de calitate' },
          { id: 'd1-t4', label: 'Semnare documente onboarding' },
        ],
        materials: [
          { id: 'm-portofoliu', title: 'Portofoliu artGRANIT', type: 'pdf', url: '/docs/portofoliu-artgranit.html', description: 'Prezentare proiecte reprezentative' },
          { id: 'm-video-istoric', title: 'Video Istoric Companie', type: 'video', url: '/docs/video-istoric.html' },
        ],
        requiresMentorValidation: false,
      },
      {
        id: 'day-2',
        dayNumber: 2,
        title: 'Proprietăți tehnice materiale',
        subtitle: 'Granit, quartz, ceramică — specificații și limitări',
        tasks: [
          { id: 'd2-t1', label: 'Studiu fișe tehnice granit natural' },
          { id: 'd2-t2', label: 'Studiu fișe tehnice quartz și ceramică' },
          { id: 'd2-t3', label: 'Exercițiu: identificare material potrivit per proiect' },
          { id: 'd2-t4', label: 'Notițe personale proprietăți (grosime, rezistență, prelucrare)' },
        ],
        materials: [
          { id: 'm-fise-tehnice', title: 'Catalog Materiale', type: 'pdf', url: '/docs/catalog-materiale.html' },
        ],
        requiresMentorValidation: false,
      },
      {
        id: 'day-3',
        dayNumber: 3,
        title: 'Manual Proliner',
        subtitle: 'Tehnologie de măsurare digitală',
        tasks: [
          { id: 'd3-t1', label: 'Citire manual Proliner (capitole 1-4)' },
          { id: 'd3-t2', label: 'Demonstrație live echipament Proliner' },
          { id: 'd3-t3', label: 'Exercițiu simulare măsurare blat simplu' },
          { id: 'd3-t4', label: 'Export fișier măsurători și verificare format' },
        ],
        materials: [
          { id: 'm-manual-proliner', title: 'Manual Proliner', type: 'pdf', url: '/docs/manual-proliner.html' },
          { id: 'm-video-proliner', title: 'Tutorial Video Proliner', type: 'video', url: '/docs/tutorial-proliner.html' },
        ],
        requiresMentorValidation: false,
      },
      {
        id: 'day-4',
        dayNumber: 4,
        title: 'Simulare CAD',
        subtitle: 'Proiectare digitală în software dedicat',
        tasks: [
          { id: 'd4-t1', label: 'Import măsurători Proliner în CAD' },
          { id: 'd4-t2', label: 'Desen blat L simplu cu decupaje standard' },
          { id: 'd4-t3', label: 'Aplicare canturi și finisaje' },
          { id: 'd4-t4', label: 'Generare fișă tehnică proiect' },
        ],
        materials: [
          { id: 'm-template-cad', title: 'Șablon Proiect CAD', type: 'doc', url: '/docs/sablon-cad.html' },
        ],
        requiresMentorValidation: false,
      },
      {
        id: 'day-5',
        dayNumber: 5,
        title: 'Gestiune Bitrix & Vizită Șantier',
        subtitle: 'CRM, documente și experiență pe teren',
        tasks: [
          { id: 'd5-t1', label: 'Navigare modul proiecte Bitrix24' },
          { id: 'd5-t2', label: 'Creare task și atașare documente proiect' },
          { id: 'd5-t3', label: 'Vizită șantier — observare montaj' },
          { id: 'd5-t4', label: 'Completare raport vizită șantier' },
        ],
        materials: [
          { id: 'm-bitrix-modele', title: 'Modele Documente Bitrix', type: 'doc', url: '/docs/modele-bitrix.html' },
          { id: 'm-ghid-bitrix', title: 'Ghid Rapid Bitrix24', type: 'pdf', url: '/docs/ghid-bitrix.html' },
        ],
        requiresMentorValidation: true,
        mentorValidationLabel: 'Validare finalizare Săptămâna I',
      },
    ],
  },
  {
    id: 'week-2',
    weekNumber: 2,
    title: 'Practică Asistată',
    description: 'Măsurători reale sub supervizare, gestionare cazuri atipice.',
    days: [
      {
        id: 'day-6',
        dayNumber: 6,
        title: 'Măsurători reale — asistent',
        subtitle: 'Primul contact cu clientul și terenul',
        tasks: [
          { id: 'd6-t1', label: 'Pregătire echipament și checklist vizită' },
          { id: 'd6-t2', label: 'Asistare măsurare blat standard (mentor lead)' },
          { id: 'd6-t3', label: 'Notare observații și particularități spațiu' },
          { id: 'd6-t4', label: 'Verificare fișier măsurători post-vizită' },
        ],
        materials: [
          { id: 'm-checklist-vizita', title: 'Checklist Vizită Măsurători', type: 'pdf', url: '/docs/checklist-vizita.html' },
        ],
        requiresMentorValidation: false,
      },
      {
        id: 'day-7',
        dayNumber: 7,
        title: 'Măsurători reale — rol activ',
        subtitle: 'Conducere măsurare cu supervizare',
        tasks: [
          { id: 'd7-t1', label: 'Conducere măsurare blat (mentor observă)' },
          { id: 'd7-t2', label: 'Comunicare cu client — explicare proces' },
          { id: 'd7-t3', label: 'Identificare și notare obstacole' },
          { id: 'd7-t4', label: 'Upload documente în Bitrix' },
        ],
        materials: [],
        requiresMentorValidation: false,
      },
      {
        id: 'day-8',
        dayNumber: 8,
        title: 'Unghiuri atipice',
        subtitle: 'Soluții pentru configurații non-standard',
        tasks: [
          { id: 'd8-t1', label: 'Studiu cazuri unghiuri atipice din portofoliu' },
          { id: 'd8-t2', label: 'Exercițiu proiectare blat cu unghiuri complexe' },
          { id: 'd8-t3', label: 'Validare soluție cu mentor' },
          { id: 'd8-t4', label: 'Documentare soluție în fișă tehnică' },
        ],
        materials: [
          { id: 'm-cazuri-atipice', title: 'Cazuri Unghiuri Atipice', type: 'pdf', url: '/docs/cazuri-atipice.html' },
        ],
        requiresMentorValidation: false,
      },
      {
        id: 'day-9',
        dayNumber: 9,
        title: 'Proiectare asistată completă',
        subtitle: 'Flux end-to-end sub supervizare',
        tasks: [
          { id: 'd9-t1', label: 'Proiectare completă blat din măsurători reale' },
          { id: 'd9-t2', label: 'Revizuire internă cu mentor' },
          { id: 'd9-t3', label: 'Corecții și optimizări' },
          { id: 'd9-t4', label: 'Trimitere proiect pentru aprobare client' },
        ],
        materials: [],
        requiresMentorValidation: false,
      },
      {
        id: 'day-10',
        dayNumber: 10,
        title: 'Test Teoretic',
        subtitle: 'Evaluare cunoștințe Săptămâna I-II',
        tasks: [
          { id: 'd10-t1', label: 'Completare test teoretic (materiale, Proliner, CAD)' },
          { id: 'd10-t2', label: 'Revizuire răspunsuri cu mentor' },
          { id: 'd10-t3', label: 'Identificare zone de îmbunătățire' },
        ],
        materials: [
          { id: 'm-test-teoretic', title: 'Fișă Test Teoretic (referință)', type: 'pdf', url: '/docs/test-teoretic.html' },
        ],
        requiresMentorValidation: true,
        mentorValidationLabel: 'Validare Test Teoretic — Ziua 10',
      },
    ],
  },
  {
    id: 'week-3',
    weekNumber: 3,
    title: 'Autonomie Completă (I)',
    description: 'Primul proiect independent de la măsurare la livrare.',
    days: [
      {
        id: 'day-11',
        dayNumber: 11,
        title: 'Proiect 1 — Pregătire & Măsurare',
        tasks: [
          { id: 'd11-t1', label: 'Analiză cerințe client și planificare vizită' },
          { id: 'd11-t2', label: 'Măsurare independentă proiect 1' },
          { id: 'd11-t3', label: 'Documentare și upload Bitrix' },
        ],
        materials: [],
        requiresMentorValidation: false,
      },
      {
        id: 'day-12',
        dayNumber: 12,
        title: 'Proiect 1 — Proiectare CAD',
        tasks: [
          { id: 'd12-t1', label: 'Proiectare completă CAD proiect 1' },
          { id: 'd12-t2', label: 'Auto-verificare conform checklist calitate' },
          { id: 'd12-t3', label: 'Trimitere pentru validare internă' },
        ],
        materials: [],
        requiresMentorValidation: false,
      },
      {
        id: 'day-13',
        dayNumber: 13,
        title: 'Proiect 1 — Finalizare',
        tasks: [
          { id: 'd13-t1', label: 'Incorporare feedback și revizie finală' },
          { id: 'd13-t2', label: 'Aprobare client și comandă producție' },
          { id: 'd13-t3', label: 'Urmărire status producție' },
        ],
        materials: [],
        requiresMentorValidation: true,
        mentorValidationLabel: 'Validare Proiect 1 Independent',
      },
      {
        id: 'day-14',
        dayNumber: 14,
        title: 'Proiect 2 — Măsurare în oglindă',
        subtitle: 'Tehnică avansată de măsurare simetrică',
        tasks: [
          { id: 'd14-t1', label: 'Studiu procedură măsurare în oglindă' },
          { id: 'd14-t2', label: 'Măsurare proiect 2 (configurație oglindă)' },
          { id: 'd14-t3', label: 'Verificare simetrie și toleranțe' },
        ],
        materials: [
          { id: 'm-procedura-oglinda', title: 'Procedură Măsurare Oglindă', type: 'pdf', url: '/docs/procedura-oglinda.html' },
        ],
        requiresMentorValidation: false,
      },
      {
        id: 'day-15',
        dayNumber: 15,
        title: 'Proiect 2 — Proiectare & Livrare',
        tasks: [
          { id: 'd15-t1', label: 'Proiectare CAD proiect 2' },
          { id: 'd15-t2', label: 'Completare Act de constatare (dacă aplicabil)' },
          { id: 'd15-t3', label: 'Finalizare și livrare proiect 2' },
        ],
        materials: [],
        requiresMentorValidation: false,
      },
    ],
  },
  {
    id: 'week-4',
    weekNumber: 4,
    title: 'Autonomie Completă (II)',
    description: 'Al treilea proiect, evaluare finală și integrare completă.',
    days: [
      {
        id: 'day-16',
        dayNumber: 16,
        title: 'Proiect 3 — Start',
        tasks: [
          { id: 'd16-t1', label: 'Planificare și măsurare proiect 3' },
          { id: 'd16-t2', label: 'Proiectare CAD' },
          { id: 'd16-t3', label: 'Coordonare cu echipa montaj' },
        ],
        materials: [],
        requiresMentorValidation: false,
      },
      {
        id: 'day-17',
        dayNumber: 17,
        title: 'Proiect 3 — Complexitate',
        subtitle: 'Caz cu elemente multiple (insule, backsplash)',
        tasks: [
          { id: 'd17-t1', label: 'Integrare insulă și backsplash în proiect' },
          { id: 'd17-t2', label: 'Verificare compatibilitate materiale' },
          { id: 'd17-t3', label: 'Prezentare client' },
        ],
        materials: [],
        requiresMentorValidation: false,
      },
      {
        id: 'day-18',
        dayNumber: 18,
        title: 'Acte de constatare',
        subtitle: 'Documentare erori și abateri',
        tasks: [
          { id: 'd18-t1', label: 'Revizuire acte constatare anterioare' },
          { id: 'd18-t2', label: 'Solicită re-instruire lecție (pagina Evaluări)' },
          { id: 'd18-t3', label: 'Analiză cauze și măsuri preventive' },
        ],
        materials: [
        ],
        requiresMentorValidation: false,
      },
      {
        id: 'day-19',
        dayNumber: 19,
        title: 'Proiect 3 — Finalizare',
        tasks: [
          { id: 'd19-t1', label: 'Livrare finală proiect 3' },
          { id: 'd19-t2', label: 'Retrospectivă proiecte săptămâna 3-4' },
          { id: 'd19-t3', label: 'Pregătire evaluare finală' },
        ],
        materials: [],
        requiresMentorValidation: true,
        mentorValidationLabel: 'Validare Proiect 3 Independent',
      },
      {
        id: 'day-20',
        dayNumber: 20,
        title: 'Evaluare Finală',
        subtitle: 'Încheiere program instruire',
        tasks: [
          { id: 'd20-t1', label: 'Prezentare portofoliu proiecte realizate' },
          { id: 'd20-t2', label: 'Evaluare finală cu mentor și șef proiectare' },
          { id: 'd20-t3', label: 'Feedback reciproc și plan dezvoltare continuă' },
          { id: 'd20-t4', label: 'Semnare certificat finalizare instruire' },
        ],
        materials: [],
        requiresMentorValidation: true,
        mentorValidationLabel: 'Validare Evaluare Finală — Ziua 20',
      },
    ],
  },
];

export const ALL_DAYS = TRAINING_PLAN.flatMap((w) => w.days);

/** Plan efectiv (static + override-uri HR) */
export function getTrainingPlanWeeks(): WeekPlan[] {
  return trainingPlanStore.getEffectivePlan();
}

export function getEffectiveAllDays() {
  return trainingPlanStore.getEffectiveAllDays();
}

export function getDayById(dayId: string) {
  return trainingPlanStore.getEffectiveDay(dayId);
}

export function getWeekForDay(dayId: string) {
  return trainingPlanStore.getEffectiveWeekForDay(dayId);
}

export function getTotalTasks(): number {
  return trainingPlanStore.getEffectiveTotalTasks();
}
