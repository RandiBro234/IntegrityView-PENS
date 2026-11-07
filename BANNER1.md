# Brief Banner IntegrityView

## Premis utama

**Satu kalimat yang harus terbaca dari 3 meter:**

> **IntegrityView — satu dashboard untuk survei integritas, tindak lanjut, dan pelaporan WBS di PENS.**

Semua elemen lain hanya menjadi bukti pendukung kalimat tersebut.

## Struktur banner

Banner berukuran **60 × 160 cm** dan terdiri dari enam blok.

| Blok | Isi | Alasan penempatan |
|---|---|---|
| 1. Header | Logo PENS + logo acara PENSAS Berdampak 2026 | Pembaca langsung tahu asal acara dan institusi. |
| 2. Hero | Nama produk, tagline, dan screenshot dashboard dalam frame laptop | Menjawab “ini aplikasi apa” tanpa perlu membaca banyak teks. |
| 3. Tiga peran | Kartu Sivitas, Admin ZI, dan Pimpinan / SPI | Memperlihatkan pembagian kerja aplikasi. |
| 4. Fitur utama | Enam fitur inti dalam kotak-kotak ringkas | Menjelaskan isi dan manfaat aplikasi. |
| 5. QR + ajakan | “Scan & coba sekarang” | Mengarahkan pengunjung untuk mencoba atau menemui tim. |
| 6. Footer | Alamat, kontak SPI, dan logo | Memenuhi kebutuhan informasi standar pameran. |

## Isi tiap blok

### 1. Header

- Logo PENS
- Logo acara **PENSAS Berdampak 2026**

### 2. Hero

**Label kecil:** Zona Integritas PENS

**Headline:** Survei, skor, dan tindak lanjut dalam satu layar.

**Subheadline:**

IntegrityView mengubah jawaban survei Zona Integritas menjadi dashboard yang bisa dibaca pimpinan, bukan tumpukan spreadsheet.

**Visual:**

- Gunakan `dash-desktop.png`.
- Tempatkan screenshot di dalam frame laptop yang sedikit miring.
- Tambahkan bayangan untuk memberi kedalaman.
- Jika screenshot memakai data simulasi, beri label kecil **data demonstrasi** di dekat gambar.

### 3. Tiga peran

> Catatan: role Sivitas dan Admin ZI sudah nyata di aplikasi, meskipun login masih demo. Pimpinan / SPI saat ini memakai halaman yang sama dengan Admin ZI. Tampilkan sebagai cara pakai, tetapi jangan menulis “login pimpinan”.

#### Sivitas

Isi survei lewat Google Form, lihat skor unit sendiri.

- Isi survei
- Lihat skor publik
- Lacak laporan WBS

#### Admin ZI

Kelola data, tindak lanjut laporan, dan ekspor rekap.

- Kelola laporan
- Perbarui status
- Ekspor CSV

#### Pimpinan / SPI

Baca tren dan rekomendasi sebelum rapat.

- Tren 5 semester
- Rekomendasi otomatis
- Laporan PDF

### 4. Fitur utama

Gunakan enam kotak fitur berikut:

1. **Dashboard agregat** — skor per kategori dan instrumen, langsung dari data survei.
2. **Filter periode & pembanding** — bandingkan semester tanpa menghitung manual.
3. **Sebaran jawaban 1–4** — lihat proporsi Setuju / Sangat Setuju, bukan hanya rata-rata.
4. **Tren 5 semester** — heatmap per instrumen untuk melihat mana yang naik dan turun.
5. **Rekomendasi otomatis** — butir di bawah ambang ditandai prioritas Tinggi atau Pantau.
6. **Ekspor PDF & CSV** — laporan siap cetak untuk rapat.

**Cadangan jika tersedia slot:**

- **Kanal WBS** — pelaporan dugaan pelanggaran.
- **Tanya Ivy** — tulis sebagai **purwarupa asisten**, bukan AI, karena isinya masih berupa jawaban contoh.

### 5. QR dan ajakan

Ajakan utama:

> **Scan & coba sekarang**

QR belum boleh dicetak sebelum tujuan final ditentukan. Pilih salah satu:

- URL deployment IntegrityView
- Video demo
- Halaman pengisian survei

Jika belum ada URL publik, ganti QR dengan ajakan:

> **Temui kami di booth**

Jangan mencetak QR yang belum aktif.

### 6. Footer

- Alamat institusi / lokasi booth
- Kontak SPI
- Logo pendukung yang diperlukan

## Wireframe kasar

```text
┌──────────────────────────────────────┐
│ logo PENS            logo PENSAS 2026│  ← 8 cm
├──────────────────────────────────────┤
│  ZONA INTEGRITAS PENS                │
│  IntegrityView                       │
│  Survei, skor, dan tindak lanjut     │  ← 45 cm
│  dalam satu layar.                   │
│                                      │
│      ┌────────────────────┐          │
│      │  screenshot         │          │
│      │  dashboard          │          │
│      └────────────────────┘          │
├──────────────────────────────────────┤
│  1 aplikasi, 3 peran.                │  ← 9 cm
│  ┌────────┐ ┌────────┐ ┌────────┐    │
│  │Sivitas │ │Admin ZI│ │Pimpinan│    │  ← 30 cm
│  └────────┘ └────────┘ └────────┘    │
├──────────────────────────────────────┤
│  Fitur Utama                         │
│  ┌──────────┐ ┌──────────┐           │
│  │ agregat  │ │ tren 5   │           │
│  ├──────────┤ ├──────────┤           │  ← 38 cm
│  │ sebaran  │ │ rekomend.│           │
│  ├──────────┤ ├──────────┤           │
│  │ ekspor   │ │ WBS      │           │
│  └──────────┘ └──────────┘           │
├──────────────────────────────────────┤
│  [QR]  Scan & coba                   │  ← 14 cm
├──────────────────────────────────────┤
│  alamat · kontak SPI · logo          │  ← 6 cm
└──────────────────────────────────────┘
```

## Batasan klaim dan data

Jangan tampilkan hal-hal berikut:

- Jangan mengklaim **10 instrumen sudah terisi**. Saat ini hanya SPAK dan Gratifikasi yang memiliki data asli; instrumen lain masih simulasi.
- Jika menampilkan angka responden, ambil dari dashboard setelah `VITE_ENABLE_SIMULATION=false` dan pastikan angka berasal dari data nyata.
- Jangan menampilkan email responden atau teks jawaban terbuka, termasuk pada screenshot contoh.
- Periksa `shot-admin.png` sebelum screenshot dicetak.
- Jangan menulis **AI** untuk Ivy. Jika ditampilkan, gunakan istilah **purwarupa asisten**.
- Jangan memakai angka bulat tanpa sumber, seperti “meningkatkan integritas 40%”.

## Palet dan tipografi

| Elemen | Nilai |
|---|---|
| Navy | `#0B1B33` |
| Oranye | `#F5843C` |
| Putih | `#FFFFFF` |
| Garis | `#DCE4F0` |
| Teal tren naik | `#2FB8A6` |
| Font judul | Sora |
| Font isi | Plus Jakarta Sans |

Gunakan rasio kontras dan detail visual sesuai sistem desain yang sudah dipakai di aplikasi.

## Keputusan sebelum produksi

1. **Tentukan tujuan QR:** URL deployment, video demo, atau halaman pengisian survei. Jika belum tersedia, gunakan teks “Temui kami di booth”.
2. **Tentukan sumber screenshot:** data simulasi boleh dipakai untuk pameran dengan label **data demonstrasi**; jika ingin menampilkan data nyata, tunggu data asli dan verifikasi semua angka.

## Catatan produksi

Dokumen ini adalah brief konten dan tata letak untuk mockup SVG atau halaman HTML banner. Mockup SVG lebih mudah diedit panitia dan dibuka di Illustrator / Figma; HTML lebih cepat untuk perubahan teks dan ekspor screenshot PNG.
