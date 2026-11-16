/* Menyusun permintaan saran langkah ke model bahasa.

   Batas privasi yang dijaga modul ini: yang dikirim hanya instrumen, periode,
   label kelompok, kata kunci, jumlah, dan porsi. Tidak ada kalimat komentar.
   `susunPrompt` tidak menerima daftar komentar sama sekali, sehingga kebocoran
   teks mentah tidak mungkin terjadi lewat jalur ini.

   Modul ini murni supaya bisa dites dengan Node.
*/

import type { Kelompok } from './kelompok.ts';

export const VERSI_ALGORITMA = 1;

export interface DataKelompok {
  instrumen: string;
  periode: string;
  kelompok: Pick<Kelompok, 'label' | 'jumlah' | 'porsi' | 'kata_kunci'>;
}

const SISTEM = [
  'Anda menyusun langkah perbaikan untuk hasil survei Zona Integritas di kampus.',
  'Jawab satu kalimat bahasa Indonesia, maksimal 25 kata, berisi tindakan yang bisa dijalankan.',
  'Gunakan hanya informasi dari kata kunci yang diberikan.',
  'Jangan mengarang angka, nama orang, nama unit, atau kejadian.',
  'Jangan mengulang pertanyaan dan jangan memakai tanda kutip.'
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
    user: `Susun satu langkah tindak lanjut untuk kelompok jawaban berikut:\n${JSON.stringify(isi)}`
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

/* Hash isi kelompok. Dipakai agar model bahasa tidak dipanggil ulang bila
   hasil klasterisasi tidak berubah, dan otomatis gugur saat algoritma naik. */
export async function hashMasukan(
  label: string,
  jumlah: number,
  kataKunci: string[]
): Promise<string> {
  const bahan = JSON.stringify({ label, jumlah, kataKunci, versi: VERSI_ALGORITMA });
  const byte = new TextEncoder().encode(bahan);
  const digest = await crypto.subtle.digest('SHA-256', byte);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
