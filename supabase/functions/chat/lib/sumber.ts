/* Pengambil data survei dari Supabase + perakit agregat per (instrumen, periode).

   Prinsip privasi: kolom yang di-select HANYA nama_instrumen, data_jawaban, dan
   created_at. `email_responden` tidak pernah diambil, sehingga tidak mungkin
   bocor ke konteks LLM atau ke log — bukan karena kode "ingat untuk tidak
   memakainya", tetapi karena datanya tidak pernah ada di memori.

   Logika agregat dipisah dari klien Supabase supaya bisa dites tanpa jaringan:
   `kumpulkan()` murni, sedangkan `buatPengambil()` hanya pembungkus query.
*/

import type { Agregat } from './statistik.ts';
import { hitungAgregat } from './statistik.ts';
import { normalizeAnswers, periodeDariTanggal, slugDariNama } from './normalisasi.ts';
import { rekomendasiUntuk, getDelta } from './rekomendasi.ts';
import type { BarisJawaban, InstrumenInfo, Registri } from './tipe.ts';

export interface BarisMentah {
  nama_instrumen: string;
  data_jawaban: unknown;
  created_at: string;
}

export interface HasilSatuInstrumen {
  instrumen: InstrumenInfo;
  agregat: Agregat;
  agregatBanding: Agregat | null;
  rekomendasi: Array<{ prioritas: string; judul: string; dasar: string; kode_butir: string | null }>;
}

export interface HasilKumpulan {
  periode: string;
  perInstrumen: HasilSatuInstrumen[];
  dibuang: number;
  totalBaris: number;
}

/* Periode terbaru yang benar-benar punya data, mengikuti urutan PERIODE di
   frontend (ganjil/genap per tahun). Dibandingkan sebagai teks menurun:
   "2026-ganjil" < "2026-genap"? Tidak — karena itu tahun dipisah dulu. */
export function periodeTerbaru(periode: string[]): string | null {
  if (!periode.length) return null;
  const kunci = (p: string) => {
    const [tahun, semester] = p.split('-');
    /* Genap (Mar-Agu) terjadi sebelum Ganjil (Sep-Feb) pada tahun yang sama. */
    const urutanSemester = semester === 'ganjil' ? 1 : 0;
    return Number(tahun) * 10 + urutanSemester;
  };
  return periode.slice().sort((a, b) => kunci(b) - kunci(a))[0];
}

export function kumpulkan(
  rows: BarisMentah[],
  registri: Registri,
  periodeDiminta?: string | null
): HasilKumpulan {
  const peta = new Map<string, { instrumen: InstrumenInfo; periode: string; records: BarisJawaban[] }>();
  const kualitas = new Map<string, { dibuang: number; duplikat: number }>();
  let dibuang = 0;

  for (const row of rows) {
    const slug = slugDariNama(row.nama_instrumen, registri.alias);
    if (!slug) continue;
    const instrumen = registri.instrumen.find((i) => i.slug === slug);
    if (!instrumen || !instrumen.punya_agregat) continue;

    const periode = periodeDariTanggal(row.created_at);
    if (!periode) continue;

    const hasil = normalizeAnswers(slug, instrumen, row.data_jawaban);
    if (!hasil.items.length) {
      dibuang += 1;
      const kunciBuang = `${slug}|${periode}`;
      const lama = kualitas.get(kunciBuang) ?? { dibuang: 0, duplikat: 0 };
      kualitas.set(kunciBuang, { ...lama, dibuang: lama.dibuang + 1 });
      continue;
    }

    const kunci = `${slug}|${periode}`;
    if (!peta.has(kunci)) peta.set(kunci, { instrumen, periode, records: [] });
    /* `terbuka` sengaja dibuang di sini: konteks LLM hanya memakai tema
       (sudah diringkas di hitungAgregat) dan tidak pernah teks mentah. */
    peta.get(kunci)!.records.push({ items: hasil.items, kelompok: hasil.kelompok });
  }

  const semuaPeriode = [...new Set([...peta.values()].map((v) => v.periode))];
  const periode = periodeDiminta && semuaPeriode.includes(periodeDiminta) ? periodeDiminta : periodeTerbaru(semuaPeriode);
  if (!periode) return { periode: '', perInstrumen: [], dibuang, totalBaris: rows.length };

  /* Periode pembanding: periode sebelumnya yang punya data instrumen yang sama. */
  const perInstrumen: HasilSatuInstrumen[] = [];
  for (const [kunci, isi] of peta) {
    if (isi.periode !== periode) continue;
    const agregat = hitungAgregat(isi.instrumen, isi.periode, isi.records, 'real', {
      dibuang: kualitas.get(kunci)?.dibuang ?? 0,
      duplikat: kualitas.get(kunci)?.duplikat ?? 0
    });
    if (!agregat) continue;

    /* Periode pembanding: periode terbaru lain yang punya data instrumen yang
       sama. Urutan memakai kunci tahun+semester, bukan urutan teks, karena
       "genap" < "ganjil" secara abjad padahal ganjil terjadi belakangan. */
    const periodeKandidat = periodeTerbaru(
      [...peta.values()].filter((v) => v.instrumen.slug === isi.instrumen.slug && v.periode !== periode).map((v) => v.periode)
    );
    const kandidatBanding = periodeKandidat
      ? [...peta.values()].find((v) => v.instrumen.slug === isi.instrumen.slug && v.periode === periodeKandidat)
      : undefined;

    const agregatBanding = kandidatBanding
      ? hitungAgregat(kandidatBanding.instrumen, kandidatBanding.periode, kandidatBanding.records, 'real')
      : null;

    const perubahanButir = agregat.butir.map((b, i) => ({
      kode: b.kode,
      label: b.label,
      delta: getDelta(b.rata, agregatBanding?.butir[i]?.rata ?? b.rata)
    }));

    perInstrumen.push({
      instrumen: isi.instrumen,
      agregat,
      agregatBanding,
      rekomendasi: rekomendasiUntuk(agregat, agregatBanding, perubahanButir, registri.ambang)
    });
  }

  perInstrumen.sort((a, b) => a.instrumen.nama.localeCompare(b.instrumen.nama));
  return { periode, perInstrumen, dibuang, totalBaris: rows.length };
}

/* ---------------------------------------------------------------------------
   Pembungkus query Supabase
   --------------------------------------------------------------------------- */

export interface KlienSupabase {
  from(tabel: string): {
    select(kolom: string): {
      order(kolom: string, opsi: { ascending: boolean }): {
        limit(n: number): PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
      };
    };
  };
}

export const KOLOM = 'nama_instrumen,data_jawaban,created_at';

/* Batas baris supaya satu permintaan tidak menarik seluruh tabel tanpa batas.
   Cukup untuk prototipe: 314 baris saat ini, batas 5000 memberi ruang. */
export const BATAS_BARIS = Number(
  (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno?.env.get('CHAT_BATAS_BARIS') ??
    (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env?.CHAT_BATAS_BARIS ??
    5000
);

export async function ambilBaris(client: KlienSupabase, batas = BATAS_BARIS): Promise<BarisMentah[]> {
  const { data, error } = await client
    .from('survey_responses')
    .select(KOLOM)
    .order('created_at', { ascending: false })
    .limit(batas);

  if (error) throw new Error(`gagal membaca survey_responses: ${error.message}`);
  return (data ?? []) as BarisMentah[];
}
