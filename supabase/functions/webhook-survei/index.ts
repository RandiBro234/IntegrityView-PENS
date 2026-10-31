// Supabase Edge Function: menerima submit Google Form lalu menyimpan ke
// tabel public.survey_responses.
//
// Deploy (dari root project):
//   supabase functions deploy webhook-survei --no-verify-jwt
// Secret (samakan dengan yang dipakai Apps Script):
//   supabase secrets set WEBHOOK_SECRET=ganti-dengan-string-acak
//
// SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY sudah otomatis tersedia di
// environment Edge Function, jadi tidak perlu diset manual.

import { CORS, json } from './lib/http.ts';
import { ambilEmail } from './lib/email.ts';
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
  const supabase = buatClient();

  const { error } = await supabase
    .from('survey_responses')
    .insert({
      nama_instrumen: instrumen,
      email_responden: email,
      data_jawaban: data
    });

  if (error) {
    return json({ error: error.message }, 500);
  }

  return json({
    status: 'success',
    message: `Data ${instrumen} tersimpan.`
  });
});
