/*
 * Seed data dummy untuk 10 instrumen yang sebelumnya memakai simulasi frontend.
 *
 * Pemakaian (PowerShell, dari root project):
 *   $env:SUPABASE_URL="https://<project-ref>.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
 *   $env:RESPONDENT_HASH_PEPPER="<secret-yang-sama-dengan-edge-function>"
 *   $env:DRY_RUN="true"
 *   node scripts/seed-dummy-survei.mjs
 *
 * Opsi:
 *   DRY_RUN=true             Hanya ringkasan, tidak menulis.
 *   RESET_DUMMY=true         Hapus semua baris sumber_data='dummy' sebelum insert.
 *   PERIODS=all              Semua periode, atau daftar dipisah koma.
 *   SLUGS=all                Semua instrumen, atau daftar slug dipisah koma.
 *   OUTPUT_JSON=<path>       Tulis baris ke file JSON tanpa menyentuh database.
 *   SKIP_ASLI=true           Lewati kombinasi instrumen-periode yang sudah punya data asli.
 *   PER_INSTRUMENT_MIN=100
 *   PER_INSTRUMENT_MAX=200
 *
 * Email dummy hanya dipakai sebagai input HMAC. Email tidak disimpan dan
 * tidak pernah dikirim ke mana pun. Semua baris diberi sumber_data='dummy'.
 */

import { createHmac } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { INSTRUMENTS, slugDariNamaInstrumen } from '../frontend/src/data/instrumentConfig.js';
import { PERIODE } from '../frontend/src/data/survey/constants.js';
import { periodeDariTanggal } from '../frontend/src/data/survey/normalize.js';

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PEPPER = process.env.RESPONDENT_HASH_PEPPER || '';
const DRY_RUN = String(process.env.DRY_RUN || 'false') === 'true';
const RESET_DUMMY = String(process.env.RESET_DUMMY || 'false') === 'true';
const OUTPUT_JSON = process.env.OUTPUT_JSON || '';
const SKIP_ASLI = String(process.env.SKIP_ASLI ?? 'true') !== 'false';
const PER_MIN = Number(process.env.PER_INSTRUMENT_MIN || 100);
const PER_MAX = Number(process.env.PER_INSTRUMENT_MAX || 200);
const POOL_SIZE = Math.max(220, PER_MAX);

const SEMUA_SLUGS = [
  'spip', 'spak', 'spkp', 'gratifikasi', 'benturan', 'wbs',
  'pengaduan', 'budaya-zi', 'pens-joss', '5r'
];

const TARGET_SLUGS = String(process.env.SLUGS || 'all') === 'all'
  ? SEMUA_SLUGS
  : String(process.env.SLUGS).split(',').map((x) => x.trim()).filter(Boolean);

const RENTANG_PERIODE = {
  '2024-ganjil': ['2024-09-01T00:00:00+07:00', '2025-03-01T00:00:00+07:00'],
  '2025-genap': ['2025-03-01T00:00:00+07:00', '2025-09-01T00:00:00+07:00'],
  '2025-ganjil': ['2025-09-01T00:00:00+07:00', '2026-03-01T00:00:00+07:00'],
  '2026-genap': ['2026-03-01T00:00:00+07:00', '2026-09-01T00:00:00+07:00'],
  '2026-ganjil': ['2026-09-01T00:00:00+07:00', '2026-11-14T00:00:00+07:00']
};

const BASE = {
  spip: 3.3,
  spak: 3.2,
  spkp: 3.15,
  gratifikasi: 3.1,
  benturan: 3.05,
  wbs: 2.95,
  pengaduan: 3.1,
  'budaya-zi': 3.25,
  'pens-joss': 3.4,
  '5r': 3.0
};

const SLOPE = {
  spip: 0.06,
  spak: 0.03,
  spkp: 0.04,
  gratifikasi: 0.02,
  benturan: -0.03,
  wbs: 0.05,
  pengaduan: 0.02,
  'budaya-zi': 0.04,
  'pens-joss': 0.015,
  '5r': -0.02
};

const NAMA_DEPAN = [
  'Budi', 'Siti', 'Ahmad', 'Dewi', 'Rizky', 'Putri', 'Fajar', 'Nur',
  'Andi', 'Rina', 'Dimas', 'Ayu', 'Hendra', 'Maya', 'Yoga', 'Intan',
  'Bayu', 'Fitri', 'Arif', 'Lestari', 'Reza', 'Wulan', 'Doni', 'Sari',
  'Ilham', 'Nadia', 'Rudi', 'Mega', 'Taufik', 'Anisa', 'Eko', 'Dian',
  'Farhan', 'Ratna', 'Adit', 'Sinta', 'Hafiz', 'Ika', 'Rafi', 'Yuni'
];

const NAMA_BELAKANG = [
  'Santoso', 'Rahmawati', 'Pratama', 'Anggraini', 'Saputra', 'Wijaya',
  'Hidayat', 'Kusuma', 'Nugroho', 'Safitri', 'Firmansyah', 'Aisyah',
  'Setiawan', 'Puspita', 'Ramadhan', 'Handayani', 'Maulana', 'Oktaviani',
  'Suryanto', 'Hartono', 'Prabowo', 'Mulyani', 'Iskandar', 'Permata',
  'Syahputra', 'Andini', 'Wibowo', 'Kurniawan', 'Lestari', 'Fauziah',
  'Hakim', 'Salsabila', 'Gunawan', 'Rahayu', 'Sudrajat', 'Novitasari',
  'Herman', 'Yuliana', 'Siregar', 'Purnama'
];

const SARAN = [
  'Sosialisasi perlu dilakukan lebih rutin.',
  'Prosedur sudah jelas, mohon dipertahankan.',
  'Tingkatkan koordinasi antar unit terkait.',
  'Informasi jadwal layanan perlu lebih transparan.',
  'Sarana pendukung bisa diperbaiki secara berkala.',
  'Perlu kanal komunikasi yang lebih mudah diakses.',
  'Pelatihan bagi pegawai baru akan sangat membantu.',
  'Dokumentasi prosedur sebaiknya diperbarui.'
];

if (!PEPPER) {
  console.error('RESPONDENT_HASH_PEPPER wajib diisi.');
  process.exit(1);
}
if (!OUTPUT_JSON && !SUPABASE_URL) {
  console.error('SUPABASE_URL wajib diisi.');
  process.exit(1);
}
if (!OUTPUT_JSON && !DRY_RUN && !SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY wajib diisi untuk insert.');
  process.exit(1);
}
if (!Number.isInteger(PER_MIN) || !Number.isInteger(PER_MAX) || PER_MIN < 1 || PER_MAX < PER_MIN) {
  console.error('PER_INSTRUMENT_MIN/MAX tidak valid.');
  process.exit(1);
}
const instrumenTarget = INSTRUMENTS.filter((i) => TARGET_SLUGS.includes(i.slug));
if (instrumenTarget.length !== TARGET_SLUGS.length) {
  console.error('Ada slug instrumen target yang tidak ditemukan di instrumentConfig.js.');
  process.exit(1);
}

const periodeDipilih = String(process.env.PERIODS || 'all') === 'all'
  ? PERIODE
  : PERIODE.filter((p) => String(process.env.PERIODS).split(',').map((x) => x.trim()).includes(p.key));

if (!periodeDipilih.length) {
  console.error('PERIODS tidak cocok dengan periode yang tersedia.');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json'
};

async function combosAsli() {
  if (!SKIP_ASLI || OUTPUT_JSON || DRY_RUN) return new Set();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/survey_responses?select=nama_instrumen,created_at&sumber_data=eq.asli&limit=10000`,
    { headers }
  );
  if (!res.ok) throw new Error(`Gagal membaca data asli (HTTP ${res.status})`);
  const rows = await res.json();
  const hasil = new Set();
  rows.forEach((row) => {
    const slug = slugDariNamaInstrumen(row.nama_instrumen);
    const periode = periodeDariTanggal(row.created_at);
    if (slug && periode) hasil.add(`${slug}|${periode}`);
  });
  return hasil;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function hashEmail(email) {
  return createHmac('sha256', PEPPER)
    .update(String(email).trim().toLowerCase())
    .digest('hex');
}

function buatEmail(rng, periodeIdx, nomor) {
  const depan = NAMA_DEPAN[Math.floor(rng() * NAMA_DEPAN.length)];
  const belakang = NAMA_BELAKANG[Math.floor(rng() * NAMA_BELAKANG.length)];
  const angka = periodeIdx * 1000 + nomor + 1;
  return `${depan}.${belakang}${angka}@gmail.com`.toLowerCase();
}

function buatPool(periodeKey, periodeIdx) {
  const rng = mulberry32(20261113 + periodeIdx * 7919);
  return Array.from({ length: POOL_SIZE }, (_, i) => {
    const email = buatEmail(rng, periodeIdx, i);
    return {
      respondenHash: hashEmail(email),
      kelompok: rng() < 0.45 ? 'Dosen' : 'Tenaga Kependidikan',
      trait: gaussian(rng) * 0.6
    };
  });
}

function acak(range, rng) {
  return new Date(
    new Date(range[0]).getTime() + rng() * (new Date(range[1]).getTime() - new Date(range[0]).getTime())
  ).toISOString();
}

function sampleTanpaPengulangan(pool, jumlah, seed) {
  const rng = mulberry32(seed);
  const indeks = pool.map((_, i) => i);
  for (let i = indeks.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indeks[i], indeks[j]] = [indeks[j], indeks[i]];
  }
  return indeks.slice(0, jumlah).map((i) => pool[i]);
}

function buatBaris(instrumen, pool, periodeKey, periodeIdx, jumlah, seed) {
  const rng = mulberry32(seed);
  const orang = sampleTanpaPengulangan(pool, jumlah, seed + 17);
  const biasButir = instrumen.butir.map((_, i) => (rng() - 0.5) * 0.35 + ((i % 4) - 1.5) * 0.03);

  return orang.map((responden) => {
    const data = { Kelompok: responden.kelompok };
    const seragam = rng() < 0.035;
    const nilaiSeragam = 2 + Math.floor(rng() * 3);
    const trenPeriode = BASE[instrumen.slug] + SLOPE[instrumen.slug] * (periodeIdx - 2);

    instrumen.butir.forEach((butir, i) => {
      let nilai;
      if (seragam) {
        nilai = nilaiSeragam;
      } else {
        const skor = trenPeriode
          + responden.trait
          + biasButir[i]
          + gaussian(rng) * 0.75;
        nilai = skor < 1.85 ? 1 : skor < 2.65 ? 2 : skor < 3.45 ? 3 : 4;
      }
      data[butir.teks] = String(nilai);
    });

    if (rng() < 0.12) {
      data['Saran perbaikan'] = SARAN[Math.floor(rng() * SARAN.length)];
    }

    return {
      nama_instrumen: instrumen.nama,
      responden_hash: responden.respondenHash,
      data_jawaban: data,
      created_at: acak(RENTANG_PERIODE[periodeKey], rng),
      sumber_data: 'dummy'
    };
  });
}

async function hitungDummy() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/survey_responses?select=id&sumber_data=eq.dummy`,
    { method: 'HEAD', headers: { ...headers, Prefer: 'count=exact' } }
  );
  if (!res.ok) throw new Error(`Gagal menghitung data dummy (HTTP ${res.status})`);
  const range = res.headers.get('content-range') || '*/0';
  return Number(range.split('/')[1] || 0);
}

async function hapusDummy() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/survey_responses?sumber_data=eq.dummy`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=minimal' }
  });
  if (!res.ok) throw new Error(`Gagal menghapus data dummy (HTTP ${res.status})`);
}

async function insertBatch(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/survey_responses`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(rows)
  });
  if (!res.ok) {
    const teks = await res.text();
    throw new Error(`Gagal insert (HTTP ${res.status}): ${teks.slice(0, 300)}`);
  }
}

async function main() {
  const semuaBaris = [];
  const ringkasan = new Map();
  const dilewati = [];
  const adaAsli = await combosAsli();

  for (let pi = 0; pi < periodeDipilih.length; pi++) {
    const periode = periodeDipilih[pi];
    const periodeIdx = PERIODE.findIndex((p) => p.key === periode.key);
    if (periodeIdx < 0 || !RENTANG_PERIODE[periode.key]) {
      throw new Error(`Rentang tanggal periode ${periode.key} belum didefinisikan.`);
    }

    const pool = buatPool(periode.key, periodeIdx);
    for (let ii = 0; ii < instrumenTarget.length; ii++) {
      const instrumen = instrumenTarget[ii];
      const kunci = `${instrumen.slug}|${periode.key}`;
      if (adaAsli.has(kunci)) {
        dilewati.push(kunci);
        continue;
      }
      const seed = 20261113 + periodeIdx * 104729 + ii * 7919;
      const rng = mulberry32(seed);
      const jumlah = PER_MIN + Math.floor(rng() * (PER_MAX - PER_MIN + 1));
      const baris = buatBaris(instrumen, pool, periode.key, periodeIdx, jumlah, seed);
      semuaBaris.push(...baris);
      ringkasan.set(kunci, baris.length);
    }
  }

  console.log(`Target: ${instrumenTarget.length} instrumen x ${periodeDipilih.length} periode`);
  for (const [kunci, jumlah] of ringkasan) {
    const [slug, periode] = kunci.split('|');
    console.log(`  ${slug.padEnd(12)} ${periode}  ${jumlah} baris`);
  }
  if (dilewati.length) {
    console.log(`Dilewati karena sudah ada data asli: ${dilewati.length} kombinasi`);
    dilewati.forEach((kunci) => console.log(`  ${kunci.replace('|', ' ')}`));
  }
  console.log(`Total baris yang akan dibuat: ${semuaBaris.length}`);

  if (OUTPUT_JSON) {
    writeFileSync(OUTPUT_JSON, JSON.stringify(semuaBaris));
    console.log(`Baris ditulis ke ${OUTPUT_JSON}`);
    return;
  }

  if (DRY_RUN) {
    console.log('Mode dry-run: tidak ada perubahan yang ditulis.');
    return;
  }

  const dummyLama = await hitungDummy();
  if (dummyLama > 0 && !RESET_DUMMY) {
    throw new Error(
      `Sudah ada ${dummyLama} baris sumber_data='dummy'. ` +
      'Set RESET_DUMMY=true untuk mengganti data dummy lama.'
    );
  }
  if (RESET_DUMMY && dummyLama > 0) {
    await hapusDummy();
    console.log(`Menghapus ${dummyLama} baris dummy lama.`);
  }

  for (let i = 0; i < semuaBaris.length; i += 500) {
    await insertBatch(semuaBaris.slice(i, i + 500));
    console.log(`Insert ${Math.min(i + 500, semuaBaris.length)}/${semuaBaris.length}`);
  }

  console.log(`Selesai. ${semuaBaris.length} baris dummy ditambahkan.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
