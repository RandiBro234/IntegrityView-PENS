/* Server pengembangan untuk Edge Function `chat`.

   Menjalankan jalur yang sama seperti produksi (Supabase -> normalisasi ->
   agregat -> konteks -> prompt -> LLM) tetapi di Node, supaya panel chatbot di
   browser bisa dicoba tanpa deploy.

   Kunci LLM dibaca dari supabase/.env.local (tidak di-commit). Data dibaca dari
   frontend/.env memakai anon key. Email responden tidak pernah di-select.

   Jalankan: node --experimental-strip-types scripts/serve-chat.mjs
            (atau: npm run chat:serve dari folder frontend)
*/

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { jawabChat } from '../supabase/functions/chat/lib/penjawab.ts';
import { kumpulkan } from '../supabase/functions/chat/lib/sumber.ts';
import { tanyaLlm } from '../supabase/functions/chat/lib/llm.ts';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.CHAT_PORT || 8787);

async function bacaEnv(jalur) {
  try {
    const isi = await readFile(jalur, 'utf8');
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

const lokal = await bacaEnv(resolve(AKAR, 'supabase/.env.local'));
const depan = await bacaEnv(resolve(AKAR, 'frontend/.env'));
const env = { ...depan, ...lokal };

const urlProyek = (depan.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const kunci = depan.VITE_SUPABASE_ANON_KEY || '';
if (!urlProyek || !kunci) {
  console.error('\n  GAGAL: frontend/.env belum berisi VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.\n');
  process.exit(1);
}
if (!lokal.LLM_API_KEY) {
  console.error('\n  GAGAL: supabase/.env.local belum berisi LLM_API_KEY.\n');
  process.exit(1);
}

Object.assign(process.env, {
  LLM_BASE_URL: lokal.LLM_BASE_URL || '',
  LLM_MODEL: lokal.LLM_MODEL || '',
  LLM_API_KEY: lokal.LLM_API_KEY || '',
  LLM_STUB: lokal.LLM_STUB || '',
  LLM_REASONING_EFFORT: lokal.LLM_REASONING_EFFORT || ''
});

const registri = JSON.parse(await readFile(resolve(AKAR, 'supabase/functions/chat/lib/instrumen.json'), 'utf8'));

const kepala = { apikey: kunci, Accept: 'application/json' };
if (kunci.startsWith('eyJ')) kepala.Authorization = `Bearer ${kunci}`;

/* Cache singkat: data survei tidak berubah per detik, dan setiap pertanyaan
   tidak perlu menarik 314 baris ulang. */
let cache = { waktu: 0, data: null };
const UMUR_CACHE_MS = 60_000;

async function ambilData() {
  if (cache.data && Date.now() - cache.waktu < UMUR_CACHE_MS) return cache.data;
  const res = await fetch(
    `${urlProyek}/rest/v1/survey_responses?select=nama_instrumen,data_jawaban,created_at&order=created_at.desc&limit=5000`,
    { headers: kepala }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status} saat membaca survey_responses`);
  const data = kumpulkan(await res.json(), registri);
  cache = { waktu: Date.now(), data };
  return data;
}

const batasPerJam = Number(lokal.CHAT_BATAS_PER_JAM || 20);
const hitungan = new Map();

function boleh(jam) {
  const sekarang = Math.floor(Date.now() / 3_600_000);
  const isi = hitungan.get(jam) ?? { jam: sekarang, jumlah: 0 };
  if (isi.jam !== sekarang) {
    isi.jam = sekarang;
    isi.jumlah = 0;
  }
  if (isi.jumlah >= batasPerJam) return false;
  isi.jumlah += 1;
  hitungan.set(jam, isi);
  return true;
}

const deps = {
  registri,
  ambilData,
  tanyaLlm,
  cekBatas: async () => boleh('total')
};

const server = createServer(async (req, res) => {
  const kirim = (status, body) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'content-type, apikey, authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    });
    res.end(JSON.stringify(body));
  };

  if (req.method === 'OPTIONS') return kirim(200, { ok: true });
  if (req.method === 'GET' && req.url === '/') {
    return kirim(200, { status: 'ok', model: lokal.LLM_MODEL || '(tidak diisi)' });
  }
  if (req.method !== 'POST') return kirim(405, { error: 'Method not allowed' });

  let mentah = '';
  for await (const bagian of req) mentah += bagian;

  let body;
  try {
    body = JSON.parse(mentah || '{}');
  } catch {
    return kirim(400, { error: 'Body bukan JSON yang valid' });
  }

  try {
    const hasil = await jawabChat(body, deps);
    return kirim(hasil.status, hasil.body);
  } catch (err) {
    console.error('galat tak terduga:', err instanceof Error ? err.message : err);
    return kirim(500, { error: 'Terjadi kesalahan internal.' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Chatbot lokal: http://127.0.0.1:${PORT}`);
  console.log(`  Model        : ${lokal.LLM_MODEL || '(tidak diisi)'}`);
  console.log(`  Batas        : ${batasPerJam} pertanyaan/jam\n`);
  console.log(`  Set di frontend/.env:  VITE_CHAT_API_URL=http://127.0.0.1:${PORT}\n`);
});
