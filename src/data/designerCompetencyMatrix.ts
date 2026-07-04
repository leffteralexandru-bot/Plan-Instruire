import type { DesignerCompetencyCriterionId, DesignerCompetencyLevel } from '@/types';

export interface DesignerCompetencyCriterion {
  id: DesignerCompetencyCriterionId;
  label: string;
  question: string;
  /** Formulare la persoana a II-a — evaluare supervizor */
  supervisorQuestion: string;
  options: { level: DesignerCompetencyLevel; text: string }[];
}

export interface DesignerCompetencyLevelProfile {
  level: DesignerCompetencyLevel;
  title: string;
  subtitle: string;
  autonomie: string;
  responsabilitate: string;
  potrivitPentru: string;
}

export interface DesignerCompetencyBand {
  minTotal: number;
  maxTotal: number;
  level: DesignerCompetencyLevel;
  label: string;
  incadrare: string;
  coeficientSalarialPercent: number;
}

export const DESIGNER_COMPETENCY_CRITERIA: DesignerCompetencyCriterion[] = [
  {
    id: 'masuratori',
    label: 'Acuratețea măsurărilor',
    question: 'Cât de precise sunt măsurările tale realizate în teren?',
    supervisorQuestion: 'Cât de precise sunt măsurările angajatului în teren?',
    options: [
      { level: 1, text: 'Apar frecvent erori care necesită corecturi' },
      { level: 2, text: 'Măsurările sunt corecte pentru lucrări simple' },
      { level: 3, text: 'Măsurările sunt precise inclusiv în condiții dificile' },
      { level: 4, text: 'Precizie perfectă, fără erori, inclusiv în situații complexe' },
    ],
  },
  {
    id: 'proliner',
    label: 'Utilizarea echipamentului Proliner',
    question: 'Cât de bine utilizezi echipamentul de măsurare Proliner?',
    supervisorQuestion: 'Cât de bine utilizează angajatul echipamentul Proliner?',
    options: [
      { level: 1, text: 'Am nevoie de ajutor constant' },
      { level: 2, text: 'Utilizez corect în situații standard' },
      { level: 3, text: 'Lucrez rapid și eficient, fără suport' },
      { level: 4, text: 'Optimizez utilizarea și instruiesc alți colegi' },
    ],
  },
  {
    id: 'autocad',
    label: 'Calitatea proiectării în AutoCAD',
    question: 'Cum apreciezi calitatea proiectelor realizate de tine?',
    supervisorQuestion: 'Cum apreciezi calitatea proiectelor realizate de angajat?',
    options: [
      { level: 1, text: 'Apar erori de cotare sau desen' },
      { level: 2, text: 'Proiectele sunt corecte pentru lucrări standard' },
      { level: 3, text: 'Proiectele sunt complete, clare și fără erori' },
      { level: 4, text: 'Proiectele sunt complexe, optimizate și standardizate' },
    ],
  },
  {
    id: 'cerinteTehnice',
    label: 'Interpretarea cerințelor tehnice',
    question: 'Cât de bine înțelegi și aplici cerințele tehnice ale lucrărilor?',
    supervisorQuestion: 'Cât de bine înțelege și aplică angajatul cerințele tehnice?',
    options: [
      { level: 1, text: 'Înțeleg parțial cerințele' },
      { level: 2, text: 'Aplic corect cerințele standard' },
      { level: 3, text: 'Interpretez corect inclusiv detalii complexe' },
      { level: 4, text: 'Propun soluții tehnice și îmbunătățiri' },
    ],
  },
  {
    id: 'optimizareMaterial',
    label: 'Optimizarea consumului de material',
    question: 'Cât de eficient optimizezi tăierile și consumul de material?',
    supervisorQuestion: 'Cât de eficient optimizează angajatul consumul de material?',
    options: [
      { level: 1, text: 'Nu țin cont de optimizare' },
      { level: 2, text: 'Optimizez doar în cazuri simple' },
      { level: 3, text: 'Optimizez constant consumul de material' },
      { level: 4, text: 'Reduc semnificativ pierderile prin soluții tehnice' },
    ],
  },
  {
    id: 'preventieErori',
    label: 'Identificarea și prevenirea erorilor',
    question: 'Cum gestionezi riscurile și erorile în proiectare?',
    supervisorQuestion: 'Cum gestionează angajatul riscurile și erorile în proiectare?',
    options: [
      { level: 1, text: 'Nu identific riscurile din timp' },
      { level: 2, text: 'Observ erori evidente' },
      { level: 3, text: 'Anticipez și previn erori' },
      { level: 4, text: 'Elimin riscurile și îmbunătățesc fluxul de lucru' },
    ],
  },
  {
    id: 'termene',
    label: 'Respectarea termenelor și eficiența',
    question: 'Cât de bine te încadrezi în termenele stabilite?',
    supervisorQuestion: 'Cât de bine se încadrează angajatul în termenele stabilite?',
    options: [
      { level: 1, text: 'Întârzii frecvent' },
      { level: 2, text: 'Respect termenele doar la lucrări simple' },
      { level: 3, text: 'Respect constant termenele' },
      { level: 4, text: 'Optimizez timpul și eficientizez procesele' },
    ],
  },
  {
    id: 'comunicare',
    label: 'Comunicare și colaborare',
    question: 'Cum comunici cu clientul și echipele interne?',
    supervisorQuestion: 'Cum comunică angajatul cu clientul și echipele interne?',
    options: [
      { level: 1, text: 'Comunicarea este limitată sau neclară' },
      { level: 2, text: 'Comunicare corectă pentru sarcini standard' },
      { level: 3, text: 'Comunicare clară și eficientă' },
      { level: 4, text: 'Coordonez relația tehnică și colaborarea între echipe' },
    ],
  },
  {
    id: 'autonomie',
    label: 'Autonomie și responsabilitate',
    question: 'Cât de autonom ești în activitatea ta?',
    supervisorQuestion: 'Cât de autonom este angajatul în activitatea sa?',
    options: [
      { level: 1, text: 'Am nevoie de supraveghere constantă' },
      { level: 2, text: 'Lucrez independent la sarcini simple' },
      { level: 3, text: 'Lucrez complet independent' },
      { level: 4, text: 'Iau decizii tehnice și îmi asum responsabilitatea' },
    ],
  },
  {
    id: 'instruire',
    label: 'Instruirea altora / rol de formator',
    question: 'Ai contribuit la instruirea altor colegi?',
    supervisorQuestion: 'A contribuit angajatul la instruirea altor colegi?',
    options: [
      { level: 1, text: 'Nu am instruit pe nimeni' },
      { level: 2, text: 'Am oferit sprijin ocazional' },
      { level: 3, text: 'Am instruit colegi până la autonomie' },
      { level: 4, text: 'Sunt formator intern și dezvolt metode de lucru' },
    ],
  },
];

export const DESIGNER_COMPETENCY_LEVEL_PROFILES: DesignerCompetencyLevelProfile[] = [
  {
    level: 1,
    title: 'Nivel 1 — Începător / Asistat',
    subtitle: 'Proces de învățare, ghidare constantă',
    autonomie: 'Scăzut',
    responsabilitate: 'Minim',
    potrivitPentru: 'instruire, proiecte simple, suport echipă',
  },
  {
    level: 2,
    title: 'Nivel 2 — Autonom parțial',
    subtitle: 'Lucrări standard, verificare ocazională',
    autonomie: 'Mediu',
    responsabilitate: 'Mediu',
    potrivitPentru: 'proiecte standard, volum constant de lucru',
  },
  {
    level: 3,
    title: 'Nivel 3 — Senior / Formator',
    subtitle: 'Lucrări complexe, fără suport',
    autonomie: 'Ridicat',
    responsabilitate: 'Mare',
    potrivitPentru: 'lucrări complexe, proiecte critice',
  },
  {
    level: 4,
    title: 'Nivel 4 — Expert',
    subtitle: 'Excelență, optimizare procese, standarde',
    autonomie: 'Complet',
    responsabilitate: 'Foarte ridicat',
    potrivitPentru: 'expert / mentor / punct de referință tehnic',
  },
];

export const DESIGNER_COMPETENCY_BANDS: DesignerCompetencyBand[] = [
  { minTotal: 10, maxTotal: 17, level: 1, label: 'Nivel 1', incadrare: 'Începător', coeficientSalarialPercent: 0 },
  { minTotal: 18, maxTotal: 25, level: 2, label: 'Nivel 2', incadrare: 'Mediu', coeficientSalarialPercent: 20 },
  { minTotal: 26, maxTotal: 33, level: 3, label: 'Nivel 3', incadrare: 'Avansat', coeficientSalarialPercent: 30 },
  { minTotal: 34, maxTotal: 40, level: 4, label: 'Nivel 4', incadrare: 'Expert', coeficientSalarialPercent: 40 },
];

export const DESIGNER_COMPETENCY_CRITERION_IDS = DESIGNER_COMPETENCY_CRITERIA.map((c) => c.id);

export function defaultDesignerCompetencyScores(): Record<DesignerCompetencyCriterionId, DesignerCompetencyLevel> {
  return Object.fromEntries(
    DESIGNER_COMPETENCY_CRITERION_IDS.map((id) => [id, 2 as DesignerCompetencyLevel]),
  ) as Record<DesignerCompetencyCriterionId, DesignerCompetencyLevel>;
}
