/* Satu sumber kebenaran untuk instrumen: slug, nama, tautan Google Form,
   jumlah butir, dan alias nama_instrumen dari database.
   Teks butir dipakai persis; `label` adalah versi pendek untuk grafik. */

export const SKALA = [
  { nilai: 1, label: 'Sangat Tidak Setuju', singkat: 'STS', warna: '#C25E1E' },
  { nilai: 2, label: 'Tidak Setuju', singkat: 'TS', warna: '#F5843C' },
  { nilai: 3, label: 'Setuju', singkat: 'S', warna: '#7FA8D9' },
  { nilai: 4, label: 'Sangat Setuju', singkat: 'SS', warna: '#0B1B33' }
];

/* Ambang rekomendasi — satu tempat agar mudah diubah. */
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
      b('Pimpinan & pegawai mengutamakan etika, integritas, dan aturan', 'Pimpinan dan pegawai selalu bekerja dengan mengutamakan etika, integritas, dan aturan yang berlaku.'),
      b('Pegawai paham tugas, tanggung jawab, dan batas kewenangan', 'Setiap pegawai memahami tugas, tanggung jawab, dan batas kewenangannya dengan jelas.'),
      b('Risiko diperhitungkan sejak perencanaan hingga pelaksanaan', 'Risiko dan hambatan pekerjaan selalu diperhitungkan sejak awal perencanaan hingga pelaksanaan.'),
      b('Pemeriksaan & persetujuan berjalan sesuai ketentuan', 'Proses pemeriksaan dan persetujuan dalam pekerjaan telah berjalan dengan baik sesuai ketentuan.'),
      b('Kesalahan atau masalah yang ditemukan segera diperbaiki', 'Setiap kesalahan atau masalah yang ditemukan saat bekerja selalu segera diperbaiki.'),
      b('Informasi & data pendukung jelas dan mudah diakses', 'Informasi dan data pendukung pekerjaan tersedia dengan jelas dan mudah diakses.'),
      b('Hasil kerja dievaluasi rutin & kekurangan ditindaklanjuti', 'Hasil kerja dievaluasi secara rutin, dan setiap kekurangan langsung ditindaklanjuti.'),
      b('Prestasi & kontribusi pegawai diberi penghargaan layak', 'Prestasi dan kontribusi pegawai diberikan penghargaan secara layak.'),
      b('Reward & punishment mendorong disiplin dan kepatuhan', 'Penerapan reward dan punishment mendorong disiplin, integritas, dan kepatuhan.')
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
      b('Layanan diberikan jujur, transparan, dan sesuai ketentuan', 'Layanan di institusi ini diberikan secara jujur, transparan, dan sesuai ketentuan yang berlaku.'),
      b('Layanan adil tanpa membedakan jabatan, kedekatan, atau unit', 'Layanan diberikan secara adil kepada semua pihak, tanpa membeda-bedakan berdasarkan jabatan, kedekatan personal, atau unit kerja.'),
      b('Bebas manipulasi data dan keberpihakan pihak tertentu', 'Proses layanan bebas dari manipulasi data, penyalahgunaan prosedur, atau keberpihakan kepada pihak tertentu.'),
      b('Tidak ada permintaan uang, hadiah, atau fasilitas di luar ketentuan', 'Tidak ada permintaan atau ekspektasi pemberian uang, hadiah, atau fasilitas di luar ketentuan sebagai syarat atau kelancaran layanan.'),
      b('Layanan diakses langsung tanpa perantara agar cepat', 'Layanan dapat diakses langsung sesuai prosedur tanpa perlu menggunakan perantara agar urusan lebih mudah atau cepat.'),
      b('Layanan secara keseluruhan berintegritas dan bebas korupsi', 'Secara keseluruhan, layanan di institusi ini telah dilaksanakan dengan integritas dan bebas dari praktik korupsi.')
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
      b('Prosedur pelayanan terstruktur, ringkas, dan mudah diakses', 'Prosedur pelayanan terstruktur secara jelas, ringkas, dan mudah diakses.'),
      b('Persyaratan administratif transparan, relevan, mudah dipenuhi', 'Persyaratan administratif pelayanan transparan, relevan, dan mudah dipenuhi.'),
      b('Informasi tarif disampaikan terbuka & sesuai regulasi resmi', 'Informasi tarif atau biaya pelayanan disampaikan secara terbuka dan sesuai regulasi resmi.'),
      b('Penyelesaian layanan tepat waktu sesuai standar pelayanan', 'Penyelesaian pelayanan tepat waktu sesuai dengan standar pelayanan yang ditetapkan.'),
      b('Petugas responsif, solutif, dan kompeten menanggapi kebutuhan', 'Petugas bersikap responsif, solutif, dan kompeten dalam menanggapi kebutuhan pemohon layanan.'),
      b('Output layanan akurat, berkualitas, dan memenuhi standar', 'Output pelayanan yang diterima akurat, berkualitas, dan memenuhi standar yang dipersyaratkan.'),
      b('Sarana fisik & sistem informasi memadai dan berfungsi optimal', 'Sarana fisik dan infrastruktur sistem informasi pelayanan memadai serta berfungsi optimal.'),
      b('Keluhan & permohonan informasi mudah diakses dan ditindaklanjuti', 'Mekanisme penyampaian keluhan dan permohonan informasi mudah diakses serta ditindaklanjuti secara efektif.')
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
      b('Pemberian dari pihak terkait pekerjaan termasuk gratifikasi', 'Saya memahami bahwa pemberian uang, barang, atau fasilitas dari pihak yang terkait dengan pekerjaan saya dapat termasuk kategori gratifikasi.'),
      b('Mengenali pemberian yang harus ditolak atau dilaporkan', 'Saya dapat mengidentifikasi situasi di mana pemberian dari mahasiswa, orang tua/wali, mitra, atau penyedia jasa harus ditolak atau dilaporkan.'),
      b('Mengetahui saluran resmi pelaporan gratifikasi', 'Saya mengetahui saluran atau mekanisme resmi untuk melaporkan penerimaan gratifikasi di institusi ini.'),
      b('Ada komitmen lingkungan kerja menolak pemberian', 'Saya melihat adanya komitmen nyata di lingkungan kerja saya untuk menolak pemberian yang dapat memengaruhi objektivitas dalam pelaksanaan tugas.'),
      b('Informasi menolak & melapor sudah disampaikan jelas', 'Informasi mengenai gratifikasi, cara menolak, dan cara melaporkannya telah disampaikan secara jelas kepada saya.')
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
      b('Hubungan personal tidak memengaruhi keputusan kedinasan', 'Saya memahami bahwa hubungan personal atau afiliasi tertentu tidak boleh memengaruhi keputusan kedinasan.'),
      b('Mengenali potensi benturan di pengadaan & rekruitmen', 'Saya mengenali potensi benturan kepentingan dalam pengadaan, penilaian, rekruitmen, dan pengambilan keputusan.'),
      b('Potensi benturan dicegah sebelum berdampak ke kerja', 'Potensi benturan kepentingan dapat diidentifikasi dan dicegah sebelum berdampak pada proses kerja.'),
      b('Mengetahui prosedur & kanal pelaporan benturan', 'Saya mengetahui prosedur dan kanal pelaporan indikasi benturan kepentingan di lingkungan instansi.'),
      b('Tata kelola mencegah intervensi pihak berkepentingan', 'Institusi menerapkan tata kelola penanganan yang efektif guna mencegah intervensi pihak berkepentingan.'),
      b('Ditangani objektif, adil, dan sesuai aturan normatif', 'Penanganan benturan kepentingan diselesaikan secara objektif, adil, dan berlandaskan aturan normatif.')
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
      b('Pengetahuan ketersediaan sistem WBS resmi institusi'),
      b('Pemahaman klasifikasi pelanggaran etik & hukum'),
      b('Kemudahan akses informasi & prosedur pelaporan'),
      b('Jaminan perlindungan pelapor dari ancaman & tekanan'),
      b('Kerahasiaan identitas pelapor & substansi laporan'),
      b('Keyakinan tindak lanjut yang objektif & transparan')
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
      b('Kanal pengaduan beragam & mudah ditemukan', 'Kanal pengaduan tersedia dalam beberapa pilihan (tatap muka, surat, telepon, dan daring), aktif, serta mudah ditemukan oleh masyarakat.'),
      b('Alur, bukti, dan estimasi waktu penyelesaian jelas', 'Alur pengaduan dijelaskan secara jelas mulai dari cara mengirim, bukti yang perlu dilampirkan, hingga perkiraan waktu penyelesaian.'),
      b('Respons awal cepat & diteruskan ke unit tepat', 'Setiap pengaduan mendapat respons awal dan diteruskan ke unit penanggung jawab yang tepat secara cepat.'),
      b('Diselesaikan sampai akar masalah, bukan formalitas', 'Pengaduan diselesaikan sampai akar masalahnya, bukan hanya ditutup secara administratif.'),
      b('Pelapor dapat melacak status & progres sendiri', 'Status dan progres pengaduan dapat dilacak oleh pelapor kapan saja tanpa harus menanyakan langsung ke petugas.'),
      b('Hasil tindak lanjut dijelaskan kembali ke pelapor', 'Hasil tindak lanjut disampaikan kembali kepada pelapor disertai penjelasan yang dapat dipercaya dan dipertanggungjawabkan.')
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
      b('Urgensi Zona Integritas bagi tata kelola bersih'),
      b('Komitmen nyata pimpinan memberantas korupsi'),
      b('Keteladanan pimpinan dalam disiplin & etika'),
      b('Kepatuhan dosen & tendik pada kode etik'),
      b('Budaya menolak manipulasi data & kecurangan'),
      b('Proaktif melaporkan indikasi penyimpangan'),
      b('Implementasi nyata, bukan sekadar administratif')
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
      b('Pemahaman filosofi & esensi nilai budaya kerja PENS JOSS'),
      b('Sosialisasi nilai yang tertanam konsisten pada seluruh pegawai'),
      b('Penerapan prinsip PENS JOSS berkesinambungan dalam tugas kedinasan'),
      b('Nilai tercermin pada pola koordinasi, etos kerja & kualitas layanan'),
      b('Keteladanan pimpinan dalam proses kerja & pengambilan kebijakan'),
      b('Transformasi nilai menjadi identitas budaya organisasi yang riil')
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
      b('5R pilar lingkungan tertata, bersih & produktif', 'Saya memahami konsep 5R sebagai pilar terciptanya lingkungan institusi yang tertata, bersih, dan produktif.'),
      b('Seleksi & eliminasi material tak diperlukan', 'Penataan area kerja/layanan dilakukan dengan menyeleksi dan mengeliminasi material yang tidak diperlukan.'),
      b('Sarana & dokumen ditata ergonomis pada tempatnya', 'Sarana, dokumen, dan fasilitas ditempatkan secara ergonomis dan terorganisasi pada tempatnya.'),
      b('Kebersihan ruang kerja & area publik berkelanjutan', 'Ruang kerja, sarana pendidikan, dan area publik dijaga kebersihannya secara berkelanjutan.'),
      b('Pemeliharaan infrastruktur kampus tertib & andal', 'Pemeliharaan berkala terhadap infrastruktur kampus berjalan tertib demi menjamin keandalan fungsi.'),
      b('Disiplin mandiri menjaga tertib, bersih & rapi', 'Setiap insan institusi memiliki kedisiplinan mandiri dalam memelihara ketertiban, kebersihan, dan kerapian.'),
      b('Kebijakan 5R jadi standar operasional & kebiasaan', 'Kebijakan 5R telah menjadi standar operasional dan kebiasaan kerja sehari-hari di seluruh unit.')
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

/* Alias nama_instrumen dari database → slug konfigurasi.
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

