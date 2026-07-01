const DB_NAME = 'artgranit-photos';
const STORE = 'photos';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
  });
}

export interface StoredPhoto {
  id: string;
  dayId: string;
  userId: string;
  label: string;
  blob: Blob;
  createdAt: string;
  synced: boolean;
}

export const photoStore = {
  async save(photo: StoredPhoto): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(photo);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async get(id: string): Promise<StoredPhoto | undefined> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result as StoredPhoto | undefined);
      req.onerror = () => reject(req.error);
    });
  },

  async listByDay(userId: string, dayId: string): Promise<StoredPhoto[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        const all = (req.result as StoredPhoto[]).filter(
          (p) => p.userId === userId && p.dayId === dayId,
        );
        resolve(all.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
      };
      req.onerror = () => reject(req.error);
    });
  },

  async listUnsynced(userId: string): Promise<StoredPhoto[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        resolve((req.result as StoredPhoto[]).filter((p) => p.userId === userId && !p.synced));
      };
      req.onerror = () => reject(req.error);
    });
  },

  async markSynced(id: string): Promise<void> {
    const photo = await this.get(id);
    if (!photo) return;
    await this.save({ ...photo, synced: true });
  },

  blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  },
};
