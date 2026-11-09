// Edge Function: membuat signed download URL untuk lampiran laporan.
// Bucket bersifat privat; admin membuka bukti lewat URL berumur pendek ini.
//
// Path berisi UUID acak (`lampiran/<jenis>/<folder>/<uuid>-<nama>`), jadi
// hanya pihak yang memang memegang path dari baris laporan yang bisa meminta
// URL. Deploy:
//   supabase functions deploy ambil-lampiran --use-api

import { CORS, json } from '../_shared/http.ts';
import { buatClient } from '../_shared/supabase.ts';
import { PayloadError } from '../_shared/errors.ts';
import { BUCKET } from '../_shared/lampiran.ts';

const UMUR_DETIK = 120;

function validasiPath(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new PayloadError('Data lampiran tidak valid.');
  }
  const path = typeof (body as Record<string, unknown>).path === 'string'
    ? ((body as Record<string, string>).path).trim()
    : '';
  if (
    !path ||
    path.length > 400 ||
    path.includes('..') ||
    !path.startsWith('lampiran/') ||
    !/^[A-Za-z0-9/._-]+$/.test(path)
  ) {
    throw new PayloadError('Path lampiran tidak valid.');
  }
  return path;
}

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

  let path: string;
  try {
    path = validasiPath(body);
  } catch (error) {
    if (error instanceof PayloadError) {
      return json({ error: error.message }, 400);
    }
    throw error;
  }

  const supabase = buatClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, UMUR_DETIK);

  if (error) {
    return json({ error: error.message }, 500);
  }

  return json({ status: 'success', data: { url: data.signedUrl, berlakuDetik: UMUR_DETIK } });
});
