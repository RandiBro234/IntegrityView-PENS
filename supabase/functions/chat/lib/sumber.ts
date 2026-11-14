/* Pengambil data survei dari Supabase + perakit agregat per (instrumen, periode).

   Prinsip privasi: data diambil lewat RPC `survey_rows_safe`, yang di server
   sudah membuang kolom email_responden dan membersihkan kunci berbau email dari
   data_jawaban. Jadi email tidak pernah ada di memori proses ini.

   Kenapa RPC, bukan select tabel: PostgREST membatasi 1000 baris per request.
   Tabel sudah berisi >6000 baris, sehingga select biasa akan terpotong diam-diam
   dan agregat dihitung dari sebagian data. RPC ini berhalaman (p_limit/p_offset)
   sehingga bisa ditarik sampai habis.

   Logika agregat dipisah dari klien Supabase supaya bisa dites tanpa jaringan:
   `kumpulkan()` murni, sedangkan `ambilBaris()` hanya pembungkus query.
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
  /* Hash responden untuk deduplikasi. Tidak bisa dibalik menjadi email. */
  responden_hash?: string | null;
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
  duplikat: number;
  totalBaris: number;
  /* Jumlah responden unik pada periode terpilih: hash distinct lintas
     instrumen, ditambah baris tanpa hash yang dihitung satu per satu. Sama
     dengan cara dashboard menghitung "Responden". */
  respondenUnik: number;
}

/* Periode terbaru yang benar-benar punya data, mengikuti urutan PERIODE di
   frontend (ganjil/genap per tahun). */
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
  let duplikat = 0;

  /* Dedup: satu responden (hash) hanya dihitung sekali per instrumen per
     periode, memakai baris terbaru. Aturan ini sama dengan normalisasiBaris()
     di frontend supaya n chatbot = n dashboard. Baris tanpa hash tidak pernah
     dianggap duplikat. */
  const terpilih = new Map<string, { row: BarisMentah; slug: string; periode: string; items: number[]; kelompok: string | null }>();

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

    const hash = row.responden_hash ? String(row.responden_hash).trim().toLowerCase() : null;
    if (!hash) {
      /* Tanpa hash: tidak bisa didedup, langsung masukkan dengan kunci unik. */
      const kunciUnik = `tanpa-hash|${slug}|${periode}|${terpilih.size}`;
      terpilih.set(kunciUnik, { row, slug, periode, items: hasil.items, kelompok: hasil.kelompok });
      continue;
    }

    const kunciDedup = `${hash}|${slug}|${periode}`;
    const lama = terpilih.get(kunciDedup);
    if (!lama) {
      terpilih.set(kunciDedup, { row, slug, periode, items: hasil.items, kelompok: hasil.kelompok });
      continue;
    }

    duplikat += 1;
    const kunciKualitas = `${slug}|${periode}`;
    const kualitasLama = kualitas.get(kunciKualitas) ?? { dibuang: 0, duplikat: 0 };
    kualitas.set(kunciKualitas, { ...kualitasLama, duplikat: kualitasLama.duplikat + 1 });

    /* Simpan yang lebih baru. */
    if (new Date(row.created_at).getTime() > new Date(lama.row.created_at).getTime()) {
      terpilih.set(kunciDedup, { row, slug, periode, items: hasil.items, kelompok: hasil.kelompok });
    }
  }

  for (const isi of terpilih.values()) {
    const kunci = `${isi.slug}|${isi.periode}`;
    if (!peta.has(kunci)) {
      const instrumen = registri.instrumen.find((i) => i.slug === isi.slug)!;
      peta.set(kunci, { instrumen, periode: isi.periode, records: [] });
    }
    /* `terbuka` sengaja dibuang: konteks LLM hanya memakai tema (sudah
       diringkas di hitungAgregat) dan tidak pernah teks mentah. */
    peta.get(kunci)!.records.push({ items: isi.items, kelompok: isi.kelompok });
  }

  const semuaPeriode = [...new Set([...peta.values()].map((v) => v.periode))];
  const periode = periodeDiminta && semuaPeriode.includes(periodeDiminta) ? periodeDiminta : periodeTerbaru(semuaPeriode);
  if (!periode) return { periode: '', perInstrumen: [], dibuang, duplikat, totalBaris: rows.length, respondenUnik: 0 };

  /* Responden unik periode terpilih: hash distinct lintas instrumen. Baris
     tanpa hash sudah diberi kunci unik saat dedup, jadi ikut terhitung satu
     per satu seperti di dashboard. */
  const hashPeriode = new Set<string>();
  for (const [kunci, isi] of terpilih) {
    if (isi.periode !== periode) continue;
    hashPeriode.add(kunci.startsWith('tanpa-hash|') ? kunci : kunci.split('|')[0]);
  }
  const respondenUnik = hashPeriode.size;

  /* Periode pembanding: periode sebelumnya yang punya data instrumen yang sama. */
  const perInstrumen: HasilSatuInstrumen[] = [];
  for (const [kunci, isi] of peta) {
    if (isi.periode !== periode) continue;
    const agregat = hitungAgregat(isi.instrumen, isi.periode, isi.records, 'real', {
      dibuang: kualitas.get(kunci)?.dibuang ?? 0,
      duplikat: kualitas.get(kunci)?.duplikat ?? 0
    });
    if (!agregat) continue;

    /* Urutan memakai kunci tahun+semester, bukan urutan teks, karena
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
  return { periode, perInstrumen, dibuang, duplikat, totalBaris: rows.length, respondenUnik };
}

/* ---------------------------------------------------------------------------
   Pembungkus query Supabase
   --------------------------------------------------------------------------- */

export interface KlienSupabase {
  rpc(
    nama: string,
    argumen: Record<string, unknown>
  ): PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
}

/* Ukuran halaman mengikuti batas maksimum RPC (1000). */
export const UKURAN_HALAMAN = 1000;

/* Batas pengaman: kalau server mengembalikan halaman penuh terus, jangan sampai
   berputar tanpa henti. 50 halaman = 50.000 baris, jauh di atas kebutuhan. */
export const MAKS_HALAMAN = Number(
  (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno?.env.get('CHAT_MAKS_HALAMAN') ??
    (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env?.CHAT_MAKS_HALAMAN ??
    50
);

/* Ambil SEMUA baris lewat RPC berhalaman sampai halaman kosong. */
export async function ambilBaris(client: KlienSupabase): Promise<BarisMentah[]> {
  const semua: BarisMentah[] = [];

  for (let halaman = 0; halaman < MAKS_HALAMAN; halaman++) {
    const { data, error } = await client.rpc('survey_rows_safe', {
      p_limit: UKURAN_HALAMAN,
      p_offset: halaman * UKURAN_HALAMAN
    });

    if (error) throw new Error(`gagal membaca survey_rows_safe: ${error.message}`);
    if (!Array.isArray(data) || data.length === 0) break;

    semua.push(...(data as BarisMentah[]));
    if (data.length < UKURAN_HALAMAN) break;
  }

  return semua;
}

