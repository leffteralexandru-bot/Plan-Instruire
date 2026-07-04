import type { Certificate } from '@/types';

export const CERTIFICATE_PROGRAM_TITLE = 'Plan de Instruire și Adaptare Profesională';
export const CERTIFICATE_ROLE = 'Inginer Proiectant';
export const CERTIFICATE_DEPARTMENT = 'Departament Proiectare — artGRANIT';
export const CERTIFICATE_DURATION = '4 săptămâni (20 zile de instruire)';

export function formatCertificateDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function certificateNumber(cert: Certificate): string {
  if (cert.certificateNumber) return cert.certificateNumber;
  const year = new Date(cert.issuedAt).getFullYear();
  const hash = cert.stagiarName.replace(/\s/g, '').slice(0, 3).toUpperCase();
  return `AG-${year}-${hash}-${cert.issuedAt.slice(5, 10).replace('-', '')}`;
}

export function certificateIntro(): string {
  return (
    'Prin prezentul certificat, artGRANIT atestă finalizarea cu succes a procesului de ' +
    'instruire și integrare profesională, în conformitate cu standardele interne de competență și calitate.'
  );
}

/** Continuare după numele titularului — fără repetarea numelui */
export function certificateBodyLine(): string {
  return (
    'a absolvit integral Planul de Instruire și Adaptare Profesională, în calitate de Inginer Proiectant, ' +
    'parcurgând cu succes toate etapele prevăzute: instruire teoretică, practică asistată, ' +
    'validări ale mentorului și evaluarea finală de competență.'
  );
}

export function certificateClosing(): string {
  return (
    'Document eliberat în format digital, pe baza evidențelor oficiale ale platformei de instruire artGRANIT; ' +
    'confirmă dreptul titularului de a exercita funcția de Inginer Proiectant, sub coordonarea ' +
    'structurilor de proiectare ale companiei.'
  );
}

export function safeCertificateFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
}
