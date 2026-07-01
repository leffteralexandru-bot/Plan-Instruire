export const COMPETENCIES = [
  { id: 'proliner', label: 'Autonomie Proliner', weeks: [1, 2] },
  { id: 'cad', label: 'Proiectare CAD', weeks: [1, 3, 4] },
  { id: 'oglinda', label: 'Măsurare oglindă', weeks: [3, 4] },
  { id: 'bitrix', label: 'Gestiune Bitrix', weeks: [1, 2, 3] },
  { id: 'echipa', label: 'Integrare echipă', weeks: [2, 4] },
  { id: 'calitate', label: 'Proiectare fără erori', weeks: [3, 4] },
] as const;

export function scoreFromFeedback(
  feedbacks: { weekNumber: number; autonomieProliner: number; proiectareFaraErori: number; integrareEchipa: number }[],
) {
  const f2 = feedbacks.find((f) => f.weekNumber === 2);
  const f4 = feedbacks.find((f) => f.weekNumber === 4);
  const avg = (n: number[]) => (n.length ? Math.round(n.reduce((a, b) => a + b, 0) / n.length) : 0);

  return {
    proliner: avg([f2?.autonomieProliner, f4?.autonomieProliner].filter(Boolean) as number[]),
    cad: avg([f2?.proiectareFaraErori, f4?.proiectareFaraErori].filter(Boolean) as number[]),
    oglinda: f4 ? Math.min(5, Math.max(3, f4.proiectareFaraErori)) : 0,
    bitrix: avg([f2?.integrareEchipa].filter(Boolean) as number[]),
    echipa: avg([f2?.integrareEchipa, f4?.integrareEchipa].filter(Boolean) as number[]),
    calitate: avg([f2?.proiectareFaraErori, f4?.proiectareFaraErori].filter(Boolean) as number[]),
  };
}
