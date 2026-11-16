/* Menyusun permintaan judul dan saran langkah ke model bahasa.

   Batas privasi yang dijaga modul ini: yang dikirim hanya instrumen, periode,
   label kelompok, kata kunci, jumlah, dan porsi. Tidak ada kalimat komentar.
   `susunPrompt` tidak menerima daftar komentar sama sekali, sehingga kebocoran
   teks mentah tidak mungkin terjadi lewat jalur ini.

   Model diminta menjawab dua baris:
     JUDUL: aspek yang disorot + masalahnya, maksimal 10 kata
     SARAN: satu kalimat tindakan, maksimal 25 kata

   Judul dibuat model karena kata kunci saja tidak cukup untuk menyebut masalah.
   Bila model tidak mengikuti format, `uraiSaran` tetap menyelamatkan sarannya.

   Modul ini murni supaya bisa dites dengan Node.
*/

import type { Kelompok } from './kelompok.ts';

export const VERSI_ALGORITMA = 2;

export interface DataKelompok {
  instrumen: string;
  periode: string;
  kelompok: Pick<Kelompok, 'label' | 'jumlah' | 'porsi' | 'kata_kunci'>;
}

const SISTEM = [
  'Anda menyusun judul dan langkah perbaikan untuk hasil survei Zona Integritas di kampus.',
  'Jawab tepat dua baris, tanpa penjelasan lain:',
  'JUDUL: maksimal 10 kata, sebut aspek yang disorot dan masalahnya, tanpa nama orang, nama unit, atau angka.',
  'SARAN: satu kalimat bahasa Indonesia, maksimal 25 kata, berisi tindakan yang bisa dijalankan.',
  'Gunakan hanya informasi dari kata kunci yang diberikan. Jangan mengarang kejadian.',
  'Jangan memakai tanda kutip, markdown, atau kalimat pembuka.'
].join(' ');

export function susunPrompt(data: DataKelompok): { system: string; user: string } {
  const isi = {
    instrumen: data.instrumen,
    periode: data.periode,
    topik: data.kelompok.label,
    kata_kunci: data.kelompok.kata_kunci,
    jumlah_komentar: data.kelompok.jumlah,
    porsi: Math.round(data.kelompok.porsi * 1000) / 1000
  };

  return {
    system: SISTEM,
    user: `Susun judul dan saran untuk kelompok jawaban berikut:\n${JSON.stringify(isi)}`
  };
}

/* Satu kalimat, tanpa baris baru, maksimal 25 kata. */
export function rapikanSaran(teks: string): string {
  const satuBaris = String(teks ?? '')
    .replace(/^[\s"'`*-]+/, '')
    .replace(/[\s"'`]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  const kata = satuBaris.split(' ').filter(Boolean);
  if (kata.length <= 25) return satuBaris;
  return `${kata.slice(0, 25).join(' ')}.`;
}

/* Judul pendek: maksimal 10 kata, tanpa titik di akhir, kapitalisasi kalimat
   (hanya huruf pertama yang kapital) supaya tidak bercampur Title Case. */
export function rapikanJudul(teks: string): string {
  const satuBaris = String(teks ?? '')
    .replace(/^[\s"'`*-]+/, '')
    .replace(/[\s"'`]+$/, '')
    .replace(/[.:;]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  const kata = satuBaris.split(' ').filter(Boolean).slice(0, 10);
  if (!kata.length) return '';

  const hasil = kata
    .map((k, i) => (i === 0 || /^[A-Z]{2,}$/.test(k) ? k : k.toLowerCase()))
    .join(' ');

  return hasil.charAt(0).toUpperCase() + hasil.slice(1);
}

export interface UraianSaran {
  judul: string | null;
  saran: string | null;
}

/* Baca balasan dua baris. Bila format tidak diikuti, seluruh teks dianggap
   saran dan judul dibiarkan kosong (pemanggil memakai judul cadangan). */
export function uraiSaran(teks: string): UraianSaran {
  const baris = String(teks ?? '')
    .split(/\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  let judul: string | null = null;
  let saran: string | null = null;

  for (const b of baris) {
    const cocokJudul = b.match(/^judul\s*:\s*(.+)$/i);
    if (cocokJudul) {
      judul = rapikanJudul(cocokJudul[1]) || null;
      continue;
    }
    const cocokSaran = b.match(/^saran\s*:\s*(.+)$/i);
    if (cocokSaran) {
      saran = rapikanSaran(cocokSaran[1]) || null;
    }
  }

  if (!saran) {
    const tanpaLabel = baris
      .filter((b) => !/^judul\s*:/i.test(b))
      .join(' ')
      .replace(/^saran\s*:\s*/i, '');
    saran = rapikanSaran(tanpaLabel) || null;
  }

  return { judul, saran };
}

/* Hash isi kelompok. Dipakai agar model bahasa tidak dipanggil ulang bila
   hasil klasterisasi tidak berubah, dan otomatis gugur saat algoritma naik. */
export async function hashMasukan(
  judul: string | null,
  label: string,
  jumlah: number,
  kataKunci: string[]
): Promise<string> {
  const bahan = JSON.stringify({ judul, label, jumlah, kataKunci, versi: VERSI_ALGORITMA });
  const byte = new TextEncoder().encode(bahan);
  const digest = await crypto.subtle.digest('SHA-256', byte);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
