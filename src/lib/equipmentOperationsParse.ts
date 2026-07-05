import type {
  EquipmentAttachment,
  EquipmentAttachmentType,
  EquipmentDevice,
  EquipmentGuideSection,
  EquipmentGuideSectionId,
} from '@/data/equipmentOperations';

function newAttachId(): string {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function newDeviceId(): string {
  return `eq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
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

/** tip | etichetă | url — ex: pdf | Manual | /docs/x.pdf */
export function formatAttachments(attachments: EquipmentAttachment[]): string {
  return attachments
    .map((a) => [a.type, a.label ?? '', a.url].join(' | '))
    .join('\n');
}

export function parseAttachments(text: string, existing: EquipmentAttachment[] = []): EquipmentAttachment[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    const parts = line.split('|').map((p) => p.trim());
    const type = (parts[0] ?? 'link') as EquipmentAttachmentType;
    const validType: EquipmentAttachmentType =
      type === 'image' || type === 'pdf' || type === 'link' ? type : 'link';
    return {
      id: existing[index]?.id ?? newAttachId(),
      type: validType,
      label: parts[1] || undefined,
      url: parts[2] ?? '',
    };
  }).filter((a) => a.url);
}

export function parseSection(
  text: string,
  stepsText: string,
  attachmentsText: string,
  existing?: EquipmentGuideSection,
): EquipmentGuideSection {
  return {
    text,
    steps: listFromLines(stepsText),
    attachments: parseAttachments(attachmentsText, existing?.attachments),
  };
}

export function createEmptyDevice(): EquipmentDevice {
  const empty = { text: '', steps: [], attachments: [] };
  return {
    id: newDeviceId(),
    name: 'Aparat nou',
    category: 'Măsurare',
    description: '',
    curatare: { ...empty },
    utilizare: { ...empty },
    cad: { ...empty },
  };
}

export function sectionTexts(device: EquipmentDevice, sectionId: EquipmentGuideSectionId) {
  const s = device[sectionId];
  return {
    text: s.text,
    steps: linesFromList(s.steps),
    attachments: formatAttachments(s.attachments),
  };
}
