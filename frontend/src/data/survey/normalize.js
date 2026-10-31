import {
  getInstrumen, slugDariNamaInstrumen, normalisasiKunci
} from '../instrumentConfig.js';

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
