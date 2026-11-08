/* Port dari frontend/src/data/survey/normalize.js bagian normalisasi jawaban.

   Bedanya dengan versi JS: modul ini TIDAK membaca email_responden sama sekali.
   Di frontend, email dipakai untuk deduplikasi; di chatbot deduplikasi tidak
   diperlukan karena konteks hanya memuat agregat per (instrumen, periode).
   Kolom email juga tidak pernah di-select dari database (lihat lib/sumber.ts).

   Modul ini murni supaya bisa dites dengan Node.
*/

import type { InstrumenInfo } from './tipe.ts';

const KOLOM_METADATA = new Set([
  'kelompok',
  'email address',
  'email',
  'timestamp',
  'nama',
  'nama lengkap',
  'unit kerja',
  'jabatan',
  'nip',
  'instansi',
  'prodi'
]);

export interface HasilNormalisasi {
  items: number[];
  terbuka: string | null;
  kelompok: string | null;
  alasan: string | null;
}

function normalisasiNilai(raw: unknown): unknown {
  if (Array.isArray(raw)) return raw.length ? raw[0] : '';
  if (raw === null || raw === undefined) return '';
  return raw;
}

export function normalisasiKelompok(raw: unknown): string | null {
  const k = String(normalisasiNilai(raw) || '').toLowerCase();
  if (k.includes('dosen')) return 'Dosen';
  if (k.includes('tendik') || k.includes('kependidikan') || k.includes('karyawan')) return 'Tenaga Kependidikan';
  return null;
}

export function normalisasiKunci(nama: unknown): string {
  return String(nama || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function safeParse(teks: string): Record<string, unknown> {
  try {
    const hasil = JSON.parse(teks);
    return hasil && typeof hasil === 'object' ? hasil : {};
  } catch {
    return {};
  }
}

export function normalizeAnswers(slug: string, instrumen: InstrumenInfo | null, dataJawaban: unknown): HasilNormalisasi {
  if (!instrumen) return { items: [], terbuka: null, kelompok: null, alasan: 'instrumen-unknown' };
  const sumber =
    typeof dataJawaban === 'string' ? safeParse(dataJawaban) : ((dataJawaban as Record<string, unknown>) ?? {});

  const perTeks = new Map<string, number>();
  let kelompok: string | null = null;
  const numerikBerurutan: number[] = [];
  let terbuka: string | null = null;

  Object.entries(sumber).forEach(([pertanyaan, raw]) => {
    const kunci = String(pertanyaan).replace(/^\uFEFF/, '').trim();
    const kunciKecil = kunci.toLowerCase();
    const nilai = normalisasiNilai(raw);

    if (kunciKecil === 'kelompok') {
      kelompok = normalisasiKelompok(nilai);
      return;
    }
    if (KOLOM_METADATA.has(kunciKecil)) return;

    const teks = String(nilai ?? '').trim();
    if (!teks || teks === '-') return;

    if (/^-?\d+(\.\d+)?$/.test(teks)) {
      const angka = Number(teks);
      numerikBerurutan.push(angka);
      perTeks.set(normalisasiKunci(kunci), angka);
      return;
    }
    if (teks.length > 3) terbuka = terbuka || teks;
  });

  /* Cocokkan tiap butir konfigurasi lewat teks lengkap, lalu label. */
  const items: number[] = [];
  for (const butir of instrumen.butir) {
    const dariTeks = perTeks.get(normalisasiKunci(butir.teks));
    const dariLabel = perTeks.get(normalisasiKunci(butir.label));
    const nilai = dariTeks ?? dariLabel;
    if (nilai !== undefined) items.push(nilai);
  }

  /* Fallback: instrumen yang belum punya teks lengkap di konfigurasi. */
  let hasil = items;
  if (hasil.length !== instrumen.butir.length && numerikBerurutan.length === instrumen.butir.length) {
    hasil = numerikBerurutan.slice();
  }

  if (hasil.length !== instrumen.butir.length) {
    return { items: [], terbuka, kelompok, alasan: 'jumlah-butir' };
  }
  if (hasil.some((n) => !Number.isInteger(n) || n < 1 || n > 4)) {
    return { items: [], terbuka, kelompok, alasan: 'nilai-tidak-valid' };
  }
  return { items: hasil, terbuka, kelompok, alasan: null };
}

/* ---------------------------------------------------------------------
   Periode dari created_at (WIB, bukan UTC)
   Sep-Feb -> Ganjil tahun awal; Mar-Agu -> Genap tahun itu.
   --------------------------------------------------------------------- */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export function periodeDariTanggal(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  const wib = new Date(ms + WIB_OFFSET_MS);
  const tahun = wib.getUTCFullYear();
  const bulan = wib.getUTCMonth() + 1;
  if (bulan >= 9) return `${tahun}-ganjil`;
  if (bulan <= 2) return `${tahun - 1}-ganjil`;
  return `${tahun}-genap`;
}

/* Alias nama_instrumen dari database -> slug registry. */
export function slugDariNama(nama: string | null | undefined, alias: Record<string, string>): string | null {
  const kunci = normalisasiKunci(nama);
  if (!kunci) return null;
  return alias[kunci] ?? null;
}
