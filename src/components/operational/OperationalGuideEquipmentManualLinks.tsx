import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EquipmentGuideDeviceView } from '@/components/equipment/EquipmentGuideDeviceView';
import {
  OperationalGuideCollapsibleShell,
} from '@/components/operational/OperationalGuideDocActions';
import { DEFAULT_EQUIPMENT_OPERATIONS, type EquipmentDevice } from '@/data/equipmentOperations';
import { downloadEquipmentPdf, shareEquipmentPdf } from '@/lib/downloadEquipmentPdf';

/** Echipament din Etapa 1.1 — legături către manualele Utilaje teren. */
export interface FieldEquipmentManualLink {
  id: string;
  label: string;
  /** ID dispozitiv din Utilaje teren; lipsește = fără manual dedicat */
  deviceId?: string;
  note?: string;
}

export const FIELD_EQUIPMENT_MANUAL_LINKS: FieldEquipmentManualLink[] = [
  {
    id: 'anexa',
    label: 'ANEXA Nr. 1 (șablon) + fișe tehnice',
    note: 'Documentul real — din Bitrix (proiectul tău), nu din Utilaje.',
  },
  {
    id: 'carnet',
    label: 'Carnet măsurători + creion',
    note: 'Fără manual Utilaje — obiect de teren (notezi cotele pe loc).',
  },
  {
    id: 'proliner',
    label: 'Aparatul de măsurat Proliner',
    deviceId: 'eq-proliner',
  },
  {
    id: 'gll',
    label: 'Nivelă laser Bosch GLL 3-80',
    deviceId: 'eq-bosch-gll-3-80',
  },
  {
    id: 'tape',
    label: 'Ruletă Bosch 5 m',
    deviceId: 'eq-bosch-tape-5m',
  },
];

function resolveDevice(deviceId: string): EquipmentDevice | undefined {
  return DEFAULT_EQUIPMENT_OPERATIONS.devices.find((d) => d.id === deviceId);
}

function devicePdf(device: EquipmentDevice): { url: string; fileName: string } | null {
  const chapter = device.chapters?.find((c) => c.pdfUrl);
  const url = chapter?.pdfUrl ?? device.manualPdfUrl;
  if (!url) return null;
  const fileName =
    chapter?.pdfFileName ?? `${device.name.replace(/\s+/g, '-')}-Manual.pdf`;
  return { url, fileName };
}

export function EquipmentManualOverlay({
  device,
  onClose,
  returnLabel = 'Înapoi la ghid',
  contextHint = 'Deschis din ghidul de pe site — după închidere rămâi în același ghid (poți continua citirea).',
}: {
  device: EquipmentDevice;
  onClose: () => void;
  /** Text pe butonul de întoarcere — rămâi pe ghidul de pe site */
  returnLabel?: string;
  contextHint?: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const pdf = useMemo(() => devicePdf(device), [device]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const handleDownload = async () => {
    if (!pdf) {
      setError('PDF indisponibil pentru acest aparat.');
      return;
    }
    setDownloading(true);
    setError(null);
    setShareHint(null);
    try {
      await downloadEquipmentPdf(pdf.url, pdf.fileName);
    } catch {
      setError('Descărcarea a eșuat. Încercați din nou.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!pdf) {
      setError('PDF indisponibil pentru acest aparat.');
      return;
    }
    setSharing(true);
    setError(null);
    setShareHint(null);
    try {
      const result = await shareEquipmentPdf(pdf.url, pdf.fileName, {
        title: device.name,
        text: `Manual utilaje artGRANIT — ${device.name}`,
      });
      if (result === 'mailto') {
        setShareHint('S-a deschis emailul cu linkul documentului.');
      } else if (result === 'copied') {
        setShareHint('Linkul a fost copiat — poți să-l trimiți oricui.');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Trimiterea a eșuat. Încercați din nou.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-corporate-surface/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Manual ${device.name}`}
    >
      <div className="relative z-[100] flex flex-wrap items-center justify-between gap-2 border-b border-corporate-border bg-white px-3 py-2.5 sm:px-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-corporate-muted">
            Mentenanță & operare · carte utilaj
          </p>
          <p className="truncate text-sm font-semibold text-corporate-dark">{device.name}</p>
          <p className="mt-0.5 text-[10px] text-corporate-muted leading-snug">{contextHint}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!pdf || downloading || sharing}
            onClick={() => void handleDownload()}
          >
            {downloading ? '…' : 'Descarcă'}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!pdf || downloading || sharing}
            onClick={() => void handleShare()}
          >
            {sharing ? '…' : 'Trimite'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {returnLabel}
          </Button>
        </div>
      </div>
      {shareHint ? (
        <p className="border-b border-corporate-border bg-corporate-surface/40 px-3 py-1.5 text-[11px] text-corporate-muted">
          {shareHint}
        </p>
      ) : null}
      {error ? (
        <p className="border-b border-red-200 bg-red-50 px-3 py-1.5 text-[11px] text-red-700">
          {error}
        </p>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        <EquipmentGuideDeviceView
          device={device}
          manualNumber={1}
          onBack={onClose}
        />
      </div>
    </div>
  );
}

export function OperationalGuideEquipmentManualLinks({
  defaultExpanded = false,
}: {
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [openDeviceId, setOpenDeviceId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openDevice = useMemo(
    () => (openDeviceId ? resolveDevice(openDeviceId) : undefined),
    [openDeviceId],
  );

  const handleOpen = (deviceId: string) => {
    setError(null);
    setOpenDeviceId(deviceId);
  };

  const handleDownload = async (deviceId: string) => {
    const device = resolveDevice(deviceId);
    if (!device) return;
    const pdf = devicePdf(device);
    if (!pdf) {
      setError('PDF indisponibil pentru acest aparat.');
      return;
    }
    setDownloadingId(deviceId);
    setError(null);
    try {
      await downloadEquipmentPdf(pdf.url, pdf.fileName);
    } catch {
      setError(`Descărcarea a eșuat: ${device.name}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <OperationalGuideCollapsibleShell
        ariaLabel="Echipament — manuale Utilaje"
        eyebrow="Etapa 1.1"
        title="Echipament — deschide manualul"
        subtitle="Lângă fiecare aparat: Deschide (vizualizare / capitole) sau Descarcă PDF."
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      >
        <ul className="space-y-1.5 list-none">
          {FIELD_EQUIPMENT_MANUAL_LINKS.map((item) => {
            const device = item.deviceId ? resolveDevice(item.deviceId) : undefined;
            const hasManual = !!device;

            return (
              <li
                key={item.id}
                className="flex flex-col gap-1.5 rounded-lg border border-corporate-border/70 bg-corporate-surface/20 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-corporate-dark leading-snug">
                    {item.label}
                  </p>
                  {item.note ? (
                    <p className="mt-0.5 text-[10px] text-corporate-muted leading-snug">{item.note}</p>
                  ) : hasManual ? (
                    <p className="mt-0.5 text-[10px] text-corporate-muted leading-snug">
                      Manual Utilaje: {device.name}
                    </p>
                  ) : null}
                </div>

                {hasManual && item.deviceId ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="!h-7 !px-2.5 !text-[10px]"
                      onClick={() => handleOpen(item.deviceId!)}
                    >
                      Deschide
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="!h-7 !px-2.5 !text-[10px]"
                      disabled={downloadingId === item.deviceId}
                      onClick={() => void handleDownload(item.deviceId!)}
                    >
                      {downloadingId === item.deviceId ? '…' : 'Descarcă PDF'}
                    </Button>
                  </div>
                ) : (
                  <span className="shrink-0 text-[10px] text-corporate-muted">Fără manual Utilaje</span>
                )}
              </li>
            );
          })}
        </ul>
        {error ? <p className="mt-2 text-[10px] text-red-600">{error}</p> : null}
      </OperationalGuideCollapsibleShell>

      {openDevice ? (
        <EquipmentManualOverlay device={openDevice} onClose={() => setOpenDeviceId(null)} />
      ) : null}
    </>
  );
}
