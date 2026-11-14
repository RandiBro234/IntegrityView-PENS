/* Memastikan cache di index.ts benar-benar bekerja: dua pertanyaan berurutan
   tidak boleh sama-sama menarik seluruh baris survei.

   Dijalankan dengan shim Deno + loader stub:
     node --experimental-strip-types --import ./scripts/loader-https-stub.mjs scripts/uji-cache-index.mjs
*/

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pasangDeno } from './deno-shim.mjs';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const env = {};
for (const baris of (await readFile(resolve(AKAR, 'frontend/.env'), 'utf8')).split(/\r?\n/)) {
  const b = baris.trim();
  if (!b || b.startsWith('#') || !b.includes('=')) continue;
  const i = b.indexOf('=');
  env[b.slice(0, i).trim()] = b.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}

const peniru = pasangDeno({
  SUPABASE_URL: env.VITE_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: env.VITE_SUPABASE_ANON_KEY,
  LLM_STUB: '1',
  CHAT_BATAS_PER_JAM: '50',
  CHAT_CACHE_MS: '60000'
});

await import(pathToFileURL(resolve(AKAR, 'supabase/functions/chat/index.ts')).href);

const tanya = async (q) => {
  const t0 = Date.now();
  const r = await peniru.panggil('POST', { pertanyaan: q });
  return { status: r.status, ms: Date.now() - t0 };
};

const pertama = await tanya('butir terlemah SPAK?');
const kedua = await tanya('skor SPAK?');
const ketiga = await tanya('berapa n SPAK?');

console.log(`\n  pertama : ${pertama.status}  ${pertama.ms} ms  (menarik data)`);
console.log(`  kedua   : ${kedua.status}  ${kedua.ms} ms  (harus dari cache)`);
console.log(`  ketiga  : ${ketiga.status}  ${ketiga.ms} ms  (harus dari cache)\n`);

const lulus = pertama.status === 200 && kedua.status === 200 && ketiga.status === 200 && kedua.ms < pertama.ms / 2;
console.log(`  ${lulus ? 'LULUS' : 'GAGAL'}: permintaan kedua ${lulus ? 'jauh lebih cepat' : 'tidak lebih cepat'}\n`);
process.exit(lulus ? 0 : 1);
