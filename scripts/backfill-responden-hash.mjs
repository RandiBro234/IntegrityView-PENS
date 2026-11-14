/*
 * Backfill responden_hash + sanitasi data_jawaban lama.
 *
 * Jalankan SETELAH migrasi 20261109000000_privasi_email_responden.sql:
 *
 *   $env:SUPABASE_URL="https://<project-ref>.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
 *   $env:RESPONDENT_HASH_PEPPER="<secret-acak-panjang>"
 *   node scripts/backfill-responden-hash.mjs
 *
 * Opsional:
 *   $env:HAPUS_EMAIL="true"   # kosongkan email_responden setelah hash dibuat
 *   $env:DRY_RUN="true"       # hanya hitung, tidak menulis
 *
 * Script ini memakai service_role dan TIDAK boleh dijalankan di browser.
 * Jangan pernah commit nilai secret ke repo.
 */

import { createHmac } from 'node:crypto';

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PEPPER = process.env.RESPONDENT_HASH_PEPPER || '';
const HAPUS_EMAIL = String(process.env.HAPUS_EMAIL || 'false') === 'true';
const DRY_RUN = String(process.env.DRY_RUN || 'false') === 'true';
const PAGE = 500;

if (!SUPABASE_URL || !SERVICE_KEY || !PEPPER) {
  console.error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan RESPONDENT_HASH_PEPPER wajib diisi.');
  process.exit(1);
}
if (PEPPER.length < 32) {
  console.warn('Peringatan: RESPONDENT_HASH_PEPPER sebaiknya minimal 32 karakter acak.');
}

const KOLOM_EMAIL = new Set([
  'email',
  'email address',
  'alamat email',
  'email responden',
  'surel',
  'respondent email',
  '__respondent_email'
]);

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json'
};

function hashEmail(email) {
  return createHmac('sha256', PEPPER)
    .update(String(email).trim().toLowerCase())
    .digest('hex');
}

function kunciEmail(kunci) {
  const bersih = String(kunci).replace(/^\uFEFF/, '').trim().toLowerCase();
  return KOLOM_EMAIL.has(bersih) || bersih.includes('email');
}

function sanitasiDataJawaban(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  return Object.fromEntries(
    Object.entries(data).filter(([kunci]) => !kunciEmail(kunci))
  );
}

async function ambilHalaman(offset) {
  const query = [
    'select=id,email_responden,data_jawaban',
    'order=id.asc',
    `limit=${PAGE}`,
    `offset=${offset}`
  ].join('&');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/survey_responses?${query}`, { headers });
  if (!res.ok) {
    const teks = await res.text();
    throw new Error(`Gagal membaca baris (HTTP ${res.status}): ${teks.slice(0, 300)}`);
  }
  return res.json();
}

async function perbarui(id, patch) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/survey_responses?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(patch)
  });
  if (!res.ok) {
    const teks = await res.text();
    throw new Error(`Gagal update id=${id} (HTTP ${res.status}): ${teks.slice(0, 300)}`);
  }
}

async function main() {
  let offset = 0;
  let total = 0;
  let berhash = 0;
  let sanitasi = 0;

  for (;;) {
    const rows = await ambilHalaman(offset);
    if (!Array.isArray(rows) || rows.length === 0) break;

    for (const row of rows) {
      const email = row.email_responden ? String(row.email_responden).trim() : '';
      const patch = {
        data_jawaban: sanitasiDataJawaban(row.data_jawaban)
      };
      if (email) {
        patch.responden_hash = hashEmail(email);
        berhash += 1;
        if (HAPUS_EMAIL) patch.email_responden = null;
      }
      if (Object.keys(patch.data_jawaban).length !== Object.keys(row.data_jawaban || {}).length) {
        sanitasi += 1;
      }

      if (!DRY_RUN) await perbarui(row.id, patch);
      total += 1;
    }

    offset += rows.length;
    if (rows.length < PAGE) break;
  }

  console.log(`Selesai. Diproses: ${total}, hash dibuat: ${berhash}, data disanitasi: ${sanitasi}.`);
  if (DRY_RUN) console.log('Mode dry-run: tidak ada perubahan yang ditulis.');
  if (HAPUS_EMAIL && !DRY_RUN) {
    console.log('email_responden sudah dikosongkan. Kolom dapat di-drop setelah verifikasi.');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
