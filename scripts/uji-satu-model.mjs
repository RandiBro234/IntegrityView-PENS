/* Uji cepat satu model dengan batas waktu ketat. */

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const isi = await readFile(resolve(AKAR, 'supabase/.env.local'), 'utf8');
const env = {};
for (const baris of isi.split(/\r?\n/)) {
  const b = baris.trim();
  if (!b || b.startsWith('#') || !b.includes('=')) continue;
  const i = b.indexOf('=');
  env[b.slice(0, i).trim()] = b.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}

const base = (env.LLM_BASE_URL || '').replace(/\/$/, '');
const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${env.LLM_API_KEY}` };
const models = process.argv.slice(2);

for (const model of models) {
  const mulai = Date.now();
  try {
    const r = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Jawab satu kata: halo' }],
        max_tokens: 50
      }),
      signal: AbortSignal.timeout(45000)
    });
    const t = await r.text();
    const detik = ((Date.now() - mulai) / 1000).toFixed(1);
    if (r.ok) {
      const j = JSON.parse(t);
      const jawab = j.choices?.[0]?.message?.content ?? '';
      console.log(`OK    ${model.padEnd(24)} ${detik}s -> "${String(jawab).trim().slice(0, 50)}"`);
    } else {
      let pesan = t;
      try {
        pesan = JSON.parse(t).error?.message ?? t;
      } catch {}
      console.log(`GAGAL ${model.padEnd(24)} ${detik}s -> ${r.status} ${String(pesan).slice(0, 130)}`);
    }
  } catch (err) {
    console.log(`ERROR ${model.padEnd(24)} -> ${err.name}: ${err.message.slice(0, 80)}`);
  }
}
