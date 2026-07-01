import { getBitrixUrlForDay } from '@/data/bitrix';
import { storage } from '@/store/storage';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface BitrixQuickLinkProps {
  dayNumber: number;
}

export function BitrixQuickLink({ dayNumber }: BitrixQuickLinkProps) {
  const settings = storage.getSettings();
  const url = getBitrixUrlForDay(dayNumber, settings) ?? settings.bitrixPortalUrl;

  return (
    <Card className="border-corporate-gold/30 bg-corporate-gold-light/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-corporate-dark">Bitrix24</p>
          <p className="text-sm text-corporate-muted">Deschide task-urile și documentele proiectului</p>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="sm" type="button">
            Deschide Bitrix →
          </Button>
        </a>
      </div>
    </Card>
  );
}
