export const SURVEI_INFO = [
  { key: 'spak', nama: 'SPAK', namaPanjang: 'Survei Persepsi Anti Korupsi', kategori: 'Integritas & Korupsi', kelompok: 'Layanan', sumber: 'riil' },
  { key: 'spkp', nama: 'SPKP', namaPanjang: 'Survei Persepsi Kualitas Pelayanan', kategori: 'Pelayanan Publik', kelompok: 'Layanan', sumber: 'simulasi' },
  { key: 'pengaduan', nama: 'Pengaduan', namaPanjang: 'Pengaduan Masyarakat', kategori: 'Pelayanan Publik', kelompok: 'Layanan', sumber: 'simulasi' },
  { key: 'spip', nama: 'SPIP', namaPanjang: 'Survei Penilaian Internal SPIP', kategori: 'Integritas & Korupsi', kelompok: 'Internal', sumber: 'simulasi' },
  { key: 'gratifikasi', nama: 'Gratifikasi', namaPanjang: 'Survei Pemahaman Gratifikasi', kategori: 'Integritas & Korupsi', kelompok: 'Internal', sumber: 'simulasi' },
  { key: 'benturan', nama: 'Benturan', namaPanjang: 'Survei Benturan Kepentingan', kategori: 'Integritas & Korupsi', kelompok: 'Internal', sumber: 'simulasi' },
  { key: 'wbs', nama: 'WBS', namaPanjang: 'Whistleblowing System', kategori: 'Pelaporan', kelompok: 'Internal', sumber: 'simulasi' },
  { key: 'budaya-zi', nama: 'Budaya ZI', namaPanjang: 'Survei Budaya Zona Integritas', kategori: 'Budaya & 5R', kelompok: 'Internal', sumber: 'simulasi' },
  { key: 'pens-joss', nama: 'PENS JOSS', namaPanjang: 'Survei Layanan PENS JOSS', kategori: 'Pelayanan Publik', kelompok: 'Internal', sumber: 'simulasi' },
  { key: '5r', nama: '5R', namaPanjang: 'Survei Implementasi 5R', kategori: 'Budaya & 5R', kelompok: 'Internal', sumber: 'simulasi' }
];

/* Definisi butir per instrumen: [nama butir, rata-rata target 1-4]. */
const BUTIR_DEF = {
  spak: { n: 142, dosen: 54, tendik: 88, butir: [
    ['Komitmen institusi mencegah korupsi', 3.62], ['Keteladanan pimpinan', 3.55], ['Ketegasan sanksi', 3.31],
    ['Mekanisme pelaporan jelas', 3.48], ['Rasa aman melaporkan', 3.28], ['Transparansi tindak lanjut', 3.35],
    ['Bebas pungli', 3.58], ['Transparansi pengadaan', 3.42], ['Akses informasi publik', 3.51] ] },
  spkp: { n: 315, dosen: 120, tendik: 195, butir: [
    ['Keramahan petugas', 3.68], ['Ketepatan waktu layanan', 3.52], ['Kejelasan prosedur', 3.49],
    ['Kebersihan fasilitas', 3.61], ['Sarana pengaduan', 3.44], ['Layanan tanpa diskriminasi', 3.66],
    ['Hasil sesuai harapan', 3.55], ['Kompetensi petugas', 3.59], ['Kepuasan keseluruhan', 3.57] ] },
  spip: { n: 58, dosen: 22, tendik: 36, butir: [
    ['Lingkungan pengendalian', 3.12], ['Penilaian risiko', 2.66], ['Kegiatan pengendalian', 2.94],
    ['Informasi & komunikasi', 2.88], ['Pemantauan', 2.91], ['Kebijakan tertulis', 3.05],
    ['Pemisahan tugas', 2.79], ['Otorisasi transaksi', 2.97], ['Dokumentasi kegiatan', 2.83],
    ['Rekonsiliasi berkala', 2.90], ['Evaluasi berkala', 2.86], ['Tindak lanjut temuan', 2.74],
    ['Pengelolaan risiko', 2.70], ['Kompetensi SDM', 3.01], ['Sistem informasi', 2.95] ] },
  gratifikasi: { n: 67, dosen: 26, tendik: 41, butir: [
    ['Pemahaman definisi gratifikasi', 3.18], ['Pengetahuan batas nilai', 2.94], ['Kesadaran wajib lapor', 3.07],
    ['Mekanisme pelaporan', 3.02], ['Perlindungan pelapor', 2.88], ['Sanksi pelanggaran', 2.95],
    ['Integritas dalam layanan', 3.24], ['Penolakan hadiah', 3.12], ['Pelatihan gratifikasi', 2.86],
    ['Pengawasan atasan', 3.05] ] },
  benturan: { n: 58, dosen: 23, tendik: 35, butir: [
    ['Pemahaman benturan kepentingan', 3.14], ['Deklarasi potensi konflik', 3.02], ['Pemisahan peran', 3.08],
    ['Pengambilan keputusan objektif', 3.11], ['Pelaporan konflik', 2.97], ['Transparansi keputusan', 3.05],
    ['Pengawasan pimpinan', 3.10], ['Kebijakan tertulis', 3.06], ['Sosialisasi kebijakan', 2.93],
    ['Konsistensi penerapan', 3.01] ] },
  wbs: { n: 96, dosen: 34, tendik: 62, butir: [
    ['Kemudahan akses kanal', 3.26], ['Jaminan kerahasiaan', 3.38], ['Kejelasan prosedur', 3.12],
    ['Kecepatan tindak lanjut', 2.98], ['Perlindungan pelapor', 3.31], ['Kepercayaan pada sistem', 3.18],
    ['Sosialisasi kanal', 3.02], ['Transparansi status', 3.09] ] },
  pengaduan: { n: 128, dosen: 42, tendik: 86, butir: [
    ['Kemudahan menyampaikan pengaduan', 3.35], ['Kejelasan alur', 3.18], ['Responsivitas petugas', 3.12],
    ['Kecepatan penyelesaian', 3.01], ['Kualitas solusi', 3.08], ['Keterbukaan informasi status', 3.05],
    ['Sikap petugas', 3.29], ['Kepuasan keseluruhan', 3.16] ] },
  'budaya-zi': { n: 74, dosen: 28, tendik: 46, butir: [
    ['Pemahaman nilai integritas', 3.22], ['Penerapan sehari-hari', 3.05], ['Keteladanan pimpinan', 3.18],
    ['Penghargaan perilaku integritas', 2.92], ['Sosialisasi nilai', 3.01], ['Konsistensi penerapan', 2.98],
    ['Budaya keterbukaan', 3.09], ['Kolaborasi antar unit', 3.12] ] },
  'pens-joss': { n: 83, dosen: 30, tendik: 53, butir: [
    ['Kemudahan akses layanan', 3.31], ['Kecepatan respons', 3.14], ['Kejelasan informasi', 3.22],
    ['Kualitas penyelesaian', 3.26], ['Sikap petugas', 3.18], ['Integrasi kanal', 3.08],
    ['Kepuasan keseluruhan', 3.29], ['Kemudahan pelacakan tiket', 2.96] ] },
  '5r': { n: 52, dosen: 18, tendik: 34, butir: [
    ['Ringkas', 3.08], ['Rapi', 3.02], ['Resik', 3.11],
    ['Rawat', 2.94], ['Rajin', 2.98], ['Konsistensi penerapan', 2.88],
    ['Pengawasan area kerja', 2.91] ] }
};

const KOMENTAR_TEMA = {
  spak: [{ tema: 'Perlu sosialisasi antikorupsi', jumlah: 18 }, { tema: 'Penguatan sanksi', jumlah: 11 }],
  spkp: [{ tema: 'Waktu tunggu layanan', jumlah: 34 }, { tema: 'Kenyamanan ruang tunggu', jumlah: 21 }],
  spip: [{ tema: 'Dokumentasi kegiatan belum konsisten', jumlah: 14 }, { tema: 'Pemahaman risiko terbatas', jumlah: 9 }],
  gratifikasi: [{ tema: 'Pelatihan gratifikasi perlu rutin', jumlah: 12 }],
  benturan: [{ tema: 'Deklarasi konflik belum diisi', jumlah: 8 }],
  wbs: [{ tema: 'Kekhawatiran kerahasiaan', jumlah: 15 }, { tema: 'Kecepatan tindak lanjut', jumlah: 10 }],
  pengaduan: [{ tema: 'Kejelasan status penanganan', jumlah: 19 }, { tema: 'Waktu penyelesaian', jumlah: 13 }],
  'budaya-zi': [{ tema: 'Keteladanan pimpinan', jumlah: 10 }],
  'pens-joss': [{ tema: 'Status tiket tidak terpantau', jumlah: 12 }],
  '5r': [{ tema: 'Konsistensi di area bersama', jumlah: 7 }]
};

/* Bangkitkan distribusi jawaban 1-4 dari rata-rata target. Deterministik. */
function sebarDistribusi(n, rata) {
  const t = Math.max(0, Math.min(1, (rata - 1) / 3));
  const w = {
    1: Math.pow(1 - t, 2.4),
    2: Math.pow(1 - t, 1.2) * t,
    3: Math.pow(t, 1.2) * (1 - t),
    4: Math.pow(t, 2.4)
  };
  const jumlahW = w[1] + w[2] + w[3] + w[4];
  const d = [1, 2, 3, 4].map((v) => Math.round(w[v] / jumlahW * n));
  let selisih = n - (d[0] + d[1] + d[2] + d[3]);
  let i = 3;
  while (selisih !== 0) {
    if (selisih > 0) { d[i]++; selisih--; }
    else if (d[i] > 0) { d[i]--; selisih++; }
    i = (i + 3) % 4;
  }
  return d;
}

/* Bentuk dataset per instrumen: siap diganti hasil API. */
export const INSTRUMEN_DATASET = {};
SURVEI_INFO.forEach((info) => {
  const def = BUTIR_DEF[info.key];
  if (!def) { INSTRUMEN_DATASET[info.key] = null; return; }
  const butir = def.butir.map((b) => {
    const nama = b[0], rata = b[1];
    const distribusi = sebarDistribusi(def.n, rata);
    const offset = ((nama.length % 5) - 2) / 20;
    const rataDosen = Math.max(1, Math.min(4, rata + offset));
    const rataTendik = Math.max(1, Math.min(4, rata - offset));
    return {
      nama, rata, distribusi,
      kelompok: { dosen: Number(rataDosen.toFixed(2)), tendik: Number(rataTendik.toFixed(2)) }
    };
  });
  INSTRUMEN_DATASET[info.key] = {
    key: info.key,
    sumber: info.sumber,
    kelompokInstrumen: info.kelompok,
    responden: { total: def.n, dosen: def.dosen, tendik: def.tendik },
    butir,
    komentarTema: KOMENTAR_TEMA[info.key] || []
  };
});

/* ================= Statistik ================= */

export function formatAngka(x, desimal = 1) {
  return Number(x).toFixed(desimal).replace('.', ',');
}

function median(arr) {
  if (!arr || !arr.length) return 0;
  const a = arr.slice().sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function simpanganBaku(arr) {
  if (!arr || arr.length < 2) return 0;
  const rata = arr.reduce((a, b) => a + b, 0) / arr.length;
  const varian = arr.reduce((a, b) => a + (b - rata) * (b - rata), 0) / (arr.length - 1);
  return Math.sqrt(varian);
}

/* Rumus indeks tunggal: (skor aktual / skor maksimal jawaban masuk) x 100. */
function indeksDariDistribusi(dist) {
  const n = dist[0] + dist[1] + dist[2] + dist[3];
  if (!n) return 0;
  const aktual = dist[0] * 1 + dist[1] * 2 + dist[2] * 3 + dist[3] * 4;
  return (aktual / (n * 4)) * 100;
}

function interval95(skorPerButir, n) {
  if (!skorPerButir || skorPerButir.length < 2 || !n) return { bawah: 0, atas: 0 };
  const rata = skorPerButir.reduce((a, b) => a + b, 0) / skorPerButir.length;
  const sd = simpanganBaku(skorPerButir);
  const se = sd / Math.sqrt(Math.max(1, n));
  return { bawah: Math.max(0, rata - 1.96 * se), atas: Math.min(100, rata + 1.96 * se) };
}

function cronbachAlpha(distribusiButir) {
  const k = distribusiButir.length;
  if (k < 2) return 0;
  const varianButir = distribusiButir.map((d) => {
    const n = d[0] + d[1] + d[2] + d[3];
    if (!n) return 0;
    const rata = (d[0] * 1 + d[1] * 2 + d[2] * 3 + d[3] * 4) / n;
    return (d[0] * Math.pow(1 - rata, 2) + d[1] * Math.pow(2 - rata, 2) +
      d[2] * Math.pow(3 - rata, 2) + d[3] * Math.pow(4 - rata, 2)) / n;
  });
  const sumVarian = varianButir.reduce((a, b) => a + b, 0);
  const rataVarian = sumVarian / k;
  const kovarians = 0.35 * rataVarian;
  const varTotal = sumVarian + 2 * kovarians * (k * (k - 1) / 2);
  if (varTotal <= 0) return 0;
  let alpha = (k / (k - 1)) * (1 - sumVarian / varTotal);
  if (!isFinite(alpha)) alpha = 0;
  return Math.max(0, Math.min(1, alpha));
}

function persenSeragam(distribusiButir) {
  if (!distribusiButir.length) return 0;
  const peluang = distribusiButir.map((d) => {
    const n = d[0] + d[1] + d[2] + d[3];
    return n ? [d[0] / n, d[1] / n, d[2] / n, d[3] / n] : [0, 0, 0, 0];
  });
  let total = 0;
  for (let v = 0; v < 4; v++) {
    let prod = 1;
    peluang.forEach((p) => { prod *= p[v]; });
    total += prod;
  }
  return total * 100;
}

function ujiT(dosen, tendik, nDosen, nTendik) {
  if (nDosen < 5 || nTendik < 5) return 1;
  const sdD = 0.6, sdT = 0.6;
  const se = Math.sqrt(sdD * sdD / nDosen + sdT * sdT / nTendik);
  if (se === 0) return 1;
  const t = Math.abs(dosen - tendik) / se;
  const p = Math.exp(-0.717 * t - 0.416 * t * t);
  return Math.max(0, Math.min(1, p));
}

export function ujiTButir(butir, nDosen, nTendik) {
  return ujiT(butir.kelompok.dosen, butir.kelompok.tendik, nDosen, nTendik);
}

/* Estimasi duplikat terdeteksi: jawaban persis sama antar responden (simulasi deterministik). */
export function getDuplikatTerdeteksi(key, dataset = INSTRUMEN_DATASET) {
  const ds = dataset[key];
  if (!ds) return 0;
  if (typeof ds.duplikat === 'number') return ds.duplikat;
  const seed = key.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return seed % 4;
}

/* Ringkasan statistik satu instrumen. */
export function getStatistikInstrumen(key, dataset = INSTRUMEN_DATASET) {
  const ds = dataset[key];
  if (!ds) return null;
  const distribusi = ds.butir.map((b) => b.distribusi);
  const skorButir = ds.butir.map((b) => indeksDariDistribusi(b.distribusi));
  const rataSkor = skorButir.reduce((a, b) => a + b, 0) / (skorButir.length || 1);

  const total = ds.butir.reduce((acc, b) => [
    acc[0] + b.distribusi[0], acc[1] + b.distribusi[1],
    acc[2] + b.distribusi[2], acc[3] + b.distribusi[3]
  ], [0, 0, 0, 0]);
  const totalN = total[0] + total[1] + total[2] + total[3];
  const persenSetuju = totalN ? ((total[2] + total[3]) / totalN) * 100 : 0;

  const ci = interval95(skorButir, skorButir.length);

  return {
    key: ds.key,
    sumber: ds.sumber,
    kelompokInstrumen: ds.kelompokInstrumen,
    responden: ds.responden,
    butir: ds.butir,
    distribusiTotal: total,
    jumlahResponden: ds.responden.total,
    skor: Number(rataSkor.toFixed(1)),
    median: Number(median(skorButir).toFixed(1)),
    simpanganBaku: Number(simpanganBaku(skorButir).toFixed(2)),
    persenSetuju: Number(persenSetuju.toFixed(1)),
    alpha: Number(cronbachAlpha(distribusi).toFixed(2)),
    persenSeragam: Number(persenSeragam(distribusi).toFixed(1)),
    ci: { bawah: Number(ci.bawah.toFixed(1)), atas: Number(ci.atas.toFixed(1)) },
    komentarTema: ds.komentarTema
  };
}

/* Rekomendasi otomatis, dibangkitkan dari aturan. */
export function getRekomendasi(key, dataset = INSTRUMEN_DATASET) {
  const st = getStatistikInstrumen(key, dataset);
  if (!st) return [];
  const rec = [];
  const butir = st.butir;

  let terendah = butir[0];
  butir.forEach((b) => { if (b.rata < terendah.rata) terendah = b; });
  rec.push({
    prioritas: 'Tinggi',
    teks: 'Perkuat aspek ' + terendah.nama,
    dasar: 'rata-rata ' + formatAngka(terendah.rata, 2) + ', terendah dari ' + butir.length + ' butir'
  });

  let negatifTerburuk = null, negatifNilai = 0;
  butir.forEach((b) => {
    const n = b.distribusi[0] + b.distribusi[1] + b.distribusi[2] + b.distribusi[3];
    const negatif = ((b.distribusi[0] + b.distribusi[1]) / n) * 100;
    if (negatif > 5 && negatif > negatifNilai) { negatifTerburuk = b; negatifNilai = negatif; }
  });
  if (negatifTerburuk) {
    rec.push({
      prioritas: 'Tinggi',
      teks: 'Telusuri penyebab ketidaksetujuan pada ' + negatifTerburuk.nama,
      dasar: formatAngka(negatifNilai, 1) + '% menjawab 1-2'
    });
  }

  butir.forEach((b) => {
    const selisih = Math.abs(b.kelompok.dosen - b.kelompok.tendik);
    const nD = st.responden.dosen, nT = st.responden.tendik;
    if (nD >= 5 && nT >= 5 && selisih >= 0.2) {
      const p = ujiT(b.kelompok.dosen, b.kelompok.tendik, nD, nT);
      if (p < 0.05) {
        rec.push({
          prioritas: 'Sedang',
          teks: 'Tinjau perbedaan persepsi antar kelompok pada ' + b.nama,
          dasar: 'selisih ' + formatAngka(selisih, 2) + ' poin, p < 0,05'
        });
      }
    }
  });

  if (st.persenSeragam > 50) {
    rec.push({
      prioritas: 'Pantau',
      teks: 'Interpretasikan skor dengan hati-hati, variasi jawaban rendah',
      dasar: formatAngka(st.persenSeragam, 1) + '% jawaban seragam'
    });
  }

  if (st.jumlahResponden < 30) {
    rec.push({
      prioritas: 'Sedang',
      teks: 'Data belum representatif',
      dasar: 'hanya ' + st.jumlahResponden + ' responden'
    });
  }

  if (st.komentarTema.length) {
    const utama = st.komentarTema.slice().sort((a, b) => b.jumlah - a.jumlah)[0];
    rec.push({
      prioritas: 'Pantau',
      teks: 'Tema komentar terbanyak: ' + utama.tema,
      dasar: utama.jumlah + ' komentar menyebut tema ini'
    });
  }

  const urutan = { 'Tinggi': 0, 'Sedang': 1, 'Pantau': 2 };
  rec.sort((a, b) => urutan[a.prioritas] - urutan[b.prioritas]);
  return rec.slice(0, 4);
}

/* Distribusi agregat per instrumen (persen 0-100 per skala 1-4) untuk stacked bar. */
export function getSebaranPerInstrumen(dataset = INSTRUMEN_DATASET) {
  return SURVEI_INFO.map((info) => {
    const st = getStatistikInstrumen(info.key, dataset);
    if (!st) return null;
    const d = st.distribusiTotal;
    const n = d[0] + d[1] + d[2] + d[3];
    const persen = n ? d.map((v) => (v / n) * 100) : [0, 0, 0, 0];
    return {
      key: info.key,
      nama: info.nama,
      namaPanjang: info.namaPanjang,
      sumber: info.sumber,
      n,
      distribusiAbsolut: d,
      distribusiPersen: persen.map((v) => Number(v.toFixed(1))),
      persenSetuju: Number((persen[2] + persen[3]).toFixed(1))
    };
  }).filter(Boolean)
    .sort((a, b) => a.persenSetuju - b.persenSetuju);
}

/* Ringkasan tiga card. */
export function getRingkasanDashboard(dataset = INSTRUMEN_DATASET) {
  const semua = SURVEI_INFO.map((s) => s.key);
  const berdata = semua.filter((k) => !!dataset[k]);

  const layanan = SURVEI_INFO.filter((s) => s.kelompok === 'Layanan').map((s) => s.nama);
  const internal = SURVEI_INFO.filter((s) => s.kelompok === 'Internal').map((s) => s.nama);

  const riil = berdata.filter((k) => dataset[k].sumber === 'riil').length;
  const simulasi = berdata.length - riil;

  let nDosen = 0, nTendik = 0;
  berdata.forEach((k) => {
    nDosen += dataset[k].responden.dosen;
    nTendik += dataset[k].responden.tendik;
  });

  const skorArr = berdata.map((k) => getStatistikInstrumen(k, dataset).skor);
  const rata = skorArr.length ? skorArr.reduce((a, b) => a + b, 0) / skorArr.length : 0;
  const ci = interval95(skorArr, skorArr.length);

  const delta = 0.3; /* perubahan vs periode sebelumnya, data simulasi */

  return {
    totalInstrumen: SURVEI_INFO.length,
    kelompok: { layanan, internal },
    riil, simulasi,
    responden: { total: nDosen + nTendik, dosen: nDosen, tendik: nTendik },
    rataSkor: Number(rata.toFixed(1)),
    ci: { bawah: Number(ci.bawah.toFixed(1)), atas: Number(ci.atas.toFixed(1)) },
    delta
  };
}

/* ================= Data lain (landing, dll.) ================= */

export const RINGKASAN = {
  rataSkor: 81.2,
  benchmark: 80,
  totalResponden: 640,
  instrumenAktif: 10,
  laporanMasuk: 411,
  partisipasiBulanIni: 128
};

export const TREN_MINGGUAN = {
  label: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
  tanggal: ['23 Sep', '24 Sep', '25 Sep', '26 Sep', '27 Sep', '28 Sep', '29 Sep'],
  skor: [79.8, 80.2, 80.5, 80.4, 80.9, 81.1, 81.2],
  benchmark: 80
};

export const CAPAIAN_BULANAN = [
  { bulan: 'Mar', skor: 78.9 },
  { bulan: 'Apr', skor: 79.4 },
  { bulan: 'Mei', skor: 80.1 },
  { bulan: 'Jun', skor: 80.5 },
  { bulan: 'Jul', skor: 80.9 },
  { bulan: 'Agu', skor: 81.2 }
];

export const KATEGORI_SKOR = [
  { kategori: 'Pelayanan Publik', skor: 88.1, tren: 'naik' },
  { kategori: 'Integritas & Korupsi', skor: 79.2, tren: 'naik' },
  { kategori: 'Budaya & 5R', skor: 76.8, tren: 'datar' }
];

export const KONTAK = {
  unit: 'Satuan Pengawasan Internal (SPI) PENS',
  email: 'spi@pens.ac.id',
  telp: '(031) 594-7280',
  wa: '0811-3200-202',
  alamat: 'Jl. Raya ITS, Keputih, Sukolilo, Surabaya 60111'
};

export const PELAPORAN_KEYS = ['wbs', 'pengaduan'];

export function isPelaporan(key) {
  return PELAPORAN_KEYS.indexOf(key) >= 0;
}

export function labelPartisipan(s) {
  return isPelaporan(s.key)
    ? `${s.responden} laporan`
    : `${s.responden} responden`;
}

/* Versi ringkas SURVEI_INFO untuk landing (dengan skor + responden tampilan). */
export const SURVEI_LANDING = SURVEI_INFO.map((info) => {
  const st = getStatistikInstrumen(info.key);
  return {
    key: info.key,
    nama: info.nama,
    namaPanjang: info.namaPanjang,
    kategori: info.kategori,
    sumber: info.sumber,
    skor: st ? st.skor : null,
    responden: st ? st.jumlahResponden : 0
  };
});

/* Rentang skor: instrumen tertinggi & terendah, dihitung otomatis dari 10 instrumen. */
export const RENTANG_SKOR = (() => {
  const berdata = SURVEI_LANDING.filter((s) => s.skor !== null);
  if (!berdata.length) return null;
  const tertinggi = berdata.reduce((a, b) => (b.skor > a.skor ? b : a));
  const terendah  = berdata.reduce((a, b) => (b.skor < a.skor ? b : a));
  return {
    tertinggi,
    terendah,
    selisih: Number((tertinggi.skor - terendah.skor).toFixed(1))
  };
})();

export function getUser() {
  const s = getSession();
  if (s) {
    const role = ROLES[s.role];
    return {
      nama: role ? role.nama : s.nama,
      role: s.role,
      inisial: role ? role.inisial : s.inisial
    };
  }
  return { nama: 'Tamu', role: 'guest', inisial: 'TM' };
}

/* Profil lengkap untuk halaman profil: data role + statistik aktivitas personal. */
export function getProfilDetail() {
  const s = getSession();
  const role = ROLES[s?.role] || null;

  const respons = getResponses();
  const jumlahSurveiDiisi = Object.keys(respons).length;
  const instrumenDiisi = SURVEI_INFO
    .filter((info) => respons[info.key])
    .map((info) => ({ key: info.key, nama: info.namaPanjang, waktu: respons[info.key].waktu }));

  const laporanUser = getPengaduan().filter(
    (p) => !p.anonim && p.nama_pelapor === role?.nama
  );

  return {
    nama: role?.nama || 'Tamu',
    inisial: role?.inisial || 'TM',
    roleLabel: role?.label || 'Pengunjung',
    email: role?.email || '—',
    nip: role?.nip || '—',
    unit: role?.unit || '—',
    jabatan: role?.jabatan || '—',
    sejak: role?.sejak || '—',
    bergabung: s?.sejak || null,
    statistik: {
      surveiDiisi: jumlahSurveiDiisi,
      totalSurvei: SURVEI_INFO.length,
      laporanDibuat: laporanUser.length,
      akunAktif: role ? 1 : 0
    },
    instrumenDiisi,
    laporanUser
  };
}

/* ================= Pusat Survei ================= */

export const SURVEI_DESKRIPSI = {
  spak: 'Mengukur persepsi sivitas terhadap upaya pencegahan korupsi di lingkungan kampus.',
  spkp: 'Menilai mutu layanan administrasi dan akademik yang diterima sivitas dan masyarakat.',
  pengaduan: 'Menilai kanal pengaduan masalah fasilitas, administrasi, dan kualitas layanan.',
  spip: 'Menilai kematangan sistem pengendalian internal pemerintah di lima unsur SPIP.',
  gratifikasi: 'Menguji pemahaman sivitas tentang batasan dan pelaporan gratifikasi.',
  benturan: 'Mengukur kesadaran sivitas terhadap potensi benturan kepentingan dalam tugas.',
  wbs: 'Menilai kanal pelaporan dugaan pelanggaran integritas, mendukung anonim.',
  'budaya-zi': 'Memetakan budaya kerja yang mendukung zona integritas di unit kerja.',
  'pens-joss': 'Menilai kualitas layanan terpadu satu pintu PENS JOSS.',
  '5r': 'Mengukur penerapan Ringkas, Rapi, Resik, Rawat, dan Rajin di area kerja.'
};

export const SURVEI_LANGKAH = {
  spak: ['Integritas Personal', 'Budaya Organisasi', 'Pelayanan Publik'],
  spkp: ['Kualitas Petugas', 'Prosedur & Fasilitas', 'Kepuasan Layanan'],
  pengaduan: ['Akses Kanal', 'Proses Penanganan', 'Hasil & Kepuasan'],
  spip: ['Lingkungan Pengendalian', 'Penilaian Risiko', 'Aktivitas Pengendalian'],
  gratifikasi: ['Pemahaman Dasar', 'Pelaporan & Perlindungan', 'Penerapan'],
  benturan: ['Pemahaman Konsep', 'Deklarasi & Pelaporan', 'Pengawasan'],
  wbs: ['Akses & Kerahasiaan', 'Tindak Lanjut', 'Kepercayaan Sistem'],
  'budaya-zi': ['Nilai Integritas', 'Keteladanan', 'Kolaborasi'],
  'pens-joss': ['Akses Layanan', 'Kualitas Penyelesaian', 'Kepuasan'],
  '5r': ['Ringkas & Rapi', 'Resik & Rawat', 'Rajin & Konsistensi']
};

/* Daftar lengkap untuk pusat survei. */
export function getDaftarSurvei() {
  return SURVEI_INFO.map((info) => {
    const st = getStatistikInstrumen(info.key);
    return {
      key: info.key,
      nama: info.nama,
      namaPanjang: info.namaPanjang,
      kategori: info.kategori,
      sumber: info.sumber,
      deskripsi: SURVEI_DESKRIPSI[info.key] || '',
      jumlahButir: st ? st.butir.length : 0,
      responden: st ? st.jumlahResponden : 0,
      langkah: SURVEI_LANGKAH[info.key] || ['Bagian 1', 'Bagian 2', 'Bagian 3']
    };
  });
}

/* Daftar butir untuk form pengisian. */
export function getButirSurvei(key) {
  const ds = INSTRUMEN_DATASET[key];
  if (!ds) return null;
  const info = SURVEI_INFO.find((s) => s.key === key);
  return {
    key,
    nama: info?.nama || key,
    namaPanjang: info?.namaPanjang || key,
    langkah: SURVEI_LANGKAH[key] || ['Bagian 1', 'Bagian 2', 'Bagian 3'],
    butir: ds.butir.map((b) => b.nama)
  };
}

/* Persist jawaban di localStorage, bentuk: { [key]: { jawaban: [...], waktu } }. */
const RESP_KEY = 'iv2_responses';

export function saveResponse(key, jawaban) {
  try {
    const all = JSON.parse(localStorage.getItem(RESP_KEY) || '{}');
    all[key] = { jawaban, waktu: new Date().toISOString() };
    localStorage.setItem(RESP_KEY, JSON.stringify(all));
  } catch { /* abaikan */ }
}

export function getResponses() {
  try { return JSON.parse(localStorage.getItem(RESP_KEY) || '{}'); }
  catch { return {}; }
}

export function sudahDiisi(key) {
  return !!getResponses()[key];
}

export function jumlahTerisi() {
  return Object.keys(getResponses()).length;
}

/* ================= Auth & Role ================= */

export const ROLES = {
  sivitas: {
    key: 'sivitas',
    label: 'Dosen & Tenaga Kependidikan',
    nama: 'Faiz Hadoop',
    inisial: 'FH',
    email: 'faiz.hadoop@pens.ac.id',
    nip: '1998 0215 201812 1 003',
    unit: 'D4 Teknik Informatika',
    jabatan: 'Dosen',
    sejak: '2022',
    deskripsi: 'Isi survei, buat pengaduan, dan lacak status laporan Anda.'
  },
  admin: {
    key: 'admin',
    label: 'Admin Zona Integritas',
    nama: 'Rina Kusuma',
    inisial: 'RK',
    email: 'rina.kusuma@pens.ac.id',
    nip: '1985 0310 201001 2 001',
    unit: 'Satuan Pengawasan Internal (SPI)',
    jabatan: 'Auditor Internal',
    sejak: '2019',
    deskripsi: 'Kelola laporan masuk, perbarui status, dan balas pelapor.'
  }
};

const SESSION_KEY = 'iv2_session';

export function loginAs(roleKey) {
  const role = ROLES[roleKey];
  if (!role) return null;
  const sesi = { role: role.key, nama: role.nama, inisial: role.inisial, sejak: new Date().toISOString() };
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesi)); } catch { /* abaikan */ }
  return sesi;
}

export function logout() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* abaikan */ }
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function isAdmin() {
  const s = getSession();
  return !!(s && s.role === 'admin');
}

/* ================= Pengaduan & WBS ================= */

export const KATEGORI_ADUAN = [
  'Fasilitas/Sarana',
  'Administrasi/Birokrasi',
  'Kualitas Pelayanan',
  'Kedisiplinan',
  'Lainnya'
];

export const STATUS_ADUAN = ['Baru', 'Diproses', 'Selesai'];

export const PENGADUAN_SEED = [
  {
    id: 'ADU-2026-0001', jenis: 'pengaduan', judul: 'AC ruang kuliah Gedung B tidak dingin',
    kategori: 'Fasilitas/Sarana', lokasi: 'Gedung B, Ruang B-201', anonim: false,
    nama_pelapor: 'Rizky Pratama', kontak_pelapor: 'rizky@example.com', hubungan: 'Mahasiswa',
    deskripsi: 'AC di ruang B-201 sudah dua minggu tidak dingin, mengganggu kegiatan kuliah pagi.',
    status: 'Diproses', pic: 'Bagian Sarana Prasarana',
    waktuLapor: '2026-08-18T08:15:00Z', waktuUpdate: '2026-08-20T03:40:00Z',
    riwayat: [
      { status: 'Baru', tanggal: '2026-08-18T08:15:00Z', catatan: 'Laporan diterima dan akan diverifikasi.' },
      { status: 'Diproses', tanggal: '2026-08-20T03:40:00Z', catatan: 'Teknisi dijadwalkan melakukan pengecekan.' }
    ],
    catatanInternal: [{ tanggal: '2026-08-19T02:00:00Z', catatan: 'Kontak vendor AC untuk jadwal servis.' }],
    balasan: []
  },
  {
    id: 'ADU-2026-0002', jenis: 'pengaduan', judul: 'Antrean layanan akademik terlalu panjang',
    kategori: 'Kualitas Pelayanan', lokasi: 'Gedung A, Lantai 1', anonim: true,
    nama_pelapor: null, kontak_pelapor: null, hubungan: null,
    deskripsi: 'Pengurusan surat keterangan aktif kuliah memerlukan antrean lebih dari satu jam.',
    status: 'Baru', pic: '',
    waktuLapor: '2026-08-24T01:30:00Z', waktuUpdate: '2026-08-24T01:30:00Z',
    riwayat: [{ status: 'Baru', tanggal: '2026-08-24T01:30:00Z', catatan: 'Laporan diterima.' }],
    catatanInternal: [], balasan: []
  },
  {
    id: 'WBS-2026-001', jenis: 'wbs', judul: 'Dugaan pungutan tidak resmi pada kegiatan orientasi',
    kategori: 'Pungli', lokasi: 'Gedung C', anonim: true,
    nama_pelapor: null, kontak_pelapor: null, hubungan: null,
    deskripsi: 'Terdapat permintaan sumbangan wajib yang tidak tercantum dalam anggaran resmi kegiatan.',
    status: 'Selesai', pic: 'Tim Zona Integritas',
    waktuLapor: '2026-07-30T02:10:00Z', waktuUpdate: '2026-08-12T06:00:00Z',
    riwayat: [
      { status: 'Baru', tanggal: '2026-07-30T02:10:00Z', catatan: 'Laporan anonim diterima.' },
      { status: 'Diproses', tanggal: '2026-08-02T04:00:00Z', catatan: 'Verifikasi dilakukan oleh Tim ZI.' },
      { status: 'Selesai', tanggal: '2026-08-12T06:00:00Z', catatan: 'Sumbangan dikembalikan dan panitia diberi pembinaan.' }
    ],
    catatanInternal: [{ tanggal: '2026-08-05T02:00:00Z', catatan: 'Koordinasi dengan bagian kemahasiswaan.' }],
    balasan: [
      { id: 'bal-1', teks: 'Laporan telah diverifikasi. Sumbangan dikembalikan dan panitia diberi pembinaan.', tanggal: '2026-08-12T06:05:00Z', oleh: 'Tim Zona Integritas', lampiran: [] }
    ]
  },
  {
    id: 'ADU-2026-0003', jenis: 'pengaduan', judul: 'WiFi area perpustakaan sering terputus',
    kategori: 'Fasilitas/Sarana', lokasi: 'Perpustakaan Pusat', anonim: false,
    nama_pelapor: 'Dewi Anggraini', kontak_pelapor: '0812-0000-0000', hubungan: 'Dosen',
    deskripsi: 'Koneksi WiFi terputus berulang saat jam sibuk, menghambat akses jurnal.',
    status: 'Diproses', pic: 'UPT TIK',
    waktuLapor: '2026-08-21T07:00:00Z', waktuUpdate: '2026-08-23T02:15:00Z',
    riwayat: [
      { status: 'Baru', tanggal: '2026-08-21T07:00:00Z', catatan: 'Laporan diterima.' },
      { status: 'Diproses', tanggal: '2026-08-23T02:15:00Z', catatan: 'Pengecekan perangkat akses titik sedang berjalan.' }
    ],
    catatanInternal: [], balasan: []
  },
  {
    id: 'ADU-2026-0004', jenis: 'pengaduan', judul: 'Papan informasi jadwal layanan belum diperbarui',
    kategori: 'Administrasi/Birokrasi', lokasi: 'Gedung A, Lantai 2', anonim: true,
    nama_pelapor: null, kontak_pelapor: null, hubungan: null,
    deskripsi: 'Jadwal layanan di papan informasi masih menampilkan periode semester lalu.',
    status: 'Selesai', pic: 'Bagian Akademik',
    waktuLapor: '2026-07-25T03:20:00Z', waktuUpdate: '2026-08-01T02:00:00Z',
    riwayat: [
      { status: 'Baru', tanggal: '2026-07-25T03:20:00Z', catatan: 'Laporan diterima.' },
      { status: 'Diproses', tanggal: '2026-07-27T01:00:00Z', catatan: 'Permintaan pemutakhiran diteruskan.' },
      { status: 'Selesai', tanggal: '2026-08-01T02:00:00Z', catatan: 'Papan informasi telah diperbarui.' }
    ],
    catatanInternal: [], balasan: []
  }
];

const ADU_KEY = 'iv2_pengaduan';

function bacaAduanLokal() {
  try { return JSON.parse(localStorage.getItem(ADU_KEY) || '[]'); }
  catch { return []; }
}

function tulisAduanLokal(arr) {
  try { localStorage.setItem(ADU_KEY, JSON.stringify(arr)); } catch { /* abaikan */ }
}

export function getPengaduan() {
  const lokal = bacaAduanLokal();
  const diEdit = new Set(lokal.map((p) => p.id));
  const seed = PENGADUAN_SEED.filter((p) => !diEdit.has(p.id));
  return seed.concat(lokal).sort((a, b) => new Date(b.waktuLapor) - new Date(a.waktuLapor));
}

function kodeBerikut(jenis) {
  const semua = getPengaduan().filter((p) => p.jenis === jenis);
  const tahun = new Date().getFullYear();
  const prefix = jenis === 'wbs' ? 'WBS' : 'ADU';
  let maks = 0;
  semua.forEach((p) => {
    const m = p.id.match(/(\d+)$/);
    if (m) maks = Math.max(maks, parseInt(m[1], 10));
  });
  const lebar = jenis === 'wbs' ? 3 : 4;
  return prefix + '-' + tahun + '-' + String(maks + 1).padStart(lebar, '0');
}

export function savePengaduan(data) {
  const jenis = data.jenis === 'wbs' ? 'wbs' : 'pengaduan';
  const now = new Date().toISOString();
  const record = {
    id: kodeBerikut(jenis),
    jenis,
    judul: data.judul,
    kategori: data.kategori,
    lokasi: data.lokasi || '',
    deskripsi: data.deskripsi,
    anonim: !!data.anonim,
    nama_pelapor: data.anonim ? null : data.nama_pelapor,
    kontak_pelapor: data.anonim ? null : data.kontak_pelapor,
    hubungan: data.anonim ? null : data.hubungan,
    status: 'Baru',
    pic: '',
    waktuLapor: now,
    waktuUpdate: now,
    riwayat: [{ status: 'Baru', tanggal: now, catatan: 'Laporan diterima.' }],
    catatanInternal: [],
    balasan: []
  };
  const arr = bacaAduanLokal();
  arr.push(record);
  tulisAduanLokal(arr);
  return record;
}

export function cariPengaduan(kode) {
  const key = (kode || '').trim().toUpperCase();
  return getPengaduan().find((p) => p.id.toUpperCase() === key) || null;
}

export function updatePengaduan(id, patch) {
  const semua = getPengaduan();
  const lama = semua.find((p) => p.id === id);
  if (!lama) return null;
  const now = new Date().toISOString();
  const baru = Object.assign({}, lama, patch, { waktuUpdate: now });
  if (patch.status && patch.status !== lama.status) {
    baru.riwayat = lama.riwayat.concat([{ status: patch.status, tanggal: now, catatan: patch.catatanPublik || '' }]);
  }
  if (patch.catatanInternalBaru) {
    baru.catatanInternal = (lama.catatanInternal || []).concat([{ tanggal: now, catatan: patch.catatanInternalBaru }]);
  }
  delete baru.catatanInternalBaru;
  delete baru.catatanPublik;
  const lokal = bacaAduanLokal();
  const li = lokal.findIndex((p) => p.id === id);
  if (li >= 0) lokal[li] = baru; else lokal.push(baru);
  tulisAduanLokal(lokal);
  return baru;
}

export function tambahBalasan(id, teks, lampiran, oleh) {
  const semua = getPengaduan();
  const lama = semua.find((p) => p.id === id);
  if (!lama) return null;
  const now = new Date().toISOString();
  const balasan = {
    id: 'bal-' + Date.now().toString(36),
    teks: (teks || '').trim(),
    tanggal: now,
    oleh: oleh || 'Admin Zona Integritas',
    lampiran: Array.isArray(lampiran) ? lampiran : []
  };
  const baru = Object.assign({}, lama, {
    balasan: (lama.balasan || []).concat([balasan]),
    waktuUpdate: now
  });
  const lokal = bacaAduanLokal();
  const li = lokal.findIndex((p) => p.id === id);
  if (li >= 0) lokal[li] = baru; else lokal.push(baru);
  tulisAduanLokal(lokal);
  return balasan;
}

export function getRingkasanPengaduan() {
  const arr = getPengaduan();
  const c = { 'Baru': 0, 'Diproses': 0, 'Selesai': 0 };
  arr.forEach((p) => { c[p.status] = (c[p.status] || 0) + 1; });
  return { total: arr.length, ...c };
}

export function formatTanggal(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTanggalWaktu(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${formatTanggal(iso)} · ${p(d.getHours())}.${p(d.getMinutes())}`;
}

/* Rekap instrumen berdata untuk halaman laporan admin. */
export function getSemuaSurveiUntukLaporan(dataset = INSTRUMEN_DATASET) {
  return SURVEI_INFO
    .map((info) => {
      const st = getStatistikInstrumen(info.key, dataset);
      if (!st) return null;
      const benchmark = info.sumber === 'riil' ? 80 : 80;
      return {
        key: info.key,
        nama: info.nama,
        namaPanjang: info.namaPanjang,
        kategori: info.kategori,
        sumber: info.sumber,
        skor: st.skor,
        benchmark,
        status: st.skor >= benchmark ? 'Di atas Target' : 'Di bawah Target',
        responden: st.jumlahResponden
      };
    })
    .filter(Boolean);
}
