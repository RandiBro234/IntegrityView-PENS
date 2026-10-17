import { useEffect, useState } from 'react';
import { INSTRUMEN_DATASET, SURVEI_INFO } from './mock';

export const API_BASE =
  (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:8000';

/* Skala Likert yang dipakai instrumen: 1 = Sangat Tidak Setuju ... 4 = Sangat Setuju. */
const SKALA_MAKS = 4;

/* Kolom metadata yang tidak diperlakukan sebagai butir pertanyaan. */
const KOLOM_METADATA = new Set([
  'timestamp', 'email address', 'email', 'kelompok', 'nama', 'nama lengkap',
  'unit kerja', 'jabatan', 'nip', 'instansi', 'prodi'
]);

/* ================= Pemetaan nama instrumen -> key internal ================= */

function normalisasiKunci(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const ALIAS = {
  spak: 'spak',
  surveipersepsiantikorupsi: 'spak',
  spkp: 'spkp',
  surveipersepsikualitaspelayanan: 'spkp',
  pengaduan: 'pengaduan',
  pengaduanmasyarakat: 'pengaduan',
  spip: 'spip',
  surveipenilaianinternalspip: 'spip',
  gratifikasi: 'gratifikasi',
  surveipemahamangratifikasi: 'gratifikasi',
  benturan: 'benturan',
  benturankepentingan: 'benturan',
  surveibenturankepentingan: 'benturan',
  wbs: 'wbs',
  whistleblowingsystem: 'wbs',
  budayazi: 'budaya-zi',
  surveibudayazona: 'budaya-zi',
  surveibudayazonaintegritas: 'budaya-zi',
  pensjoss: 'pens-joss',
  surveilayananpensjoss: 'pens-joss',
  '5r': '5r',
  surveiimplementasi5r: '5r'
};

export function keyFromInstrumen(nama) {
  const n = normalisasiKunci(nama);
  if (!n) return null;
  if (ALIAS[n]) return ALIAS[n];
  const info = SURVEI_INFO.find(
    (s) => normalisasiKunci(s.key) === n
      || normalisasiKunci(s.nama) === n
      || normalisasiKunci(s.namaPanjang) === n
  );
  return info ? info.key : null;
}

/* ================= Parsing JSONB ================= */

function ambilNilai(nilai) {
  if (Array.isArray(nilai)) return nilai.length ? nilai[0] : '';
  if (nilai === null || nilai === undefined) return '';
  return nilai;
}

function amanParseJSON(teks) {
  try {
    return JSON.parse(teks);
  } catch {
    return {};
  }
}

/* Pisahkan jawaban menjadi data numerik (Likert) dan data teks (saran/masukan). */
export function parseJawaban(dataJawaban) {
  const sumber = typeof dataJawaban === 'string' ? amanParseJSON(dataJawaban) : (dataJawaban || {});
  const numerik = {};
  const teks = [];
  let kelompok = null;

  Object.entries(sumber).forEach(([pertanyaan, raw]) => {
    const kunci = String(pertanyaan).trim().toLowerCase();
    const nilai = ambilNilai(raw);

    if (kunci === 'kelompok') {
      kelompok = String(nilai).trim() || null;
      return;
    }
    if (KOLOM_METADATA.has(kunci)) return;

    const teksNilai = String(nilai).trim();
    if (!teksNilai) return;

    /* Numerik: Likert 1-5. */
    const numerikMurni = /^-?\d+(\.\d+)?$/.test(teksNilai);
    if (numerikMurni) {
      numerik[String(pertanyaan).trim()] = Number(teksNilai);
      return;
    }

    /* Teks: masukan/saran dengan panjang memadai. */
    if (teksNilai.length > 5) {
      teks.push({ pertanyaan: String(pertanyaan).trim(), teks: teksNilai });
    }
  });

  return { numerik, teks, kelompok };
}

/* ================= Tema komentar ================= */

const KATA_KUNCI = [
  ['sosialisasi', 'Perlu sosialisasi'],
  ['pelatihan', 'Pelatihan perlu rutin'],
  ['transparan', 'Transparansi layanan'],
  ['sop', 'Kejelasan SOP'],
  ['tindak lanjut', 'Tindak lanjut laporan'],
  ['sarana', 'Perbaikan sarana'],
  ['fasilitas', 'Perbaikan fasilitas'],
  ['digital', 'Digitalisasi proses'],
  ['integritas', 'Penguatan integritas'],
  ['korupsi', 'Pencegahan korupsi'],
  ['gratifikasi', 'Pemahaman gratifikasi'],
  ['komunikasi', 'Komunikasi antar unit'],
  ['website', 'Perbaikan kanal digital'],
  ['anonim', 'Keraguan kerahasiaan'],
  ['waktu', 'Waktu layanan']
];

function ekstrakTema(komentar) {
  if (!komentar.length) return [];
  const hitung = new Map();
  komentar.forEach((teks) => {
    const t = teks.toLowerCase();
    KATA_KUNCI.forEach(([kata, tema]) => {
      if (t.includes(kata)) hitung.set(tema, (hitung.get(tema) || 0) + 1);
    });
  });
  return Array.from(hitung.entries())
    .map(([tema, jumlah]) => ({ tema, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 3);
}

/* ================= Penyusun dataset ================= */

function rataArray(arr) {
  if (!arr.length) return null;
  return Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
}

function kelompokTeks(kelompok) {
  const k = String(kelompok || '').toLowerCase();
  if (k.includes('dosen')) return 'dosen';
  if (k.includes('tendik') || k.includes('kependidikan') || k.includes('karyawan')) return 'tendik';
  return null;
}

/* Ubah baris API menjadi dataset dengan bentuk sama seperti INSTRUMEN_DATASET.
   Instrumen tanpa data riil tetap memakai dataset simulasi sebagai fallback. */
export function buildDataset(rows) {
  const dataset = {};
  Object.keys(INSTRUMEN_DATASET).forEach((k) => { dataset[k] = INSTRUMEN_DATASET[k]; });

  const grup = {};

  (rows || []).forEach((row) => {
    const key = keyFromInstrumen(row.nama_instrumen);
    if (!key) return;

    const parsed = parseJawaban(row.data_jawaban);
    if (!grup[key]) {
      grup[key] = {
        pertanyaan: {}, total: 0, dosen: 0, tendik: 0,
        komentar: [], signatures: new Set(), signaturesWithDup: 0
      };
    }
    const g = grup[key];
    g.total += 1;

    const kelompok = kelompokTeks(parsed.kelompok);
    if (kelompok === 'dosen') g.dosen += 1;
    else if (kelompok === 'tendik') g.tendik += 1;

    const semuaJawaban = [
      ...Object.entries(parsed.numerik).map(([q, v]) => [q, String(v)]),
      ...parsed.teks.map((t) => [t.pertanyaan, t.teks])
    ];
    if (semuaJawaban.length) {
      const sig = semuaJawaban
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([, v]) => v)
        .join('|');
      if (g.signatures.has(sig)) g.signaturesWithDup += 1;
      else g.signatures.add(sig);
    }

    Object.entries(parsed.numerik).forEach(([pertanyaan, nilai]) => {
      const skor = Math.min(SKALA_MAKS, Math.max(1, Math.round(nilai)));
      if (!g.pertanyaan[pertanyaan]) {
        g.pertanyaan[pertanyaan] = { distribusi: [0, 0, 0, 0], dosen: [], tendik: [] };
      }
      const p = g.pertanyaan[pertanyaan];
      p.distribusi[skor - 1] += 1;
      if (kelompok === 'dosen') p.dosen.push(skor);
      else if (kelompok === 'tendik') p.tendik.push(skor);
    });

    parsed.teks.forEach((t) => g.komentar.push(t.teks));
  });

  Object.entries(grup).forEach(([key, g]) => {
    const info = SURVEI_INFO.find((s) => s.key === key);

    const butir = Object.entries(g.pertanyaan).map(([nama, p]) => {
      const n = p.distribusi.reduce((a, b) => a + b, 0);
      const rata = n
        ? (p.distribusi[0] * 1 + p.distribusi[1] * 2 + p.distribusi[2] * 3 + p.distribusi[3] * 4) / n
        : 0;
      const rataDosen = rataArray(p.dosen);
      const rataTendik = rataArray(p.tendik);
      return {
        nama,
        rata: Number(rata.toFixed(2)),
        distribusi: p.distribusi,
        kelompok: {
          dosen: rataDosen !== null ? rataDosen : Number(rata.toFixed(2)),
          tendik: rataTendik !== null ? rataTendik : Number(rata.toFixed(2))
        }
      };
    });

    if (!butir.length) return;

    dataset[key] = {
      key,
      sumber: 'riil',
      kelompokInstrumen: info ? info.kelompok : 'Internal',
      responden: { total: g.total, dosen: g.dosen, tendik: g.tendik },
      butir,
      komentarTema: ekstrakTema(g.komentar),
      komentar: g.komentar,
      duplikat: g.signaturesWithDup
    };
  });

  return dataset;
}

/* ================= API call & hook ================= */

export async function fetchSurvei() {
  const res = await fetch(`${API_BASE}/api/survei`);
  if (!res.ok) {
    throw new Error(`Gagal memuat data survei (HTTP ${res.status})`);
  }
  return res.json();
}

/* Hook: ambil data dari API, parsing, lalu kembalikan dataset siap pakai.
   Bila backend tidak tersedia, otomatis jatuh ke dataset simulasi. */
export function useSurveiData() {
  const [state, setState] = useState({ dataset: null, loading: true, error: null, fallback: false });

  useEffect(() => {
    let aktif = true;
    (async () => {
      try {
        const rows = await fetchSurvei();
        if (!aktif) return;
        setState({ dataset: buildDataset(rows), loading: false, error: null, fallback: false });
      } catch (err) {
        if (!aktif) return;
        setState({
          dataset: { ...INSTRUMEN_DATASET },
          loading: false,
          error: err,
          fallback: true
        });
      }
    })();
    return () => { aktif = false; };
  }, []);

  return state;
}
