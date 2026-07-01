export type HrAlertSeverity = 'info' | 'warning' | 'critical';

export interface HrAlert {
  id: string;
  severity: HrAlertSeverity;
  title: string;
  message: string;
  traineeId?: string;
}

export interface HrPerformancePayload {
  profiles: Array<{
    userId: string;
    prenume: string;
    nume: string;
  }>;
  evaluations: Array<{
    id: string;
    angajatId: string;
    termenReevaluare: string;
    status: 'planificat' | 'in_curs' | 'evaluat' | 'intarziat';
    perioadaStart: string;
  }>;
  errorCases: Array<{
    id: string;
    angajatId: string;
    descriere: string;
    proiectNume?: string;
    planActiune: {
      termenLimita: string;
      status: 'deschis' | 'in_lucru' | 'inchis';
    };
  }>;
  updatedAt: string;
}
