import { useEffect, useState } from 'react';
import { isBitrixApiConfigured, fetchBitrixDeal } from '@/lib/bitrixApi';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface BitrixConnectionStatusProps {
  /** ID deal din ultimul act constatare sau setări */
  dealId?: string;
}

export function BitrixConnectionStatus({ dealId }: BitrixConnectionStatusProps) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [dealTitle, setDealTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!isBitrixApiConfigured()) {
      setConnected(false);
      return;
    }
    if (!dealId) {
      setConnected(true);
      return;
    }
    void fetchBitrixDeal(dealId).then((d) => {
      setConnected(!!d);
      setDealTitle(d?.title ?? null);
    });
  }, [dealId]);

  if (connected === null) return null;

  return (
    <Card padding="sm" className="border-corporate-gold/30 bg-corporate-gold-light/30">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={connected ? 'success' : 'default'}>
          Bitrix API {connected ? 'conectat' : 'doar link-uri'}
        </Badge>
        {dealTitle && <span className="text-xs text-slate-600">Proiect: {dealTitle}</span>}
        {!isBitrixApiConfigured() && (
          <span className="text-xs text-corporate-muted">
            Setați VITE_BITRIX_WEBHOOK_URL pentru date live
          </span>
        )}
      </div>
    </Card>
  );
}
