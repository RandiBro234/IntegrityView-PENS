// Edge Function: menghitung rekomendasi dari jawaban terbuka.
//
// Dipicu oleh webhook-survei (setelah data baru) dan pg_cron tiap 30 menit.
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
import { konfigLlm, tanyaLlm } from '../_shared/llm.ts';
import { jalankanProses, type KlienDb } from './lib/proses.ts';

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
  const maksSaran = Math.min(
    Math.max(0, Number(body?.maks_saran) || envAngka('REKOMENDASI_MAKS_SARAN', MAKS_SARAN_BAWAAN)),
    50
  );

  const db = buatClient() as unknown as KlienDb;

  try {
    const hasil = await jalankanProses(db, { batas, maksSaran }, (pesan) =>
      tanyaLlm(pesan, { ...konfigLlm(), maxToken: 200 })
    );
    return json(hasil);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'gagal memproses' }, 500);
  }
});
