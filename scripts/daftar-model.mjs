/* Menampilkan daftar model yang tersedia di penyedia LLM.

   Berguna saat memakai agregator: nama model sering berbeda dari nama resmi
   (mis. "claude-haiku-5.5" vs "anthropic/claude-haiku-5.5"). Jalankan ini
   setelah mengisi LLM_BASE_URL dan LLM_API_KEY, lalu salin id yang cocok ke
   LLM_MODEL.

   Kunci API tidak pernah dicetak.

   Jalankan: node scripts/daftar-model.mjs
*/

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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

const env = await bacaEnv(resolve(AKAR, 'supabase/.env.local'));
const base = (env.LLM_BASE_URL || '').replace(/\/$/, '');
const kunci = env.LLM_API_KEY || '';

if (!base) {
  console.error('\n  GAGAL: LLM_BASE_URL belum diisi di supabase/.env.local\n');
  process.exit(1);
}
if (!kunci) {
  console.error('\n  GAGAL: LLM_API_KEY belum diisi di supabase/.env.local\n');
  process.exit(1);
}

let headerEkstra = {};
try {
  headerEkstra = env.LLM_EXTRA_HEADERS ? JSON.parse(env.LLM_EXTRA_HEADERS) : {};
} catch {
  headerEkstra = {};
}

console.log(`\n  Endpoint : ${base}`);
console.log(`  Kunci    : ${kunci.length} karakter\n`);

const res = await fetch(`${base}/models`, {
  headers: { Authorization: `Bearer ${kunci}`, Accept: 'application/json', ...headerEkstra }
});

if (!res.ok) {
  const teks = await res.text();
  console.error(`  GAGAL: HTTP ${res.status}`);
  console.error(`  ${teks.slice(0, 300)}\n`);
  process.exit(1);
}

const data = await res.json();
const daftar = Array.isArray(data) ? data : (data.data ?? []);

if (!daftar.length) {
  console.log('  Tidak ada model yang dikembalikan endpoint /models.');
  console.log('  Sebagian agregator tidak menyediakan endpoint ini; isi LLM_MODEL manual.\n');
  process.exit(0);
}

console.log(`  ${daftar.length} model tersedia:\n`);
for (const m of daftar) {
  const id = m.id ?? m.name ?? String(m);
  console.log(`    ${id}`);
}
console.log('\n  Salin salah satu id ke LLM_MODEL di supabase/.env.local\n');
