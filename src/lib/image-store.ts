const DB_NAME = "infinity_rate_images_v1";
const STORE = "images";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet<T>(id: string): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(id);
        req.onsuccess = () => {
          db.close();
          resolve(req.result as T | undefined);
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      }),
  );
}

function idbPut(id: string, value: Blob | string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(value, id);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

function idbDelete(id: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

export function isImageStoreRef(image: string | undefined): boolean {
  return Boolean(image?.startsWith("idb:"));
}

export function isExternalImageUrl(image: string): boolean {
  return /^https?:\/\//i.test(image.trim());
}

/** حفظ ملف صورة — أي نوع وأي حجم */
export async function saveImageFile(file: File): Promise<string> {
  const id = crypto.randomUUID();
  await idbPut(id, file);
  return `idb:${id}`;
}

/** حفظ رابط أو data URL */
export async function saveImageData(data: string): Promise<string> {
  if (data.startsWith("data:")) {
    const id = crypto.randomUUID();
    await idbPut(id, data);
    return `idb:${id}`;
  }
  return data.trim();
}

export async function loadImageRef(ref: string): Promise<string> {
  if (!ref.trim()) return "";
  if (!isImageStoreRef(ref)) return ref;

  const id = ref.slice(4);
  const data = await idbGet<Blob | string>(id);
  if (!data) return "";

  if (typeof data === "string") return data;
  return URL.createObjectURL(data);
}

export async function deleteImageRef(ref: string): Promise<void> {
  if (!isImageStoreRef(ref)) return;
  await idbDelete(ref.slice(4));
}

export async function clearAllImages(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|svg|heic|heif|avif|tiff?)$/i;

export function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return IMAGE_EXT.test(file.name);
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("فشل قراءة الملف"));
    reader.readAsDataURL(file);
  });
}
