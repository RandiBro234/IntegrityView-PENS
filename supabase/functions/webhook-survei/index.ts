// Supabase Edge Function: menerima submit Google Form lalu menyimpan ke
// tabel public.survey_responses.
//
// Deploy (dari root project):
//   supabase functions deploy webhook-survei --no-verify-jwt
// Secret (samakan dengan yang dipakai Apps Script):
//   supabase secrets set WEBHOOK_SECRET=ganti-dengan-string-acak
// Secret hash email responden:
//   supabase secrets set RESPONDENT_HASH_PEPPER=ganti-dengan-string-acak-panjang
//
// SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY sudah otomatis tersedia di
// environment Edge Function, jadi tidak perlu diset manual.

import { CORS, json } from './lib/http.ts';
import { ambilEmail } from './lib/email.ts';
import { hashEmail, sanitasiDataJawaban } from './lib/privasi.ts';
import { buatClient } from './lib/supabase.ts';
import { PayloadError, validasiData } from './lib/validasi.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const secret = req.headers.get('x-webhook-secret');
  const expected = Deno.env.get('WEBHOOK_SECRET');
  if (!expected || secret !== expected) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let body: { instrumen?: string; data?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Body bukan JSON yang valid' }, 400);
  }

  const instrumen = String(body.instrumen || 'UNKNOWN');

  let data: Record<string, unknown>;
  try {
    data = validasiData(body.data ?? {});
  } catch (error) {
    if (error instanceof PayloadError) {
      return json({ error: error.message }, 400);
    }
    throw error;
  }

  const email = ambilEmail(data);
  const dataBersih = sanitasiDataJawaban(data);
  let respondenHash: string | null = null;

  try {
    respondenHash = email ? await hashEmail(email) : null;
  } catch (error) {
    console.error('Gagal membuat hash responden:', error);
    return json({ error: 'Konfigurasi privasi responden belum siap' }, 500);
  }

  const supabase = buatClient();

  const { error } = await supabase
    .from('survey_responses')
    .insert({
      nama_instrumen: instrumen,
      responden_hash: respondenHash,
      data_jawaban: dataBersih
    });

  if (error) {
    return json({ error: error.message }, 500);
  }

  /* Hitung ulang rekomendasi jawaban terbuka di latar belakang. Tidak ditunggu
     di jalur respons supaya pengiriman Google Form tidak ikut lambat bila model
     bahasa sedang sibuk. Kegagalan di sini tidak membatalkan penyimpanan. */
  picuRekomendasi();

  return json({
    status: 'success',
    message: `Data ${instrumen} tersimpan.`
  });
});

function picuRekomendasi(): void {
  const url = Deno.env.get('SUPABASE_URL');
  const kunci = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !kunci) return;

  const tugas = fetch(`${url.replace(/\/$/, '')}/functions/v1/hitung-rekomendasi`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kunci}`,
      'Content-Type': 'application/json'
    },
    body: '{}',
    signal: AbortSignal.timeout(120_000)
  })
    .then(async (res) => {
      if (!res.ok) console.error(`hitung-rekomendasi membalas HTTP ${res.status}`);
    })
    .catch((err) => console.error('Gagal memicu hitung-rekomendasi:', err?.name ?? err));

  /* waitUntil tersedia di runtime Edge Function; saat dites di Node tidak ada,
     jadi tugas hanya dilepas tanpa ditunggu. */
  const runtime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(tugas);
}
