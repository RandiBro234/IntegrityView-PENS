/* Server lokal peniru Edge Function `chat`, untuk uji end-to-end tanpa Deno.

   Yang DIPAKAI ASLI di sini:
   - data dari Supabase (REST, kolom tanpa email_responden)
   - normalisasi + agregat + perakit konteks + penyusun prompt
   - inti endpoint (lib/penjawab.ts)
   Yang DIGANTI:
   - Deno.serve -> node:http
   - LLM asli -> stub (LLM_STUB=1), supaya tanpa biaya
   - rate limit database -> penghitung di memori

   Tujuannya memverifikasi jalur lengkap "database -> jawaban" dengan kode yang
   sama seperti produksi. Yang tidak terverifikasi di sini hanya pembungkus
   Deno (import JSON, Deno.env, Deno.serve).

   Jalankan: node scripts/e2e-chat.mjs
*/

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { jawabChat } from '../supabase/functions/chat/lib/penjawab.ts';
import { kumpulkan, KOLOM } from '../supabase/functions/chat/lib/sumber.ts';
import { susunPesan } from '../supabase/functions/chat/lib/prompt.ts';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function muatEnv() {
  try {
    const isi = await readFile(resolve(AKAR, 'frontend/.env'), 'utf8');
    const env = {};
    for (const baris of isi.split(/\r?\n/)) {
      const b = baris.trim();
      if (!b || b.startsWith('#') || !b.includes('=')) continue;
      const i = b.indexOf('=');
      env[b.slice(0, i).trim()] = b.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    }
    return env;
  } catch {
    return {};
  }
}

export async function buatKetergantungan({ batasPerJam = 20, stub = '1' } = {}) {
  const env = { ...(await muatEnv()), ...process.env };
  const url = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.VITE_SUPABASE_ANON_KEY || '';
  if (!url || !key) throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi di frontend/.env');

  const registri = JSON.parse(await readFile(resolve(AKAR, 'supabase/functions/chat/lib/instrumen.json'), 'utf8'));

  const headers = { apikey: key, Accept: 'application/json' };
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;

  /* Bentuk klien tiruan yang meniru supabase-js secukupnya. */
  const client = {
    from() {
      return {
        select(kolom) {
          return {
            order(_k, { ascending }) {
              return {
                async limit(n) {
                  const arah = ascending ? 'asc' : 'desc';
                  const res = await fetch(
                    `${url}/rest/v1/survey_responses?select=${kolom}&order=created_at.${arah}&limit=${n}`,
                    { headers }
                  );
                  if (!res.ok) return { data: null, error: { message: `HTTP ${res.status}` } };
                  return { data: await res.json(), error: null };
                }
              };
            }
          };
        }
      };
    }
  };

  let terpakai = 0;

  return {
    registri,
    deps: {
      registri,
      ambilData: async () => kumpulkan(await ambilBarisLokal(client), registri),
      /* Stub LLM: balasan menyebut kode butir supaya jalur `dasar` ikut teruji. */
      tanyaLlm: async (pesan) => {
        if (stub === 'gagal') {
          const { LlmTidakTersedia } = await import('../supabase/functions/chat/lib/llm.ts');
          throw new LlmTidakTersedia('stub gagal');
        }
        const data = JSON.parse(pesan.user.slice('DATA: '.length, pesan.user.indexOf('\n\nPERTANYAAN:')));
        const kode =
          data.butir?.[2]?.kode ?? data.instrumen?.[0]?.butir_terendah?.kode ?? null;
        return `[stub] Menurut data, butir terendah${kode ? ` adalah ${kode}` : ' tidak tersedia'}.`;
      },
      cekBatas: async () => {
        terpakai += 1;
        return terpakai <= batasPerJam;
      }
    }
  };
}

async function ambilBarisLokal(client, batas = 5000) {
  const { data, error } = await client.from('survey_responses').select(KOLOM).order('created_at', { ascending: false }).limit(batas);
  if (error) throw new Error(`gagal membaca survey_responses: ${error.message}`);
  return data ?? [];
}

/* Server HTTP dengan kontrak sama seperti Edge Function. */
export async function jalankanServer(opsi) {
  const { deps } = await buatKetergantungan(opsi);
  const server = createServer(async (req, res) => {
    const kirim = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };

    if (req.method === 'OPTIONS') return kirim(200, { ok: true });
    if (req.method !== 'POST') return kirim(405, { error: 'Method not allowed' });

    let mentah = '';
    for await (const bagian of req) mentah += bagian;
    let body;
    try {
      body = JSON.parse(mentah || '{}');
    } catch {
      return kirim(400, { error: 'Body bukan JSON yang valid' });
    }

    const hasil = await jawabChat(body, deps);
    return kirim(hasil.status, hasil.body);
  });

  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  return { server, port: server.address().port, deps };
}

/* Dijalankan langsung: node scripts/e2e-chat.mjs */
if (process.argv[1] && process.argv[1].endsWith('e2e-chat.mjs')) {
  const { server, port } = await jalankanServer({ stub: process.env.LLM_STUB || '1' });
  console.log(`\n  Server uji jalan di http://127.0.0.1:${port}`);
  console.log('  Coba:');
  console.log(`    curl -X POST http://127.0.0.1:${port}/ -H "content-type: application/json" -d "{\\"pertanyaan\\":\\"butir mana yang paling lemah di SPAK?\\"}"`);
  console.log('  Tekan Ctrl+C untuk berhenti.\n');
  process.on('SIGINT', () => {
    server.close();
    process.exit(0);
  });
}
