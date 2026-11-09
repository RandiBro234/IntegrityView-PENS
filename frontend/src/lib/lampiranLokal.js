/* Penyimpanan lampiran bukti untuk mode demo (tanpa Supabase).
   File asli disimpan di IndexedDB per kode laporan; localStorage hanya memuat
   metadata kecil. Dengan env Supabase, lampiran tetap diunggah ke Storage dan
   file asli tidak disalin ke perangkat. */

const DB_NAMA = 'iv2_lampiran';
const TOKO = 'lampiran';

function bukaDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAMA, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(TOKO)) db.createObjectStore(TOKO, { keyPath: 'kode' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function simpanLampiranLokal(kode, files) {
  if (!files.length) return [];
  const db = await bukaDb();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(TOKO, 'readwrite');
      tx.objectStore(TOKO).put({
        kode,
        files: files.map((f) => ({ nama: f.name, tipe: f.type, ukuran: f.size, blob: f }))
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
  return files.map((f) => ({ nama: f.name, tipe: f.type, ukuran: f.size, lokal: true }));
}

export async function ambilLampiranLokal(kode) {
  const db = await bukaDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(TOKO, 'readonly');
      const req = tx.objectStore(TOKO).get(kode);
      req.onsuccess = () => resolve(req.result?.files || []);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}
