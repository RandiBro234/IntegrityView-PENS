/* Satu sumber kebenaran untuk instrumen: slug, nama, tautan Google Form,
   jumlah butir, dan alias nama_instrumen dari database.
   Teks butir dipakai persis; `label` adalah versi pendek untuk grafik. */

export const SKALA = [
  { nilai: 1, label: 'Sangat Tidak Setuju', singkat: 'STS', warna: '#C25E1E' },
  { nilai: 2, label: 'Tidak Setuju', singkat: 'TS', warna: '#F5843C' },
  { nilai: 3, label: 'Setuju', singkat: 'S', warna: '#7FA8D9' },
  { nilai: 4, label: 'Sangat Setuju', singkat: 'SS', warna: '#0B1B33' }
];

/* Ambang rekomendasi â€” satu tempat agar mudah diubah. */
export const AMBANG = {
  rataRataTinggi: 2.75,
  rataRataPantau: 3.19,
  negatifTinggi: 30,
  negatifPantau: 15,
  perubahanBermakna: 2,
  respondenMinimum: 30,
  deltaStabil: 0.5
};

const b = (label, teks) => ({ label, teks: teks || label });

export const INSTRUMENTS = [
  {
    slug: 'spip',
    deskripsi: 'Mengukur kematangan sistem pengendalian internal pada sembilan aspek SPIP.',
    nama: 'SPIP',
    namaPanjang: 'Survei Penilaian Internal SPIP',
    kategori: 'Integritas & Korupsi',
    kelompok: 'Internal',
    url: 'https://forms.gle/L24oZngpbbs9n3Kf7',
    requiresGoogleLogin: false,
    butir: [
      b('Etika & integritas'),
      b('Pemahaman tugas & kewenangan'),
      b('Penilaian risiko'),
      b('Pemeriksaan & persetujuan'),
      b('Perbaikan kesalahan'),
      b('Ketersediaan informasi'),
      b('Evaluasi & tindak lanjut'),
      b('Penghargaan prestasi'),
      b('Reward & punishment')
    ]
  },
  {
    slug: 'spak',
    deskripsi: 'Mengukur persepsi sivitas terhadap layanan yang jujur, adil, dan bebas korupsi.',
    nama: 'SPAK',
    namaPanjang: 'Survei Persepsi Anti Korupsi',
    kategori: 'Integritas & Korupsi',
    kelompok: 'Layanan',
    url: 'https://forms.gle/DqJ3woNo2VzbJRHcA',
    requiresGoogleLogin: true,
    butir: [
      b('Layanan jujur & transparan', 'Layanan di institusi ini diberikan secara jujur, transparan, dan sesuai ketentuan yang berlaku.'),
      b('Layanan adil', 'Layanan diberikan secara adil kepada semua pihak, tanpa membeda-bedakan berdasarkan jabatan, kedekatan personal, atau unit kerja.'),
      b('Bebas manipulasi', 'Proses layanan bebas dari manipulasi data, penyalahgunaan prosedur, atau keberpihakan kepada pihak tertentu.'),
      b('Bebas pungutan', 'Tidak ada permintaan atau ekspektasi pemberian uang, hadiah, atau fasilitas di luar ketentuan sebagai syarat atau kelancaran layanan.'),
      b('Tanpa perantara', 'Layanan dapat diakses langsung sesuai prosedur tanpa perlu menggunakan perantara agar urusan lebih mudah atau cepat.'),
      b('Layanan bebas korupsi', 'Secara keseluruhan, layanan di institusi ini telah dilaksanakan dengan integritas dan bebas dari praktik korupsi.')
    ]
  },
  {
    slug: 'spkp',
    deskripsi: 'Menilai mutu layanan administrasi dan akademik yang diterima sivitas.',
    nama: 'SPKP',
    namaPanjang: 'Survei Persepsi Kualitas Pelayanan',
    kategori: 'Pelayanan Publik',
    kelompok: 'Layanan',
    url: 'https://forms.gle/RXHTbKFQEnmG1HBp7',
    requiresGoogleLogin: false,
    butir: [
      b('Prosedur jelas'),
      b('Persyaratan transparan'),
      b('Informasi tarif'),
      b('Ketepatan waktu'),
      b('Responsivitas petugas'),
      b('Kualitas output'),
      b('Sarana & sistem informasi'),
      b('Mekanisme keluhan')
    ]
  },
  {
    slug: 'gratifikasi',
    deskripsi: 'Menguji pemahaman dan komitmen menolak gratifikasi di lingkungan kerja.',
    nama: 'Gratifikasi',
    namaPanjang: 'Survei Pemahaman Gratifikasi',
    kategori: 'Integritas & Korupsi',
    kelompok: 'Internal',
    url: 'https://forms.gle/sYjGdzRsxKkbXzc8A',
    requiresGoogleLogin: false,
    butir: [
      b('Pemahaman gratifikasi', 'Saya memahami bahwa pemberian uang, barang, atau fasilitas dari pihak yang terkait dengan pekerjaan saya dapat termasuk kategori gratifikasi.'),
      b('Identifikasi pemberian yang ditolak', 'Saya dapat mengidentifikasi situasi di mana pemberian dari mahasiswa, orang tua/wali, mitra, atau penyedia jasa harus ditolak atau dilaporkan.'),
      b('Saluran pelaporan', 'Saya mengetahui saluran atau mekanisme resmi untuk melaporkan penerimaan gratifikasi di institusi ini.'),
      b('Komitmen menolak', 'Saya melihat adanya komitmen nyata di lingkungan kerja saya untuk menolak pemberian yang dapat memengaruhi objektivitas dalam pelaksanaan tugas.'),
      b('Sosialisasi informasi', 'Informasi mengenai gratifikasi, cara menolak, dan cara melaporkannya telah disampaikan secara jelas kepada saya.')
    ]
  },
  {
    slug: 'benturan',
    deskripsi: 'Mengukur pemahaman dan penanganan benturan kepentingan.',
    nama: 'Benturan',
    namaPanjang: 'Survei Benturan Kepentingan',
    kategori: 'Integritas & Korupsi',
    kelompok: 'Internal',
    url: 'https://forms.gle/y9B4WccmjXhnPvt17',
    requiresGoogleLogin: false,
    butir: [
      b('Pemahaman benturan kepentingan'),
      b('Pengenalan potensi'),
      b('Pencegahan dini'),
      b('Kanal pelaporan'),
      b('Tata kelola penanganan'),
      b('Penanganan objektif')
    ]
  },
  {
    slug: 'wbs',
    deskripsi: 'Menilai pengetahuan dan kepercayaan pada saluran Whistleblowing System.',
    nama: 'WBS',
    namaPanjang: 'Whistleblowing System (WBS)',
    kategori: 'Pelaporan',
    kelompok: 'Internal',
    url: 'https://forms.gle/nAve1DzXiEaoGq998',
    requiresGoogleLogin: false,
    butir: [
      b('Pengetahuan saluran WBS'),
      b('Klasifikasi pelanggaran'),
      b('Kemudahan akses'),
      b('Perlindungan pelapor'),
      b('Kerahasiaan identitas'),
      b('Keyakinan tindak lanjut')
    ]
  },
  {
    slug: 'pengaduan',
    deskripsi: 'Menilai kanal, alur, dan tindak lanjut pengaduan layanan.',
    nama: 'Pengaduan',
    namaPanjang: 'Pengaduan Masyarakat',
    kategori: 'Pelayanan Publik',
    kelompok: 'Layanan',
    url: 'https://forms.gle/vvWAH5dSVh145rjm9',
    requiresGoogleLogin: false,
    butir: [
      b('Kanal tersedia'),
      b('Panduan alur'),
      b('Respons & distribusi'),
      b('Penyelesaian komprehensif'),
      b('Pelacakan progres'),
      b('Tindak lanjut kredibel')
    ]
  },
  {
    slug: 'budaya-zi',
    deskripsi: 'Memetakan budaya kerja yang mendukung Zona Integritas.',
    nama: 'Budaya ZI',
    namaPanjang: 'Survei Budaya Zona Integritas',
    kategori: 'Budaya & 5R',
    kelompok: 'Internal',
    url: 'https://forms.gle/GziP5cwDwJ69S3Tq5',
    requiresGoogleLogin: false,
    butir: [
      b('Urgensi ZI'),
      b('Komitmen pimpinan'),
      b('Keteladanan pimpinan'),
      b('Kepatuhan kode etik'),
      b('Budaya anti-manipulasi'),
      b('Proaktif melaporkan'),
      b('Implementasi nyata')
    ]
  },
  {
    slug: 'pens-joss',
    deskripsi: 'Menilai penerapan budaya kerja PENS JOSS dalam layanan.',
    nama: 'PENS JOSS',
    namaPanjang: 'Survei Layanan PENS JOSS',
    kategori: 'Pelayanan Publik',
    kelompok: 'Internal',
    url: 'https://forms.gle/gWemUcZBFhUcbzpC8',
    requiresGoogleLogin: false,
    butir: [
      b('Pemahaman filosofi'),
      b('Sosialisasi nilai'),
      b('Penerapan berkesinambungan'),
      b('Tercermin di kerja & layanan'),
      b('Keteladanan pimpinan'),
      b('Identitas budaya')
    ]
  },
  {
    slug: '5r',
    deskripsi: 'Mengukur penerapan Ringkas, Rapi, Resik, Rawat, dan Rajin.',
    nama: '5R',
    namaPanjang: 'Survei Implementasi 5R',
    kategori: 'Budaya & 5R',
    kelompok: 'Internal',
    url: 'https://forms.gle/AV12MNFhrv3GckZH7',
    requiresGoogleLogin: false,
    butir: [
      b('Pemahaman 5R'),
      b('Penataan area'),
      b('Penempatan ergonomis'),
      b('Kebersihan'),
      b('Pemeliharaan infrastruktur'),
      b('Disiplin mandiri'),
      b('5R jadi kebiasaan')
    ]
  }
];

export const TOTAL_BUTIR = INSTRUMENTS.reduce((n, i) => n + i.butir.length, 0);

const PETA_SLUG = new Map(INSTRUMENTS.map((i) => [i.slug, i]));

export function getInstrumen(slug) {
  return PETA_SLUG.get(slug) || null;
}

export function getSurveyUrl(slug) {
  return PETA_SLUG.get(slug)?.url || null;
}

/* Alias nama_instrumen dari database â†’ slug konfigurasi.
   Pencocokan tidak sensitif huruf besar/kecil dan spasi. */
export const ALIAS_INSTRUMEN = {
  spip: 'spip',
  surveipenilaianinternalspip: 'spip',
  penerapanspip: 'spip',
  spak: 'spak',
  surveipersepsiantikorupsi: 'spak',
  spkp: 'spkp',
  surveipersepsikualitaspelayanan: 'spkp',
  gratifikasi: 'gratifikasi',
  pengendaliangratifikasi: 'gratifikasi',
  surveipemahamangratifikasi: 'gratifikasi',
  benturan: 'benturan',
  penangananbenturankepentingan: 'benturan',
  surveibenturankepentingan: 'benturan',
  wbs: 'wbs',
  whistleblowingsystem: 'wbs',
  whistleblowingsystemwbs: 'wbs',
  pengaduan: 'pengaduan',
  pengaduanmasyarakat: 'pengaduan',
  budayazi: 'budaya-zi',
  budaya: 'budaya-zi',
  budayaintegritaszi: 'budaya-zi',
  surveibudayazonaintegritas: 'budaya-zi',
  pensjoss: 'pens-joss',
  budayakerjapensjoss: 'pens-joss',
  surveilayananpensjoss: 'pens-joss',
  '5r': '5r',
  implementasi5r: '5r',
  surveiimplementasi5r: '5r'
};

export function normalisasiKunci(nama) {
  return String(nama || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function slugDariNamaInstrumen(nama) {
  const kunci = normalisasiKunci(nama);
  if (!kunci) return null;
  if (ALIAS_INSTRUMEN[kunci]) return ALIAS_INSTRUMEN[kunci];
  const langsung = INSTRUMENTS.find(
    (i) => normalisasiKunci(i.slug) === kunci
      || normalisasiKunci(i.nama) === kunci
      || normalisasiKunci(i.namaPanjang) === kunci
  );
  return langsung ? langsung.slug : null;
}

/* Metadata ringkas untuk tabel/daftar. */
export const SURVEI_DESKRIPSI = Object.fromEntries(INSTRUMENTS.map((i) => [i.slug, i.deskripsi]));

export const SURVEI_INFO = INSTRUMENTS.map((i) => ({
  key: i.slug,
  nama: i.nama,
  namaPanjang: i.namaPanjang,
  kategori: i.kategori,
  kelompok: i.kelompok,
  url: i.url,
  requiresGoogleLogin: i.requiresGoogleLogin,
  deskripsi: i.deskripsi,
  jumlahButir: i.butir.length
}));

