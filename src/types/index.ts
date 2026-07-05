import type { DepartmentId } from '@/data/departments';

export type UserRole = 'admin' | 'hr' | 'angajat' | 'mentor';

export interface User {
  id: string;
  name: string;
  /** Un utilizator poate avea mai multe roluri: ex. ['angajat', 'mentor'] */
  roles: UserRole[];
  email: string;
  active: boolean;
  createdAt: string;
}

export type EnrollmentStatus = 'active' | 'completed' | 'suspended';

/** Înscriere la un program de instruire — HR atribuie mentorul */
export interface TrainingEnrollment {
  id: string;
  angajatId: string;
  departmentId: DepartmentId;
  cohortId: string;
  mentorId: string;
  programStart: string;
  status: EnrollmentStatus;
  createdAt: string;
  updatedAt: string;
}

/** Profil angajat cu datele instruirii active */
export interface TraineeProfile extends User {
  enrollmentId: string;
  mentorId: string;
  cohortId: string;
  departmentId: DepartmentId;
  programStart: string;
  enrollmentStatus: EnrollmentStatus;
}

export interface Material {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'doc' | 'link';
  url: string;
  description?: string;
  bitrixTemplate?: boolean;
  /** Fișier încărcat de HR (IndexedDB) — prioritar față de url static */
  documentId?: string;
}

/** Override HR pentru conținutul unei zile din planul de instruire */
export interface DayPlanOverride {
  dayId: string;
  departmentId: DepartmentId;
  title?: string;
  subtitle?: string;
  tasks?: Task[];
  materials?: Material[];
  updatedAt: string;
  updatedBy: string;
  updatedByName: string;
}

export interface Task {
  id: string;
  label: string;
  description?: string;
  /** Materiale atașate taskului (video, PDF, link) */
  materials?: Material[];
}

export interface DayPlan {
  id: string;
  dayNumber: number;
  title: string;
  subtitle?: string;
  tasks: Task[];
  materials: Material[];
  requiresMentorValidation: boolean;
  mentorValidationLabel?: string;
  fieldDay?: boolean;
  bitrixDay?: boolean;
}

export interface WeekPlan {
  id: string;
  weekNumber: number;
  title: string;
  description: string;
  days: DayPlan[];
}

export interface QuizResult {
  score: number;
  total: number;
  passed: boolean;
  completedAt: string;
  attempts: number;
  /** Răspunsuri ale angajatului: id întrebare → index opțiune */
  answers?: Record<string, number>;
}

export interface PhotoAttachment {
  id: string;
  dayId: string;
  label: string;
  createdAt: string;
  gpsNote?: string;
  synced?: boolean;
  /** Legacy — migrat în IndexedDB */
  dataUrl?: string;
}

export interface DayProgress {
  completedTasks: string[];
  mentorValidated: boolean;
  mentorValidatedAt?: string;
  mentorNotes?: string;
  quizResult?: QuizResult;
  mentorUnlocked?: boolean;
}

export interface FeedbackForm {
  weekNumber: 2 | 4;
  autonomieProliner: 1 | 2 | 3 | 4 | 5;
  proiectareFaraErori: 1 | 2 | 3 | 4 | 5;
  integrareEchipa: 1 | 2 | 3 | 4 | 5;
  comentarii: string;
  completedAt?: string;
  mentorName?: string;
}

export interface ActConstatare {
  id: string;
  proiectNume: string;
  dataMasuratoare: string;
  eroriIdentificate: string;
  abateriMasuratori: string;
  masuriCorective: string;
  observatii?: string;
  dayId?: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  targetDayId?: string;
  details?: string;
  createdAt: string;
}

export interface DevelopmentPlan {
  obiective6Luni: string;
  competenteDeDezvoltat: string;
  proiecteTinta: string;
  mentorAcord: string;
  completedAt: string;
}

export interface Certificate {
  issuedAt: string;
  mentorName: string;
  stagiarName: string;
  programVersion: string;
  certificateNumber?: string;
  /** Nivel profesional la emitere — din feedback mentor S2/S4 */
  nivelLabel?: string;
  nivelScore?: number;
  /** Rezultat test teoretic Ziua 10 la emitere */
  testScoreLabel?: string;
  testPercent?: number;
  testPassed?: boolean;
}

export interface AppProgress {
  userId: string;
  days: Record<string, DayProgress>;
  feedbacks: FeedbackForm[];
  acteConstatare: ActConstatare[];
  photos: PhotoAttachment[];
  auditLog: AuditEntry[];
  developmentPlan?: DevelopmentPlan;
  certificate?: Certificate;
  lastVisitedDayId?: string;
  schemaVersion: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface OrgSettings {
  programVersion: string;
  activeCohortId?: string;
}

// ─── Performanță HR (post-instruire) ─────────────────────────────────────────

export type EmployeeStatus = 'activ' | 'suspendat' | 'incetat' | 'in_reinstruire';
export type EmployeeType = 'incepator' | 'experimentat';
export type EvaluationStatus = 'planificat' | 'in_curs' | 'evaluat' | 'intarziat';
export type QuickNoteType = 'observatie' | 'apreciere' | 'atentionare';
export type ErrorMotiv =
  | 'neatentie'
  | 'lipsa_procedura'
  | 'comunicare'
  | 'materiale'
  | 'echipament'
  | 'altul';
export type ActionPlanStatus = 'deschis' | 'in_lucru' | 'inchis';

export type ErrorCaseHrStatus = 'ciorna' | 'trimis_hr' | 'aprobat_hr' | 'respins_hr';

export interface ErrorReTrainingProposal {
  topicDayId: string;
  topicTitle: string;
  trainerId: string;
  lessonNotes: string;
  lessonDocumentIds: string[];
  /** Data propusă de supervizor pentru începerea re-instruirii */
  plannedStartDate?: string;
  submittedAt?: string;
  submittedBy?: string;
}

export type HrDocumentType =
  | 'template_evaluare'
  | 'evaluare_semnata'
  | 'evaluare_electronica'
  | 'nota_constatare'
  | 'plan_actiune'
  | 'certificat'
  | 're_instruire'
  | 'sablon_lucru'
  | 'material_instruire'
  | 'altul';

export type EvaluationStageId = 'auto_evaluare' | 'evaluare_mentor' | 'validare_hr';
export type EvaluationStageStatus = 'neinceput' | 'in_curs' | 'completat';

export interface EvaluationStage {
  id: EvaluationStageId;
  label: string;
  status: EvaluationStageStatus;
  completedAt?: string;
  completedBy?: string;
  completedByName?: string;
}

export interface EmployeeSelfAssessment {
  realizari: string;
  dificultati: string;
  obiectiveViitoare: string;
  completedAt?: string;
}

/** Matrice oficială inginer proiectant — 10 criterii × nivel 1–4 */
export type DesignerCompetencyLevel = 1 | 2 | 3 | 4;

export type DesignerCompetencyCriterionId =
  | 'masuratori'
  | 'proliner'
  | 'autocad'
  | 'cerinteTehnice'
  | 'optimizareMaterial'
  | 'preventieErori'
  | 'termene'
  | 'comunicare'
  | 'autonomie'
  | 'instruire';

export type DesignerCompetencyScores = Record<DesignerCompetencyCriterionId, DesignerCompetencyLevel>;

export interface DesignerCompetencyOutcome {
  scores: DesignerCompetencyScores;
  total: number;
  nivel: DesignerCompetencyLevel;
  nivelLabel: string;
  incadrare: string;
  /** Vizibil doar HR / Admin în UI */
  coeficientSalarialPercent: number;
  computedAt: string;
}

/** Foldere arhivă per angajat (structură ierarhică) */
export type EmployeeArchiveFolder =
  | 'documentatie_baza'
  | 'istoric_evaluari'
  | 'istoric_instruire';

export const ARCHIVE_FOLDER_LABELS: Record<EmployeeArchiveFolder, string> = {
  documentatie_baza: 'Documentație de bază',
  istoric_evaluari: 'Istoric evaluări',
  istoric_instruire: 'Istoric instruire',
};

export const ARCHIVE_FOLDER_DESCRIPTIONS: Record<EmployeeArchiveFolder, string> = {
  documentatie_baza:
    'Plan finalizat — șabloane măsurare/proiectare și materiale de referință permanente.',
  istoric_evaluari: 'Rapoarte tri-lunale (electronic + scan semnat).',
  istoric_instruire: 'Sesiuni re-instruire obligatorii după erori repetate.',
};

export interface EmployeeProfile {
  userId: string;
  prenume: string;
  nume: string;
  functie: string;
  departamentId: DepartmentId;
  dataAngajarii: string;
  /** Supervizor desemnat de HR — evaluări 90 zile, re-instruire, notificări erori */
  supervisorId?: string;
  managerId?: string;
  /** Mentori evaluare per săptămână — setați de HR (S1–S4) */
  weeklyEvalMentors?: WeeklyEvaluationMentor[];
  /** Istoric atribuiri mentor principal, supervizor, mentori săptămânali */
  assignmentHistory?: EmployeeAssignmentHistory;
  status: EmployeeStatus;
  tipAngajat: EmployeeType;
  /** Ultimul nivel competență validat HR (matrice inginer proiectant) */
  nivelCompetenta?: DesignerCompetencyLevel;
  scorCompetentaTotal?: number;
  /** Poză profil — data URL (JPEG comprimat) */
  photoUrl?: string;
  /** Doar HR/Admin — coeficient salarial din matrice */
  coeficientSalarialPercent?: number;
  createdAt: string;
  updatedAt: string;
}

/** Mentor evaluare atribuit de HR pentru o săptămână din plan */
export interface WeeklyEvaluationMentor {
  weekNumber: number;
  mentorId: string;
}

/** Istoric schimbări mentor principal / supervizor / mentori săptămânali */
export interface AssignmentHistoryEntry {
  id: string;
  changedAt: string;
  changedById?: string;
  changedByName?: string;
  fromUserId?: string;
  toUserId?: string;
  note?: string;
}

export interface WeeklyMentorHistoryEntry extends AssignmentHistoryEntry {
  weekNumber: number;
}

export interface EmployeeAssignmentHistory {
  principalMentor?: AssignmentHistoryEntry[];
  supervisor?: AssignmentHistoryEntry[];
  weeklyMentors?: WeeklyMentorHistoryEntry[];
}

export interface EvaluationScores {
  calitate: 1 | 2 | 3 | 4 | 5;
  autonomie: 1 | 2 | 3 | 4 | 5;
  colaborare: 1 | 2 | 3 | 4 | 5;
  respectProceduri: 1 | 2 | 3 | 4 | 5;
}

export interface EvaluationCycle {
  id: string;
  angajatId: string;
  evaluatorId: string;
  perioadaStart: string;
  perioadaEnd: string;
  dataEvaluare?: string;
  termenReevaluare: string;
  status: EvaluationStatus;
  scoruri?: EvaluationScores;
  /** Chestionar auto-evaluare angajat (10 criterii) */
  competencySelfScores?: DesignerCompetencyScores;
  /** Scoruri validate de supervizor */
  competencySupervisorScores?: DesignerCompetencyScores;
  /** Rezultat final HR — nivel + coeficient */
  competencyResult?: DesignerCompetencyOutcome;
  concluzii?: string;
  planDezvoltare?: string;
  documentId?: string;
  /** Fișier evaluare încărcat de HR (template / formular electronic) */
  electronicDocumentId?: string;
  /** Parcurgere evaluare: auto-evaluare → supervizor → HR */
  stages?: EvaluationStage[];
  employeeSelfAssessment?: EmployeeSelfAssessment;
  /** Evaluare narativă supervizor — aceleași întrebări ca la auto-evaluare */
  supervisorAssessment?: EmployeeSelfAssessment;
  observatiiMentor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuickNote {
  id: string;
  angajatId: string;
  autorId: string;
  autorNume: string;
  autorRol: 'mentor' | 'hr' | 'manager' | 'admin';
  text: string;
  tip: QuickNoteType;
  createdAt: string;
}

export interface ErrorActionPlan {
  pasi: string;
  responsabilId: string;
  termenLimita: string;
  status: ActionPlanStatus;
  inchisLa?: string;
}

/** Notă de constatare (sesizare) — comandă material refacere */
export interface NotaConstatareRefacere {
  deLa: string;
  data: string;
  subsemnatul: string;
  dataComanda: string;
  client: string;
  nrComanda: string;
  subGarantie: 'da' | 'nu';
  materialCuloareTip: string;
  cantitate: string;
  descriereDefect: string;
  cauzaDefect: string;
  persoanaResponsabila: string;
  incheiatDe: string;
  angajatConfirmare: string;
  martorNume?: string;
  martorFunctie?: string;
  anexe?: string;
  masuriCorective1: string;
  masuriCorective2?: string;
}

export interface ErrorCase {
  id: string;
  angajatId: string;
  raportatDe: string;
  raportatDeNume: string;
  data: string;
  proiectNume?: string;
  motiv: ErrorMotiv;
  descriere: string;
  documentId?: string;
  /** Scan notă de constatare semnată de angajat + supervizor */
  signedDocumentId?: string;
  notaConstatare?: NotaConstatareRefacere;
  /** Propunere re-instruire completată de supervizor înainte de trimitere la HR */
  reTrainingProposal?: ErrorReTrainingProposal;
  hrStatus?: ErrorCaseHrStatus;
  hrReviewNote?: string;
  hrReviewedAt?: string;
  hrReviewedBy?: string;
  reTrainingSessionId?: string;
  planActiune: ErrorActionPlan;
  legaturaBiblioteca?: string;
  migratedFromActId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HrDocument {
  id: string;
  angajatId?: string;
  tip: HrDocumentType;
  /** Folder arhivă angajat — izolare logică documente */
  folder?: EmployeeArchiveFolder;
  nume: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  uploadedByNume: string;
  evaluationCycleId?: string;
  errorCaseId?: string;
  reTrainingSessionId?: string;
  /** Zi din planul de instruire (materiale HR) */
  dayId?: string;
  departmentId?: DepartmentId;
  createdAt: string;
}

/** Index plan modular arhivat la finalizare (săptămâni → zile → materiale) */
export interface PlanArchiveIndexEntry {
  weekId: string;
  weekNumber: number;
  weekTitle: string;
  dayId: string;
  dayNumber: number;
  dayTitle: string;
  materials: Material[];
  instructions: string[];
}

export interface PlanArchiveRecord {
  id: string;
  angajatId: string;
  departmentId: DepartmentId;
  enrollmentId?: string;
  completedAt: string;
  progressPercent: number;
  index: PlanArchiveIndexEntry[];
}

/** Motiv cerere re-instruire pedagogică (inițiată de angajat) */
export type ReinstruireCerereMotiv = 'eroare' | 'neintelegere' | 'uitare' | 'altele';

export type ReinstruireCerereStatus = 'trimisa' | 'acceptata' | 'respinsa';

export type ReTrainingTrigger = 'cerere_angajat' | 'eroare';

/** Cerere angajat → supervizor (fără HR la început) */
export interface ReinstruireCerere {
  id: string;
  angajatId: string;
  supervisorId: string;
  topicDayId: string;
  topicTitle: string;
  topicWeekNumber?: number;
  topicDayNumber?: number;
  motiv: ReinstruireCerereMotiv;
  mesaj?: string;
  status: ReinstruireCerereStatus;
  rejectReason?: string;
  reTrainingSessionId?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
}

/** Sesiune re-instruire după erori — notă semnată → plan supervizor → OK HR → trainer → confirmare */
export type ReTrainingStatus =
  | 'alerta_supervizor'
  | 'asteapta_hr'
  | 'planificat'
  | 'in_curs'
  | 'raport_trainer'
  | 'confirmat_supervizor'
  | 'finalizat'
  /** @deprecated migrat la alerta_supervizor */
  | 'obligatoriu';

export interface TrainerReport {
  text: string;
  /** Confirmare mentor: a înțeles lecția sau nu */
  comprehension?: 'inteles' | 'neinteles';
  submittedAt: string;
  submittedBy: string;
  submittedByName: string;
  documentId?: string;
}

/** Sesiune obligatorie re-instruire (declanșată de erori repetate) */
export interface ReTrainingSession {
  id: string;
  angajatId: string;
  supervisorId: string;
  /** Persoana desemnată de supervizor să instruiască */
  trainerId?: string;
  /** Mentor legacy — egal cu trainerId când e setat */
  mentorId: string;
  errorMotiv: ErrorMotiv;
  errorCaseIds: string[];
  /** cerere_angajat = flux pedagogic (fără HR la start) */
  trigger?: ReTrainingTrigger;
  reinstruireCerereId?: string;
  cerereMotiv?: ReinstruireCerereMotiv;
  /** Raport trimis la HR la final (doar flux pedagogic) */
  hrReportSubmittedAt?: string;
  hrReportSubmittedBy?: string;
  titlu: string;
  descriere: string;
  /** Temă din planul de instruire de bază (zi) */
  topicDayId?: string;
  topicTitle?: string;
  materialUrls: string[];
  documentIds: string[];
  trainerReport?: TrainerReport;
  supervisorConfirmedAt?: string;
  supervisorConfirmedBy?: string;
  supervisorSubmittedAt?: string;
  supervisorSubmittedBy?: string;
  hrPlanApprovedAt?: string;
  hrPlanApprovedBy?: string;
  hrPlanApprovedByName?: string;
  hrGroupedAt?: string;
  hrGroupedBy?: string;
  hrGroupedByName?: string;
  hrConfirmedAt?: string;
  hrConfirmedBy?: string;
  hrConfirmedByName?: string;
  status: ReTrainingStatus;
  /** Progres lecție re-instruire (doar ziua aleasă) */
  lessonProgress?: DayProgress;
  /** Angajatul a marcat lecția ca parcursă */
  traineeCompletedAt?: string;
  traineeCompletedBy?: string;
  /** Data la care începe re-instruirea (confirmată sau propusă) */
  plannedStartDate?: string;
  termenLimita: string;
  finalizatLa?: string;
  createdAt: string;
}

/** Alertă supervizor — același tip de eroare repetat */
export interface ErrorRepeatAlert {
  id: string;
  angajatId: string;
  supervisorId: string;
  mentorId: string;
  errorMotiv: ErrorMotiv;
  errorTag: string;
  count: number;
  errorCaseIds: string[];
  reTrainingSessionId: string;
  severity: 'warning' | 'critical';
  acknowledgedAt?: string;
  createdAt: string;
}

export interface KpiSnapshot {
  id: string;
  luna: string;
  departamentId?: DepartmentId;
  totalAngajati: number;
  eroriLuna: number;
  evaluariIntarziate: number;
  evaluariFinalizate: number;
  progresInstruireMediu: number;
  createdAt: string;
}

export type TimelineEventType =
  | 'evaluare'
  | 'nota'
  | 'eroare'
  | 'document'
  | 'instruire'
  | 're_instruire'
  | 'alerta_eroare'
  | 'audit';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  subtitle?: string;
  severity?: 'info' | 'warning' | 'critical' | 'success';
  createdAt: string;
  meta?: Record<string, string>;
}
