import type { DepartmentId } from '@/data/departments';

export type UserRole = 'stagiar' | 'mentor' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  mentorId?: string;
  programStart?: string;
  cohortId?: string;
  departmentId?: DepartmentId;
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
