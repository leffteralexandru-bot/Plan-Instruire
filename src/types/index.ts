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
}

export interface Task {
  id: string;
  label: string;
  description?: string;
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
  bitrixProjectId?: string;
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
  bitrixPortalUrl: string;
  programVersion: string;
  activeCohortId?: string;
}

// ─── Performanță HR (post-instruire) ─────────────────────────────────────────

export type EmployeeStatus = 'activ' | 'suspendat' | 'incetat';
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
export type HrDocumentType =
  | 'template_evaluare'
  | 'evaluare_semnata'
  | 'evaluare_electronica'
  | 'nota_constatare'
  | 'plan_actiune'
  | 'certificat'
  | 're_instruire'
  | 'sablon_lucru'
  | 'altul';

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
  managerId?: string;
  status: EmployeeStatus;
  tipAngajat: EmployeeType;
  createdAt: string;
  updatedAt: string;
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
  concluzii?: string;
  planDezvoltare?: string;
  documentId?: string;
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

/** Sesiune obligatorie re-instruire (declanșată de erori repetate) */
export interface ReTrainingSession {
  id: string;
  angajatId: string;
  mentorId: string;
  errorMotiv: ErrorMotiv;
  errorCaseIds: string[];
  titlu: string;
  descriere: string;
  materialUrls: string[];
  documentIds: string[];
  status: 'obligatoriu' | 'in_curs' | 'finalizat';
  termenLimita: string;
  finalizatLa?: string;
  createdAt: string;
}

/** Alertă mentor — același tip de eroare repetat */
export interface ErrorRepeatAlert {
  id: string;
  angajatId: string;
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
