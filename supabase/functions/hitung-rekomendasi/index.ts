// Edge Function: menghitung rekomendasi dari jawaban terbuka.
//
// Dipicu oleh pg_cron (atau manual) setelah tabel rekomendasi_kotor terisi.
// Satu kali jalan memproses maksimal beberapa kombinasi instrumen-periode,
// supaya tidak menabrak batas waktu Edge Function dan kuota model bahasa.
//
// Deploy (dari root project):
//   supabase functions deploy hitung-rekomendasi --use-api
//
// Secret yang dipakai sama dengan chatbot (LLM_BASE_URL, LLM_MODEL, LLM_API_KEY).
// Function ini wajib service role: hanya pemanggil server yang boleh memicu
// pekerjaan berbayar.

import { buatClient } from '../_shared/supabase.ts';
import { CORS, json } from '../_shared/http.ts';
import { LlmTidakTersedia, konfigLlm, tanyaLlm } from '../_shared/llm.ts';
import { ambilKomentar, type KlienRpc } from './lib/sumber.ts';
import { bentukKelompok, prioritasDari } from './lib/kelompok.ts';
import { hashMasukan, rapikanSaran, susunPrompt } from './lib/saran.ts';

interface KlienDb extends KlienRpc {
  from(tabel: string): any;
}

interface Penanda {
  nama_instrumen: string;
  periode: string;
  ditandai_pada: string;
}

const BATAS_BAWAAN = 5;
const MAKS_SARAN_BAWAAN = 10;

function envAngka(nama: string, bawaan: number): number {
  const nilai = Number(Deno.env.get(nama) ?? '');
  return Number.isFinite(nilai) && nilai > 0 ? nilai : bawaan;
}

/* verify_jwt=true menjaga tanda tangan token, tetapi token anon juga lolos.
   Periksa klaim role supaya pengunjung tidak bisa memicu pekerjaan berbayar. */
function peranToken(req: Request): string | null {
  const otoritas = req.headers.get('authorization') ?? '';
  const token = otoritas.toLowerCase().startsWith('bearer ') ? otoritas.slice(7).trim() : '';
  const bagian = token.split('.');
  if (bagian.length !== 3) return null;

  try {
    const isi = bagian[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(isi)) as { role?: unknown };
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

async function ambilPenanda(db: KlienDb, batas: number): Promise<Penanda[]> {
  const { data, error } = await db
    .from('rekomendasi_kotor')
    .select('nama_instrumen, periode, ditandai_pada')
    .order('ditandai_pada', { ascending: true })
    .limit(batas);

  if (error) throw new Error(`gagal membaca penanda: ${error.message}`);
  return (data ?? []) as Penanda[];
}

interface BarisRekomendasi {
  label: string;
  hash_masukan: string;
  saran_langkah: string | null;
}

async function saranTersimpan(
  db: KlienDb,
  instrumen: string,
  periode: string
): Promise<Map<string, BarisRekomendasi>> {
  const { data, error } = await db
    .from('rekomendasi_terbuka')
    .select('label, hash_masukan, saran_langkah')
    .eq('nama_instrumen', instrumen)
    .eq('periode', periode);

  if (error) throw new Error(`gagal membaca rekomendasi lama: ${error.message}`);

  const peta = new Map<string, BarisRekomendasi>();
  for (const row of (data ?? []) as BarisRekomendasi[]) {
    if (row.hash_masukan) peta.set(row.label, row);
  }
  return peta;
}

interface AnggaranSaran {
  sisa: number;
}

async function susunSaran(
  instrumen: string,
  periode: string,
  kelompok: { label: string; jumlah: number; porsi: number; kata_kunci: string[] },
  anggaran: AnggaranSaran,
  galat: string[]
): Promise<string | null> {
  if (anggaran.sisa <= 0) return null;
  anggaran.sisa -= 1;

  const konfig = { ...konfigLlm(), maxToken: 200 };
  try {
    const teks = await tanyaLlm(susunPrompt({ instrumen, periode, kelompok }), konfig);
    return rapikanSaran(teks) || null;
  } catch (err) {
    /* Model bahasa gagal bukan alasan menggagalkan seluruh perhitungan:
       kelompok tetap disimpan tanpa saran, dan akan dicoba lagi lain waktu
       karena hash_masukan dibiarkan kosong. */
    const alasan = err instanceof LlmTidakTersedia ? err.message : 'galat tidak dikenal';
    console.warn(`hitung-rekomendasi: saran LLM gagal untuk ${instrumen} ${periode}: ${alasan}`);
    galat.push(`${kelompok.label}: ${alasan}`);
    return null;
  }
}

interface Ringkasan {
  instrumen: string;
  periode: string;
  kelompok: number;
  komentar: number;
  tanpa_kata: number;
  silhouette: number | null;
  saran_baru: number;
  galat_saran: string[];
}

async function prosesSatu(
  db: KlienDb,
  penanda: Penanda,
  anggaran: AnggaranSaran
): Promise<Ringkasan> {
  const instrumen = penanda.nama_instrumen;
  const periode = penanda.periode;

  const komentar = await ambilKomentar(db, instrumen, periode);
  const hasil = bentukKelompok(komentar);
  const lama = await saranTersimpan(db, instrumen, periode);

  const baris: Record<string, unknown>[] = [];
  const galatSaran: string[] = [];
  let saranBaru = 0;

  for (const kelompok of hasil.kelompok) {
    const hash = await hashMasukan(kelompok.label, kelompok.jumlah, kelompok.kata_kunci);
    const tersimpan = lama.get(kelompok.label);

    let saran: string | null = null;
    if (tersimpan && tersimpan.hash_masukan === hash) {
      saran = tersimpan.saran_langkah;
    } else {
      saran = await susunSaran(instrumen, periode, kelompok, anggaran, galatSaran);
      if (saran) saranBaru += 1;
    }

    baris.push({
      label: kelompok.label,
      prioritas: prioritasDari(kelompok.porsi),
      jumlah: kelompok.jumlah,
      porsi: Math.round(kelompok.porsi * 10000) / 10000,
      kata_kunci: kelompok.kata_kunci,
      /* Hash hanya disimpan bila saran benar-benar ada, supaya kelompok yang
         gagal memanggil model bahasa dicoba lagi pada jalan berikutnya. */
      saran_langkah: saran,
      hash_masukan: saran ? hash : null,
      silhouette: hasil.silhouette,
      jumlah_komentar: hasil.jumlahKomentar,
      jumlah_unik: hasil.jumlahUnik,
      jumlah_tanpa_kata: hasil.tanpaKata
    });
  }

  const { error: galatSimpan } = await db.rpc('ganti_rekomendasi_terbuka', {
    p_instrumen: instrumen,
    p_periode: periode,
    p_baris: baris
  });
  if (galatSimpan) throw new Error(`gagal menyimpan rekomendasi: ${galatSimpan.message}`);

  /* Bila ada kelompok yang belum mendapat saran (model bahasa gagal atau kuota
     jalan ini habis), penanda tidak dihapus melainkan dimundurkan. Tanpa ini,
     kelompok tersebut tidak akan pernah dicoba lagi karena tidak ada data baru
     yang memicunya. Dimundurkan, bukan dibiarkan, supaya ia tidak selalu berada
     di urutan terdepan dan menghalangi kombinasi lain. */
  const perluUlang = galatSaran.length > 0 || baris.some((b) => !b.saran_langkah);

  if (perluUlang) {
    const { error: galatTunda } = await db
      .from('rekomendasi_kotor')
      .update({ ditandai_pada: new Date().toISOString() })
      .eq('nama_instrumen', instrumen)
      .eq('periode', periode)
      .lte('ditandai_pada', penanda.ditandai_pada);

    if (galatTunda) throw new Error(`gagal menunda penanda: ${galatTunda.message}`);
  } else {
    /* Hapus penanda hanya sampai waktu baca. Baris yang masuk saat perhitungan
       berjalan punya tanda lebih baru dan tetap kotor, jadi tidak hilang. */
    const { error: galatBersih } = await db
      .from('rekomendasi_kotor')
      .delete()
      .eq('nama_instrumen', instrumen)
      .eq('periode', periode)
      .lte('ditandai_pada', penanda.ditandai_pada);

    if (galatBersih) throw new Error(`gagal membersihkan penanda: ${galatBersih.message}`);
  }

  return {
    instrumen,
    periode,
    kelompok: baris.length,
    komentar: hasil.jumlahKomentar,
    tanpa_kata: hasil.tanpaKata,
    silhouette: hasil.silhouette,
    saran_baru: saranBaru,
    galat_saran: galatSaran
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }
  if (peranToken(req) !== 'service_role') {
    return json({ error: 'Forbidden' }, 403);
  }

  let body: { maks?: unknown; maks_saran?: unknown } = {};
  try {
    body = (await req.json()) as { maks?: unknown; maks_saran?: unknown };
  } catch {
    /* Body kosong diperbolehkan: pg_cron mengirim tanpa isi. */
  }

  const batas = Math.min(
    Math.max(1, Number(body?.maks) || envAngka('REKOMENDASI_BATAS_PER_JALAN', BATAS_BAWAAN)),
    10
  );
  const anggaran: AnggaranSaran = {
    sisa: Math.min(
      Math.max(0, Number(body?.maks_saran) || envAngka('REKOMENDASI_MAKS_SARAN', MAKS_SARAN_BAWAAN)),
      50
    )
  };

  const db = buatClient() as unknown as KlienDb;

  let penanda: Penanda[];
  try {
    penanda = await ambilPenanda(db, batas);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'gagal membaca penanda' }, 500);
  }

  const diproses: Ringkasan[] = [];
  const gagal: Array<{ instrumen: string; periode: string; pesan: string }> = [];

  for (const satu of penanda) {
    try {
      diproses.push(await prosesSatu(db, satu, anggaran));
    } catch (err) {
      gagal.push({
        instrumen: satu.nama_instrumen,
        periode: satu.periode,
        pesan: err instanceof Error ? err.message : 'galat tidak dikenal'
      });
    }
  }

  return json({
    diproses,
    gagal,
    sisa_kuota_saran: anggaran.sisa,
    masih_kotor: penanda.length === batas ? 'mungkin' : 'tidak'
  });
});
