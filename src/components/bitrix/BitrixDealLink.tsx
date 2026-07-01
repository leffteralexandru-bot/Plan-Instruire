import { useEffect, useState } from 'react';
import { fetchBitrixDeal, getBitrixDealUrl, isBitrixApiConfigured } from '@/lib/bitrixApi';
import { Button } from '@/components/ui/Button';

interface BitrixDealLinkProps {
  dealId: string;
}

export function BitrixDealLink({ dealId }: BitrixDealLinkProps) {
  const [title, setTitle] = useState<string | null>(null);
  const url = getBitrixDealUrl(dealId);

  useEffect(() => {
    if (!isBitrixApiConfigured()) return;
    void fetchBitrixDeal(dealId).then((d) => {
      if (d) setTitle(d.title);
    });
  }, [dealId]);

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
      <Button variant="ghost" size="sm" type="button">
        Bitrix #{dealId}{title ? ` — ${title}` : ''} →
      </Button>
    </a>
  );
}
