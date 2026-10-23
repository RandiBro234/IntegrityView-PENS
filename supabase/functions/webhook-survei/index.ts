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

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}

function pertama(nilai: unknown): string | null {
  if (Array.isArray(nilai)) return nilai.length ? String(nilai[0]) : null;
  if (nilai === null || nilai === undefined) return null;
  return String(nilai);
}

function ambilEmail(data: Record<string, unknown>): string | null {
  for (const kunci of ['Email Address', 'Email', 'email']) {
    const nilai = pertama(data[kunci]);
    if (nilai) return nilai;
  }
  return null;
}

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

  let body: { instrumen?: string; data?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Body bukan JSON yang valid' }, 400);
  }

  const instrumen = String(body.instrumen || 'UNKNOWN');
  const data = body.data || {};
  const email = ambilEmail(data);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

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
