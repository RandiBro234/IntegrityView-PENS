// Edge Function: menjawab pertanyaan tentang hasil survei memakai LLM.
//
// Deploy (dari root project):
//   supabase functions deploy chat --use-api
//
// Atur nama model lewat secret, JANGAN di kode:
//   supabase secrets set LLM_BASE_URL=... LLM_MODEL=... LLM_API_KEY=...
//
// Function ini tanpa JWT karena dipakai pengunjung publik. Email responden
// tidak pernah di-select dari database (lihat lib/sumber.ts), jadi tidak
// mungkin bocor ke prompt LLM.

import { CORS, json } from '../_shared/http.ts';
import { cekBatas } from '../_shared/limit.ts';
import { buatClient } from '../_shared/supabase.ts';
import registri from './lib/instrumen.json' with { type: 'json' };
import { ambilBaris, kumpulkan } from './lib/sumber.ts';
import { jawabChat } from './lib/penjawab.ts';
import { tanyaLlm } from './lib/llm.ts';
import { buatCache } from './lib/cache.ts';

const BATAS_PER_JAM = Number(Deno.env.get('CHAT_BATAS_PER_JAM') || 20);
const JENDELA_JAM_MENIT = 60;

/* Data survei tidak berubah per detik, tetapi menariknya mahal: >7.000 baris
   dalam 8 request berurutan. Cache ini membuat pertanyaan berikutnya dalam
   satu menit tidak menyentuh database sama sekali. */
const CACHE_MS = Number(Deno.env.get('CHAT_CACHE_MS') || 60_000);

const ambilData = buatCache({
  umurMs: CACHE_MS,
  ambil: async () => kumpulkan(await ambilBaris(buatClient()), registri)
});

/* Batas harian seluruh sistem. Dihitung di memori instance; cukup untuk
   prototipe, dan sengaja bukan penghitung per pengguna. */
const BATAS_HARIAN = Number(Deno.env.get('CHAT_BATAS_HARIAN') || 200);
let harianTerpakai = 0;
let harianMulai = new Date().setHours(0, 0, 0, 0);

function bolehHarian(): boolean {
  const awalHariIni = new Date().setHours(0, 0, 0, 0);
  if (awalHariIni !== harianMulai) {
    harianMulai = awalHariIni;
    harianTerpakai = 0;
  }
  if (harianTerpakai >= BATAS_HARIAN) return false;
  harianTerpakai += 1;
  return true;
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

  const supabase = buatClient();

  const hasil = await jawabChat(body, {
    registri,
    ambilData,
    tanyaLlm,
    cekBatas: async () => {
      const perIp = await cekBatas(supabase, req, 'chat', BATAS_PER_JAM, JENDELA_JAM_MENIT);
      if (!perIp) return false;
      return bolehHarian();
    }
  });

  return json(hasil.body, hasil.status);
});
