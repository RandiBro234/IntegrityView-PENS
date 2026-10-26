# DESIGN_SYSTEM.md
## IntegrityView -- Sistem Desain Resmi

> Dokumen ini adalah sumber kebenaran tunggal untuk semua keputusan visual IntegrityView.
> Baca seluruh dokumen sebelum mengerjakan antarmuka baru, mengubah komponen yang ada,
> atau menambahkan halaman. Setiap keputusan desain yang tidak ada dalam dokumen ini
> harus didiskusikan dan ditambahkan ke sini sebelum diimplementasikan.
>
> Dokumen ini menggantikan DESIGN.md dan DESIGN2.md sebagai referensi desain utama.
> DESIGN.md dan DESIGN2.md tetap ada untuk konteks historis, tetapi jika ada konflik,
> dokumen ini yang berlaku.

---

## 1. Kepribadian Platform

IntegrityView adalah alat kerja institusi, bukan produk komersial. Kepribadian visualnya mengikuti tiga prinsip:

**Data sebagai hierarki.** Angka dan grafik adalah elemen utama. Elemen dekoratif hanya boleh hadir jika tidak bersaing dengan data untuk mendapat perhatian.

**Kepercayaan institusional.** Tampilan harus terbaca seperti laporan resmi yang bisa dipertanggungjawabkan, bukan seperti landing page startup yang ingin menjual sesuatu.

**Satu fokus per layar.** Setiap halaman punya satu tindakan utama. Pengguna tidak boleh bingung menentukan langkah berikutnya.

### 1.1 Dial Desain

| Dial | Nilai | Arti |
|---|---|---|
| ENERGY | 3 / 5 | Tegas dan percaya diri, tanpa kesan agresif atau sensasional |
| RHYTHM | 3 / 5 | Komposisi berbeda per section, grid internal konsisten |
| MOTION | 1 / 5 | Hanya hover state dan satu reveal singkat. Tidak ada animasi looping |

MOTION tetap 1 meskipun ENERGY naik ke 3. Kepercayaan institusional dibangun dari tipografi dan ruang, bukan gerakan.

---

## 2. Palet Warna

### 2.1 Warna Utama (Navy)

| Token | Hex | Penggunaan |
|---|---|---|
| `--navy` | `#0F2A3D` | Navbar, heading utama, surface gelap primer |
| `--navy-dark` | `#0A1F2E` | Background section gelap, hero, footer |
| `--navy-mid` | `#2C4A60` | Gradient, elemen level dua, garis pemisah |
| `--navy-light` | `#EAF0F4` | Background kartu info, highlight ringan |

### 2.2 Warna Aksen (Orange)

| Token | Hex | Penggunaan |
|---|---|---|
| `--orange` | `#F2793C` | CTA button, progress bar, aksen visual |
| `--orange-dark` | `#D95A20` | Hover state tombol oranye |
| `--orange-text` | `#D95A20` | Teks oranye di atas latar terang (wajib, untuk WCAG AA) |
| `--orange-light` | `#FDEEE3` | Background chip kategori, alert hint |

Aturan orange: hanya satu elemen oranye dominan per section. Jika dua elemen bersaing, salah satunya harus diturunkan ke varian outline.

Teks oranye di atas latar terang wajib memakai `--orange-text` (#D95A20), bukan `--orange` (#F2793C). #F2793C tidak mencapai rasio kontras 4.5:1 di latar putih.

Teks putih di atas tombol oranye tidak diizinkan. Gunakan `--navy-dark` sebagai warna teks tombol oranye.

### 2.3 Warna Halaman dan Surface

| Token | Hex | Penggunaan |
|---|---|---|
| `--bg-page` | `#F8F9FA` | Background semua halaman (light theme) |
| `--white` | `#FFFFFF` | Kartu, navbar, surface putih |

### 2.4 Warna Teks

| Token | Hex | Penggunaan |
|---|---|---|
| `--text-dark` | `#0F2A3D` | Teks utama, heading kecil |
| `--text-mid` | `#475569` | Teks sekunder, paragraf |
| `--text-light` | `#64748B` | Label, caption, placeholder |

### 2.5 Warna Border

| Token | Hex | Penggunaan |
|---|---|---|
| `--border` | `#E2E8F0` | Border kartu, divider |
| `--border-mid` | `#CBD5E1` | Border input aktif, separator tegas |

### 2.6 Warna Status Laporan

| Status | Hex Teks | Hex Background | Makna |
|---|---|---|---|
| Baru | `#64748B` | `#F1F5F9` | Menunggu tindakan |
| Diproses | `#92400E` | `#FEF3C7` | Sedang ditangani |
| Selesai | `#0F2A3D` | `#EAF0F4` | Tuntas |

Warna status mengikuti semantik, bukan estetika. Jangan mengubahnya atas dasar preferensi visual semata.

### 2.7 Warna 10 Instrumen Survei

Ini adalah encoding data, bukan dekorasi. Setiap warna adalah identitas satu instrumen yang harus konsisten di seluruh platform: sidebar dot, strip indikator, chart tren, kartu hub, chatbot chips. Mengubah satu warna instrumen berarti mengubah seluruh identitas visualnya di semua halaman.

| Instrumen | Key IV | Hex | Kategori | Jenis |
|---|---|---|---|---|
| SPAK | `spak` | `#0F2A3D` | Integritas & Korupsi | survei |
| SPKP | `spkp` | `#F2793C` | Pelayanan Publik | survei |
| SPIP | `spip` | `#8B5CF6` | Integritas & Korupsi | survei |
| Gratifikasi | `gratifikasi` | `#059669` | Integritas & Korupsi | survei |
| Benturan Kepentingan | `benturan` | `#0284C7` | Integritas & Korupsi | survei |
| WBS | `wbs` | `#6D28D9` | Pelaporan | pelaporan |
| Pengaduan Masyarakat | `pengaduan` | `#0EA5E9` | Pelayanan Publik | pelaporan |
| Budaya ZI | `budaya-zi` | `#D97706` | Budaya & 5R | survei |
| Budaya Kerja | `budaya-kerja` | `#E11D48` | Budaya & 5R | survei |
| 5R | `5r` | `#0D9488` | Budaya & 5R | survei |

Setiap warna harus **unik**: tidak ada dua instrumen yang berbagi hex yang sama. Sebelumnya SPIP (#8B5CF6) dan WBS (#7C3AED) nyaris sama, dan 5R (#A855F7) juga ungu. WBS digeser ke `#6D28D9` dan 5R ke `#0D9488` agar masing-masing instrumen punya identitas warna yang jelas berbeda. Field `jenis` membedakan instrumen survei (metrik persentase skor) dari kanal pelaporan (metrik jumlah laporan).

Di landing page, warna instrumen dipakai hanya sebagai garis aksen 3px di tepi atas kartu. Tidak sebagai latar penuh, tidak sebagai gradien.

### 2.8 Alias Backward-Compat

Token `--teal`, `--teal-dark`, `--teal-light`, `--teal-mid`, `--coral`, `--coral-light`, `--coral-dark` adalah alias lama yang mengarah ke `--navy` dan `--orange`. Jangan hapus. Dipakai di hampir semua file CSS lama.

---

## 3. Tipografi

### 3.1 Keluarga Font

| Peran | Keluarga | Dipakai untuk |
|---|---|---|
| Display / Heading | Plus Jakarta Sans | Judul halaman, judul section, angka skor besar |
| Body / UI | Plus Jakarta Sans | Paragraf, label, tabel, tombol, angka kecil, UI dashboard |

```css
--font-display:  'Plus Jakarta Sans', system-ui, sans-serif;
--font-heading:  var(--font-body);
--font-body:     'Plus Jakarta Sans', sans-serif;
--font-head:     var(--font-body);
```

Seluruh platform memakai satu keluarga font: Plus Jakarta Sans. Tidak ada lagi Source Serif 4. Alasannya: satu keluarga membuat halaman terasa konsisten dan modern, menghapus campuran serif-sans yang sebelumnya membuat landing dan halaman kerja terasa seperti dua produk berbeda. Efek sampingnya, hanya satu keluarga font yang perlu dimuat, sehingga halaman lebih cepat.

Hanya h1 sampai h6 yang memakai `--font-heading`, dan karena `--font-heading` mengarah ke `--font-body`, seluruh teks memakai Plus Jakarta Sans.

Font diload dari Google Fonts. Perlu koneksi internet.

**Catatan lama.** Sebelum revisi ini, platform memakai Source Serif 4 untuk heading dan hanya landing yang memakai serif. Aturan itu dihapus. Kelas `.page-landing` di `landing.css` tetap ada supaya tidak ada yang rusak, tetapi nilainya sudah sama dengan default global.

### 3.2 Skala Tipografi

| Elemen | Ukuran | Weight | Font |
|---|---|---|---|
| H1 hero | `clamp(2.3rem, 5vw, 3.7rem)` | 600 | Sans |
| H2 section | `clamp(1.7rem, 3.2vw, 2.5rem)` | 600 | Sans |
| H3 sub-heading | `1.1rem - 1.25rem` | 600 | Sans |
| Skor komposit kartu | `clamp(2.8rem, 5vw, 3.6rem)` | 700 | Sans |
| Angka statistik | `clamp(1.7rem, 3vw, 2.2rem)` | 700 | Sans |
| Judul kartu instrumen | `1.08rem` | 600 | Sans |
| Body text | `0.92rem - 1.05rem` | 400 | Sans |
| Label, caption kecil | `0.72rem - 0.82rem` | 400-500 | Sans |
| Supertitle uppercase | `0.76rem` | 700 | Sans |
| Teks tombol | `0.9rem` | 600 | Sans |
| Teks badge | `0.75rem` | 600 | Sans |

Serif 700 di ukuran besar terlihat gemuk. Gunakan 600 untuk semua heading kecuali angka skor kartu yang memerlukan 700 untuk bobot focal point.

Lebar baris maksimum: 68 karakter untuk body text.

Tidak ada font monospace dekoratif.

### 3.3 Font Weight Token

| Token | Nilai | Penggunaan |
|---|---|---|
| `--fw-regular` | 400 | Body teks biasa |
| `--fw-medium` | 500 | Label, link nav |
| `--fw-semi` | 600 | Sub-heading, tombol, judul kartu |
| `--fw-bold` | 700 | Angka penting, skor |
| `--fw-black` | 800 | Angka statistik sangat besar |

### 3.4 Letter Spacing Token

| Token | Nilai | Penggunaan |
|---|---|---|
| `--ls-tight` | `-0.02em` | Angka statistik besar |
| `--ls-normal` | `0em` | Teks umum |
| `--ls-label` | `0.05em` | Badge, label kapital |
| `--ls-wide` | `0.08em` | Supertitle seperti "ZONA INTEGRITAS" |

---

## 4. Spacing

### 4.1 Skala Spacing

```css
--sp-1:   4px
--sp-2:   8px
--sp-3:  12px
--sp-4:  16px
--sp-5:  20px
--sp-6:  24px
--sp-8:  32px
--sp-10: 40px
--sp-12: 48px
--sp-16: 64px
--sp-20: 80px
```

Gunakan token, jangan menulis nilai piksel langsung di CSS baru.

### 4.2 Border Radius

| Token | Nilai | Penggunaan |
|---|---|---|
| `--radius-sm` | `12px` | Badge, chip, input kecil |
| `--radius-md` | `18px` | Kartu standar |
| `--radius-lg` | `24px` | Kartu besar, panel |
| `--radius-xl` | `32px` | Hero card, panel utama |
| `--radius-full` | `9999px` | Pill badge, tombol pill |

Jangan memberi radius besar ke semua elemen. Radius mengikuti hierarki ukuran elemen.

### 4.3 Shadows

| Token | Nilai | Penggunaan |
|---|---|---|
| `--shadow-xs` | `0 1px 3px rgba(15,42,61,.05)` | Divider tipis |
| `--shadow-sm` | `0 2px 10px rgba(15,42,61,.07)` | Kartu datar |
| `--shadow-md` | `0 6px 22px rgba(15,42,61,.10)` | Kartu interaktif, dropdown |
| `--shadow-lg` | `0 12px 36px rgba(15,42,61,.14)` | Modal, panel melayang |
| `--shadow-orange` | `0 4px 20px rgba(242,121,60,.35)` | CTA primer saat hover |

Shadow hanya untuk elemen yang menunjukkan kedalaman atau interaktivitas. Elemen statis tidak perlu shadow agresif.

---

## 5. Grid dan Layout

### 5.1 Container

```css
max-width: 1280px;
margin-inline: auto;
padding-inline: clamp(1rem, 5vw, 2rem);
```

### 5.2 Grid Utama

| Konteks | Kolom | Gap |
|---|---|---|
| Grid 10 instrumen (desktop) | 5 | `--sp-5` |
| Grid 10 instrumen (tablet) | 3 | `--sp-4` |
| Grid 10 instrumen (mobile) | 2 | `--sp-3` |
| Grid fitur 3 kolom | 3 | `--sp-6` |
| Grid 2 kolom sejajar | 2 | `--sp-8` |
| Sidebar + konten | `240px 1fr` | `--sp-6` |

### 5.3 Breakpoint

| Nama | Lebar | Perilaku |
|---|---|---|
| Mobile | < 480px | Satu kolom, chatbot panel full-screen |
| Tablet | 480px - 768px | Dua kolom untuk grid instrumen |
| Desktop kecil | 768px - 1100px | Layout penuh kecuali dashboard scroll |
| Desktop | > 1100px | Semua layout penuh, dashboard fixed viewport |

Dashboard menggunakan `height: 100vh; overflow: hidden` di desktop. Di bawah 1100px lebar atau 600px tinggi, scroll normal diizinkan sebagai fallback.

---

## 6. Komponen

### 6.1 Navbar

- Tinggi: 76px, tetap di semua halaman
- Posisi: `position: sticky; top: 0; z-index: 200`
- Background: putih, `box-shadow: --shadow-xs` saat di-scroll
- Brand: "IntegrityView" saja (Plus Jakarta Sans bold). Tidak ada sub-brand.
- Link aktif: border-bottom navy, bukan background highlight
- State guest: tombol "Masuk" oranye di kanan
- State admin: avatar huruf pertama + nama asli user + satu badge role "Admin" (navy gelap `#1e3a5f`). Nama tidak boleh berupa "Admin ..." karena akan mengulang badge
- Link "Pengaduan": guest menuju form baru, admin menuju manajemen
- Link "Laporan" dan "Lacak": "Laporan" hanya untuk admin, "Lacak" hanya untuk guest

### 6.2 Sidebar

- Lebar: 268px, `position: fixed; top: 76px; left: 0; z-index: 200`
- Hanya ada di: `dashboard.html`, `laporan.html`, `pengaduan.html`
- Kartu ringkasan navy di atas: rata-rata skor ZI, delta dari bulan lalu, breakdown skor per kategori
- Section "Instrumen Survei": 10 link dengan bar warna unik per instrumen dan nilai di kanan (skor persen untuk survei, jumlah laporan untuk kanal, "Belum ada data" bila kosong)
- Highlight aktif: background `--navy-light`, teks `--navy` bold
- Section "Navigasi": guest punya "Buat Pengaduan" dan "Lacak Pengaduan"; admin punya "Manajemen Pengaduan" dan "Laporan dan Rekap"

### 6.3 Tombol

| Kelas | Latar | Teks | Kapan Dipakai |
|---|---|---|---|
| `btn-primary` | `--orange` | `--navy-dark` | CTA utama, satu per section |
| `btn-outline` | Transparan | `--navy` | Aksi sekunder di latar terang |
| `btn-outline-white` | Transparan | Putih | Aksi sekunder di latar navy |
| `btn-ghost` | Transparan | `--text-mid` | Aksi tersier, navigasi kecil |

Teks tombol oranye memakai `--navy-dark`, bukan putih. Putih di atas #F2793C tidak mencapai 4.5:1.

Hover state tombol primer: `translateY(-1px)` + `--shadow-orange`.

Kartu statis tidak terangkat saat hover.

### 6.4 Kartu

**Kartu standar (terang):**
- Background: `--white`
- Border: `1px solid var(--border)`
- Radius: `--radius-md`
- Shadow diam: `--shadow-sm`
- Shadow hover: `--shadow-md`, `translateY(-2px)`

**Kartu instrumen survei:**
- Border-top: `3px solid [warnaHex instrumen]` (encoding data)
- Tidak terangkat saat hover jika kartu hanya informasi

**Kartu KPI:**
- Border-top berwarna per instrumen atau per status
- Angka besar, label kecil
- Di bawah angka ada sparkline mini (bar CSS) yang menunjukkan arah data

**Kartu grafis hero (dua bagian):**
- Muka: latar `--navy`, berisi skor komposit ZI sebagai focal point
- Badan: latar putih, berisi angka pendukung dan mini bar chart CSS

**Kartu gelap:**
- Background: `--navy`
- Teks: putih

### 6.5 Badge

| Konteks | Background | Teks |
|---|---|---|
| Status Baru | `#F1F5F9` | `#64748B` |
| Status Diproses | `#FEF3C7` | `#92400E` |
| Status Selesai | `#EAF0F4` | `#0F2A3D` |
| Kategori instrumen | `[warnaHex]` at 15% opacity | `[warnaHex]` |
| Tren naik | `#D1FAE5` | `#065F46` |
| Tren turun | `#FEE2E2` | `#991B1B` |
| Tren datar | `#F1F5F9` | `#64748B` |
| Role admin | `#DC2626` | Putih |

### 6.6 Form Multi-Step

- Header sticky berisi progress bar dan step dots
- Progress bar: gradien `--navy` ke `--orange`, transisi `width 300ms ease`
- Step dots: aktif = `--orange`, selesai = `--navy`, belum = `--border`
- Likert group (`.likert-group`): wajib diisi untuk validasi
- Error state: border `--orange-dark`, pesan `.form-error` di bawah input
- Validasi dijalankan oleh `MultiStepForm` class di `form-validation.js`

### 6.7 Chart

- Library: Chart.js 4.4.3 dari CDN. Hanya dimuat di `dashboard.html` dan `laporan.html`
- Font: Plus Jakarta Sans untuk semua teks chart
- Warna: diambil dari `IV.SURVEI_INFO[key].warnaHex`. Tidak boleh di-hardcode terpisah
- Tooltip: background `--navy`, teks putih, radius 8px
- Grid line: `rgba(0,0,0,0.05)`
- Target line: selalu `borderDash: [6, 4]`, tidak pernah solid
- Radar chart dan detail chart wajib guard re-init: `Chart.getChart(ctx)?.destroy()` sebelum membuat baru
- Tren chart tidak perlu guard karena hanya di-init sekali

### 6.8 Toast Notification

- Posisi: `position: fixed; bottom: 24px; right: 24px; z-index: 400`
- Background: `--navy`, teks putih
- Radius: `--radius-sm`, shadow: `--shadow-md`
- Durasi: 3-4 detik, kemudian fade-out

### 6.9 Chatbot FAB dan Panel

**FAB:**
- Posisi: `position: fixed; bottom: 24px; right: 24px; z-index: 300`
- Bentuk pill, tinggi 52px, ikon chat bubble + label teks "Butuh Bantuan?", background `--navy`
- Dot notifikasi oranye menampilkan jumlah pesan tersimpan; disembunyikan bila belum ada riwayat, dan hilang setelah panel dibuka. Statis (tidak pulse)
- Hadir di semua halaman

**Panel Chat:**
- Posisi: `position: fixed; bottom: 90px; right: 24px; z-index: 300`
- Desktop: 360px x 520px. Mobile (< 480px): full-screen
- Background putih, radius `--radius-lg` di sudut atas, shadow `--shadow-lg`
- Animasi buka: `translateY(100%) ke translateY(0)`, 300ms ease-out
- Animasi tutup: `translateY(0) ke translateY(100%)`, 250ms ease-in

**Bubble chat:**

| | Bot | User |
|---|---|---|
| Posisi | Kiri | Kanan |
| Background | `#F1F5F9` | `--navy` |
| Teks | `--text-dark` | Putih |
| Max-width | 80% | 80% |
| Font | Plus Jakarta Sans 0.88rem | Plus Jakarta Sans 0.88rem |

### 6.10 Stepper Status (Lacak Pengaduan)

Tiga tahap linear: Laporan Diterima, Sedang Diproses, Selesai Ditangani.

- Tahap tercapai: ikon centang `--navy`, garis penghubung `--navy`
- Tahap aktif: ikon `--orange`
- Tahap belum tercapai: ikon abu, teks `--text-light`, opacity 0.5

### 6.11 Transisi dan Motion

MOTION tetap 1 (hover state dan satu reveal singkat), tetapi transisi antar halaman harus halus, bukan patah.

**Perpindahan halaman:**
- `main` memakai animasi `pageIn`: fade + naik 10px, durasi 380ms, easing `cubic-bezier(.22,.61,.36,1)`.
- Klik link internal memicu `.page-leaving` (fade 160ms) sebelum navigasi. Link eksternal, `#hash`, `target="_blank"`, dan unduhan dikecualikan.
- View Transitions API didaftarkan lewat `@view-transition { navigation: auto }` untuk browser yang mendukung. Browser yang tidak mendukung memakai fallback di atas.

**Reveal saat masuk viewport:**
- Kelas `.reveal` + `.is-in`, dijalankan `IntersectionObserver` di `main.js`. Elemen naik 14px sambil fade, 460ms.
- Dipakai pada section landing dan blok besar dashboard. Tidak untuk setiap elemen.

**Aturan:** semua animasi dimatikan oleh `prefers-reduced-motion`. Tidak ada animasi looping.

---

## 7. Pola Layout Per Halaman

### 7.1 Landing Page (`index.html`)

Sembilan section berurutan:

```
1   Hero + kartu skor          navy split: teks kiri, kartu grafis kanan
2   Apa itu Zona Integritas    terang: 3 angka + paragraf
3   Manfaat untuk sivitas      terang: sticky heading kiri + daftar bernomor kanan
4   Sepuluh Instrumen          putih: grid 5x2 + kartu pintu
5   Alur Kerja                 navy: 4 langkah horizontal bernomor
6   Pengaduan dan WBS          terang: 2 jalur berdampingan
7   Dampak                     putih: narasi kiri + angka cakupan kanan
8   Pita Ajakan                navy: pita sempit penuh lebar
9   Footer                     navy gelap: brand + 3 klaster tautan
```

Komposisi section berbeda-beda. Itu yang memenuhi RHYTHM 3.

**Hero:** full-width, satu kolom. Latar foto gedung (`assets/img/pens.jpeg`) dengan scrim gradien navy dua lapis agar teks tetap kontras. Teks dan CTA rata kiri di atas foto. Di bawah CTA ada strip statistik empat angka dengan latar navy semi-transparan. Tinggi minimal 92vh di desktop, `auto` di mobile.

Detail hero:

- **Scrim:** dua lapis gradien, satu diagonal `rgba(10,20,40,.55)` ke `rgba(10,20,40,.92)`, satu horizontal `rgba(10,20,40,.82)` ke `rgba(10,20,40,.45)`. Terukur: kontras terendah judul 12.45:1 dan paragraf 10.81:1, jauh di atas WCAG AA 4.5:1.
- **Branding:** "IntegrityView" hanya muncul di navbar. Hero tidak menampilkan nama produk sebagai heading, hanya eyebrow "Zona Integritas PENS". Ini menghindari duplikasi brand.
- **CTA context-aware:** guest melihat "Buka Dashboard Publik" dan "Lihat Pusat Survei". Admin melihat "Kelola Survei" (menuju manajemen) dan "Lihat Ringkasan Admin" (menuju laporan).
- **Scroll indicator:** chevron animasi di bawah hero menuju `#tentang`. Animasi dimatikan saat `prefers-reduced-motion`.

**Band statistik (`.stats-band`):** section terpisah, BUKAN bagian dari `.hero`. Ini penting: `.hero` memakai `overflow: hidden` dan `min-height`, jadi menaruh band statistik di dalamnya membuatnya terpotong dan tampak mengambang. Band statistik berdiri sendiri dalam normal flow (`position: relative`), full-width, background navy gelap solid (`--navy-dark`), tepat di bawah hero.

- Grid 4 kolom di desktop, 2 kolom di <=900px, 1 kolom di <=480px.
- Tiap statistik tiga baris terpisah: angka (`.stats-band__num`), deskripsi (`.stats-band__label`, margin-top 12px), keterangan "Data Simulasi" (`.stats-band__note`, margin-top 8px, 0.68rem, italic, warna muted).

**Trust strip:** section tipis tepat di bawah hero, dibuka heading kecil "Statistik Ringkas" agar tidak menyatu dengan hero. Berisi slot logo institusi (`[LOGO PENS]`, `[LOGO ZONA INTEGRITAS]`, placeholder sampai berkas asli tersedia) dan tiga angka ringkas (survei selesai, tingkat transparansi, partisipan aktif) dengan label "Data Simulasi".

**Alur kerja:** nomor besar oranye berdiri sendiri tanpa lingkaran. Tidak ada ikon di dalam bulatan berwarna.

**Footer:** tiga klaster: Instrumen, Platform, Institusi. Bukan empat kolom Product/Company/Resources/Legal.

### 7.2 Dashboard (`pages/dashboard.html`)

Dashboard publik memakai **lebar penuh tanpa sidebar**. Navigasi cukup lewat navbar atas. Isi sidebar lama (ringkasan skor dan daftar instrumen) dihapus karena duplikat dengan card ringkasan dan grafik sebaran.

Layout desktop: satu layar penuh, `height: calc(100dvh - var(--navbar-h))`, **tanpa scroll internal**. Grid utama `grid-template-rows: auto auto 1fr` dengan `min-height: 0` pada semua anak grid. Tidak ada elemen dengan `overflow: auto/scroll` di dalam halaman. Berlaku sampai viewport sekecil 1280x650. Dua panel tetap berdampingan (`3fr 2fr`) selama lebar >= 900px; tumpuk vertikal hanya di bawah 900px atau tinggi di bawah 560px.

**View Ringkasan (struktur):**
```
Header              satu baris, maksimal 56px: eyebrow + judul + badge (periode, akses, sumber data)
Bagian 1            tiga card ringkasan sejajar (tinggi maksimal 84px)
Bagian 2            dua kotak: kiri 60% sebaran jawaban, kanan 40% statistik + rekomendasi
```

**Bagian 1 - Tiga card ringkasan** (padat, satu baris, tiga kolom sama lebar, tinggi maksimal 84px, padding 10-14px). Isi horizontal: label kecil + ikon info di atas, angka besar di kiri, rincian satu-dua baris di kanan angka.

1. **Total Instrumen**: "10", rincian "3 layanan, 7 internal" dan sub-label "1 data riil, 9 simulasi".
2. **Jumlah Responden**: angka besar, rincian "Dosen x, Tendik y". Angka absolut tanpa persentase partisipasi.
3. **Rata-rata Skor ZI**: angka besar, rincian "Interval 95%: bawah - atas" dan perubahan dari periode lalu.

Catatan rumus indeks tidak ditampilkan sebagai teks permanen, melainkan di tooltip ikon info kecil di pojok card. Ikon info (`.info-dot`) memunculkan tooltip saat hover atau fokus.

**Bagian 2 - Dua kotak** (kiri 60%, kanan 40%, tinggi mengikuti sisa ruang):

- **Kiri, "Sebaran Jawaban per Instrumen"**: horizontal stacked bar 100% untuk 10 instrumen, dibagi rata memenuhi tinggi kotak (baris `flex: 1`, tinggi batang `clamp(18px, 2.4vh, 24px)`, tanpa area scroll). Empat segmen: Sangat Tidak Setuju (1) oranye tua `#D95A20`, Tidak Setuju (2) oranye muda `#F5A97A`, Setuju (3) biru muda `#93B4D1`, Sangat Setuju (4) navy `#0F2A3D`. Tiap baris: nama instrumen lebar tetap 130px, batang `1fr` mengisi seluruh sisa lebar, jumlah responden (n) lebar tetap 56px di kanan. Legend empat warna sebaris dengan judul panel (judul kiri, legend kanan), bukan baris terpisah. Penjelasan "Klik batang untuk melihat statistik." ada di tooltip ikon info, bukan sub-judul permanen. Label persen di dalam segmen hanya bila lebar segmen minimal 36px; segmen lebih sempit tanpa label, angkanya di tooltip. Batang terpilih diberi outline navy. Batang simulasi diberi label kecil "simulasi". Sudut dan garis tegas, tanpa lengkung.
- **Kanan, "Ringkasan Statistik dan Rekomendasi"**: badge "Data simulasi" atau "Data riil" di samping judul. Panel memakai flex column `justify-content: space-between` mengisi tinggi penuh. Bagian atas grid 3 kolom x 2 baris berisi enam angka kecil (jumlah responden, rata-rata, median, simpangan baku, persen Setuju + Sangat Setuju, Cronbach's alpha); tinggi sel 48-56px, angka 1.25rem, label 0.68rem. Rata-rata dan median dipisah menjadi dua sel. Bagian bawah maksimal 3 rekomendasi, tiap item satu baris judul dan satu baris dasar data dengan `line-clamp: 1`. Tombol "Lihat detail" membuka modal berisi seluruh rekomendasi. Tanpa scroll di dalam kotak. Panel diberi `padding-right` agar tombol bantuan tidak menutupi angka.

**Instrumen terpilih awal: SPAK**, satu-satunya instrumen berdata riil. Pemilihan instrumen dilakukan dengan klik pada batang grafik; panel kanan mengikuti.

**Satu sumber data.** Semua angka dashboard dihitung dari `IV.getRingkasanDashboard()`, `IV.getStatistikInstrumen(key)`, dan `IV.getRekomendasi(key)` yang membaca dataset per butir `IV.INSTRUMEN_DATASET`. Tidak ada dua angka berbeda untuk hal yang sama. Rumus indeks tunggal `(skor aktual / skor maksimal) x 100`.

**Format angka** memakai koma desimal dan titik ribuan Indonesia (`IV.formatAngkaId`, `IV.persen`).

**Tombol bantuan** bundar kecil berikon chat di pojok kanan bawah, jarak minimal 16px dari tepi. Teks "Butuh Bantuan?" muncul hanya saat hover atau fokus.

**Dihapus dari ringkasan publik:** card Status Laporan, donut status, chart tren, chart skor bar, strip indikator lama, feed aktivitas, dan sidebar.

**State loading dan kosong:** kotak sebaran menampilkan "Memuat sebaran jawaban..." saat memuat, "Belum ada data untuk instrumen ini." bila instrumen tidak punya data.

**Diuji pada 1280x650, 1366x680, 1536x730, 1920x950:** seluruh konten terlihat tanpa scroll halaman maupun scroll di dalam panel, dua panel tetap berdampingan, dan tinggi tidak meluber (memakai `clamp()` dengan satuan vh/vw agar muat di viewport terkecil).

**View Detail (hash routing `dashboard.html#[key]`):**
```
Header detail   nama panjang, badge, tombol isi survei, tombol kembali
Panel 1         skor, badge target, benchmark, 5 aspek bar
Panel 2         radar lima unsur SPIP (hanya tampil saat key = spip)
Panel 3         tren 6 bulan instrumen
Panel 4         total responden, kategori, status breakdown
```

### 7.3 Halaman Pusat Survei (`pages/survei.html`)

```
Hero navy gradien   judul kiri, panel progres gelap kanan (angka besar + progress bar)
Stat strip          kartu putih, 4 angka, naik menimpa tepi hero (margin-top negatif)
Toolbar             filter kategori kiri, tombol "Mulai Survei Berikutnya" kanan
Grid instrumen      3 kolom kartu, tiap kartu: badge kategori, nama, deskripsi,
                    rel skor dengan penanda benchmark, jumlah responden, badge status, tombol isi
```

Kartu instrumen bukan sekadar nama dan tombol. Setiap kartu menampilkan rel skor berwarna instrumen dengan penanda posisi benchmark, sehingga pengguna bisa membandingkan capaian antar instrumen sekilas. Tombol isi survei memakai `btn-block` agar targetnya besar dan mudah di-tap.

### 7.4 Halaman Admin

`pengaduan.html` dan `laporan.html` menggunakan layout `sidebar (240px fixed) + konten (1fr)`.

- `pengaduan.html`: hard redirect ke login jika tidak ada sesi admin
- `laporan.html`: soft gate, konten diganti pesan "Akses Terbatas" tanpa redirect

**Manajemen laporan (`pengaduan.html`):**

- Empat kartu KPI status (Total, Baru, Diproses, Selesai) yang bisa diklik untuk memfilter tabel.
- Filter Status, Jenis (Pengaduan/WBS), Kategori, dan pencarian teks.
- Aksi cepat per baris: tombol Proses / Selesaikan untuk memindahkan status, plus Detail.
- Panel detail berisi deskripsi, identitas pelapor (atau keterangan anonim), riwayat status, catatan internal, dan tombol Salin Kode serta Lihat Halaman Pelacakan.
- Form perbarui status: PIC wajib diisi bila status bukan Baru, catatan publik tampil ke pelapor, catatan internal tidak.

**Balasan dan lampiran hasil penanganan:**

Admin dapat mengirim balasan untuk pelapor, bisa berkali-kali, masing-masing dengan teks dan lampiran berkas. Balasan bersifat publik dan tampil di halaman pelacakan pelapor.

- Lampiran menerima PDF, dokumen, dan gambar, maksimal 2 MB per berkas.
- Berkas dibaca sebagai data URI base64 lalu disimpan di localStorage (`iv_pengaduan`), karena prototype tidak punya server. Batas ini disengaja: berkas besar akan menghabiskan kuota localStorage.
- Balasan disimpan pada field `balasan[]` per laporan: `{ id, teks, tanggal, oleh, lampiran[] }`, dan `lampiran[]` berisi `{ nama, tipe, ukuran, data }`.
- Halaman pelacakan menampilkan teks balasan dan tautan unduh lampiran, tetapi tetap menyembunyikan deskripsi lengkap, identitas pelapor, nama PIC, dan catatan internal.

**Panel detail laporan (struktur tampilan):**

- **Breadcrumb** di atas panel: "Kembali ke Daftar Pengaduan / [Jenis] [ID]". Tidak bergantung pada tombol back browser.
- **Definition list 2 kolom** (`.detail-list`) untuk semua data key-value: label di kiri (bold, muted, diakhiri titik dua lewat CSS), value di kanan. Berlaku di "Identitas pelapor" dan "Metadata laporan". Di bawah 600px menjadi satu kolom.
- **Setiap kelompok dibungkus card terpisah** (`.detail-card`): Deskripsi, Identitas pelapor, Metadata laporan, Catatan internal, Riwayat status. Jarak antar card konsisten.
- **Catatan internal** memakai `.detail-card--internal`: background kuning muda `#FFFBEB`, border `#FDE68A`, heading dengan ikon gembok, untuk menandai data confidential yang tidak tampil ke pelapor.
- **Riwayat status** selaras dengan badge: dot entri terakhir diwarnai sesuai status terkini (Baru abu, Diproses cokelat `#92400E`, Selesai navy), sama seperti warna badge di header.
- **Divider** (`.detail-divider`) memisahkan section besar: setelah Catatan internal, setelah Riwayat status, dan sebelum Balasan.
- Panel detail diberi `padding-bottom: 96px` agar form "Perbarui status" tidak tertutup widget chat fixed.

Catatan teknis: `.detail-list` didefinisikan di `components.css`, bukan `dashboard.css`, karena `pengaduan.html` tidak memuat `dashboard.css`. Ini mencegah bug label dan value yang menyatu akibat aturan `display: grid` tidak teraplikasi.

---

## 8. Aksesibilitas dan Kontras

### 8.1 Pasangan Kontras Wajib

| Pasangan | Rasio Minimum |
|---|---|
| Teks navy di latar putih | 7:1 |
| Teks putih di latar navy | 7:1 |
| Teks `--orange-text` di latar putih | 4.5:1 |
| Teks navy di latar `--navy-light` | 4.5:1 |
| Teks putih di atas foto hero | Panel navy solid, bukan langsung di foto |

`--orange` (#F2793C) tidak boleh dipakai sebagai warna teks di atas latar terang.

### 8.2 Interaktivitas

- Setiap elemen interaktif wajib punya fokus yang terlihat saat `:focus-visible`
- Touch target minimal 44x44px di mobile
- Kartu yang bisa diklik harus dibungkus `<a>` yang valid, bukan hanya `onclick` di `div`

### 8.3 Label Data Simulasi

Semua angka statistik publik dari data mock wajib punya label: "Data Simulasi", "Data Simulasi Agustus 2026", atau setara. Label boleh kecil, tapi harus ada dan terbaca.

---

## 9. Aturan Teks dan Konten

**Bahasa:** Semua teks antarmuka dalam Bahasa Indonesia. Pengecualian: nama teknis yang sudah lazim (Dashboard, Whistleblowing System, WBS).

**Karakter yang dilarang di teks user-facing:**
- Em dash (karakter panjang). Gunakan titik dua, koma, atau kalimat terpisah
- Teks placeholder: lorem ipsum, [PLACEHOLDER], TODO, COMING SOON
- Kutipan atau testimonial yang dibuat-buat
- Tautan mati

**CTA:** Teks tombol spesifik dan deskriptif. "Lihat Rekap Skor ZI" lebih baik dari "Pelajari Lebih Lanjut". Setiap section punya paling banyak satu CTA primer.

---

## 10. Urutan Load Script

Urutan ini tidak bisa dibalik. Membaliknya menyebabkan `ReferenceError: IV is not defined`.

```html
<!-- Untuk pages/*.html -->
<script src="../assets/js/mock-data.js"></script>
<script src="../assets/js/main.js"></script>
<script src="../assets/js/chatbot.js"></script>

<!-- Untuk index.html -->
<script src="assets/js/mock-data.js"></script>
<script src="assets/js/main.js"></script>
<script src="assets/js/chatbot.js"></script>
```

`chatbot.js` memanggil `initChatbot()` sendiri saat `DOMContentLoaded`. Tidak perlu dipanggil dari luar.

---

## 11. Checklist Sebelum Mengirim UI Baru

**Konten:**
- [ ] Angka statistik dari data mock berlabel "Data Simulasi" atau setara
- [ ] Tidak ada teks placeholder tersisa
- [ ] Semua link aktif dan menuju URL yang benar
- [ ] Tidak ada tombol atau link yang tidak berfungsi
- [ ] Teks antarmuka dalam Bahasa Indonesia
- [ ] Tidak ada em dash di teks yang tampil ke pengguna

**Warna:**
- [ ] Teks oranye di latar terang memakai `--orange-text`, bukan `--orange`
- [ ] Teks tombol oranye memakai `--navy-dark`, bukan putih
- [ ] Warna instrumen tidak diubah dari nilai di `IV.SURVEI_INFO`
- [ ] Status laporan memakai warna yang sesuai semantik

**Tipografi:**
- [ ] Semua teks memakai Plus Jakarta Sans, tidak ada Source Serif 4
- [ ] Tidak ada font family kedua yang dimuat di HTML

**Spacing:**
- [ ] Spacing memakai token `--sp-*`, bukan nilai piksel langsung

**Interaktivitas:**
- [ ] Elemen interaktif punya fokus yang terlihat
- [ ] Touch target minimal 44x44px di mobile
- [ ] Kartu yang bisa diklik terbungkus elemen semantik yang benar

**Chart (jika ada):**
- [ ] Warna chart diambil dari `IV.SURVEI_INFO[key].warnaHex`
- [ ] Target line menggunakan `borderDash: [6, 4]`, tidak pernah solid
- [ ] Radar chart dan detail chart punya guard re-init

**Script:**
- [ ] Urutan load: `mock-data.js`, `main.js`, lalu yang lain

---

*IntegrityView Design System*
*September 2026 -- Zona Integritas PENS*
*Revisi dokumen ini harus disertai alasan dan contoh implementasi.*
