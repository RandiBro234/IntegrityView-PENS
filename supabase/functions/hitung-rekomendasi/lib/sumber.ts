/* Mengambil komentar satu kombinasi instrumen-periode.

   Memakai RPC `survey_komentar_safe` yang sudah membuang kunci email dari
   data_jawaban. RPC dibatasi 1000 baris per request, jadi pengambilan dilakukan
   berhalaman sampai habis.

   Deduplikasi mengikuti dashboard: satu responden (hash) dihitung sekali per
   instrumen. Baris terbaru yang dipakai, karena query sudah terurut menurun.

   Modul ini murni (kecuali `ambilKomentar`) supaya bisa dites dengan Node.
*/

import { komentarDari, jawabanSensitif } from './komentar.ts';
import { periodeDariTanggal } from './periode.ts';

export interface BarisKomentar {
  data_jawaban: unknown;
  created_at: string;
  responden_hash?: string | null;
}

export interface KlienRpc {
  rpc(
    nama: string,
    argumen: Record<string, unknown>
  ): PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
}

/* Komentar bersih untuk satu periode, tanpa teks sensitif dan tanpa duplikat
   responden. */
export function komentarPeriode(rows: BarisKomentar[], periode: string): string[] {
  const sudah = new Set<string>();
  const komentar: string[] = [];

  for (const row of rows) {
    if (periodeDariTanggal(row.created_at) !== periode) continue;

    const hash = row.responden_hash ? String(row.responden_hash).trim().toLowerCase() : '';
    if (hash) {
      if (sudah.has(hash)) continue;
      sudah.add(hash);
    }

    const teks = komentarDari(row.data_jawaban);
    if (!teks) continue;
    if (jawabanSensitif(teks)) continue;

    komentar.push(teks);
  }

  return komentar;
}

const UKURAN_HALAMAN = 1000;
const MAKS_HALAMAN = 50;

export async function ambilKomentar(
  client: KlienRpc,
  instrumen: string,
  periode: string
): Promise<string[]> {
  const rows: BarisKomentar[] = [];

  for (let halaman = 0; halaman < MAKS_HALAMAN; halaman++) {
    const { data, error } = await client.rpc('survey_komentar_safe', {
      p_instrumen: instrumen,
      p_periode: periode,
      p_limit: UKURAN_HALAMAN,
      p_offset: halaman * UKURAN_HALAMAN
    });

    if (error) throw new Error(`gagal membaca survey_komentar_safe: ${error.message}`);
    if (!Array.isArray(data) || data.length === 0) break;

    rows.push(...(data as BarisKomentar[]));
    if (data.length < UKURAN_HALAMAN) break;
  }

  return komentarPeriode(rows, periode);
}
