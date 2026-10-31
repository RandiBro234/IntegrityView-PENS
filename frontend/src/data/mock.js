/* Modul data non-survei: format angka, kontak, autentikasi demo, dan tiket
   pengaduan/WBS. Seluruh angka survei berasal dari src/data/surveyData.js. */

export function formatAngka(x, desimal = 1) {
  const n = Number(x);
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(desimal).replace('.', ',');
}

export const KONTAK = {
  unit: 'Satuan Pengawasan Internal (SPI) PENS',
  email: 'spi@pens.ac.id',
  telp: '(031) 594-7280',
  wa: '0811-3200-202',
  alamat: 'Jl. Raya ITS, Keputih, Sukolilo, Surabaya 60111'
};

/* WBS dan Pengaduan tetap instrumen survei: satuannya "responden".
   Jumlah laporan tiket adalah modul terpisah. */
export function labelPartisipan(s) {
  return `${Number(s.responden || 0).toLocaleString('id-ID')} responden`;
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

/* Profil: pengisian survei lewat Google Form, jadi aplikasi tidak menyimpan
   riwayat pengisian survei per pengguna. */
export function getProfilDetail() {
  const s = getSession();
  const role = ROLES[s?.role] || null;

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
      laporanDibuat: laporanUser.length,
      akunAktif: role ? 1 : 0
    },
    laporanUser
  };
}

/* ================= Pengaduan & WBS (modul tiket, terpisah dari survei) ================= */

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
/* Seed demo bisa dimatikan di produksi tanpa menghapus fallback lokal. */
const DEMO_LAPORAN = String(import.meta.env.VITE_ENABLE_DEMO_LAPORAN ?? 'true') !== 'false';

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
  const seed = DEMO_LAPORAN ? PENGADUAN_SEED.filter((p) => !diEdit.has(p.id)) : [];
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

/* Simpan/mirror laporan ke localStorage. Dipakai sebagai fallback demo dan
   agar laporan yang baru dikirim langsung muncul di halaman lacak/kelola
   pada browser yang sama. */
export function simpanPengaduanLokal(record) {
  const arr = bacaAduanLokal();
  const idx = arr.findIndex((p) => p.id === record.id);
  if (idx >= 0) arr[idx] = record; else arr.push(record);
  tulisAduanLokal(arr);
  return record;
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
    balasan: [],
    lampiran: []
  };
  return simpanPengaduanLokal(record);
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
