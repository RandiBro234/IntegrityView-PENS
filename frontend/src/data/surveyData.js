import {
  INSTRUMENTS, SURVEI_INFO, SKALA, AMBANG,
  getInstrumen, slugDariNamaInstrumen, normalisasiKunci
} from './instrumentConfig.js';

/* =====================================================================
   Satu modul selector untuk seluruh aplikasi.
   Semua angka (landing, dashboard, detail, pusat survei, PDF) berasal
   dari getReportData(filter) di file ini.
   ===================================================================== */

export const PERIODE = [
  { key: '2024-ganjil', label: '2024 Ganjil', tahun: '2024', semester: 'Ganjil', rentang: 'Sep 2024–Feb 2025' },
  { key: '2025-genap', label: '2025 Genap', tahun: '2025', semester: 'Genap', rentang: 'Mar–Agu 2025' },
  { key: '2025-ganjil', label: '2025 Ganjil', tahun: '2025', semester: 'Ganjil', rentang: 'Sep 2025–Feb 2026' },
  { key: '2026-genap', label: '2026 Genap', tahun: '2026', semester: 'Genap', rentang: 'Mar–Agu 2026' },
  { key: '2026-ganjil', label: '2026 Ganjil', tahun: '2026', semester: 'Ganjil', rentang: 'Sep 2026–Feb 2027', berjalan: true }
];

export const PERIODE_AWAL = PERIODE[0].key;
export const PERIODE_DEFAULT = '2026-ganjil';

export const DEFAULT_FILTER = {
  periode: PERIODE_DEFAULT,
  pembanding: 'sebelumnya',
  kategori: 'Semua'
};

export const PILIHAN_PEMBANDING = [
  { key: 'sebelumnya', label: 'Semester sebelumnya' },
  { key: 'tanpa', label: 'Tanpa pembanding' }
];
export const PILIHAN_KATEGORI = ['Semua', 'Layanan', 'Internal'];

/* ---------------------------------------------------------------------
   Periode dari created_at (WIB, bukan UTC)
   Sep–Feb → Ganjil tahun awal; Mar–Agu → Genap tahun itu.
   --------------------------------------------------------------------- */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export function periodeDariTanggal(iso) {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  const wib = new Date(ms + WIB_OFFSET_MS);
  const tahun = wib.getUTCFullYear();
  const bulan = wib.getUTCMonth() + 1;
  if (bulan >= 9) return `${tahun}-ganjil`;
  if (bulan <= 2) return `${tahun - 1}-ganjil`;
  return `${tahun}-genap`;
}

/* ---------------------------------------------------------------------
   Normalisasi jawaban
   --------------------------------------------------------------------- */
const KOLOM_METADATA = new Set([
  'kelompok', 'email address', 'email', 'timestamp', 'nama', 'nama lengkap',
  'unit kerja', 'jabatan', 'nip', 'instansi', 'prodi'
]);

const KATA_SENSITIF = ['rp', 'juta', 'miliar', 'dugaan', 'melaporkan', 'fiktif', 'mark up', 'markup'];

export function normalisasiNilai(raw) {
  if (Array.isArray(raw)) return raw.length ? raw[0] : '';
  if (raw === null || raw === undefined) return '';
  return raw;
}

export function normalisasiKelompok(raw) {
  const k = String(normalisasiNilai(raw) || '').toLowerCase();
  if (k.includes('dosen')) return 'Dosen';
  if (k.includes('tendik') || k.includes('kependidikan') || k.includes('karyawan')) return 'Tenaga Kependidikan';
  return null;
}

export function jawabanSensitif(teks) {
  const t = String(teks || '');
  if (t.length > 300) return true;
  const kecil = t.toLowerCase();
  return KATA_SENSITIF.some((kata) => kecil.includes(kata));
}

/* Tema sederhana dari frekuensi kata kunci. Tanpa layanan AI eksternal dan
   tanpa menampilkan teks mentah. */
const KATA_KUNCI_TEMA = [
  ['sosialisasi', 'Sosialisasi'],
  ['pelatihan', 'Pelatihan'],
  ['transparan', 'Transparansi'],
  ['sop', 'Kejelasan SOP'],
  ['tindak lanjut', 'Tindak lanjut'],
  ['sarana', 'Perbaikan sarana'],
  ['fasilitas', 'Perbaikan fasilitas'],
  ['digital', 'Digitalisasi'],
  ['integritas', 'Penguatan integritas'],
  ['korupsi', 'Pencegahan korupsi'],
  ['gratifikasi', 'Pemahaman gratifikasi'],
  ['komunikasi', 'Komunikasi antar unit'],
  ['antre', 'Antrean layanan'],
  ['waktu', 'Waktu layanan']
];

export function temaTerbuka(teksList) {
  if (!teksList.length) return [];
  const hitung = new Map();
  teksList.forEach((teks) => {
    const kecil = String(teks).toLowerCase();
    KATA_KUNCI_TEMA.forEach(([kata, tema]) => {
      if (kecil.includes(kata)) hitung.set(tema, (hitung.get(tema) || 0) + 1);
    });
  });
  return [...hitung.entries()]
    .map(([tema, jumlah]) => ({ tema, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 3);
}

/* Mengembalikan { items, terbuka, kelompok, alasan }.
   items hanya bilangan bulat 1-4 dan harus tepat sebanyak butir instrumen. */
export function normalizeAnswers(slug, dataJawaban) {
  const instrumen = getInstrumen(slug);
  if (!instrumen) return { items: [], terbuka: null, kelompok: null, alasan: 'instrumen-unknown' };
  const sumber = typeof dataJawaban === 'string' ? safeParse(dataJawaban) : (dataJawaban || {});

  const perTeks = new Map();
  let kelompok = null;
  const numerikBerurutan = [];
  let terbuka = null;

  Object.entries(sumber).forEach(([pertanyaan, raw]) => {
    const kunci = String(pertanyaan).replace(/^\uFEFF/, '').trim();
    const kunciKecil = kunci.toLowerCase();
    const nilai = normalisasiNilai(raw);

    if (kunciKecil === 'kelompok') { kelompok = normalisasiKelompok(nilai); return; }
    if (KOLOM_METADATA.has(kunciKecil)) return;

    const teks = String(nilai ?? '').trim();
    if (!teks || teks === '-') return;

    if (/^-?\d+(\.\d+)?$/.test(teks)) {
      const angka = Number(teks);
      numerikBerurutan.push(angka);
      perTeks.set(normalisasiKunci(kunci), angka);
      return;
    }
    if (teks.length > 3) terbuka = terbuka || teks;
  });

  /* Cocokkan tiap butir konfigurasi lewat teks lengkap, lalu label. */
  const items = [];
  for (const butir of instrumen.butir) {
    const dariTeks = perTeks.get(normalisasiKunci(butir.teks));
    const dariLabel = perTeks.get(normalisasiKunci(butir.label));
    const nilai = dariTeks ?? dariLabel;
    if (nilai !== undefined) items.push(nilai);
  }

  /* Fallback: instrumen yang belum punya teks lengkap di konfigurasi.
     Ambil nilai numerik berurutan hanya jika jumlahnya persis cocok. */
  let hasil = items;
  if (hasil.length !== instrumen.butir.length && numerikBerurutan.length === instrumen.butir.length) {
    hasil = numerikBerurutan.slice();
  }

  if (hasil.length !== instrumen.butir.length) {
    return { items: [], terbuka, kelompok, alasan: 'jumlah-butir' };
  }
  if (hasil.some((n) => !Number.isInteger(n) || n < 1 || n > 4)) {
    return { items: [], terbuka, kelompok, alasan: 'nilai-tidak-valid' };
  }
  return { items: hasil, terbuka, kelompok, alasan: null };
}

function safeParse(teks) {
  try { return JSON.parse(teks); } catch { return {}; }
}

/* ---------------------------------------------------------------------
   Baris mentah → record ternormalisasi + dedup
   --------------------------------------------------------------------- */
export function normalisasiBaris(rows = []) {
  const records = [];
  const dibuang = {};
  const duplikat = {};

  rows.forEach((row, index) => {
    const slug = slugDariNamaInstrumen(row.nama_instrumen);
    if (!slug) return;
    const periode = periodeDariTanggal(row.created_at);
    if (!periode) return;

    const parsed = normalizeAnswers(slug, row.data_jawaban);
    if (!parsed.items.length) {
      dibuang[slug] = (dibuang[slug] || 0) + 1;
      return;
    }
    const email = row.email_responden ? String(row.email_responden).trim().toLowerCase() : null;
    records.push({
      slug,
      periode,
      email,
      respondentId: email || `row:${row.id ?? index}`,
      createdAt: row.created_at,
      items: parsed.items,
      terbuka: parsed.terbuka || null,
      kelompok: parsed.kelompok || null
    });
  });

  /* Dedup: email + instrumen + periode, simpan created_at terbaru.
     Baris tanpa email tidak pernah dianggap duplikat. */
  const peta = new Map();
  const hasil = [];
  records.forEach((rec) => {
    if (!rec.email) { hasil.push(rec); return; }
    const kunci = `${rec.email}|${rec.slug}|${rec.periode}`;
    const lama = peta.get(kunci);
    if (!lama) { peta.set(kunci, rec); hasil.push(rec); return; }
    duplikat[rec.slug] = (duplikat[rec.slug] || 0) + 1;
    if (new Date(rec.createdAt) > new Date(lama.createdAt)) {
      const idx = hasil.indexOf(lama);
      if (idx >= 0) hasil[idx] = rec;
      peta.set(kunci, rec);
    }
  });

  return { records: hasil, dibuang, duplikat };
}

/* ---------------------------------------------------------------------
   Agregasi
   --------------------------------------------------------------------- */
function rata(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

function varianSampel(arr) {
  if (arr.length < 2) return 0;
  const m = rata(arr);
  return arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1);
}

function median(arr) {
  if (!arr.length) return 0;
  const a = arr.slice().sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/* Pembulatan largest remainder agar total tepat 100%. */
export function persenLargestRemainder(counts) {
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return [0, 0, 0, 0];
  const mentah = counts.map((c) => (c / total) * 100);
  const dasar = mentah.map((v) => Math.floor(v));
  let sisa = 100 - dasar.reduce((a, b) => a + b, 0);
  const urutan = mentah
    .map((v, i) => ({ i, sisa: v - Math.floor(v) }))
    .sort((a, b) => b.sisa - a.sisa);
  for (let k = 0; k < urutan.length && sisa > 0; k++) { dasar[urutan[k].i] += 1; sisa -= 1; }
  return dasar;
}

function cronbach(rows, k) {
  if (rows.length < 2 || k < 2) return null;
  const variansButir = [];
  for (let i = 0; i < k; i++) variansButir.push(varianSampel(rows.map((r) => r.items[i])));
  const total = rows.map((r) => r.items.reduce((a, b) => a + b, 0));
  const varTotal = varianSampel(total);
  if (!varTotal) return null;
  const alpha = (k / (k - 1)) * (1 - variansButir.reduce((a, b) => a + b, 0) / varTotal);
  return Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : null;
}

function skorBaris(items) {
  return (rata(items) / 4) * 100;
}

/* Agregat satu (instrumen, periode). */
export function hitungAgregat(slug, periode, records, sumber, kualitasTambahan = {}) {
  const instrumen = getInstrumen(slug);
  if (!instrumen || !records.length) return null;
  const k = instrumen.butir.length;
  const skor = records.map((r) => skorBaris(r.items));
  const n = records.length;

  const distribusiButir = instrumen.butir.map((butir, i) => {
    const counts = [0, 0, 0, 0];
    records.forEach((r) => { counts[r.items[i] - 1] += 1; });
    const rataButir = rata(records.map((r) => r.items[i]));
    const negatif = counts[0] + counts[1];
    return {
      label: butir.label,
      teks: butir.teks,
      rata: rataButir,
      distribusi: counts,
      distribusiPersen: persenLargestRemainder(counts),
      persenSetuju: ((counts[2] + counts[3]) / n) * 100,
      persenNegatif: (negatif / n) * 100
    };
  });

  const totalCounts = [0, 0, 0, 0];
  records.forEach((r) => r.items.forEach((v) => { totalCounts[v - 1] += 1; }));
  const totalJawaban = totalCounts.reduce((a, b) => a + b, 0);

  const indeks = (records.reduce((a, r) => a + r.items.reduce((x, y) => x + y, 0), 0) / (k * 4 * n)) * 100;
  const sd = Math.sqrt(varianSampel(skor));
  const se = n >= 2 ? sd / Math.sqrt(n) : null;
  const ci = se == null ? null : { bawah: Math.max(0, indeks - 1.96 * se), atas: Math.min(100, indeks + 1.96 * se) };

  const seragam = records.filter((r) => r.items.every((v) => v === r.items[0])).length;
  const terbuka = records.filter((r) => r.terbuka).length;
  const tertahan = records.filter((r) => r.terbuka && jawabanSensitif(r.terbuka)).length;
  const tema = temaTerbuka(records
    .filter((r) => r.terbuka && !jawabanSensitif(r.terbuka))
    .map((r) => r.terbuka));

  const alpha = cronbach(records, k);

  return {
    slug,
    periode,
    sumber,
    jumlahButir: k,
    n,
    indeks,
    skorRata: indeks,
    median: median(skor),
    sd,
    se,
    ci,
    alpha,
    alphaCatatan: alpha != null && n < 30 ? 'n kecil, interpretasi hati-hati' : null,
    setuju: (totalCounts[2] + totalCounts[3]) / totalJawaban * 100,
    distribusi: totalCounts,
    distribusiPersen: persenLargestRemainder(totalCounts),
    butir: distribusiButir,
    butirTerendah: distribusiButir.reduce((a, b) => (b.rata < a.rata ? b : a), distribusiButir[0]),
    kualitas: {
      seragam: (seragam / n) * 100,
      duplikat: kualitasTambahan.duplikat || 0,
      dibuang: kualitasTambahan.dibuang || 0,
      terbuka,
      tertahan,
      tema,
      n
    },
    kelompok: (() => {
      const dosen = records.filter((r) => r.kelompok === 'Dosen').length;
      const tendik = records.filter((r) => r.kelompok === 'Tenaga Kependidikan').length;
      return dosen || tendik ? { dosen, tendik } : null;
    })()
  };
}

/* ---------------------------------------------------------------------
   Data simulasi (seed tetap) — hanya jika flag aktif
   --------------------------------------------------------------------- */
const SKENARIO = ['naik', 'naik', 'turun', 'stabil', 'naik', 'stabil', 'turun', 'naik', 'stabil', 'naik'];

function rand(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function simulasiRecords(instrumen, idx, periodeIdx) {
  const rng = rand(9001 + idx * 7919 + periodeIdx * 1543);
  const n = 60 + ((idx * 37 + periodeIdx * 53) % 121);
  const butir = instrumen.butir;
  const geser = SKENARIO[idx] === 'naik' ? (periodeIdx - 2) * 0.16
    : SKENARIO[idx] === 'turun' ? (2 - periodeIdx) * 0.26 : (periodeIdx % 2 ? -0.02 : 0.02);
  const basis = 3.05 + (idx % 3) * 0.08;

  return Array.from({ length: n }, (_, r) => {
    const kecenderungan = rng() < 0.04 ? -1.6 : (rng() + rng() + rng() - 1.5) * 0.8;
    const items = butir.map((_, bi) => {
      const target = basis + geser + kecenderungan + (rng() + rng() - 1) * 1.1 + (bi % 3) * 0.04;
      return Math.max(1, Math.min(4, Math.round(target)));
    });
    return {
      slug: instrumen.slug,
      periode: PERIODE[periodeIdx].key,
      email: null,
      respondentId: `sim:${instrumen.slug}:${PERIODE[periodeIdx].key}:${r}`,
      createdAt: null,
      items,
      terbuka: null,
      kelompok: r % 5 < 2 ? 'Dosen' : 'Tenaga Kependidikan'
    };
  });
}

/* ---------------------------------------------------------------------
   Store data nyata
   --------------------------------------------------------------------- */
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const SIMULASI_AKTIF = String(import.meta.env.VITE_ENABLE_SIMULATION ?? 'true') !== 'false';

export const store = {
  loaded: false,
  error: null,
  records: [],
  dibuang: {},
  duplikat: {},
  periodeTersedia: {},
  rlsTerbuka: false
};

/* Ambil baris mentah. Catatan: anon key saat ini masih bisa membaca baris
   mentah; migrasi SQL di supabase/migrations menyediakan RPC agregat
   sebagai jalur yang disarankan. */
export async function muatDataSurvei() {
  if (store.loaded) return store;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    store.loaded = true;
    store.error = 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi';
    return store;
  }
  try {
    const headers = { apikey: SUPABASE_KEY, Accept: 'application/json' };
    if (SUPABASE_KEY.startsWith('eyJ')) headers.Authorization = `Bearer ${SUPABASE_KEY}`;
    const kolom = 'select=id,nama_instrumen,email_responden,data_jawaban,created_at&order=created_at.desc';
    const res = await fetch(`${SUPABASE_URL}/rest/v1/survey_responses?${kolom}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status} saat membaca survey_responses`);
    const rows = await res.json();
    store.rlsTerbuka = true;
    const { records, dibuang, duplikat } = normalisasiBaris(rows);
    store.records = records;
    store.dibuang = dibuang;
    store.duplikat = duplikat;
    records.forEach((r) => {
      store.periodeTersedia[r.periode] = (store.periodeTersedia[r.periode] || 0) + 1;
    });
    store.error = null;
    /* Buang cache yang sempat dihitung dari simulasi sebelum data tiba. */
    cacheAgregat.clear();
    cacheLaporan.clear();
  } catch (err) {
    store.error = err.message;
  } finally {
    store.loaded = true;
  }
  return store;
}

/* Records untuk satu (instrumen, periode): nyata jika ada, selain itu simulasi. */
function recordsUntuk(slug, periodeKey) {
  const nyata = store.records.filter((r) => r.slug === slug && r.periode === periodeKey);
  if (nyata.length) return { records: nyata, sumber: 'real' };
  if (!SIMULASI_AKTIF) return { records: [], sumber: 'empty' };
  const idx = INSTRUMENTS.findIndex((i) => i.slug === slug);
  const pi = PERIODE.findIndex((p) => p.key === periodeKey);
  if (idx < 0 || pi < 0) return { records: [], sumber: 'empty' };
  return { records: simulasiRecords(INSTRUMENTS[idx], idx, pi), sumber: 'simulated' };
}

const cacheAgregat = new Map();
function agregat(slug, periodeKey) {
  const kunci = `${slug}|${periodeKey}`;
  if (cacheAgregat.has(kunci)) return cacheAgregat.get(kunci);
  const { records, sumber } = recordsUntuk(slug, periodeKey);
  const hasil = hitungAgregat(slug, periodeKey, records, sumber, {
    dibuang: store.dibuang[slug] || 0,
    duplikat: store.duplikat[slug] || 0
  });
  cacheAgregat.set(kunci, hasil);
  return hasil;
}

/* ---------------------------------------------------------------------
   Filter
   --------------------------------------------------------------------- */
export function normalisasiFilter(filter = {}) {
  const periode = PERIODE.some((p) => p.key === filter.periode) ? filter.periode : DEFAULT_FILTER.periode;
  const pembanding = periode === PERIODE_AWAL
    ? 'tanpa'
    : PILIHAN_PEMBANDING.some((p) => p.key === filter.pembanding)
      ? filter.pembanding
      : DEFAULT_FILTER.pembanding;
  return {
    periode,
    pembanding,
    kategori: PILIHAN_KATEGORI.includes(filter.kategori) ? filter.kategori : DEFAULT_FILTER.kategori
  };
}

export function arahPerubahan(delta) {
  if (delta == null || Number.isNaN(delta)) return null;
  const bulat = Math.round(delta * 10) / 10;
  if (bulat >= AMBANG.deltaStabil) return 'naik';
  if (bulat <= -AMBANG.deltaStabil) return 'turun';
  return 'stabil';
}

export function getDelta(aktif, pembanding) {
  if (aktif == null || pembanding == null) return null;
  return Math.round((aktif - pembanding) * 10) / 10;
}

/* ---------------------------------------------------------------------
   Rekomendasi
   --------------------------------------------------------------------- */
function rekomendasiUntuk(agregatAktif, agregatBanding, perubahanButir) {
  if (!agregatAktif) return [];
  const daftar = [];
  const k = agregatAktif.jumlahButir;

  agregatAktif.butir.forEach((b) => {
    const tinggi = b.rata < AMBANG.rataRataTinggi || b.persenNegatif >= AMBANG.negatifTinggi;
    const pantau = !tinggi && (b.rata <= AMBANG.rataRataPantau || (b.persenNegatif >= AMBANG.negatifPantau && b.persenNegatif < AMBANG.negatifTinggi));
    if (!tinggi && !pantau) return;
    daftar.push({
      prioritas: tinggi ? 'Tinggi' : 'Pantau',
      judul: `Perkuat aspek ${b.label}`,
      dasar: `rata-rata ${b.rata.toFixed(2).replace('.', ',')}, terendah dari ${k} butir`
        + (b.persenNegatif >= AMBANG.negatifPantau ? `; ${b.persenNegatif.toFixed(1).replace('.', ',')}% menjawab 1-2` : '')
    });
  });

  if (agregatBanding) {
    const delta = getDelta(agregatAktif.indeks, agregatBanding.indeks);
    const ciTidakTumpang = agregatAktif.ci && agregatBanding.ci
      && (agregatAktif.ci.bawah > agregatBanding.ci.atas || agregatBanding.ci.bawah > agregatAktif.ci.atas);
    const nCukup = agregatAktif.n >= AMBANG.respondenMinimum && agregatBanding.n >= AMBANG.respondenMinimum;
    if (nCukup && Math.abs(delta) >= AMBANG.perubahanBermakna && ciTidakTumpang) {
      const turun = perubahanButir.find((x) => x.delta != null && x.delta < 0);
      daftar.push({
        prioritas: delta < 0 ? 'Tinggi' : 'Pantau',
        judul: delta < 0
          ? `Telusuri penurunan skor ${agregatAktif.slug}`
          : 'Pertahankan praktik yang berjalan',
        dasar: `selisih ${Math.abs(delta).toFixed(1).replace('.', ',')} poin`
          + (turun ? `; penurunan terbesar pada ${turun.label}` : '')
      });
    }
    if (!nCukup) {
      daftar.push({
        prioritas: 'Sedang',
        judul: 'Perbandingan belum dapat diandalkan',
        dasar: `n ${agregatAktif.n} dan ${agregatBanding.n}; minimum ${AMBANG.respondenMinimum} per semester`
      });
    }
  }

  const urutan = { Tinggi: 0, Sedang: 1, Pantau: 2 };
  daftar.sort((a, b) => urutan[a.prioritas] - urutan[b.prioritas]);
  return daftar;
}

/* Jumlah responden satu periode: email distinct lintas instrumen, baris tanpa
   email dihitung satu per baris, ditambah baris simulasi bila dipakai. */
function jumlahResponden(periodeKey, slugs) {
  const set = new Set(slugs);
  const emailSet = new Set();
  let tanpaEmail = 0;
  store.records.forEach((r) => {
    if (r.periode !== periodeKey || !set.has(r.slug)) return;
    if (r.email) emailSet.add(r.email);
    else tanpaEmail += 1;
  });
  let simulasi = 0;
  slugs.forEach((slug) => {
    const { records, sumber } = recordsUntuk(slug, periodeKey);
    if (sumber === 'simulated') simulasi += records.length;
  });
  return emailSet.size + tanpaEmail + simulasi;
}

/* ---------------------------------------------------------------------
   Selector utama
   --------------------------------------------------------------------- */
const cacheLaporan = new Map();

export function getReportData(pilihan = DEFAULT_FILTER) {
  const filter = normalisasiFilter(pilihan);
  const kunci = `${filter.periode}|${filter.pembanding}|${filter.kategori}|${store.loaded}|${store.records.length}`;
  if (cacheLaporan.has(kunci)) return cacheLaporan.get(kunci);

  const idxPeriode = PERIODE.findIndex((p) => p.key === filter.periode);
  const idxBanding = filter.pembanding === 'tanpa' ? -1 : idxPeriode - 1;
  const periode = PERIODE[idxPeriode];
  const periodePembanding = PERIODE[idxBanding] || null;

  const daftar = INSTRUMENTS.filter((i) => filter.kategori === 'Semua' || i.kelompok === filter.kategori);

  const instrumen = daftar.map((info) => {
    const aktif = agregat(info.slug, periode.key);
    const banding = periodePembanding ? agregat(info.slug, periodePembanding.key) : null;
    const perubahanButir = aktif
      ? aktif.butir.map((b, i) => {
        const sebelum = banding?.butir[i];
        return {
          label: b.label,
          teks: b.teks,
          rata: b.rata,
          skor: (b.rata / 4) * 100,
          sebelumnya: sebelum ? (sebelum.rata / 4) * 100 : null,
          delta: sebelum ? Math.round(((b.rata - sebelum.rata) / 4) * 1000) / 10 : null
        };
      }).sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))
      : [];

    const tren = PERIODE.map((p, i) => {
      const a = agregat(info.slug, p.key);
      const sebelum = i > 0 ? agregat(info.slug, PERIODE[i - 1].key) : null;
      return {
        ...p,
        indeks: a ? a.indeks : null,
        n: a ? a.n : 0,
        sumber: a ? a.sumber : 'empty',
        deltaSemester: a && sebelum ? getDelta(a.indeks, sebelum.indeks) : null
      };
    });

    return {
      info: {
        key: info.slug,
        nama: info.nama,
        namaPanjang: info.namaPanjang,
        kategori: info.kategori,
        kelompok: info.kelompok,
        jumlahButir: info.butir.length,
        url: info.url,
        requiresGoogleLogin: info.requiresGoogleLogin
      },
      aktif,
      pembanding: banding,
      delta: aktif && banding ? getDelta(aktif.indeks, banding.indeks) : null,
      perubahanButir,
      sebaranButir: aktif ? aktif.butir.map((b) => ({
        nama: b.teks,
        label: b.label,
        rata: b.rata,
        distribusiAbsolut: b.distribusi,
        distribusiPersen: b.distribusiPersen,
        persenSetuju: b.persenSetuju,
        n: aktif.n
      })) : [],
      rekomendasi: rekomendasiUntuk(aktif, banding, perubahanButir),
      tren
    };
  });

  const valid = instrumen.filter((s) => s.aktif);
  const validBanding = instrumen.filter((s) => s.pembanding);

  const indeksRata = valid.length ? rata(valid.map((s) => s.aktif.indeks)) : null;
  const indeksBanding = validBanding.length ? rata(validBanding.map((s) => s.pembanding.indeks)) : null;
  const seGabungan = valid.length
    ? Math.sqrt(valid.reduce((a, s) => a + (s.aktif.se || 0) ** 2, 0)) / valid.length
    : null;
  const ciRingkasan = seGabungan == null ? null : {
    bawah: Math.max(0, indeksRata - 1.96 * seGabungan),
    atas: Math.min(100, indeksRata + 1.96 * seGabungan)
  };

  /* Responden: email distinct lintas instrumen + baris tanpa email + simulasi. */
  const semuaSlug = daftar.map((i) => i.slug);
  const responden = jumlahResponden(periode.key, semuaSlug);
  const respondenBanding = periodePembanding
    ? jumlahResponden(periodePembanding.key, semuaSlug)
    : null;

  const sebaran = valid.map((s) => ({
    key: s.info.key,
    nama: s.info.nama,
    namaPanjang: s.info.namaPanjang,
    sumber: s.aktif.sumber,
    n: s.aktif.n,
    indeks: s.aktif.indeks,
    distribusiAbsolut: s.aktif.distribusi,
    distribusiPersen: s.aktif.distribusiPersen,
    delta: s.delta,
    deltaArah: arahPerubahan(s.delta)
  })).sort((a, b) => a.indeks - b.indeks);

  const kategoriSkor = [...new Set(daftar.map((i) => i.kategori))].map((kategori) => {
    const items = valid.filter((s) => s.info.kategori === kategori);
    if (!items.length) return null;
    const nilai = rata(items.map((s) => s.aktif.indeks));
    const bandingItems = items.filter((s) => s.pembanding);
    const sebelum = bandingItems.length ? rata(bandingItems.map((s) => s.pembanding.indeks)) : null;
    return { kategori, skor: nilai, delta: sebelum == null ? null : getDelta(nilai, sebelum) };
  }).filter(Boolean);

  const simulasiTerpakai = valid.filter((s) => s.aktif.sumber === 'simulated').length;
  const realTerpakai = valid.filter((s) => s.aktif.sumber === 'real').length;

  const hasil = {
    filter,
    periode,
    periodePembanding,
    instrumen,
    sebaran,
    kategoriSkor,
    simulasiTerpakai,
    realTerpakai,
    memakaiSimulasi: simulasiTerpakai > 0,
    loading: !store.loaded,
    error: store.error,
    ringkasan: {
      totalInstrumen: valid.length,
      deltaInstrumen: periodePembanding ? valid.length - validBanding.length : null,
      kelompok: {
        layanan: valid.filter((s) => s.info.kelompok === 'Layanan').map((s) => s.info.nama),
        internal: valid.filter((s) => s.info.kelompok === 'Internal').map((s) => s.info.nama)
      },
      responden: {
        total: responden,
        dosen: valid.reduce((a, s) => a + (s.aktif.kelompok?.dosen || 0), 0),
        tendik: valid.reduce((a, s) => a + (s.aktif.kelompok?.tendik || 0), 0),
        adaKelompok: valid.some((s) => s.aktif.kelompok)
      },
      deltaResponden: respondenBanding == null ? null : responden - respondenBanding,
      rataSkor: indeksRata,
      delta: indeksBanding == null || indeksRata == null ? null : getDelta(indeksRata, indeksBanding),
      ci: ciRingkasan,
      simulasiTerpakai,
      realTerpakai
    },
    perubahanTerbesar: {
      naik: [...instrumen].filter((s) => s.delta != null).sort((a, b) => b.delta - a.delta)[0] || null,
      turun: [...instrumen].filter((s) => s.delta != null).sort((a, b) => a.delta - b.delta)[0] || null
    }
  };

  cacheLaporan.set(kunci, hasil);
  return hasil;
}

/* Ringkasan untuk landing/auth/pusat survei — sumber sama. */
export function getRingkasanPublik(filter = DEFAULT_FILTER) {
  return getReportData({ ...filter, kategori: 'Semua' });
}

export { INSTRUMENTS, SURVEI_INFO, SKALA, AMBANG, getInstrumen };

