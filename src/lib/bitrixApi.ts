import { storage } from '@/store/storage';
import { bitrixProjectUrl } from '@/data/bitrix';

export function isBitrixApiConfigured(): boolean {
  return !!import.meta.env.VITE_BITRIX_WEBHOOK_URL?.trim();
}

function webhookBase(): string {
  const url = import.meta.env.VITE_BITRIX_WEBHOOK_URL!.trim();
  return url.endsWith('/') ? url : `${url}/`;
}

export interface BitrixDealSummary {
  id: string;
  title: string;
  stageId?: string;
  url: string;
}

/** Citește deal Bitrix24 via incoming webhook (read-only) */
export async function fetchBitrixDeal(dealId: string): Promise<BitrixDealSummary | null> {
  if (!isBitrixApiConfigured() || !dealId.trim()) return null;

  try {
    const settings = storage.getSettings();
    const res = await fetch(`${webhookBase()}crm.deal.get?id=${encodeURIComponent(dealId.trim())}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: { ID: string; TITLE: string; STAGE_ID?: string } };
    const deal = json.result;
    if (!deal) return null;
    return {
      id: deal.ID,
      title: deal.TITLE,
      stageId: deal.STAGE_ID,
      url: bitrixProjectUrl(deal.ID, settings),
    };
  } catch {
    return null;
  }
}

export interface BitrixTaskSummary {
  id: string;
  title: string;
  status: string;
}

/** Task-uri deschise asociate unui deal (dacă webhook permite) */
export async function fetchBitrixDealTasks(dealId: string): Promise<BitrixTaskSummary[]> {
  if (!isBitrixApiConfigured()) return [];

  try {
    const res = await fetch(
      `${webhookBase()}tasks.task.list?filter[UF_CRM_TASK]=D_${encodeURIComponent(dealId)}&select[]=ID&select[]=TITLE&select[]=STATUS`,
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      result?: { tasks?: { id: string; title: string; status: string }[] };
    };
    const tasks = json.result?.tasks ?? [];
    return tasks.map((t) => ({ id: t.id, title: t.title, status: t.status }));
  } catch {
    return [];
  }
}

export function getBitrixDealUrl(dealId: string): string {
  return bitrixProjectUrl(dealId, storage.getSettings());
}
