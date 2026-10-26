import { SURVEI_INFO, INSTRUMEN_DATASET } from './mock.js';

/* Lima semester berurutan. `rentang` hanya tampil di tooltip.
   Tidak memakai singkatan S1/S2 di antarmuka. */
export const PERIODE = [
  { key: '2024-ganjil', label: '2024 Ganjil', tahun: '2024', semester: 'Ganjil', rentang: 'Sep 2024–Feb 2025' },
  { key: '2025-genap', label: '2025 Genap', tahun: '2025', semester: 'Genap', rentang: 'Mar–Agu 2025' },
  { key: '2025-ganjil', label: '2025 Ganjil', tahun: '2025', semester: 'Ganjil', rentang: 'Sep 2025–Feb 2026' },
  { key: '2026-genap', label: '2026 Genap', tahun: '2026', semester: 'Genap', rentang: 'Mar–Agu 2026' },
  { key: '2026-ganjil', label: '2026 Ganjil', tahun: '2026', semester: 'Ganjil', rentang: 'Sep 2026–Feb 2027', berjalan: true }
];

export const PERIODE_AWAL = PERIODE[0].key;

export const DEFAULT_FILTER = {
  periode: '2026-ganjil',
  pembanding: 'sebelumnya',
  kelompok: 'Semua',
  kategori: 'Semua'
};

export const PILIHAN_PEMBANDING = [
  { key: 'sebelumnya', label: 'Semester sebelumnya' },
  { key: 'tanpa', label: 'Tanpa pembanding' }
];
export const PILIHAN_KELOMPOK = ['Semua', 'Dosen', 'Tenaga Kependidikan'];
export const PILIHAN_KATEGORI = ['Semua', 'Layanan', 'Internal'];

/* Satu ambang untuk seluruh aplikasi: 0,5 poin. */
export const AMBANG_PERUBAHAN = 0.5;

/* Satu-satunya aturan arah perubahan skor antar semester.
   Nilai dibulatkan ke 1 desimal lebih dulu agar angka yang tampil
   (mis. "0,5") selalu konsisten dengan warnanya.
   Dipakai oleh kartu, panel sebaran, heatmap, halaman detail, dan PDF. */
export function arahPerubahan(delta) {
  if (delta == null || Number.isNaN(delta)) return null;
  const bulat = Math.round(delta * 10) / 10;
  if (bulat >= AMBANG_PERUBAHAN) return 'naik';
  if (bulat <= -AMBANG_PERUBAHAN) return 'turun';
  return 'stabil';
}

export function labelArah(delta) {
  const arah = arahPerubahan(delta);
  if (arah === 'naik') return 'naik';
  if (arah === 'turun') return 'turun';
  return 'stabil';
}

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
    kelompok: PILIHAN_KELOMPOK.includes(filter.kelompok) ? filter.kelompok : DEFAULT_FILTER.kelompok,
    kategori: PILIHAN_KATEGORI.includes(filter.kategori) ? filter.kategori : DEFAULT_FILTER.kategori
  };
}

function randomGenerator(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/* Skenario per instrumen agar perbandingan bermakna:
   sebagian naik bertahap, dua turun, sisanya stabil. */
const SKENARIO = ['naik', 'naik', 'turun', 'stabil', 'naik', 'stabil', 'turun', 'naik', 'stabil', 'naik'];

/* Jumlah responden bervariasi per semester dan per instrumen. */
function jumlahResponden(idx, pi, key, periodeKey) {
  /* SPAK 2026 Ganjil = data riil 165 responden, 6 butir (pengisian Sep 2026). */
  if (key === 'spak' && periodeKey === '2026-ganjil') return 165;
  const dasar = 60 + ((idx * 37 + pi * 53) % 121);
  return dasar;
}

/* Setiap baris adalah seorang responden. Kecenderungan bersama membuat
   jawaban antarbutir saling berkorelasi. */
export const JAWABAN_PERIODE = Object.fromEntries(SURVEI_INFO.map((info, idx) => {
  const semuaButir = INSTRUMEN_DATASET[info.key].butir;
  const butir = info.key === 'spak' ? semuaButir.slice(0, 6) : semuaButir;
  const kumpulan = Object.fromEntries(PERIODE.map((periode, pi) => {
    const rand = randomGenerator(40121 + idx * 7919 + pi * 1543);
    const n = jumlahResponden(idx, pi, info.key, periode.key);
    const geser = SKENARIO[idx] === 'naik'
      ? (pi - 2) * 0.18
      : SKENARIO[idx] === 'turun'
        ? (2 - pi) * 0.3
        : (pi % 2 ? -0.02 : 0.02);
    const riil = info.key === 'spak' && periode.key === '2026-ganjil';
    const jawaban = Array.from({ length: n }, (_, r) => {
      const peran = r % 5 < 2 ? 'Dosen' : 'Tenaga Kependidikan';
      const kecenderungan = rand() < 0.035 ? -1.7 : (rand() + rand() + rand() - 1.5) * 0.85;
      return {
        id: `${info.key}-${periode.key}-${r}`,
        peran,
        nilai: butir.map((b) => {
          const target = b.rata + geser + kecenderungan + (rand() + rand() - 1) * 1.2;
          return Math.max(1, Math.min(4, Math.round(target)));
        })
      };
    });
    return [periode.key, {
      sumber: riil ? 'riil' : 'simulasi',
      butir: butir.map((b) => b.nama),
      jawaban
    }];
  }));
  return [info.key, kumpulan];
}));

function interval95(nilai) {
  if (!nilai.length) return { bawah: 0, atas: 0 };
  const rata = nilai.reduce((a, b) => a + b, 0) / nilai.length;
  const varian = nilai.length > 1 ? nilai.reduce((a, b) => a + (b - rata) ** 2, 0) / (nilai.length - 1) : 0;
  const margin = 1.96 * Math.sqrt(varian / nilai.length);
  return { bawah: Math.max(0, rata - margin), atas: Math.min(100, rata + margin) };
}

function alphaCronbach(baris, banyak) {
  if (baris.length < 2 || banyak < 2) return 0;
  const variasi = (nilai) => {
    const rata = nilai.reduce((a, b) => a + b, 0) / nilai.length;
    return nilai.reduce((a, b) => a + (b - rata) ** 2, 0) / (nilai.length - 1);
  };
  const total = variasi(baris.map((r) => r.nilai.reduce((a, b) => a + b, 0)));
  if (!total) return 0;
  const butir = Array.from({ length: banyak }, (_, i) => variasi(baris.map((r) => r.nilai[i])));
  return Math.max(0, Math.min(1, banyak / (banyak - 1) * (1 - butir.reduce((a, b) => a + b, 0) / total)));
}

const cacheStatistik = new Map();

export function statistikPeriode(key, periode, kelompok = 'Semua') {
  const cacheKey = `${key}/${periode}/${kelompok}`;
  if (cacheStatistik.has(cacheKey)) return cacheStatistik.get(cacheKey);
  const data = JAWABAN_PERIODE[key]?.[periode];
  if (!data) return null;
  const baris = kelompok === 'Semua' ? data.jawaban : data.jawaban.filter((r) => r.peran === kelompok);
  if (baris.length < 5) { cacheStatistik.set(cacheKey, null); return null; }
  const jumlah = baris.length;
  const banyak = data.butir.length;
  const skorResponden = baris.map((r) => r.nilai.reduce((a, b) => a + b, 0) / banyak * 25);
  const skor = skorResponden.reduce((a, b) => a + b, 0) / jumlah;
  const distribusiTotal = [0, 0, 0, 0];
  const butir = data.butir.map((nama, i) => {
    const distribusi = [0, 0, 0, 0];
    baris.forEach((r) => { distribusi[r.nilai[i] - 1]++; distribusiTotal[r.nilai[i] - 1]++; });
    const rata = distribusi.reduce((sum, n, v) => sum + n * (v + 1), 0) / jumlah;
    const dosen = baris.filter((r) => r.peran === 'Dosen').map((r) => r.nilai[i]);
    const tendik = baris.filter((r) => r.peran === 'Tenaga Kependidikan').map((r) => r.nilai[i]);
    const rataKelompok = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : rata);
    return {
      nama,
      rata,
      skor: rata * 25,
      distribusi,
      kelompok: { dosen: rataKelompok(dosen), tendik: rataKelompok(tendik) }
    };
  });
  const totalJawaban = jumlah * banyak;
  const responden = {
    total: jumlah,
    dosen: baris.filter((r) => r.peran === 'Dosen').length,
    tendik: baris.filter((r) => r.peran === 'Tenaga Kependidikan').length
  };
  const hasil = {
    key,
    periode,
    sumber: data.sumber,
    responden,
    jumlahResponden: jumlah,
    butir,
    skor,
    ci: interval95(skorResponden),
    alpha: alphaCronbach(baris, banyak),
    distribusiTotal,
    persenSetuju: (distribusiTotal[2] + distribusiTotal[3]) / totalJawaban * 100,
    median: [...skorResponden].sort((a, b) => a - b)[Math.floor(jumlah / 2)],
    simpanganBaku: Math.sqrt(skorResponden.reduce((a, b) => a + (b - skor) ** 2, 0) / Math.max(1, jumlah - 1)),
    persenSeragam: baris.filter((r) => r.nilai.every((n) => n === r.nilai[0])).length / jumlah * 100,
    duplikat: jumlah - new Set(baris.map((r) => r.id)).size
  };
  cacheStatistik.set(cacheKey, hasil);
  return hasil;
}

export function selisih(aktif, pembanding) {
  return aktif == null || pembanding == null ? null : aktif - pembanding;
}

function intervalTerpisah(a, b) {
  return a.ci.bawah > b.ci.atas || b.ci.bawah > a.ci.atas;
}

function rekomendasiPeriode(aktif, pembanding, perubahanButir, namaPembanding) {
  if (!aktif) return [];
  const hasil = [];
  if (pembanding) {
    const beda = aktif.skor - pembanding.skor;
    const butirTurun = perubahanButir.find((b) => b.delta != null && b.delta < 0);
    const dasar = `Selisih ${Math.abs(beda).toFixed(1).replace('.', ',')} poin dibanding ${namaPembanding}`
      + (butirTurun ? `; butir turun terbesar: ${butirTurun.nama}` : '') + '.';
    /* Rekomendasi berbasis perubahan hanya jika >= 2 poin dan CI tidak tumpang tindih. */
    if (Math.abs(beda) >= 2 && intervalTerpisah(aktif, pembanding)) {
      hasil.push({
        prioritas: beda < 0 ? 'Tinggi' : 'Pantau',
        teks: beda < 0
          ? `Telusuri penurunan skor dibanding ${namaPembanding}`
          : `Pertahankan kenaikan skor dibanding ${namaPembanding}`,
        dasar
      });
    }
    if (aktif.jumlahResponden < 30 || pembanding.jumlahResponden < 30) {
      hasil.push({
        prioritas: 'Sedang',
        teks: 'Perbandingan belum dapat diandalkan',
        dasar: 'Jumlah responden pada salah satu semester di bawah 30.'
      });
    }
  }
  const terendah = [...aktif.butir].sort((a, b) => a.skor - b.skor)[0];
  if (terendah) {
    hasil.push({
      prioritas: 'Pantau',
      teks: `Tinjau aspek ${terendah.nama}`,
      dasar: `Indeks butir ${terendah.skor.toFixed(1).replace('.', ',')}%.`
    });
  }
  return hasil;
}

const cacheLaporan = new Map();

export function getReportData(pilihan = DEFAULT_FILTER) {
  const filter = normalisasiFilter(pilihan);
  const cacheKey = Object.values(filter).join('/');
  if (cacheLaporan.has(cacheKey)) return cacheLaporan.get(cacheKey);

  const indeks = PERIODE.findIndex((p) => p.key === filter.periode);
  const pembandingIndex = filter.pembanding === 'tanpa' ? -1 : indeks - 1;
  const periode = PERIODE[indeks];
  const periodePembanding = PERIODE[pembandingIndex] || null;

  const daftar = SURVEI_INFO.filter((s) => filter.kategori === 'Semua' || s.kelompok === filter.kategori);

  const instrumen = daftar.map((info) => {
    const aktif = statistikPeriode(info.key, periode.key, filter.kelompok);
    const pembanding = periodePembanding
      ? statistikPeriode(info.key, periodePembanding.key, filter.kelompok)
      : null;

    const perubahanButir = aktif?.butir.map((b, i) => ({
      nama: b.nama,
      skor: b.skor,
      sebelumnya: pembanding?.butir[i]?.skor ?? null,
      delta: selisih(b.skor, pembanding?.butir[i]?.skor)
    })).sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0)) || [];

    const sebaranButir = aktif?.butir.map((b) => ({
      nama: b.nama,
      sumber: aktif.sumber,
      n: aktif.jumlahResponden,
      distribusiAbsolut: b.distribusi,
      distribusiPersen: b.distribusi.map((v) => v / aktif.jumlahResponden * 100),
      persenSetuju: (b.distribusi[2] + b.distribusi[3]) / aktif.jumlahResponden * 100
    })).sort((a, b) => a.persenSetuju - b.persenSetuju) || [];

    /* Riwayat 5 semester + selisih terhadap semester tepat sebelumnya.
       Statistik disebar lebih dulu agar `key` tetap kunci periode
       (statistikPeriode memakai `key` untuk kunci instrumen). */
    const tren = PERIODE.map((p, i) => {
      const statistik = statistikPeriode(info.key, p.key, filter.kelompok);
      const sebelum = i > 0 ? statistikPeriode(info.key, PERIODE[i - 1].key, filter.kelompok) : null;
      return { ...statistik, ...p, deltaSemester: selisih(statistik?.skor, sebelum?.skor) };
    });

    return {
      info,
      aktif,
      pembanding,
      delta: selisih(aktif?.skor, pembanding?.skor),
      perubahanButir,
      sebaranButir,
      rekomendasi: rekomendasiPeriode(aktif, pembanding, perubahanButir, periodePembanding?.label),
      tren
    };
  });

  const valid = instrumen.filter((s) => s.aktif);
  const validPembanding = instrumen.filter((s) => s.pembanding);
  const rata = (items, field) => (items.length ? items.reduce((a, b) => a + b[field].skor, 0) / items.length : null);

  const skor = rata(valid, 'aktif');
  const skorPembanding = rata(validPembanding, 'pembanding');
  const responden = valid.reduce((n, s) => n + s.aktif.jumlahResponden, 0);
  const respondenPembanding = validPembanding.reduce((n, s) => n + s.pembanding.jumlahResponden, 0);
  const ci = interval95(valid.map((s) => s.aktif.skor));

  const sebaran = valid.map((s) => {
    const d = s.aktif.distribusiTotal;
    const n = d.reduce((a, b) => a + b, 0);
    return {
      key: s.info.key,
      nama: s.info.nama,
      namaPanjang: s.info.namaPanjang,
      sumber: s.aktif.sumber,
      n,
      distribusiAbsolut: d,
      distribusiPersen: d.map((v) => v / n * 100),
      persenSetuju: s.aktif.persenSetuju,
      delta: s.delta,
      deltaArah: arahPerubahan(s.delta)
    };
  }).sort((a, b) => a.persenSetuju - b.persenSetuju);

  const kategoriSkor = [...new Set(instrumen.map((s) => s.info.kategori))].map((kategori) => {
    const items = instrumen.filter((s) => s.info.kategori === kategori && s.aktif);
    const nilai = items.reduce((n, s) => n + s.aktif.skor, 0) / (items.length || 1);
    const banding = items.filter((s) => s.pembanding);
    const sebelumnya = banding.reduce((n, s) => n + s.pembanding.skor, 0) / (banding.length || 1);
    return { kategori, skor: nilai, delta: banding.length ? nilai - sebelumnya : null };
  });

  const hasil = {
    filter,
    periode,
    periodePembanding,
    instrumen,
    sebaran,
    kategoriSkor,
    ringkasan: {
      totalInstrumen: valid.length,
      deltaInstrumen: periodePembanding ? valid.length - validPembanding.length : null,
      kelompok: {
        layanan: valid.filter((s) => s.info.kelompok === 'Layanan').map((s) => s.info.nama),
        internal: valid.filter((s) => s.info.kelompok === 'Internal').map((s) => s.info.nama)
      },
      riil: valid.filter((s) => s.aktif.sumber === 'riil').length,
      simulasi: valid.filter((s) => s.aktif.sumber === 'simulasi').length,
      responden: {
        total: responden,
        dosen: valid.reduce((n, s) => n + s.aktif.responden.dosen, 0),
        tendik: valid.reduce((n, s) => n + s.aktif.responden.tendik, 0)
      },
      deltaResponden: periodePembanding ? responden - respondenPembanding : null,
      rataSkor: skor,
      delta: selisih(skor, skorPembanding),
      ci
    },
    perubahanTerbesar: {
      naik: [...instrumen].filter((s) => s.delta != null).sort((a, b) => b.delta - a.delta)[0] || null,
      turun: [...instrumen].filter((s) => s.delta != null).sort((a, b) => a.delta - b.delta)[0] || null
    }
  };

  cacheLaporan.set(cacheKey, hasil);
  return hasil;
}
