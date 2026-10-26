# PRD — IntegrityView
## Platform Analitik Zona Integritas PENS
### Versi 3.0 | September 2026

---

## Daftar Isi

1. [Identitas & Ringkasan Produk](#1-identitas--ringkasan-produk)
2. [Latar Belakang & Masalah yang Diselesaikan](#2-latar-belakang--masalah-yang-diselesaikan)
3. [Tujuan & Sasaran](#3-tujuan--sasaran)
4. [Pengguna & Aktor](#4-pengguna--aktor)
5. [Fitur & Fungsionalitas Per Halaman](#5-fitur--fungsionalitas-per-halaman)
6. [Data Model & Logika Bisnis](#6-data-model--logika-bisnis)
7. [Sistem Autentikasi & Otorisasi](#7-sistem-autentikasi--otorisasi)
8. [User Flows](#8-user-flows)
9. [Acceptance Criteria](#9-acceptance-criteria)
10. [Batasan & Keputusan Teknis](#10-batasan--keputusan-teknis)
11. [Ruang Lingkup & Out of Scope](#11-ruang-lingkup--out-of-scope)
12. [Rencana Masa Depan](#12-rencana-masa-depan)

---

## 1. Identitas & Ringkasan Produk

| Atribut | Detail |
|---|---|
| **Nama Produk** | IntegrityView |
| **Nama Lengkap** | IntegrityView — Platform Analitik Zona Integritas PENS |
| **Versi Dokumen** | 3.0 |
| **Tanggal** | September 2026 |
| **Status** | Prototype Aktif (v2) |
| **Institusi** | Politeknik Elektronika Negeri Surabaya (PENS) |
| **Jenis Sistem** | Platform Web Statis (Static Frontend Prototype) |
| **Bahasa Antarmuka** | Indonesia |
| **Model Akses** | Publik (sebagian besar) + Admin (sebagian kecil) |

### 1.1 Ringkasan Eksekutif

IntegrityView adalah platform digital untuk memonitoring dan mendokumentasikan capaian Zona Integritas (ZI) PENS. Platform ini menyatukan tiga fungsi utama:

**Fungsi 1 — Pusat Survei ZI**
PENS memiliki 10 instrumen survei integritas yang wajib diisi oleh sivitas (dosen, tendik, mahasiswa) dan masyarakat umum. Platform ini menjadi satu-satunya pintu masuk untuk semua instrumen, menggantikan pendekatan link-link tersebar di berbagai kanal komunikasi.

**Fungsi 2 — Dashboard Analitik Publik**
Skor dan tren dari survei diolah menjadi indeks terukur dan ditampilkan di dashboard yang terbuka untuk umum tanpa perlu login. Pimpinan dan assessor ZI bisa langsung melihat data tanpa meminta laporan manual.

**Fungsi 3 — Kanal Pengaduan & Whistleblowing**
Platform menyediakan dua jalur pelaporan: Pengaduan Masyarakat (untuk masalah fasilitas, layanan, administrasi) dan Whistleblowing System atau WBS (untuk dugaan pelanggaran integritas). Keduanya mendukung pelaporan anonim dan pelacakan status via kode tracking.

### 1.2 Stack Teknologi

| Komponen | Teknologi | Catatan |
|---|---|---|
| Markup | HTML5 (Vanilla) | Tidak ada framework |
| Styling | CSS3 (Vanilla) | Tidak ada preprocessor |
| Logic | JavaScript (Vanilla, ES2020+) | Tidak ada bundler |
| Chart | Chart.js 4.4.3 | CDN, butuh internet |
| Font | Google Fonts | Butuh internet |
| Storage | localStorage + sessionStorage | Browser-side only |
| Kriptografi | Web Crypto API (crypto.subtle) | SHA-256, butuh HTTPS/localhost |

---

## 2. Latar Belakang & Masalah yang Diselesaikan

### 2.1 Konteks Program Zona Integritas

Zona Integritas (ZI) adalah program nasional Kementerian PANRB untuk mendorong birokrasi pemerintah yang bersih, bebas korupsi, dan berorientasi layanan. Perguruan tinggi negeri seperti PENS wajib mengikuti program ini dan membuktikan capaiannya kepada assessor eksternal melalui survei terstandar dan mekanisme pengaduan yang transparan.

### 2.2 Masalah Sebelum IntegrityView

| Masalah | Dampak |
|---|---|
| 10 link survei tersebar via WhatsApp secara terpisah | Sivitas bingung, partisipasi tidak terpantau |
| Tidak ada dashboard publik untuk data ZI | Assessor tidak bisa melihat data tanpa laporan manual |
| Kanal pengaduan tidak terdigitalisasi | Pelapor tidak tahu status tindak lanjut |
| Data tersebar di berbagai spreadsheet | Admin butuh waktu lebih untuk menyusun laporan asesmen |

### 2.3 Nilai yang Diberikan IntegrityView

- Satu URL untuk semua kebutuhan ZI sivitas dan masyarakat
- Dashboard yang bisa ditunjukkan langsung kepada assessor sebagai bukti transparansi
- Kode tracking untuk setiap laporan sehingga pelapor bisa memantau tindak lanjut
- Rekap data yang bisa diekspor sebagai lampiran dokumen asesmen formal

---

## 3. Tujuan & Sasaran

### 3.1 Tujuan Utama

| No | Tujuan | Deskripsi |
|---|---|---|
| T1 | Sentralisasi Survei | Satu platform untuk semua 10 instrumen survei ZI |
| T2 | Transparansi Publik | Dashboard terbuka tanpa login untuk sivitas, publik, dan assessor |
| T3 | Kanal Pelaporan Aman | Pengaduan dan WBS yang mudah diakses, anonim jika dipilih, dan bisa dilacak |
| T4 | Fondasi Backend-Ready | Prototype yang strukturnya siap disambung ke backend nyata tanpa menulis ulang antarmuka |

### 3.2 Sasaran Terukur (Success Criteria)

Karena ini adalah prototype statis dengan data simulasi, keberhasilan diukur dari kelengkapan fitur dan kualitas pengalaman pengguna, bukan data operasional nyata.

| Sasaran | Indikator Keberhasilan |
|---|---|
| Semua 10 instrumen survei tersedia | 10 link Google Form aktif tampil di hub survei |
| Dashboard dapat dipahami tanpa panduan | Penguji baru bisa navigasi tanpa instruksi |
| Admin dapat mengelola pengaduan | Alur update status berjalan tanpa error |
| Pelapor dapat melacak pengaduan | Input kode ID menampilkan status yang benar |
| Chatbot menjawab intent pengguna | Minimal 15 intent berbeda direspons dengan teks relevan |
| Platform bisa diakses di mobile | Tidak ada elemen overflow di viewport lebar 390px |
| Login terlindungi dari brute-force | Lockout aktif setelah 5 kegagalan berturut-turut |

### 3.3 Yang Bukan Tujuan Platform Ini

- Menggantikan Google Forms sebagai alat pengumpulan data survei
- Menyediakan analitik demografis atau korelasi antar instrumen
- Menjadi sistem manajemen dokumen ZI
- Menyediakan komunikasi dua arah antara admin dan pelapor
- Mengelola akun pengguna selain satu akun admin
- Integrasi dengan sistem kepegawaian atau akademik PENS

---

## 4. Pengguna & Aktor

### 4.1 Ringkasan Aktor

| Aktor | Perlu Login | Halaman yang Bisa Diakses |
|---|---|---|
| Sivitas PENS (Dosen/Tendik/Mahasiswa) | Tidak | Semua halaman publik |
| Masyarakat Umum | Tidak | Semua halaman publik |
| Pimpinan PENS | Tidak | Dashboard, landing, survei (baca saja) |
| Admin ZI | Ya | Semua halaman + manajemen pengaduan + laporan penuh |

### 4.2 Persona Pengguna

#### Persona 1 — Sivitas PENS (Dosen/Tendik)

**Profil:** Berusia 35-55 tahun, literasi digital menengah, keseharian akademis.

**Kebutuhan:**
- Menemukan semua survei ZI dari satu halaman
- Mengetahui survei mana yang sudah diisi
- Melaporkan pelanggaran integritas secara anonim jika perlu

**Pain Points:** Bingung dengan banyak link berbeda, tidak tahu survei mana yang sudah diisi, takut melapor tanpa jaminan kerahasiaan.

#### Persona 2 — Mahasiswa PENS

**Profil:** Berusia 20-23 tahun, literasi digital tinggi, aktif di media sosial.

**Kebutuhan:**
- Mengisi survei yang diminta dosen dengan cepat
- Membuat pengaduan tentang fasilitas kampus
- Melacak status pengaduan tanpa perlu login

**Pain Points:** Merasa pengaduan ke kampus tidak ada tindak lanjutnya, tidak mau menyebut nama saat melapor dugaan pungli.

#### Persona 3 — Masyarakat Umum

**Profil:** Berusia 45-55 tahun, literasi digital dasar hingga menengah, sesekali berurusan dengan PENS.

**Kebutuhan:**
- Melapor masalah layanan PENS tanpa harus datang langsung
- Memilih anonim jika diperlukan
- Melacak tindak lanjut dengan mudah

**Pain Points:** Tidak tahu harus lapor ke mana, khawatir laporan tidak diproses.

#### Persona 4 — Pimpinan PENS

**Profil:** Berusia 45-60 tahun, literasi digital menengah, butuh informasi ringkas dan visual.

**Kebutuhan:**
- Melihat ringkasan skor ZI terkini dalam satu layar
- Memantau instrumen yang di bawah benchmark
- Data yang bisa ditunjukkan kepada assessor tanpa login

**Pain Points:** Tidak punya waktu membaca laporan panjang, tidak ingin login hanya untuk melihat data publik.

#### Persona 5 — Admin Zona Integritas

**Profil:** Berusia 28-40 tahun, literasi digital tinggi, staf Unit Penjaminan Mutu PENS.

**Kebutuhan:**
- Login aman untuk akses halaman manajemen
- Visibilitas semua laporan dalam satu tampilan
- Mencatat catatan internal yang tidak terlihat pelapor
- Filter laporan berdasarkan status dan kategori
- Ekspor data rekap untuk lampiran dokumen asesmen

### 4.3 Matriks Akses Per Halaman

| Halaman | Sivitas | Masyarakat | Pimpinan | Admin |
|---|---|---|---|---|
| Landing Page | Baca | Baca | Baca | Baca |
| Dashboard | Baca | Baca | Baca | Baca penuh |
| Pusat Survei | Baca + Isi | Baca | Baca | Baca + Isi |
| Form Survei Internal | Isi | Isi | - | Isi |
| Form Pengaduan Baru | Submit | Submit | - | Submit |
| Lacak Pengaduan | Lacak | Lacak | - | Lacak |
| Manajemen Pengaduan | - | - | - | Kelola |
| Laporan & Rekap | - | - | Baca terbatas | Baca penuh + Ekspor |
| Login | - | - | - | Login |

> **Catatan "Baca terbatas" pada laporan:** Halaman tidak redirect jika bukan admin, melainkan konten diganti dengan pesan "Akses Terbatas". Data penuh hanya tampil setelah login.

### 4.4 Perilaku Sistem Berdasarkan Status Login

**Navbar:**
- Tamu: tombol "Masuk" di kanan
- Admin: avatar + nama + role badge + tombol "Keluar"

**Link "Pengaduan":**
- Tamu: menuju form pengaduan baru
- Admin: menuju halaman manajemen pengaduan

**Link "Laporan":**
- Tamu: tidak tampil
- Admin: tampil

**Dashboard:**
- Tamu: badge "Akses Publik"
- Admin: nama admin

---

## 5. Fitur & Fungsionalitas Per Halaman

### 5.1 Daftar Halaman

| No | File | Akses | Fungsi |
|---|---|---|---|
| 1 | `index.html` | Publik | Landing page dan entry point |
| 2 | `pages/dashboard.html` | Publik | Dashboard monitoring ZI |
| 3 | `pages/survei.html` | Publik | Hub 10 instrumen survei |
| 4 | `pages/survei-spak.html` | Publik | Form survei SPAK (orphaned fallback) |
| 5 | `pages/survei-spkp.html` | Publik | Form survei SPKP (orphaned fallback) |
| 6 | `pages/survei-wbs.html` | Publik | Form WBS dan pelaporan |
| 7 | `pages/pengaduan-baru.html` | Publik | Form pengaduan masyarakat |
| 8 | `pages/pengaduan-status.html` | Publik | Lacak status pengaduan by kode |
| 9 | `pages/pengaduan.html` | Admin | Manajemen pengaduan |
| 10 | `pages/laporan.html` | Admin (soft-gate) | Rekap laporan ZI |
| 11 | `pages/login.html` | - | Login admin |

---

### 5.2 Landing Page (`index.html`)

**Tujuan:** Menjadi wajah publik platform. Pengunjung pertama harus langsung memahami: ini platform apa, untuk siapa, dan apa yang bisa dilakukan.

**Komponen yang diperlukan:**

**Navbar Global**
- Dinjeksi via JavaScript, bukan statis di HTML
- Sticky di atas halaman
- Berubah konten sesuai status login (lihat bagian 4.4)

**Section Hero**
- Judul utama platform dengan deskripsi singkat
- Dua tombol CTA: satu menuju dashboard, satu menuju pusat survei
- Empat angka statistik kunci: jumlah instrumen, total responden, periode tren, jumlah laporan WBS
- Setiap statistik wajib berlabel "Data Simulasi"
- Cuplikan skor tiga instrumen utama (SPAK, SPKP, SPIP)

**Section Tentang ZI**
- Penjelasan singkat tentang program Zona Integritas
- Tiga manfaat utama platform dengan penjelasan singkat

**Section Grid 10 Instrumen Survei**
- Sepuluh kartu instrumen, masing-masing memuat: nama, deskripsi singkat, kategori, jumlah responden (statis), dan tombol langsung ke Google Form
- Satu kartu tambahan untuk menuju halaman pusat survei

**Section Cara Kerja**
- Empat langkah berurutan: Isi Survei, Data Terkumpul, Analitik Diproses, Visualisasi Publik

**Section Kanal Pengaduan**
- Dua kartu berdampingan: Pengaduan Masyarakat dan Whistleblowing System
- Setiap kartu memiliki CTA dan deskripsi perbedaan antar keduanya
- Kartu WBS menyebutkan ketersediaan pelaporan anonim

**Footer**
- Link navigasi utama
- Label "Data Simulasi" dan versi prototipe
- Informasi hak cipta

---

### 5.3 Dashboard (`pages/dashboard.html`)

**Tujuan:** Memvisualisasikan data ZI dalam satu layar tanpa scroll berlebihan. Terbuka untuk publik tanpa login.

**Aturan Viewport:** Layout fixed satu layar penuh (100vh, tanpa scroll body). Panel internal scroll secara mandiri. Di layar kecil (lebar < 1100px atau tinggi < 600px), scroll normal diizinkan sebagai fallback.

#### VIEW: Ringkasan (default)

**Baris KPI — 4 Kartu Angka Besar**
Sebelum chart, ada empat kartu statistik ringkasan:
- Instrumen Aktif: 10 dari 10
- Total Responden: 640+
- Rata-rata Skor ZI: 81.2% (vs benchmark 80%)
- Laporan Masuk: 411 (WBS + Pengaduan)

Data source: hard-coded HTML (angka simulasi).

**Area Chart — 3 Kolom**

Kolom 1 (terlebar): Chart garis tren skor 6 bulan
- Data: SPAK, SPKP, SPIP dari Maret hingga Agustus 2026
- Satu garis putus-putus: target 80%
- Tooltip interaktif

Kolom 2: Radar chart SPIP 5 Unsur
- Lima sumbu: Lingkungan Pengendalian, Penilaian Risiko, Kegiatan Pengendalian, Informasi & Komunikasi, Pemantauan
- Satu garis target putus-putus (75%)

Kolom 3: Daftar jumlah responden 5 instrumen
- Ditampilkan sebagai angka absolut
- Tidak ada persentase, tidak ada target responden

**Strip 10 Indikator**
- Sepuluh kartu ringkasan di bawah area chart
- Setiap kartu: nama singkat, skor atau jumlah, badge tren (naik/turun/datar)
- Klik kartu: URL berubah ke hash instrumen, masuk view detail

**Baris Aktivitas Terbaru**
- Lima item terbaru dari feed aktivitas platform
- Setiap item: tipe aktivitas (survei/laporan/peringatan), deskripsi, waktu relatif

#### VIEW: Detail Per Instrumen

Dipanggil via hash URL, contoh: `dashboard.html#spak`.

**Header Detail:**
- Nama panjang instrumen + badge kategori
- Tombol "Isi Survei" ke Google Form instrumen tersebut
- Label sumber data ("Data Simulasi Agustus 2026")
- Tombol "Kembali ke Ringkasan"

**Panel Skor & Aspek:**
- Angka skor besar
- Badge "Di atas Target" atau "Di bawah Target"
- Benchmark referensi dan jarak ke benchmark
- Lima aspek (Integritas, Transparansi, Akuntabilitas, Responsivitas, Kepatuhan)

**Panel Tren:**
- Chart garis tren 6 bulan khusus instrumen ini

**Panel Info:**
- Total responden absolut
- Kategori instrumen
- Untuk WBS dan Pengaduan: hitungan per status (Baru, Diproses, Selesai)

---

### 5.4 Pusat Survei (`pages/survei.html`)

**Tujuan:** Hub tunggal untuk semua 10 instrumen survei. Pengguna melihat semua survei, tahu mana yang sudah diisi, dan langsung mengisi yang belum.

**Komponen:**

**Section Hero**
- Judul dan deskripsi halaman
- Progress bar: "Sudah diisi: X dari 10 survei" (dihitung dari localStorage)

**Stats Bar**
- Empat angka: Total Instrumen, Total Responden, Instrumen Aktif, Periode

**Filter Kategori**
- Tombol filter: Semua, Integritas & Korupsi, Pelayanan Publik, Pelaporan, Budaya & 5R
- Filter berfungsi tanpa reload halaman

**Grid 10 Kartu Survei**
- Setiap kartu: nama, deskripsi singkat, kategori, jumlah responden statis, tombol "Isi Survei" ke Google Form
- Badge "Sudah Diisi" jika localStorage mendeteksi respon tersimpan
- Tombol "Isi Ulang" jika sudah diisi (untuk mengisi kembali)

**Tombol "Mulai Semua Survei"**
- Membuka survei pertama yang belum diisi di tab baru
- Menggunakan `window.open()` ke Google Form

---

### 5.5 Form SPAK (`pages/survei-spak.html`)

**Status:** Orphaned fallback. Tidak ada link aktif dari navbar atau hub. Hanya bisa diakses via URL langsung.

**Struktur:** Multi-step form 3 langkah, masing-masing berisi 3 pertanyaan Likert.

**Langkah 1 — Integritas Personal:**
1. Komitmen institusi mencegah korupsi
2. Keteladanan pimpinan
3. Ketegasan sanksi

**Langkah 2 — Budaya Organisasi:**
1. Ketersediaan mekanisme pelaporan
2. Rasa aman melaporkan
3. Transparansi tindak lanjut

**Langkah 3 — Pelayanan Publik:**
1. Bebas pungli
2. Transparansi pengadaan
3. Akses informasi publik

**Skala Likert:** Sangat Setuju / Setuju / Tidak Setuju / Sangat Tidak Setuju

**Submit:** Menyimpan ke `localStorage['iv_responses_spak']`. Menampilkan layar sukses dengan tautan ke hub survei.

---

### 5.6 Form SPKP (`pages/survei-spkp.html`)

**Status:** Orphaned fallback, sama seperti SPAK.

**Langkah 1 — Sikap Petugas:**
1. Keramahan dan kesopanan petugas
2. Ketepatan waktu layanan
3. Kejelasan prosedur

**Langkah 2 — Fasilitas & Non-diskriminasi:**
1. Kebersihan dan kenyamanan fasilitas
2. Ketersediaan sarana pengaduan
3. Pelayanan tanpa diskriminasi

**Langkah 3 — Output & Kepuasan:**
1. Kesesuaian hasil dengan harapan
2. Kompetensi petugas
3. Kepuasan keseluruhan

**Submit:** Menyimpan ke `localStorage['iv_responses_spkp']`.

---

### 5.7 Form WBS (`pages/survei-wbs.html`)

**Tujuan:** Kanal resmi pelaporan dugaan pelanggaran integritas. Mendukung pelaporan anonim penuh.

**Struktur:** Multi-step form 3 langkah.

**Langkah 1 — Identitas Pelapor:**
- Toggle anonim (checkbox)
- Jika tidak anonim: Nama, Kontak/Email, Hubungan dengan PENS
- Jika anonim: seluruh field identitas disembunyikan via JavaScript
- Penjelasan eksplisit bahwa identitas anonim tidak disimpan

**Langkah 2 — Detail Laporan:**
- Judul laporan (wajib)
- Kategori: Gratifikasi / Korupsi / Pungli / Benturan Kepentingan / Pelanggaran Etika / Kualitas Pelayanan / Kedisiplinan / Lainnya
- Unit atau pihak terkait (opsional)
- Deskripsi lengkap kejadian (wajib)
- Tanggal dan waktu perkiraan kejadian

**Langkah 3 — Bukti & Konfirmasi:**
- Field upload bukti (UI saja, tidak ada server penerima)
- Pernyataan laporan dibuat dengan itikad baik
- Pernyataan kebenaran informasi

**Hasil Submit:**
- ID format: `WBS-2026-XXX` (3 digit, sequential)
- Layar sukses menampilkan kode tracking dan link ke halaman lacak
- Jika anonim: pesan tambahan bahwa status hanya bisa dilacak via kode, bukan nama

**Garansi Anonimitas:**
Saat `anonim: true`, fungsi `normalizeReport()` me-null-kan semua field identitas sebelum disimpan. Admin yang melihat tidak mendapat data identitas pelapor.

---

### 5.8 Form Pengaduan Baru (`pages/pengaduan-baru.html`)

**Tujuan:** Kanal pengaduan untuk masalah fasilitas, administrasi, dan kualitas layanan. Berbeda dari WBS yang khusus untuk pelanggaran integritas.

**Struktur:** Multi-step form 2 langkah.

**Langkah 1 — Detail Pengaduan:**
- Judul pengaduan (wajib)
- Kategori: Fasilitas/Sarana / Administrasi/Birokrasi / Kualitas Pelayanan / Kedisiplinan / Lainnya
- Lokasi atau gedung terkait (opsional)
- Deskripsi lengkap masalah (wajib)

**Langkah 2 — Identitas & Konfirmasi:**
- Toggle anonim (mekanisme sama dengan WBS)
- Jika tidak anonim: Nama, Email atau WhatsApp, Hubungan dengan PENS
- Persetujuan terhadap ketentuan pengaduan

**Hasil Submit:**
- ID format: `ADU-2026-XXXX` (4 digit, sequential)
- Layar sukses: kode tracking + tombol salin kode + link ke halaman lacak

---

### 5.9 Lacak Pengaduan (`pages/pengaduan-status.html`)

**Tujuan:** Memungkinkan pelapor melihat status penanganan pengaduannya kapan saja, tanpa login, hanya dengan kode ID.

**Fitur:**

**Form Pencarian:**
- Input teks: kode pengaduan (contoh: `ADU-2026-0001` atau `WBS-2026-001`)
- Tombol "Lacak Sekarang"
- Pencarian berdasarkan kode ID yang tepat (case-insensitive, trimmed)

**Hasil — Card Status:**
- ID laporan dan kategori
- Judul pengaduan
- Badge status (Baru / Diproses / Selesai)

**Stepper 3 Tahap (timeline status):**
1. Laporan Diterima — tanggal dan catatan publik dari riwayat pertama
2. Sedang Diproses — tanggal dan catatan publik dari riwayat kedua (jika ada)
3. Selesai Ditangani — tanggal dan catatan publik dari riwayat ketiga (jika ada)

**Informasi yang TIDAK Ditampilkan (keputusan privasi):**
- Deskripsi lengkap laporan
- Nama, kontak, atau identitas pelapor
- Nama PIC yang menangani
- Catatan internal admin

**Error State:**
Jika kode tidak ditemukan: pesan informatif dengan instruksi cara mendapatkan kode yang benar.

---

### 5.10 Manajemen Pengaduan (`pages/pengaduan.html`)

**Tujuan:** Halaman kerja admin untuk mengelola semua laporan pengaduan dan WBS.

**Gate:** Hard redirect ke login jika tidak ada sesi admin valid.

**Fitur:**

**Summary Cards (3 kartu):**
Dihitung real-time dari data pengaduan:
- Jumlah laporan Selesai
- Jumlah laporan Diproses
- Jumlah laporan Baru

**Filter Bar:**
- Filter Status: Semua / Baru / Diproses / Selesai
- Filter Kategori: semua kategori yang tersedia
- Input pencarian: cari berdasarkan judul, ID, atau kategori

**Tabel Laporan:**
- Kolom: ID | Jenis | Judul | Kategori | Status | PIC | Waktu Lapor
- Baris bisa diklik untuk membuka panel detail
- Badge status per kondisi

**Panel Detail (inline, muncul saat baris diklik):**
- Semua metadata laporan: ID, jenis, kategori, lokasi, waktu lapor, waktu update
- Deskripsi lengkap laporan
- Identitas pelapor (hanya jika tidak anonim)
- PIC saat ini
- Riwayat status: timeline dari array riwayat
- Catatan internal: hanya tampil untuk admin, tidak tampil ke pelapor

**Form Update Status:**
- Dropdown pilih status baru
- Input PIC (wajib diisi jika status bukan "Baru")
- Textarea catatan publik (akan tampil di riwayat, bisa dilihat pelapor)
- Textarea catatan internal (hanya tersimpan di `catatanInternal`, tidak tampil ke publik)
- Tombol simpan + toast notification saat berhasil

---

### 5.11 Laporan & Rekap (`pages/laporan.html`)

**Tujuan:** Memberikan rekap data ZI kepada admin untuk keperluan pelaporan dan asesmen.

**Gate:** Soft-gate. Tidak redirect jika bukan admin, tapi konten diganti dengan pesan "Akses Terbatas".

**Fitur:**

**Filter Periode:**
- Dropdown pilih bulan laporan (UI saja, data tidak berubah)

**Stat Strip (4 angka):**
- Indikator Terpantau: 6
- Total Responden: 640
- Rata-rata Partisipasi: 82%
- Laporan Baru Masuk: 2

**Tabel Rekap Skor Indikator:**
- Kolom: Indikator | Nama Lengkap | Skor | Benchmark | Status | Responden | Tren
- Data dari `IV.getSurveiDetail(key)` untuk setiap instrumen
- Badge "Di atas Target" atau "Di bawah Target"
- Panah tren: naik, turun, atau datar

**Dua Chart:**
- Chart perbandingan Skor vs Target per instrumen
- Chart jumlah responden dari data partisipasi

**Tabel Ringkasan Pengaduan & WBS:**
- Hitungan per kategori dan per status

**Tombol Ekspor CSV:**
- Menghasilkan file `.csv` dari data tabel rekap
- File bisa langsung dibuka di Excel

---

### 5.12 Login Admin (`pages/login.html`)

**Tujuan:** Pintu masuk admin. Sudah login otomatis redirect ke dashboard.

**Fitur:**

**Auto-redirect:**
Saat halaman dimuat, cek sesi. Jika sesi valid, redirect otomatis ke dashboard.

**Form Login:**
- Input username
- Input password
- Tombol submit "Masuk ke Dashboard"
- Tombol "Masuk sebagai Admin (demo)": mengisi otomatis `admin`/`admin123` dan submit
- Link ke halaman survei (untuk yang tidak perlu login)

**Error Handling:**
- Credential salah: pesan error spesifik
- Lockout aktif: pesan dengan countdown mundur real-time per detik

**Redirect Setelah Login:**
Berdasarkan role, menuju `PERMISSIONS[role].redirect` (untuk admin = dashboard).

---

### 5.13 Chatbot ZI (Fitur v2, semua halaman)

**Tujuan:** Asisten virtual berbasis aturan yang membantu pengguna menemukan informasi ZI, mengisi survei, atau melacak pengaduan, tanpa perlu navigasi manual.

**Jenis:** Rule-based, bukan AI/LLM. Semua respons adalah teks yang sudah dikurasi. Arsitektur dibuat agar mudah diganti dengan panggilan API AI di masa depan.

**Titik Masuk:**
- FAB (Floating Action Button) di pojok kanan bawah, muncul di semua halaman
- FAB selalu di atas navbar dan sidebar (z-index lebih tinggi)
- Tooltip saat hover: "Tanya ZI Assistant"

**Panel Chat:**
- Muncul saat FAB diklik
- Mobile: full-screen
- Tombol minimize dan tutup

**Struktur Panel:**
- Header: nama bot, status online
- Area pesan: scrollable, bubble kiri untuk bot, kanan untuk user
- Area chips: quick reply buttons yang bisa di-scroll horizontal
- Area input: text field + tombol kirim

**Kategori Intent:**

| Kategori | Contoh Trigger | Respons |
|---|---|---|
| Greeting | "halo", "hi", "selamat" | Sambutan + 4 chips awal |
| Info ZI | "apa itu zi", "zona integritas" | Penjelasan ZI |
| Info Instrumen | "apa itu spak", "spkp", "wbs" | Detail instrumen |
| Cara Isi Survei | "isi survei", "cara isi" | Langkah-langkah + daftar instrumen |
| Skor ZI | "skor spak", "instrumen terbaik" | Data dari getSurveiDetail() |
| Pengaduan | "buat pengaduan", "cara lapor" | Panduan + link form |
| Lacak Pengaduan | "lacak pengaduan", "kode ADU" | Mulai flow lacak (multi-turn) |
| Admin | "login", "masuk admin" | Link ke halaman login |
| Fallback | Tidak cocok | Saran topik + 4 chips |

**Flow Multi-Turn: Lacak Pengaduan**
1. User ketik "lacak pengaduan"
2. Bot minta kode tracking
3. User masukkan kode (apapun yang diketik berikutnya)
4. Bot cari di data pengaduan berdasarkan kode
5. Jika ditemukan: tampilkan status dan riwayat singkat + tombol ke halaman detail
6. Jika tidak ditemukan: pesan error + link ke halaman lacak

**Fallback Berlapis:**
- Setelah 2x berturut-turut tidak ada intent yang cocok: sarankan menghubungi tim ZI langsung

**Persistensi:**
- Riwayat pesan tersimpan di localStorage, maksimal 20 pesan terakhir
- Riwayat dimuat kembali saat panel dibuka ulang

---

## 6. Data Model & Logika Bisnis

### 6.1 Global Object IV

Semua data dan fungsi helper tersedia melalui satu object global `IV`, dibuat sebagai IIFE di `mock-data.js`. Tidak ada akses langsung ke data internal tanpa melalui fungsi `IV.*`.

**API Publik IV:**
- `IV.SURVEI_INFO` — data 10 instrumen survei
- `IV.SURVEY_URL` — mapping key instrumen ke URL Google Form
- `IV.SCORECARD` — data skor mentah 5 instrumen utama
- `IV.TREN_BULANAN` — data tren 6 bulan untuk chart
- `IV.SPIP_RADAR` — data radar chart 5 unsur SPIP
- `IV.SURVEI_AGREGAT` — jumlah responden per instrumen
- `IV.PARTISIPASI` — data bar chart responden (5 instrumen)
- `IV.AKTIVITAS` — feed aktivitas terbaru (5 item)
- `IV.PENGADUAN` — seed data pengaduan
- `IV.USERS` — data pengguna admin
- `IV.PERMISSIONS` — hak akses per role
- `IV.getSurveiDetail(key)` — fungsi utama untuk data detail instrumen
- `IV.login(username, password)` — autentikasi async
- `IV.logout()` — hapus sesi
- `IV.getUser()` — baca sesi aktif
- `IV.requireAdminAuth()` — guard keras halaman admin
- `IV.savePengaduan(data)` — simpan laporan baru
- `IV.getPengaduan()` — baca semua laporan (merge seed + localStorage)
- `IV.updatePengaduan(id, patch)` — update status laporan
- `IV.saveResponse(type, data)` — simpan respon survei internal
- `IV.getResponses(type)` — baca respon survei dari localStorage

### 6.2 Data 10 Instrumen Survei (SURVEI_INFO)

| Key | Nama Singkat | Nama Panjang | Kategori |
|---|---|---|---|
| `spak` | SPAK | Survei Persepsi Anti Korupsi | Integritas & Korupsi |
| `spkp` | SPKP | Survei Persepsi Kualitas Pelayanan | Pelayanan Publik |
| `spip` | SPIP | Survei Penilaian Internal SPIP | Integritas & Korupsi |
| `gratifikasi` | Gratifikasi | Survei Pemahaman Gratifikasi | Integritas & Korupsi |
| `benturan` | Benturan | Survei Benturan Kepentingan | Integritas & Korupsi |
| `wbs` | WBS | Whistleblowing System | Pelaporan |
| `pengaduan` | Pengaduan | Pengaduan Masyarakat | Pelayanan Publik |
| `budaya-zi` | Budaya ZI | Survei Budaya Zona Integritas | Budaya & 5R |
| `budaya-kerja` | Budaya Kerja | Survei Budaya Kerja | Budaya & 5R |
| `5r` | 5R | Survei Implementasi 5R | Budaya & 5R |

Setiap instrumen memiliki field `formUrl` yang berisi URL Google Form resmi. `IV.SURVEY_URL` dibangun otomatis dari field ini. Perubahan URL Google Form hanya perlu dilakukan di satu tempat (`SURVEI_INFO`).

### 6.3 Formula Skor Indeks

```
Skor Indeks (%) = (totalSkorAktual / (jumlahResponden x jumlahPertanyaan x 4)) x 100
```

Nilai maksimum Likert adalah 4 (Sangat Setuju). Dihitung internal via `hitungSkorIndeks()`, diekspos via `IV.getSurveiDetail(key)`.

**PENTING:** Jangan baca skor langsung dari `IV.SCORECARD`. Selalu gunakan `IV.getSurveiDetail(key)` untuk mendapatkan skor yang sudah dihitung.

### 6.4 Data Skor Per Instrumen (Simulasi)

| Instrumen | Responden | Pertanyaan | Skor Indeks | Benchmark |
|---|---|---|---|---|
| SPAK | 142 | 9 | 84.6% | 80% |
| SPKP | 315 | 9 | 88.1% | 85% |
| SPIP | 58 | 15 | 72.3% | 75% |
| Gratifikasi | 67 | 10 | 80.0% | 85% |
| Benturan Kepentingan | 58 | 10 | 80.0% | 80% |

### 6.5 Aturan Partisipasi Survei

- Survei bersifat terbuka tanpa target responden
- Partisipasi HANYA ditampilkan sebagai angka absolut (contoh: "142 responden")
- Tidak boleh ada persentase partisipasi
- Tidak boleh ada progress bar "X dari Y target"

### 6.6 Model Laporan Pengaduan & WBS

**Field laporan:**

```
id              -- ADU-2026-XXXX atau WBS-2026-XXX
jenis           -- 'pengaduan' atau 'wbs'
judul           -- judul laporan
kategori        -- kategori laporan
lokasi          -- opsional
deskripsi       -- deskripsi lengkap
anonim          -- boolean
nama_pelapor    -- null jika anonim
kontak_pelapor  -- null jika anonim
hubungan        -- null jika anonim
status          -- 'Baru' | 'Diproses' | 'Selesai'
pic             -- nama petugas yang menangani
waktuLapor      -- ISO timestamp
waktuUpdate     -- ISO timestamp
riwayat         -- array histori status (publik)
catatanInternal -- array catatan admin (tidak publik)
```

**Format ID:**

| Jenis | Format | Contoh |
|---|---|---|
| Pengaduan Masyarakat | `ADU-{tahun}-{4 digit}` | `ADU-2026-0001` |
| WBS | `WBS-{tahun}-{3 digit}` | `WBS-2026-001` |

**Aturan Bisnis:**
- PIC wajib diisi jika status bukan "Baru"
- Perubahan status selalu menambahkan entri baru ke `riwayat`
- Catatan internal tidak pernah tampil di halaman publik
- Saat anonim, semua field identitas di-null-kan oleh `normalizeReport()` sebelum disimpan

### 6.7 Storage Keys

| Key | Tipe | Isi |
|---|---|---|
| `iv_responses_spak` | localStorage | Array respon Likert SPAK |
| `iv_responses_spkp` | localStorage | Array respon Likert SPKP |
| `iv_pengaduan` | localStorage | Array laporan user + edited seed |
| `iv_auth_log` | localStorage (max 50) | Log percobaan login |
| `iv_login_failures` | localStorage | Data lockout: count, firstTs, lockedUntil |
| `iv_chatbot_history` | localStorage (max 20) | Riwayat pesan chatbot |
| `iv_session` | sessionStorage | Token + waktu kedaluwarsa sesi |
| `iv_user` | sessionStorage | Data user yang sedang login |

---

## 7. Sistem Autentikasi & Otorisasi

### 7.1 Model Akses

- Satu akun admin statis: username `admin`, password `admin123`
- Semua halaman lain terbuka tanpa login
- Tidak ada fitur registrasi akun baru (tidak boleh dibuat)
- Sesi berlaku 8 jam atau sampai tab ditutup

### 7.2 Alur Login

1. User submit form login
2. Sistem cek lockout di localStorage
3. Jika terkunci: tolak, tampilkan countdown
4. Jika tidak terkunci: hitung SHA-256(salt + password)
5. Bandingkan hash dengan data di `IV.USERS`
6. Jika cocok: buat token, simpan sesi di sessionStorage, redirect
7. Jika tidak cocok: catat kegagalan, tampilkan error

### 7.3 Sistem Lockout (Brute-Force Protection)

- 5 kegagalan berturut-turut = lockout 60 detik
- Hitungan kegagalan direset jika login berhasil
- Hitungan TIDAK direset saat halaman di-refresh (tersimpan di localStorage)
- UI lockout: pesan + countdown yang update setiap detik

### 7.4 Guard Halaman

**Guard Keras (`pengaduan.html`):**
Panggil `IV.requireAdminAuth()` di awal skrip. Jika bukan admin, redirect langsung ke login.

**Guard Lunak (`laporan.html`):**
Panggil `IV.getUser()`. Jika bukan admin, swap konten dengan pesan "Akses Terbatas". Tidak ada redirect.

**Halaman Publik:**
Panggil `IV.getUser()` hanya untuk render kondisional (tampilkan nama admin di navbar, bukan untuk gating).

### 7.5 Keamanan Password

- Tidak ada password plaintext tersimpan di mana pun
- Hashing: SHA-256(salt + password) menggunakan Web Crypto API
- Salt: `'IntegrityView-2026-Seed'` (hard-coded, prototipe saja)

### 7.6 Syarat Teknis Auth

- `crypto.subtle` hanya berfungsi di `http://localhost` atau `https://`, bukan `file://`
- Cara menjalankan: `npx serve frontend` atau Live Server extension
- Tanpa server lokal: tombol login tidak berfungsi

### 7.7 Demo Login

Tombol "Masuk sebagai Admin (demo)" mengisi otomatis `admin`/`admin123` dan submit. Tidak ada bypass mekanisme auth, validasi tetap berjalan normal.

---

## 8. User Flows

### Flow 1 — Sivitas Mengisi Survei

```
Terima link platform via WhatsApp
  --> Buka landing page
  --> Klik "Isi Survei Sekarang"
  --> Pusat survei: lihat 10 kartu, progress "0 dari 10"
  --> Klik "Isi Survei" pada kartu SPKP
  --> Google Form terbuka di tab baru
  --> Isi dan submit di Google Forms
  --> Kembali ke tab pusat survei
```

> **Catatan:** Badge "Sudah Diisi" hanya muncul jika mengisi via form internal fallback, bukan via Google Forms. Google Forms tidak memberikan callback ke platform ini.

---

### Flow 2 — Pimpinan Membaca Dashboard

```
Buka URL dashboard dari bookmark
  --> Dashboard overview: header "Akses Publik"
  --> Baca 4 KPI cards
  --> Lihat tren 3 instrumen di chart garis
  --> Radar SPIP: "Penilaian Risiko" paling rendah
  --> Klik kartu SPIP di strip indikator
  --> View detail SPIP: skor 72.3%, di bawah target 75%
  --> Baca tren 6 bulan: stagnan
  --> Klik "Kembali ke Ringkasan"
  --> Lanjut baca aktivitas terbaru
  --> Siap untuk presentasi kepada assessor
```

---

### Flow 3 — Masyarakat Membuat Pengaduan

```
Temukan link dari website PENS
  --> Landing page, klik "Buat Pengaduan"
  --> Form pengaduan, langkah 1: isi judul, kategori, deskripsi
  --> Langkah 2: tidak pilih anonim, isi identitas
  --> Submit: dapat kode ADU-2026-XXXX
  --> Simpan kode
[Beberapa hari kemudian]
  --> Buka halaman lacak
  --> Input kode tracking
  --> Lihat status: Diproses
  --> Baca riwayat: 2 tahap, tahap ketiga belum
```

---

### Flow 4 — Sivitas Lapor WBS Anonim

```
Buka landing page, klik "Lapor Sekarang" di kartu WBS
  --> Form WBS, langkah 1: centang "lapor anonim"
  --> Field identitas langsung disembunyikan
  --> Langkah 2: isi detail pelanggaran
  --> Langkah 3: konfirmasi, submit
  --> Dapat kode WBS-2026-XXX
  --> Layar sukses: "Identitas tidak disimpan. Simpan kode ini."
[Di database]
  --> Semua field identitas null
  --> Admin tidak bisa melihat siapa pelapor
```

---

### Flow 5 — Chatbot Cari Skor SPIP

```
Buka halaman mana saja
  --> Klik FAB chatbot
  --> Panel slide-up, pesan sambutan
  --> User ketik "berapa skor spip"
  --> Bot ambil data dari IV.getSurveiDetail('spip')
  --> Bot balas: Skor 72.3%, Benchmark 75%, Status di bawah target
  --> User klik "Lihat Detail di Dashboard"
  --> Navigasi ke dashboard.html#spip
```

---

### Flow 6 — Admin Login dan Kelola Pengaduan

```
Buka landing page, klik "Masuk"
  --> Login: klik "Masuk sebagai Admin (demo)"
  --> Redirect ke dashboard (tampilan admin)
  --> Klik "Pengaduan" di sidebar
  --> Filter status "Baru"
  --> Klik laporan baru
  --> Panel detail: baca isi laporan dan identitas pelapor
  --> Set status "Diproses", isi PIC, tulis catatan publik + internal
  --> Simpan: toast "Status berhasil diperbarui"
  --> Laporan menghilang dari filter "Baru"
```

---

### Flow 7 — Admin Ekspor Data Asesmen

```
[Sudah login sebagai admin]
  --> Klik "Laporan" di sidebar
  --> Tabel rekap 10 instrumen
  --> Periksa SPIP: di bawah target
  --> Klik "Ekspor CSV"
  --> File rekap-zi-agt-2026.csv terdownload
  --> Buka di Excel, masukkan ke dokumen asesmen
```

---

### Flow 8 — Chatbot Lacak Pengaduan

```
Klik FAB chatbot
  --> User ketik "lacak pengaduan saya"
  --> Bot: "Masukkan kode pengaduanmu"
  --> User ketik: "ADU-2026-0087"
  --> Bot cari di data pengaduan
  --> Bot balas: judul, status, riwayat singkat, tombol detail
  --> User klik "Lihat Detail Lengkap"
  --> Navigasi ke pengaduan-status.html?id=ADU-2026-0087
```

---

## 9. Acceptance Criteria

Format:
- `[ ]` Belum diverifikasi
- `[x]` Lulus
- `[BLOCKER]` Wajib lulus sebelum rilis

### 9.1 Landing Page

- [ ] [BLOCKER] Tujuh section tampil berurutan: Hero, Tentang ZI, 10 Instrumen, Dashboard Preview, Cara Kerja, Kanal Pengaduan, Footer
- [ ] [BLOCKER] Sepuluh kartu instrumen + 1 kartu "Lihat Pusat Survei"
- [ ] [BLOCKER] Label "Data Simulasi" ada di semua angka statistik publik
- [ ] Dua tombol CTA tampil dan menuju URL yang benar
- [ ] Tombol "Isi Survei" di setiap kartu membuka Google Form di tab baru
- [ ] Di viewport 390px: tidak ada overflow horizontal
- [ ] Tidak ada broken link atau konten placeholder

### 9.2 Dashboard

- [ ] [BLOCKER] Dashboard bisa diakses tanpa login
- [ ] [BLOCKER] Header menampilkan "Akses Publik" jika tidak login
- [ ] [BLOCKER] Akses `dashboard.html#spak` menampilkan detail SPAK
- [ ] [BLOCKER] Akses `dashboard.html#spkp` menampilkan detail SPKP
- [ ] [BLOCKER] Akses `dashboard.html#spip` menampilkan detail SPIP
- [ ] Semua 10 key menghasilkan konten detail yang benar
- [ ] Chart tren tampil dengan 3 garis data + 1 garis target
- [ ] Radar chart SPIP tampil dengan 5 sumbu
- [ ] Partisipasi ditampilkan sebagai angka absolut (bukan persentase)
- [ ] Strip 10 indikator tampil di bawah chart grid
- [ ] Klik kartu strip mengubah hash URL dan menampilkan detail
- [ ] 4 KPI cards tampil di atas chart grid
- [ ] Tombol "Kembali ke Ringkasan" menghapus hash dan kembali ke overview
- [ ] Skor di detail dihitung via `getSurveiDetail()`, bukan hard-code

### 9.3 Pusat Survei

- [ ] [BLOCKER] Sepuluh kartu instrumen tampil dengan benar
- [ ] Setiap tombol "Isi Survei" menuju Google Form yang benar di tab baru
- [ ] Filter kategori menyembunyikan kartu yang tidak sesuai
- [ ] Filter "Semua" menampilkan kembali semua kartu
- [ ] Progress bar "Sudah diisi" dihitung dari localStorage

### 9.4 Form WBS

- [ ] [BLOCKER] Form terdiri dari 3 langkah
- [ ] Toggle anonim menyembunyikan field identitas saat dicentang
- [ ] [BLOCKER] Submit menghasilkan kode WBS-2026-XXX di layar sukses
- [ ] Sukses screen menampilkan link ke halaman lacak
- [ ] Data tersimpan tanpa field identitas jika lapor anonim

### 9.5 Form Pengaduan Baru

- [ ] [BLOCKER] Form terdiri dari 2 langkah
- [ ] [BLOCKER] Submit menghasilkan kode ADU-2026-XXXX di layar sukses
- [ ] Tombol "Salin Kode" menyalin kode ke clipboard
- [ ] Pengaduan tersimpan di localStorage setelah submit

### 9.6 Lacak Pengaduan

- [ ] [BLOCKER] Kode ADU yang valid menampilkan card status
- [ ] [BLOCKER] Kode WBS yang valid menampilkan card status
- [ ] [BLOCKER] Identitas pelapor TIDAK tampil di halaman ini
- [ ] [BLOCKER] Deskripsi lengkap laporan TIDAK tampil di halaman ini
- [ ] Catatan internal admin TIDAK tampil di halaman ini
- [ ] Kode tidak ditemukan menampilkan pesan error informatif
- [ ] Stepper menampilkan jumlah tahap yang benar sesuai riwayat

### 9.7 Manajemen Pengaduan

- [ ] [BLOCKER] Halaman redirect ke login jika akses tanpa sesi valid
- [ ] Summary cards menampilkan jumlah yang benar per status
- [ ] Filter status berfungsi
- [ ] Klik baris laporan membuka panel detail
- [ ] Panel detail menampilkan identitas jika tidak anonim
- [ ] Panel detail TIDAK menampilkan identitas jika anonim
- [ ] Catatan internal tampil di panel detail (hanya untuk admin)
- [ ] [BLOCKER] Update status: jika status bukan "Baru" dan PIC kosong, tidak bisa submit
- [ ] [BLOCKER] Update status berhasil: status berubah, riwayat bertambah, toast muncul

### 9.8 Laporan

- [ ] Tanpa login: konten diganti dengan pesan "Akses Terbatas" (bukan redirect)
- [ ] Setelah login admin: tabel rekap skor tampil dengan benar
- [ ] Skor menggunakan `IV.getSurveiDetail()`, bukan hard-code
- [ ] Tombol "Ekspor CSV" menghasilkan file CSV yang bisa didownload

### 9.9 Login Admin

- [ ] [BLOCKER] Login dengan admin/admin123 berhasil dan redirect ke dashboard
- [ ] Login dengan credential salah menampilkan pesan error
- [ ] [BLOCKER] Setelah 5 kegagalan berturut-turut, form terkunci dengan countdown
- [ ] Setelah lockout habis, form bisa digunakan kembali
- [ ] Tombol demo mengisi form dan submit otomatis
- [ ] Sudah login dan buka login.html: redirect otomatis ke dashboard

### 9.10 Chatbot

- [ ] [BLOCKER] FAB chatbot muncul di semua halaman
- [ ] FAB tidak tertutup oleh navbar atau sidebar
- [ ] [BLOCKER] Minimal 15 intent berbeda direspons dengan teks relevan
- [ ] Greeting menampilkan 4 chips awal
- [ ] "skor spip" menampilkan data dari `getSurveiDetail('spip')`
- [ ] [BLOCKER] Flow lacak pengaduan: kode valid menampilkan status yang benar
- [ ] Riwayat pesan tersimpan di localStorage
- [ ] Riwayat dimuat ulang saat panel dibuka kembali
- [ ] Riwayat dibatasi 20 pesan terakhir

### 9.11 Umum & Cross-Cutting

- [ ] [BLOCKER] Semua link navbar menuju halaman yang benar
- [ ] [BLOCKER] Tidak ada dead link
- [ ] [BLOCKER] Semua angka statistik publik berlabel "data simulasi" atau setara
- [ ] [BLOCKER] Semua teks antarmuka dalam Bahasa Indonesia
- [ ] Tidak ada em dash di teks yang tampil ke user
- [ ] Tidak ada teks placeholder yang tersisa
- [ ] Semua halaman bisa digunakan di viewport 390px lebar

---

## 10. Batasan & Keputusan Teknis

### 10.1 Aturan yang Tidak Boleh Diubah

**Warna per instrumen adalah encoding data, bukan dekorasi**
Sepuluh warna di `SURVEI_INFO[*].warnaHex` menjadi identitas visual setiap instrumen. Harus konsisten di seluruh platform. Perubahan satu warna berarti perubahan identitas instrumen di mana-mana.

**Urutan load script wajib diikuti**
```
1. mock-data.js   (mendefinisikan IV)
2. main.js        (bergantung pada IV)
3. chatbot.js     (bergantung pada IV dan main.js)
```
Membalik urutan ini menyebabkan ReferenceError.

**CSS backward-compat aliases tidak boleh dihapus**
Token `--teal`, `--coral`, dan variannya di `base.css` digunakan di seluruh file CSS. Menghapusnya akan merusak banyak komponen.

**Tidak ada halaman register**
File `pages/register.html` sudah sengaja dihapus. Tidak ada dan tidak akan ada fitur registrasi pengguna baru.

**Skor selalu dihitung, tidak pernah dikodekan keras**
Menulis skor langsung di HTML adalah anti-pattern. Gunakan `IV.getSurveiDetail(key)`.

**Partisipasi hanya angka absolut**
Jangan tambahkan field `target` ke `SURVEI_AGREGAT`. Jangan hitung atau tampilkan persentase partisipasi.

**Lacak pengaduan hanya by kode ID**
Ini adalah keputusan privasi yang disengaja, bukan keterbatasan teknis. Tidak boleh ada pencarian by nama, kategori, atau tanggal.

### 10.2 Aturan yang Wajib Diikuti

**Label "Data Simulasi"**
Setiap angka statistik dari data mock wajib berlabel ini. Label boleh kecil, tapi harus ada dan terbaca.

**Bahasa Indonesia**
Semua teks antarmuka baru wajib dalam Bahasa Indonesia. Pengecualian: nama teknis yang sudah lazim (Dashboard, Whistleblowing System).

**Tidak ada em dash di teks user-facing**
Gunakan titik dua, koma, atau kalimat terpisah.

**Platform harus diakses via localhost atau HTTPS**
`crypto.subtle` tidak berfungsi di `file://`. Gunakan `npx serve frontend` atau Live Server.

**Chart.js hanya di dashboard.html dan laporan.html**
Jangan tambahkan CDN Chart.js ke halaman lain tanpa kebutuhan yang jelas.

### 10.3 Gotcha & Bug Dokumentasi

**`laporan.html` pernah membaca SCORECARD langsung (bug lama)**
Field `item.value`, `item.target`, `item.totalResponden` tidak ada di `IV.SCORECARD`. Gunakan `IV.getSurveiDetail(key)` untuk mengambil `skor`, `benchmark`, `totalResponden`.

**Guided mode adalah dead code**
`form-validation.js` memiliki logika untuk `iv_guided_mode` tapi tidak ada kode yang pernah menyetel flag ini. Biarkan saja, jangan diaktifkan.

**Form SPAK dan SPKP adalah orphaned pages**
Tidak ada link aktif yang menuju kedua halaman ini. Hanya bisa diakses via URL langsung.

**Mapping key `benturan` ke SCORECARD `bentkep`**
Di `getSurveiDetail()`: key `benturan` dipetakan ke SCORECARD key `bentkep`. Jangan ubah salah satunya tanpa mengubah yang lain.

**`iv_redirect_after_login` tidak pernah ditulis**
`initLoginForm()` membaca key ini tapi tidak ada kode yang menyetelnya. Dead code. Redirect selalu ke `PERMISSIONS[role].redirect`.

**Sukses screen WBS anonim: pelapor harus simpan kode sendiri**
Karena tidak ada kontak pelapor, tidak ada cara mengirimkan kode tracking. Harus ada pesan eksplisit di layar sukses WBS anonim.

### 10.4 Batasan Platform Prototype

- Tidak ada server: data tersimpan di browser pengguna saja
- Tidak ada backend auth: login client-side adalah placeholder
- Data adalah simulasi: semua angka adalah data demo
- Upload file UI-only: tidak ada server penerima file
- Notifikasi email simulasi: hanya toast notification, tidak ada email sungguhan

---

## 11. Ruang Lingkup & Out of Scope

### 11.1 Yang Termasuk (In Scope)

- Landing page publik sebagai entry point platform
- Dashboard monitoring ZI dengan visualisasi skor dan tren (publik)
- Hub 10 instrumen survei dengan link ke Google Forms (publik)
- Form internal survei SPAK, SPKP, dan WBS (orphaned fallback)
- Form pengaduan masyarakat (publik)
- Halaman lacak status pengaduan by kode ID (publik)
- Portal manajemen pengaduan untuk admin (login required)
- Halaman rekap laporan dan ekspor CSV untuk admin (login required)
- Sistem autentikasi admin dengan brute-force protection
- Chatbot ZI berbasis aturan (v2)

### 11.2 Yang Tidak Termasuk (Out of Scope)

- Backend server atau database sungguhan
- Integrasi langsung dengan Google Forms API
- Notifikasi email sungguhan
- Sistem registrasi akun selain admin
- Manajemen multi-admin dengan role berbeda
- Mobile app native (iOS/Android)
- Analitik demografis responden
- Korelasi antar instrumen
- Manajemen dokumen ZI
- Integrasi dengan sistem kepegawaian atau akademik PENS

---

## 12. Rencana Masa Depan

### 12.1 Backend Integration (v3)

- REST API untuk menerima submit survei langsung tanpa Google Forms
- Database persisten untuk pengaduan dan survei
- Email notification nyata saat status pengaduan berubah
- Multi-admin dengan role berbeda (editor, viewer, approver)

**Titik sambungan (seams) yang sudah disiapkan:**
- `IV.login()` bisa diganti dengan `fetch('/api/auth/login')`
- `IV.savePengaduan()`, `IV.getPengaduan()`, `IV.updatePengaduan()` bisa diganti dengan fetch ke endpoint REST
- Antarmuka tidak perlu diubah karena semua interaksi melalui `IV.*`

### 12.2 Fitur Tambahan

- Ekspor PDF laporan
- Notifikasi push browser untuk admin
- Statistik demografis responden per instrumen
- Halaman about/FAQ platform
- Versi cetak dashboard (print-friendly)

### 12.3 Performa

- Caching via service worker
- Lazy loading chart
- Font hosting lokal

### 12.4 Aksesibilitas

- Full keyboard navigation
- Screen reader support untuk chart
- High contrast mode
- `prefers-reduced-motion` untuk animasi

---

## Lampiran A — Struktur File

```
frontend/
  index.html
  assets/
    js/
      mock-data.js          -- IV object + semua data
      main.js               -- navbar, sidebar, utils
      form-validation.js    -- MultiStepForm class
      dashboard-chart.js    -- fungsi chart dashboard
      chatbot.js            -- logika + UI chatbot
    css/
      base.css              -- design tokens
      components.css        -- komponen reusable
      dashboard.css         -- layout dashboard
      form.css              -- styling form
      chatbot.css           -- styling chatbot
  pages/
    dashboard.html
    survei.html
    survei-spak.html
    survei-spkp.html
    survei-wbs.html
    pengaduan-baru.html
    pengaduan-status.html
    pengaduan.html
    laporan.html
    login.html
```

---

## Lampiran B — Urutan Load Script (Wajib)

Untuk `pages/*.html`:
```html
<script src="../assets/js/mock-data.js"></script>
<script src="../assets/js/main.js"></script>
<!-- lalu script spesifik halaman -->
<script src="../assets/js/chatbot.js"></script>
```

Untuk `index.html`:
```html
<script src="assets/js/mock-data.js"></script>
<script src="assets/js/main.js"></script>
<script src="assets/js/chatbot.js"></script>
```

---

## Lampiran C — Cara Menjalankan

```bash
npx serve frontend
# atau Live Server di VS Code
```

Akses: `http://localhost:PORT`
Login demo: username `admin`, password `admin123`

---

*IntegrityView PRD v3.0*
*September 2026 -- Zona Integritas PENS*
*Dokumen ini adalah spesifikasi produk murni, tidak mengandung spesifikasi desain visual.*
