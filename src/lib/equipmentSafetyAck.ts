const PREFIX = 'artgranit_equipment_safety_ack_';

export function hasAcknowledgedEquipmentSafety(deviceId: string): boolean {
  try {
    return localStorage.getItem(`${PREFIX}${deviceId}`) === '1';
  } catch {
    return false;
  }
}

export function acknowledgeEquipmentSafety(deviceId: string): void {
  try {
    localStorage.setItem(`${PREFIX}${deviceId}`, '1');
  } catch {
    /* ignore quota errors */
  }
}
