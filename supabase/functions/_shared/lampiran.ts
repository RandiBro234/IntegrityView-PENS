import { PayloadError } from './errors.ts';

export type JenisLaporan = 'pengaduan' | 'wbs';

export interface LampiranMeta {
  path: string;
  nama: string;
  tipe: string;
  ukuran: number;
}

export interface UploadInput {
  jenis: JenisLaporan;
  nama: string;
  tipe: string;
  ukuran: number;
}

export const BUCKET = 'lampiran-laporan';
export const MAKS_FILE = 3;
export const MAKS_UKURAN = 10 * 1024 * 1024;

export const TIPE_DIIZINKAN = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
]);

function jenisValid(nilai: unknown): JenisLaporan {
  if (nilai === 'pengaduan' || nilai === 'wbs') return nilai;
  throw new PayloadError('jenis harus "pengaduan" atau "wbs".');
}

function tipeNormal(nilai: unknown): string {
  const tipe = typeof nilai === 'string' ? nilai.trim().toLowerCase() : '';
  return tipe === 'image/jpg' ? 'image/jpeg' : tipe;
}

function namaFile(nilai: unknown): string {
  const nama = typeof nilai === 'string' ? nilai.trim() : '';
  if (!nama || nama.length > 200) {
    throw new PayloadError('Nama lampiran wajib diisi (maks. 200 karakter).');
  }
  return nama;
}

function ukuranFile(nilai: unknown): number {
  if (!Number.isInteger(nilai) || (nilai as number) <= 0 || (nilai as number) > MAKS_UKURAN) {
    throw new PayloadError('Ukuran lampiran maksimal 10MB.');
  }
  return nilai as number;
}

function cekTipe(tipe: string) {
  if (!TIPE_DIIZINKAN.has(tipe)) {
    throw new PayloadError('Tipe lampiran harus PDF, Word, JPG, atau PNG.');
  }
}

export function validasiUpload(body: unknown): UploadInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new PayloadError('Data lampiran tidak valid.');
  }
  const data = body as Record<string, unknown>;
  const jenis = jenisValid(data.jenis);
  const nama = namaFile(data.nama);
  const tipe = tipeNormal(data.tipe);
  const ukuran = ukuranFile(data.ukuran);
  cekTipe(tipe);
  return { jenis, nama, tipe, ukuran };
}

/* Metadata yang dikirim setelah upload harus menunjuk ke folder laporan
   yang sama; ini mencegah path arbitrer dipakai untuk menghapus/membaca
   objek lain saat cleanup. */
export function validasiLampiran(raw: unknown, jenis: JenisLaporan): LampiranMeta[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) throw new PayloadError('lampiran harus berupa array.');
  if (raw.length > MAKS_FILE) {
    throw new PayloadError(`Maksimal ${MAKS_FILE} lampiran per laporan.`);
  }

  const prefix = `lampiran/${jenis}/`;
  const dilihat = new Set<string>();

  return raw.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new PayloadError('Metadata lampiran tidak valid.');
    }
    const data = item as Record<string, unknown>;
    const path = typeof data.path === 'string' ? data.path.trim() : '';
    const nama = namaFile(data.nama);
    const tipe = tipeNormal(data.tipe);
    const ukuran = ukuranFile(data.ukuran);

    if (
      !path ||
      path.length > 400 ||
      path.includes('..') ||
      !path.startsWith(prefix) ||
      !/^[A-Za-z0-9/._-]+$/.test(path)
    ) {
      throw new PayloadError('Path lampiran tidak valid.');
    }
    if (dilihat.has(path)) throw new PayloadError('Lampiran duplikat.');
    dilihat.add(path);
    cekTipe(tipe);

    return { path, nama, tipe, ukuran };
  });
}
