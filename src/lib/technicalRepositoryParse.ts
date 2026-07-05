import type { TechnicalCatalogItem } from '@/data/technicalRepository';

function newCatalogId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function formatCatalogLines(items: TechnicalCatalogItem[]): string {
  return items
    .map((i) => {
      const specs = Object.entries(i.specs)
        .map(([k, v]) => `${k}:${v}`)
        .join(';');
      return [i.title, i.category, i.description ?? '', i.documentUrl ?? '', specs].join(' | ');
    })
    .join('\n');
}

/** title | categorie | descriere | url | spec1:val;spec2:val */
export function parseCatalogLines(text: string, existing: TechnicalCatalogItem[] = []): TechnicalCatalogItem[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const parts = line.split('|').map((p) => p.trim());
    const specs: Record<string, string> = {};
    const specPart = parts[4] ?? '';
    if (specPart) {
      for (const pair of specPart.split(';')) {
        const colon = pair.indexOf(':');
        if (colon > 0) {
          const k = pair.slice(0, colon).trim();
          const v = pair.slice(colon + 1).trim();
          if (k && v) specs[k] = v;
        }
      }
    }
    const title = parts[0] ?? '';
    const match = existing.find((e) => e.title === title);
    return {
      id: match?.id ?? newCatalogId(),
      title,
      category: parts[1] || 'General',
      description: parts[2] || undefined,
      documentUrl: parts[3] || undefined,
      specs,
    };
  }).filter((i) => i.title);
}

export function linesFromList(lines: string[]): string {
  return lines.join('\n');
}

export function listFromLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}
