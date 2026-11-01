// Edge Function: membuat signed upload URL untuk lampiran laporan.
// Browser mengunggah langsung ke Storage memakai URL ini, lalu metadata
// dikirim bersama laporan ke function kirim-laporan.
//
// Deploy (dari root project):
//   supabase functions deploy buat-upload-lampiran --use-api

import { CORS, json } from '../_shared/http.ts';
import { buatClient } from '../_shared/supabase.ts';
import { cekBatas, BATAS_UPLOAD } from '../_shared/limit.ts';
import { PayloadError } from '../_shared/errors.ts';
import { BUCKET, validasiUpload } from '../_shared/lampiran.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Body bukan JSON yang valid' }, 400);
  }

  let input;
  try {
    input = validasiUpload(body);
  } catch (error) {
    if (error instanceof PayloadError) {
      return json({ error: error.message }, 400);
    }
    throw error;
  }

  const supabase = buatClient();
  if (!(await cekBatas(supabase, req, 'upload', BATAS_UPLOAD))) {
    return json(
      { error: 'Terlalu banyak unggahan dari jaringan ini. Coba lagi dalam 10 menit.' },
      429
    );
  }

  const now = new Date();
  const folder = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const aman = input.nama
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(-80) || 'lampiran';
  const path = `lampiran/${input.jenis}/${folder}/${crypto.randomUUID()}-${aman}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error) {
    return json({ error: error.message }, 500);
  }

  return json({ status: 'success', data: { ...data, path } });
});
