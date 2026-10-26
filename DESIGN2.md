# DESIGN2.md — IntegrityView Redesign (Bento Dashboard Theme)

> Dokumen ini adalah spesifikasi desain untuk iterasi tampilan **baru** IntegrityView (dashboard + landing page), terinspirasi dari referensi UI bertema "productivity dashboard" (sidebar gelap, kartu bento rounded, ilustrasi dekoratif lembut).
>
> Project ini berjalan **terpisah** di folder `frontend2/` agar tidak menabrak/menimpa implementasi frontend yang sudah ada di folder frontend utama. Anggap ini sebagai "Theme 2" / alternate design, bukan pengganti langsung.

---

## 1. Filosofi Desain

Referensi yang diberikan punya ciri khas:
- Sidebar ikon gelap, ramping, minim label
- Kartu-kartu bento (ukuran beragam) dengan sudut sangat membulat (rounded-2xl/3xl)
- Bentuk dekoratif organik (blob/gelombang transparan) di pojok kartu
- Warna solid cerah untuk kartu "highlight" (hijau lime, oranye), sisanya netral putih/abu muda
- Tipografi besar & tebal untuk angka utama, label kecil di atasnya
- Grafik garis halus (smooth curve) dan progress bar tipis dengan ujung membulat
- Greeting personal di header ("Hi Thomas 👋")

Kita **pertahankan brand utama IntegrityView: Navy (biru gelap) + Oranye**, sambil mengadopsi bahasa visual bento/rounded/organik dari referensi. Hijau lime dari referensi **tidak dipakai sebagai warna dasar**, karena brand IntegrityView sudah punya warna aksen sendiri (oranye) — mengganti primary accent hijau→oranye sudah cukup untuk mendapat mood yang sama tanpa menabrak identitas kampus/institusi.

Satu warna tambahan **boleh** ditambahkan, tapi hanya dipakai jika benar-benar pas secara kontekstual (lihat §2.3) — bukan dipaksakan di semua tempat.

---

## 2. Palet Warna

### 2.1 Warna Inti (wajib, dari brand lama)
| Token | Hex | Pemakaian |
|---|---|---|
| `--navy-900` | `#0B1B33` | Sidebar background, teks utama di atas terang, kartu gelap (hero stat) |
| `--navy-700` | `#13284A` | Card gelap sekunder, hover state sidebar |
| `--navy-500` | `#1E3A5F` | Badge role, elemen navy sedang |
| `--orange-500` | `#F5843C` | CTA utama, highlight card, progress bar aktif |
| `--orange-100` | `#FDE7D7` | Background card highlight lembut (pengganti "hijau lime" di referensi) |
| `--white` | `#FFFFFF` | Card netral, background utama konten |
| `--gray-50` | `#F5F6F8` | Background halaman (di luar card) |
| `--gray-200` | `#E4E7EC` | Border tipis antar card |
| `--gray-500` | `#6B7280` | Teks sekunder/label kecil |

### 2.2 Peran "Kartu Highlight" (pengganti kartu hijau lime di referensi)
Di referensi, kartu hijau lime dipakai untuk elemen yang ingin ditonjolkan positif (statistik selesai, progress). Di tema kita, peran itu diambil alih oleh:
- **Kartu oranye solid** (`--orange-500` background, teks putih) → untuk 1 kartu paling penting per halaman (mis. CTA ajakan isi survei, atau ringkasan skor ZI tertinggi).
- **Kartu peach/oranye muda** (`--orange-100` background, teks navy) → untuk kartu statistik sekunder yang tetap ingin terasa "hangat" tanpa terlalu mencolok.

### 2.3 Warna Tambahan (opsional, dipakai sangat terbatas)
Tambahkan **satu** warna aksen ketiga: **Teal/Mint lembut** `--teal-500: #2FB8A6` (atau alternatif `--mint-400: #7FD6C2`).

Aturan pemakaian (ketat — "kalau masuk aja"):
- Hanya untuk indikator **status "naik/positif"** pada trend badge (pengganti hijau default), karena hijau standar bentrok secara psikologis dengan skema hangat navy+oranye.
- Hanya untuk **satu jenis chart** yang butuh diferensiasi dari oranye (mis. jika dalam satu kartu ada 2 garis tren: garis oranye = skor ZI, garis teal = target/benchmark).
- **Jangan** dipakai untuk background card besar, CTA, atau navigasi — supaya tidak menjadi warna ketiga yang bersaing dengan brand.
- Jika di komponen tertentu ternyata teal terasa "menabrak" (misal berdampingan langsung dengan oranye dalam rasio besar), turunkan kembali ke skema abu-abu netral (`--gray-500`) sebagai fallback aman.

### 2.4 Warna Status (dipakai konsisten, bukan dekoratif)
| Status | Warna |
|---|---|
| Naik / Positif | `--teal-500` |
| Datar / Netral | `--gray-500` |
| Turun / Perhatian | `--orange-500` (bukan merah — merah dicadangkan utk error sistem/form invalid saja) |
| Error / Validasi gagal | `#DC4C4C` (dipakai HANYA untuk form error, bukan status data) |

---

## 3. Layout Global

### 3.1 Sidebar (dashboard & area admin)
- Lebar tetap ~72px (collapsed icon-only, seperti referensi), warna `--navy-900`.
- Ikon menu: Beranda, Dashboard, Survei, Pengaduan, Laporan, Profil, Keluar — ikon saja, tooltip muncul on-hover (bukan label permanen), konsisten dengan gaya minimalis referensi.
- Item aktif: pill/rounded highlight `--orange-500` di belakang ikon.
- Avatar user di paling bawah sidebar, bukan di topbar kanan (beda dari versi lama yang taruh di navbar atas) — opsional, boleh tetap di topbar kanan jika ingin transisi lebih halus dari desain lama.

### 3.2 Topbar
- Kiri: Greeting personal — **"Hai, {NamaUser} 👋"** + subtext kecil ("Senang melihatmu lagi" / "Berikut ringkasan integritas kampus hari ini").
- Tengah/kanan: search bar rounded-full, ikon notifikasi (badge angka oranye), jam & tanggal, indikator cuaca dihapus (tidak relevan untuk konteks kampus) — ganti dengan **"Periode aktif: Maret–Agustus 2026"** sebagai chip kecil.
- Tombol "Masuk"/"Keluar" tetap solid oranye rounded-full di ujung kanan.

### 3.3 Grid Bento (konten utama)
- Container utama pakai CSS grid 12 kolom, gap 16–20px.
- Card besar (hero stat) = 4–6 kolom, card kecil = 2–3 kolom, mengikuti proporsi referensi (tidak seragam, ada yang portrait ada yang landscape).
- Semua card: `border-radius: 24px`, `box-shadow: 0 1px 2px rgba(16,24,40,0.04)` (soft, bukan shadow tebal), padding internal 20–24px.
- Kartu dekoratif: tambahkan bentuk blob/lingkaran transparan (opacity 10–15%) di pojok kanan atas kartu gelap/oranye, meniru elemen organik referensi — gunakan SVG inline, warna mengikuti warna dasar card (jangan warna asing).

---

## 4. Pemetaan Komponen (Referensi → IntegrityView)

| Elemen di Referensi | Versi IntegrityView |
|---|---|
| "44 hours at work last week" (card putih, blob dekor) | **"640 Responden"** — total partisipan survei bulan ini |
| "13 tasks completed" (card putih, blob dekor) | **"10 Instrumen Aktif"** — instrumen survei berjalan |
| "Add new widgets" (dashed card + tombol lingkaran) | **"Tambah Survei Baru"** — dashed card, tombol lingkaran oranye dengan ikon "+" |
| "Go premium" (card oranye solid, badge) | **"Ajak Partisipasi"** — card oranye solid berisi CTA share link survei ke civitas kampus, badge "baru" & "penting" |
| Grafik mingguan (garis oranye + lime, tooltip "Track time") | **Tren Skor ZI Mingguan** — garis oranye (skor aktual) + garis teal tipis (benchmark nasional 80%), tooltip on-hover menampilkan nilai tanggal tsb |
| "Completed task statistics" (card lime, progress bar Feb/Mar/Apr) | **"Statistik Capaian Bulanan"** — card peach (`--orange-100`), progress bar per bulan menunjukkan skor ZI bulanan |
| "Teamwork overview" (card peach, ikon chat besar) | **"Ringkasan Partisipasi"** — jumlah pengaduan/WBS masuk bulan ini, ikon chat/laporan besar sebagai aksen |
| "Last notes" table (Type, Date, Status, Duration) | **"Pengaduan Terbaru"** table — Kode Aduan, Tanggal, Status (badge), Kategori — menggantikan kolom "Duration" |
| Tab switch "Dashboard 1 / Dashboard 2" di bottom | **"Ringkasan / Per Instrumen"** — toggle tampilan dashboard (ringkasan umum vs breakdown 10 instrumen) |

---

## 5. Landing Page (Bento Style)

Landing page lama (hero foto gedung full-bleed) diubah total menjadi gaya **bento grid preview**, mirip dashboard referensi tapi versi "showcase publik" — tanpa data privat, murni untuk visitor publik.

**Struktur baru:**
1. **Topbar** — sama seperti versi lama (logo IntegrityView, nav, tombol Masuk), tapi background putih bersih, bukan lagi transparan di atas foto.
2. **Hero section** (bukan foto gedung penuh lagi):
   - Kolom kiri: Judul besar "Capaian integritas kampus, terbuka untuk diperiksa siapa saja." + deskripsi singkat + 2 CTA ("Buka Dashboard Publik" solid oranye, "Lihat Pusat Survei" outline navy).
   - Kolom kanan: **mini bento preview** — 2–3 kartu kecil mengambang menampilkan cuplikan data real (mis. kartu "81.2% Skor ZI" gaya sama seperti dashboard, kartu "640+ Responden") — ini menggantikan foto gedung sebagai visual hero, sekaligus jadi social proof langsung di atas fold.
   - Background section: `--gray-50` polos atau gradient sangat halus navy→putih di satu sisi, bukan foto.
3. **Section statistik** (yang sudah ada) → dikonversi jadi bento card grid (4 kartu: skor, instrumen, responden, laporan), masing-masing dengan blob dekoratif kecil sesuai §3.3, bukan lagi layout flat 4-kolom teks polos.
4. **Section trust/CTA lanjutan** — kartu oranye solid full-width kecil (gaya "Go premium" dari referensi) berisi ajakan: "Jadi bagian dari transparansi kampus — isi survei integritas sekarang."
5. Widget "Butuh Bantuan?" tetap dipertahankan di pojok kanan bawah, style disamakan rounded-full mengikuti bahasa desain baru.

**Prinsip kunci:** foto gedung besar dihilangkan dari hero (karena bertentangan dengan bahasa desain bento yang bersih & card-based), tapi identitas institusi tetap dijaga lewat warna navy dominan + tipografi tegas, bukan lewat foto arsitektur.

---

## 6. Tipografi

- Font tetap menggunakan font grotesque/geometric sans yang sudah dipakai (tebal di heading, mirip gaya referensi yang juga grotesque-bold).
- Angka statistik besar: `font-weight: 800`, ukuran 36–48px, tracking sedikit rapat.
- Label kecil di atas angka: uppercase, letter-spacing lebar, `--gray-500`, 11–12px — konsisten dengan gaya referensi ("Type", "Date", label kolom tabel).

---

## 7. Struktur Folder `frontend2/`

```
frontend2/
├── DESIGN2.md                 <- dokumen ini
├── src/
│   ├── styles/
│   │   ├── tokens.css         <- semua CSS variable warna di §2
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   └── BentoGrid.jsx
│   │   ├── cards/
│   │   │   ├── StatCard.jsx        <- kartu putih + blob dekor
│   │   │   ├── HighlightCard.jsx   <- kartu oranye solid (CTA)
│   │   │   ├── SoftStatCard.jsx    <- kartu peach (--orange-100)
│   │   │   ├── ChartCard.jsx       <- tren mingguan
│   │   │   └── AddNewCard.jsx      <- dashed "tambah survei"
│   │   └── tables/
│   │       └── ReportsTable.jsx    <- "Pengaduan Terbaru"
│   └── pages/
│       ├── LandingPage.jsx
│       └── Dashboard.jsx
└── README.md                  <- catatan setup, terpisah dari frontend lama
```

> Catatan: struktur folder di atas adalah *rekomendasi* penamaan; sesuaikan dengan stack yang benar-benar dipakai (React/Vue/HTML statis). Yang penting: **semua file baru masuk ke `frontend2/`**, tidak menimpa file apa pun di folder frontend yang sudah berjalan.

---

## 8. Checklist Implementasi

- [ ] Setup `tokens.css` dengan seluruh variable warna §2 (termasuk teal sebagai variable terpisah, mudah di-disable jika ternyata tidak cocok)
- [ ] Sidebar icon-only + tooltip
- [ ] Topbar dengan greeting personal
- [ ] Bento grid dashboard sesuai mapping §4
- [ ] Landing page hero tanpa foto, pakai mini bento preview
- [ ] Section statistik landing diubah ke bento card + blob dekor
- [ ] Trend badge pakai teal (bukan hijau default) untuk status "naik"
- [ ] Uji kontras warna (WCAG AA) terutama teks navy di atas `--orange-100` dan teks putih di atas `--orange-500`
- [ ] Responsive check: sidebar collapse jadi bottom-nav di mobile, bento grid jadi 1 kolom stack
