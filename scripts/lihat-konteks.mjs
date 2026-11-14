/* Menampilkan konteks yang dikirim ke LLM untuk satu instrumen.
   Dipakai untuk memeriksa apakah data yang ditanyakan benar-benar ada.

   Jalankan: node --experimental-strip-types scripts/lihat-konteks.mjs benturan
*/

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SLUG = process.argv[2] || 'benturan';

const env = {};
for (const baris of (await readFile(resolve(AKAR, 'frontend/.env'), 'utf8')).split(/\r?\n/)) {
  const b = baris.trim();
  if (!b || b.startsWith('#') || !b.includes('=')) continue;
  const i = b.indexOf('=');
  env[b.slice(0, i).trim()] = b.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}

const url = env.VITE_SUPABASE_URL.replace(/\/$/, '');
const key = env.VITE_SUPABASE_ANON_KEY;
const headers = { apikey: key, Accept: 'application/json', 'Content-Type': 'application/json' };

const rows = [];
for (let offset = 0; ;) {
  const res = await fetch(`${url}/rest/v1/rpc/survey_rows_safe`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ p_limit: 1000, p_offset: offset })
  });
  const halaman = await res.json();
  if (!Array.isArray(halaman) || halaman.length === 0) break;
  rows.push(...halaman);
  offset += halaman.length;
}

const registri = JSON.parse(await readFile(resolve(AKAR, 'supabase/functions/chat/lib/instrumen.json'), 'utf8'));
const { kumpulkan } = await import(pathToFileURL(resolve(AKAR, 'supabase/functions/chat/lib/sumber.ts')).href);
const { rakitKonteksSatu } = await import(pathToFileURL(resolve(AKAR, 'supabase/functions/chat/lib/konteks.ts')).href);

const data = kumpulkan(rows, registri);
const satu = data.perInstrumen.find((d) => d.instrumen.slug === SLUG);
if (!satu) {
  console.error(`\n  ${SLUG} tidak ada.\n`);
  process.exit(1);
}

const konteks = rakitKonteksSatu(satu.agregat, satu.instrumen, registri.ambang, satu.rekomendasi);

console.log(`\n  ${satu.instrumen.nama} · ${satu.agregat.periode}`);
console.log(`  ukuran konteks: ${JSON.stringify(konteks).length} byte\n`);

console.log('  BUTIR:');
for (const b of konteks.butir) {
  console.log(`    ${b.kode}  skor ${b.skor}  tidak_setuju ${b.tidak_setuju_persen}%`);
  console.log(`         aspek     : ${b.aspek}`);
  console.log(`         pernyataan: ${b.pernyataan}`);
}

console.log('\n  REKOMENDASI:');
if (!konteks.rekomendasi.length) console.log('    (kosong)');
for (const r of konteks.rekomendasi) {
  console.log(`    [${r.prioritas}] ${r.judul}`);
  console.log(`         dasar: ${r.dasar}`);
}

console.log('\n  RINGKASAN:');
console.log(`    ${JSON.stringify(konteks.ringkasan)}`);
console.log('');
