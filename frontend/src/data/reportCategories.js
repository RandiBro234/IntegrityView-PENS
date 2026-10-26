/* Satu-satunya sumber kategori kanal pelaporan (Whistleblowing System).

   Kanal ini hanya menangani dugaan pelanggaran integritas. Keluhan fasilitas
   dan kepuasan layanan dialihkan ke SatisView, bukan diproses di sini.

   Field tiap kategori:
   - key              : kunci stabil yang disimpan pada laporan baru
   - label            : teks yang tampil di form, chip, dan filter
   - group            : kunci grup untuk <optgroup>
   - instrumenTerkait : instrumen survei yang butirnya menjadi dasar kategori
   - deskripsi        : satu kalimat penjelas
   - contoh           : contoh singkat agar pelapor tahu batas kategorinya
*/

/* TODO: isi alamat SatisView yang sebenarnya.
   Selama kosong, nama SatisView ditampilkan sebagai teks biasa tanpa tautan
   supaya tidak ada tautan mati. */
export const SATISVIEW_URL = '';

export const SATISVIEW_NAMA = 'SatisView';

export const GRUP_KATEGORI = [
  { key: 'korupsi', label: 'Korupsi & Penyuapan' },
  { key: 'wewenang', label: 'Penyalahgunaan Wewenang & Prosedur' },
  { key: 'etika', label: 'Etika & Perlindungan Pelapor' }
];

export const KATEGORI_LAPORAN = [
  {
    key: 'gratifikasi',
    label: 'Gratifikasi',
    group: 'korupsi',
    instrumenTerkait: ['Gratifikasi'],
    deskripsi: 'Pemberian uang, barang, atau fasilitas dari pihak yang terkait pekerjaan dan tidak dilaporkan melalui saluran resmi.',
    contoh: 'Honor tidak resmi dari vendor, hadiah dari penyedia jasa, atau fasilitas pribadi dari mitra.'
  },
  {
    key: 'pungli',
    label: 'Pungutan Liar (Pungli)',
    group: 'korupsi',
    instrumenTerkait: ['SPAK', 'SPKP'],
    deskripsi: 'Permintaan atau ekspektasi pembayaran di luar ketentuan sebagai syarat kelancaran layanan.',
    contoh: 'Uang pelicin untuk mempercepat surat, biaya tambahan yang tidak tercantum pada tarif resmi.'
  },
  {
    key: 'korupsi_suap',
    label: 'Korupsi & Suap',
    group: 'korupsi',
    instrumenTerkait: ['SPAK'],
    deskripsi: 'Layanan atau keputusan yang dimanipulasi, disuap, atau berpihak demi keuntungan pihak tertentu.',
    contoh: 'Pengadaan yang diarahkan ke satu vendor, pembayaran untuk meloloskan hasil tertentu.'
  },
  {
    key: 'benturan_kepentingan',
    label: 'Benturan Kepentingan',
    group: 'korupsi',
    instrumenTerkait: ['Benturan'],
    deskripsi: 'Keputusan atau penanganan yang dipengaruhi kepentingan pribadi, keluarga, atau pihak lain yang berhubungan.',
    contoh: 'Atasan menyetujui pengadaan dari perusahaan kerabat tanpa deklarasi konflik.'
  },
  {
    key: 'manipulasi_wewenang',
    label: 'Manipulasi Data & Penyalahgunaan Wewenang',
    group: 'wewenang',
    instrumenTerkait: ['SPAK', 'SPIP', 'Budaya ZI'],
    deskripsi: 'Data, laporan, atau prosedur diubah atau digunakan untuk menguntungkan pihak tertentu.',
    contoh: 'Rekap kegiatan dibuat berbeda dari pelaksanaan, akses sistem dipakai untuk kepentingan pribadi.'
  },
  {
    key: 'diskriminasi',
    label: 'Perlakuan Tidak Adil & Diskriminasi',
    group: 'wewenang',
    instrumenTerkait: ['SPAK'],
    deskripsi: 'Perlakuan berbeda berdasarkan jabatan, kedekatan personal, unit kerja, atau latar belakang tertentu.',
    contoh: 'Prioritas layanan hanya untuk orang dekat, permintaan berbeda untuk mahasiswa tertentu.'
  },
  {
    key: 'prosedur_tarif',
    label: 'Penyimpangan Prosedur & Tarif Layanan',
    group: 'wewenang',
    instrumenTerkait: ['SPKP', 'SPAK'],
    deskripsi: 'Prosedur atau tarif layanan dijalankan menyimpang dari ketentuan resmi yang berlaku.',
    contoh: 'Persyaratan yang tidak diumumkan, tarif berbeda dari informasi resmi, jalur perantara.'
  },
  {
    key: 'pengendalian_internal',
    label: 'Kelemahan Pengendalian Internal',
    group: 'wewenang',
    instrumenTerkait: ['SPIP'],
    deskripsi: 'Pengawasan, pemisahan tugas, dokumentasi, atau tindak lanjut temuan tidak berjalan semestinya.',
    contoh: 'Satu orang memegang seluruh tahap transaksi, temuan audit tidak ditindaklanjuti.'
  },
  {
    key: 'etik_disiplin',
    label: 'Pelanggaran Kode Etik & Disiplin',
    group: 'etika',
    instrumenTerkait: ['SPIP', 'Budaya ZI', 'PENS JOSS'],
    deskripsi: 'Perilaku yang melanggar kode etik, disiplin kerja, atau keteladanan yang seharusnya dijaga.',
    contoh: 'Ketidakhadiran tanpa keterangan, perlakuan tidak pantas, keteladanan pimpinan yang lemah.'
  },
  {
    key: 'pembalasan_pelapor',
    label: 'Ancaman atau Pembalasan terhadap Pelapor',
    group: 'etika',
    instrumenTerkait: ['WBS'],
    deskripsi: 'Tekanan, ancaman, atau tindakan pembalasan yang diarahkan kepada pelapor atau saksi.',
    contoh: 'Penurunan penilaian kinerja setelah melapor, ancaman agar tidak melanjutkan laporan.'
  },
  {
    key: 'lainnya',
    label: 'Dugaan Pelanggaran Integritas Lainnya',
    group: 'etika',
    instrumenTerkait: ['SPAK', 'SPKP', 'SPIP', 'Gratifikasi', 'Benturan', 'WBS', 'Budaya ZI', 'PENS JOSS', '5R'],
    deskripsi: 'Dugaan pelanggaran integritas yang tidak tercakup kategori lain.',
    contoh: 'Kejadian yang belum jelas kategorinya namun berpotensi melanggar integritas.'
  }
];

/* Label tampilan untuk tiga kategori lama yang kini dialihkan ke SatisView.
   Datanya tidak dihapus agar admin tetap bisa membuka laporan lama. */
export const LABEL_DIALIHKAN = 'Layanan & fasilitas (dialihkan ke SatisView)';

/* Pemetaan nilai kategori LAMA (tersimpan sebagai label) ke kunci baru.
   Dipakai hanya di lapisan tampilan; data tersimpan tidak diubah. */
const PETA_LAMA = {
  kedisiplinan: 'etik_disiplin',
  pungli: 'pungli',
  gratifikasi: 'gratifikasi',
  'benturan kepentingan': 'benturan_kepentingan',
  lainnya: 'lainnya',
  'fasilitas/sarana': 'layanan_fasilitas',
  'administrasi/birokrasi': 'layanan_fasilitas',
  'kualitas pelayanan': 'layanan_fasilitas'
};

const PETA_KATEGORI = new Map(KATEGORI_LAPORAN.map((k) => [k.key, k]));

export function normalisasiKategori(nilai) {
  return String(nilai || '').trim().toLowerCase();
}

/* Kunci kategori untuk nilai apa pun (baru atau lama). */
export function kunciKategori(nilai) {
  const n = normalisasiKategori(nilai);
  if (!n) return null;
  if (PETA_KATEGORI.has(n)) return n;
  return PETA_LAMA[n] || null;
}

/* Label yang ditampilkan untuk nilai kategori apa pun. */
export function labelKategori(nilai) {
  const kunci = kunciKategori(nilai);
  if (kunci === 'layanan_fasilitas') return LABEL_DIALIHKAN;
  if (kunci && PETA_KATEGORI.has(kunci)) return PETA_KATEGORI.get(kunci).label;
  return String(nilai || 'Tanpa kategori');
}

export function deskripsiKategori(nilai) {
  const kunci = kunciKategori(nilai);
  if (!kunci || !PETA_KATEGORI.has(kunci)) return '';
  return PETA_KATEGORI.get(kunci).deskripsi;
}

export function contohKategori(nilai) {
  const kunci = kunciKategori(nilai);
  if (!kunci || !PETA_KATEGORI.has(kunci)) return '';
  return PETA_KATEGORI.get(kunci).contoh;
}

/* Daftar kategori dikelompokkan sesuai urutan GRUP_KATEGORI. */
export function kategoriPerGrup() {
  return GRUP_KATEGORI.map((grup) => ({
    ...grup,
    kategori: KATEGORI_LAPORAN.filter((k) => k.group === grup.key)
  }));
}

/* Opsi filter admin: kategori baru + satu opsi untuk data lama. */
export function opsiFilterKategori() {
  return [
    ...kategoriPerGrup().map((grup) => ({
      label: grup.label,
      opsi: grup.kategori.map((k) => ({ value: k.key, label: k.label }))
    })),
    {
      label: 'Data lama',
      opsi: [{ value: 'layanan_fasilitas', label: LABEL_DIALIHKAN }]
    }
  ];
}

/* Apakah laporan memakai kategori yang dialihkan ke SatisView? */
export function dialihkanKeSatisView(nilai) {
  return kunciKategori(nilai) === 'layanan_fasilitas';
}
