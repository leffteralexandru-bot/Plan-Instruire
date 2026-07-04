import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

interface ActConstatareFormProps {
  defaultDayId?: string;
  onSubmit: (data: {
    proiectNume: string;
    dataMasuratoare: string;
    eroriIdentificate: string;
    abateriMasuratori: string;
    masuriCorective: string;
    observatii?: string;
    dayId?: string;
  }) => void;
}

export function ActConstatareForm({ onSubmit, defaultDayId }: ActConstatareFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmit({
      proiectNume: fd.get('proiectNume') as string,
      dataMasuratoare: fd.get('dataMasuratoare') as string,
      eroriIdentificate: fd.get('eroriIdentificate') as string,
      abateriMasuratori: fd.get('abateriMasuratori') as string,
      masuriCorective: fd.get('masuriCorective') as string,
      observatii: (fd.get('observatii') as string) || undefined,
      dayId: (fd.get('dayId') as string) || defaultDayId,
    });
    setSubmitted(true);
    e.currentTarget.reset();
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-corporate-dark mb-1">Act de Constatare</h3>
      <p className="text-sm text-corporate-muted mb-5">
        Documentare erori și abateri la măsurători în oglindă
      </p>

      {submitted && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          Act de constatare salvat cu succes.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="proiectNume" name="proiectNume" label="Nume proiect" required placeholder="ex. Blat Bucătărie — Popescu" />
          <Input id="dataMasuratoare" name="dataMasuratoare" label="Data măsurătorii" type="date" required />
        </div>
        <Input id="dayId" name="dayId" label="Zi program (ID)" defaultValue={defaultDayId} placeholder="ex. day-18" />
        <Textarea id="eroriIdentificate" name="eroriIdentificate" label="Erori identificate" required />
        <Textarea id="abateriMasuratori" name="abateriMasuratori" label="Abateri măsurători (oglindă)" required />
        <Textarea id="masuriCorective" name="masuriCorective" label="Măsuri corective" required />
        <Textarea id="observatii" name="observatii" label="Observații suplimentare (opțional)" />
        <Button type="submit" variant="primary">Salvează Act de Constatare</Button>
      </form>
    </Card>
  );
}
