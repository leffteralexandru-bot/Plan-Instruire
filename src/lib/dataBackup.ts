import type { AppProgress, OrgSettings } from '@/types';

export const BACKUP_VERSION = 1;

export interface ArtGranitBackup {
  backupVersion: number;
  exportedAt: string;
  organization: 'artGRANIT';
  settings: OrgSettings;
  progress: Record<string, AppProgress>;
}

export function buildBackup(
  getAllProgress: () => Record<string, AppProgress>,
  getSettings: () => OrgSettings,
): ArtGranitBackup {
  return {
    backupVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    organization: 'artGRANIT',
    settings: getSettings(),
    progress: getAllProgress(),
  };
}

export function validateBackup(data: unknown): ArtGranitBackup | null {
  if (!data || typeof data !== 'object') return null;
  const b = data as Partial<ArtGranitBackup>;
  if (b.organization !== 'artGRANIT') return null;
  if (typeof b.backupVersion !== 'number' || b.backupVersion > BACKUP_VERSION) return null;
  if (!b.progress || typeof b.progress !== 'object') return null;
  if (!b.settings || typeof b.settings !== 'object') return null;
  return b as ArtGranitBackup;
}

export function downloadBackupJson(backup: ArtGranitBackup): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `artgranit-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readBackupFile(file: File): Promise<ArtGranitBackup> {
  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;
  const backup = validateBackup(parsed);
  if (!backup) {
    throw new Error('Fișier invalid — așteptat backup artGRANIT.');
  }
  return backup;
}
