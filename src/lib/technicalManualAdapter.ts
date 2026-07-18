import type { EquipmentDevice } from '@/data/equipmentOperations';
import type { TechnicalManual } from '@/data/technicalRepository';

/** Adaptează un manual din Repository Tehnic la forma EquipmentDevice pentru reutilizarea viewer-ului. */
export function technicalManualToDevice(manual: TechnicalManual): EquipmentDevice {
  return {
    id: manual.id,
    name: manual.name,
    category: manual.category,
    description: manual.description,
    chapters: manual.chapters,
    manualPdfUrl: manual.manualPdfUrl,
    curatare: { text: '', steps: [], attachments: [] },
    utilizare: { text: '', steps: [], attachments: [] },
    cad: { text: '', steps: [], attachments: [] },
  };
}
