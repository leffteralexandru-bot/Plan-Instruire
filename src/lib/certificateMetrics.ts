import { THEORETICAL_TEST } from '@/data/theoreticalTest';
import type { AppProgress, Certificate, FeedbackForm } from '@/types';

export const FEEDBACK_RATING_LABELS = ['Slab', 'Sub medie', 'Mediu', 'Bun', 'Excelent'] as const;

export interface CertificateMetrics {
  nivelLabel: string | null;
  /** Medie feedback mentor S2/S4, scala 1–5 */
  nivelScore: number | null;
  testScoreLabel: string | null;
  testPercent: number | null;
  testPassed: boolean | null;
}

function feedbackWeekAverage(f: FeedbackForm): number {
  return (f.autonomieProliner + f.proiectareFaraErori + f.integrareEchipa) / 3;
}

export function ratingLabelFromScore(score: number): string {
  const idx = Math.min(5, Math.max(1, Math.round(score))) - 1;
  return FEEDBACK_RATING_LABELS[idx];
}

export function buildCertificateMetrics(progress: AppProgress): CertificateMetrics {
  const f2 = progress.feedbacks.find((f) => f.weekNumber === 2);
  const f4 = progress.feedbacks.find((f) => f.weekNumber === 4);
  const weekAvgs = [f2, f4].filter(Boolean).map((f) => feedbackWeekAverage(f!));
  const nivelScore = weekAvgs.length
    ? Math.round((weekAvgs.reduce((a, b) => a + b, 0) / weekAvgs.length) * 10) / 10
    : null;

  const quiz = progress.days[THEORETICAL_TEST.dayId]?.quizResult;
  const testPercent = quiz ? Math.round((quiz.score / quiz.total) * 100) : null;

  return {
    nivelLabel: nivelScore !== null ? ratingLabelFromScore(nivelScore) : null,
    nivelScore,
    testScoreLabel: quiz ? `${quiz.score}/${quiz.total}` : null,
    testPercent,
    testPassed: quiz?.passed ?? null,
  };
}

export function metricsFromCertificate(certificate: Certificate): CertificateMetrics | null {
  if (certificate.nivelScore == null && certificate.testPercent == null) return null;
  return {
    nivelLabel: certificate.nivelLabel ?? null,
    nivelScore: certificate.nivelScore ?? null,
    testScoreLabel: certificate.testScoreLabel ?? null,
    testPercent: certificate.testPercent ?? null,
    testPassed: certificate.testPassed ?? null,
  };
}

export function resolveCertificateMetrics(
  certificate: Certificate,
  progress?: AppProgress,
): CertificateMetrics | null {
  const stored = metricsFromCertificate(certificate);
  if (stored) return stored;
  if (progress) return buildCertificateMetrics(progress);
  return null;
}

export function formatNivelLine(metrics: CertificateMetrics): string | null {
  if (metrics.nivelScore === null || !metrics.nivelLabel) return null;
  return `${metrics.nivelLabel} — medie ${metrics.nivelScore}/5 (feedback mentor S2/S4)`;
}

export function formatTestLine(metrics: CertificateMetrics): string | null {
  if (metrics.testPercent === null || !metrics.testScoreLabel) return null;
  const status = metrics.testPassed === true ? 'Promovat' : metrics.testPassed === false ? 'Nepromovat' : '';
  return `${metrics.testPercent}% · ${metrics.testScoreLabel} puncte${status ? ` · ${status}` : ''}`;
}
