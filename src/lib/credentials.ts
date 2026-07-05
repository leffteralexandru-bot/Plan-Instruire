const PASSWORDS_KEY = 'artgranit_passwords';

/** Parolă inițială standard — schimbați după prima autentificare (viitor) */
export const DEFAULT_PLATFORM_PASSWORD = 'artgranit2026';

function readPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PASSWORDS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writePasswords(map: Record<string, string>): void {
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(map));
}

export const credentials = {
  getPassword(userId: string): string | undefined {
    return readPasswords()[userId];
  },

  setPassword(userId: string, password: string): void {
    const map = readPasswords();
    map[userId] = password;
    writePasswords(map);
  },

  removePassword(userId: string): void {
    const map = readPasswords();
    if (!(userId in map)) return;
    delete map[userId];
    writePasswords(map);
  },

  verify(userId: string, password: string): boolean {
    const stored = readPasswords()[userId];
    const expected = stored ?? DEFAULT_PLATFORM_PASSWORD;
    return password === expected;
  },

  seedDefaults(userIds: string[], password = DEFAULT_PLATFORM_PASSWORD): void {
    const map = readPasswords();
    let changed = false;
    for (const id of userIds) {
      if (!map[id]) {
        map[id] = password;
        changed = true;
      }
    }
    if (changed) writePasswords(map);
  },
};
