/* Menjalankan index.ts Edge Function apa adanya (tanpa Docker), memakai shim
   Deno minimal. Tujuannya memverifikasi bahwa pembungkus Deno benar: import
   JSON, Deno.env, Deno.serve, dan rangkaian dependensinya.

   LLM tetap stub; data tetap dari Supabase asli.

   Jalankan: node --experimental-strip-types --import ./scripts/deno-shim.mjs scripts/uji-index.mjs
*/

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pasangDeno } from './deno-shim.mjs';
const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function muatEnv() {
  const isi = await readFile(resolve(AKAR, 'frontend/.env'), 'utf8');
  const env = {};
  for (const baris of isi.split(/\r?\n/)) {
    const b = baris.trim();
    if (!b || b.startsWith('#') || !b.includes('=')) continue;
    const i = b.indexOf('=');
    env[b.slice(0, i).trim()] = b.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = await muatEnv();
const peniru = pasangDeno({
  SUPABASE_URL: env.VITE_SUPABASE_URL,
  /* service_role tidak tersedia di .env frontend; pakai publishable untuk uji baca. */
  SUPABASE_SERVICE_ROLE_KEY: env.VITE_SUPABASE_ANON_KEY,
  LLM_STUB: '1',
  CHAT_BATAS_PER_JAM: '5'
});

await import(pathToFileURL(resolve(AKAR, 'supabase/functions/chat/index.ts')).href);

/* Rate limit memakai RPC cek_rate_limit; di uji ini RPC boleh gagal (fail-open),
   tetapi bila migrasi sudah dijalankan, penghitungnya ikut terpakai. */
const kasus = [
  ['OPTIONS', undefined, 200],
  ['GET', undefined, 405],
  ['POST', { pertanyaan: '' }, 422],
  ['POST', { pertanyaan: 'a'.repeat(301) }, 422],
  ['POST', 'bukan json', 400],
  ['POST', { pertanyaan: 'butir terendah SPAK?' }, 200]
];

let lulus = 0;
for (const [metode, body, harap] of kasus) {
  const hasil = await peniru.panggil(metode, body);
  const ok = hasil.status === harap;
  if (ok) lulus += 1;
  console.log(`  ${ok ? 'OK  ' : 'GAGAL'} ${metode.padEnd(7)} ${String(harap).padEnd(3)} -> ${hasil.status}  ${hasil.teks.slice(0, 70)}`);
}

console.log(`\n  ${lulus}/${kasus.length} sesuai harapan\n`);
process.exit(lulus === kasus.length ? 0 : 1);
