# IntegrityView

Platform analitik **Zona Integritas PENS**: pusat survei, dashboard analitik, dan kanal
pelaporan **Whistleblowing System (WBS)**. Frontend berupa SPA React 19 + Vite; data survei
dibaca dari Supabase (PostgreSQL + Edge Functions). Tanpa konfigurasi Supabase, aplikasi
tetap berjalan memakai data simulasi dan `localStorage`/`sessionStorage`.

> Prototipe/demo. Angka di dashboard bisa berasal dari data riil Supabase atau simulasi
> ber-seed. Login masih demo dan tidak memverifikasi password.

## Stack

- **React 19** + **Vite 8**, vanilla CSS dengan CSS variables (`src/styles/tokens.css`)
- **Supabase**: tabel `survey_responses`, `pengaduan`, `whistleblowing`, RPC pelacakan,
  dan Edge Functions (Deno)
- **html2canvas + jsPDF** untuk ekspor PDF
- **oxlint** untuk lint
- **FastAPI** opsional di `backend/` (legacy, tidak dipanggil frontend)

## Mulai cepat

```bash
cd frontend
npm install
npm run dev
```

Buka URL yang muncul (biasanya `http://localhost:5173`; bila port dipakai Vite pindah ke 5174).

Perintah lain:

```bash
npm run build      # hasil ke frontend/dist/
npm run preview    # menyajikan hasil build
npm run lint       # oxlint
```

Tidak ada test runner dan tidak ada formatter.

## Deploy ke Vercel

Repo sudah menyiapkan dua konfigurasi. Pilih salah satu saat import project:

**A. Root Directory = `frontend`** (disarankan)

- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Rewrite SPA memakai `frontend/vercel.json`

**B. Root Directory = root repo**

- Biarkan pengaturan build mengikuti `vercel.json` di root:
  install `npm --prefix frontend install`, build `npm --prefix frontend run build`,
  output `frontend/dist`.

Tambahkan environment variables di **Project Settings > Environment Variables**
(Production dan Preview):

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_ENABLE_SIMULATION=true
VITE_ENABLE_DEMO_LAPORAN=true
```

Set `VITE_ENABLE_DEMO_LAPORAN=false` untuk produksi bila seed laporan demo tidak ingin tampil.
Vite membaca env saat build, jadi **redeploy** setelah mengubah nilainya.

## Variabel lingkungan

Salin `frontend/.env.example` menjadi `frontend/.env`:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_ENABLE_SIMULATION=true
VITE_ENABLE_DEMO_LAPORAN=true
```

- `.env` tidak di-commit. Jangan pernah menaruh `sb_secret_...` atau `DATABASE_URL` di frontend.
- `VITE_ENABLE_SIMULATION=false` menampilkan keadaan kosong untuk (instrumen, periode) tanpa
  baris asli.
- `VITE_ENABLE_DEMO_LAPORAN=false` mematikan seed laporan WBS demo.
- Vite hanya membaca `.env` saat start; restart `npm run dev` setelah mengubahnya.

## Struktur repo

```
IntegrityView/
├── frontend/                 aplikasi React + Vite
│   ├── src/
│   │   ├── App.jsx           "router" manual berbasis state + query string
│   │   ├── pages/            satu file per halaman (*.jsx + *.css)
│   │   ├── components/       layout, dashboard, instrumen, laporan, ivy, motion, cards, tables
│   │   ├── data/             instrumentConfig, surveyData (facade), survey/, mock, laporanApi, notifikasi
│   │   ├── lib/              reportPdf, formatDelta, formatSkor, lampiranLokal, motion
│   │   └── styles/           tokens.css + globals.css
│   └── public/               favicon, icons, pens.jpeg
├── supabase/
│   ├── schema.sql            skema tabel, RLS, trigger kode, RPC, bucket lampiran
│   ├── apps_script_webhook.js
│   ├── functions/            webhook-survei, kirim-laporan, buat-upload-lampiran, ambil-lampiran
│   └── migrations/           view agregat (belum dijalankan)
├── backend/                  FastAPI opsional/legacy (tidak dipakai frontend)
├── AGENTS.md                 aturan kerja untuk AI agent
├── PRD-IntegrityView-v3.md   spesifikasi produk
├── DESIGN_SYSTEM.md          sistem desain resmi
└── DESIGN2.md                spesifikasi tema "bento"
```

## Halaman & fitur

Routing tanpa react-router: `App.jsx` menyimpan state `page` dan menyinkronkan
`?page=`, `?instrumen=`, serta filter `periode`/`pembanding`/`kategori` ke URL.

| Halaman | Isi |
|---|---|
| **Landing** | Beranda publik: ringkasan angka, daftar instrumen, alur, kanal lapor, CTA masuk |
| **Auth** | Masuk/daftar demo; pilih peran `sivitas` atau `admin` |
| **Dashboard** | KPI ringkasan, sebaran jawaban per instrumen, heatmap perubahan 5 semester, panel statistik + rekomendasi, ekspor PDF |
| **Pusat Survei** | Daftar 10 instrumen, filter kategori, tombol **Isi Survei** ke Google Form |
| **Detail Instrumen** | Distribusi butir, tren periode, rekomendasi, kualitas data, ekspor PDF |
| **WBS / Pengaduan** | Buat laporan dugaan pelanggaran integritas + lacak status dengan kode laporan |
| **Kelola Pengaduan** | Admin: filter, ubah status, catatan internal, balas pelapor, buka lampiran |
| **Laporan** | Admin: rekap skor instrumen, rekap kategori WBS, ekspor CSV |
| **Profil** | Identitas pengguna, statistik laporan, tab keamanan |

Fitur lintas halaman:

- **Filter global** (periode, pembanding, kategori) tersinkron ke URL dan dipakai semua halaman.
- **Notifikasi topbar** dihitung dari data yang ada (laporan baru, periode berjalan, perubahan
  status laporan di perangkat ini); status "dibaca" disimpan di `localStorage`.
- **Ivy** — widget tanya-jawab prototipe dengan jawaban hardcoded (belum memakai LLM/API).
- **Transisi halaman** memakai View Transitions API bila tersedia, dengan fallback fade dan
  dukungan `prefers-reduced-motion`.
- **Ekspor PDF** memakai satu komponen template (`.rt__page` = satu halaman A4), sehingga
  pratinjau dan hasil unduhan identik.

## Alur data survei

```
Google Form
  -> Apps Script "On form submit" (supabase/apps_script_webhook.js)
  -> Edge Function webhook-survei
  -> INSERT public.survey_responses

Browser
  -> ReportFilterProvider memuat data sekali (muatDataSurvei)
  -> GET /rest/v1/survey_responses (anon/publishable key)
  -> normalisasi + dedup + tentukan periode (WIB)
  -> getReportData(filter) menghitung semua angka
  -> landing, dashboard, detail, pusat survei, laporan, PDF
```

Semua halaman memakai **satu selector** `getReportData(filter)` dari `src/data/surveyData.js`.
Implementasinya dipecah di `src/data/survey/` (constants, normalize, statistics, aggregates,
recommendations, report, simulation, store, cache, filters); `surveyData.js` hanya facade
agar API lama tetap jalan.

Aturan sumber data per (instrumen, periode):

```
ada baris asli?  -> "real"
tidak            -> simulasi aktif? -> "simulated"
tidak            -> "empty"
```

Satu pasangan (instrumen, periode) tidak pernah mencampur data asli dan simulasi.

Bentuk baris `survey_responses`:

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint identity | primary key |
| `nama_instrumen` | text | mis. `SPAK`, `Gratifikasi` |
| `email_responden` | text, nullable | dedup + hitung responden unik |
| `data_jawaban` | jsonb | metadata + jawaban butir + satu jawaban terbuka |
| `created_at` | timestamptz | penentu periode (dikonversi ke WIB) |

Nilai Likert di `data_jawaban` disimpan sebagai **string** `"1"`–`"4"`, dan kunci butir berupa
teks pertanyaan lengkap. Pertanyaan terbuka ikut di objek yang sama, bukan kolom terpisah.

## Instrumen

10 instrumen, total **66 butir**, skala Likert 1–4. Definisi resmi ada di
`src/data/instrumentConfig.js` (slug, nama, kategori, kelompok, tautan Google Form, teks butir,
alias nama dari database, dan ambang rekomendasi).

| Slug | Nama | Butir | Kategori | Kelompok |
|---|---|---:|---|---|
| `spip` | SPIP | 9 | Integritas & Korupsi | Internal |
| `spak` | SPAK | 6 | Integritas & Korupsi | Layanan |
| `spkp` | SPKP | 8 | Pelayanan Publik | Layanan |
| `gratifikasi` | Gratifikasi | 5 | Integritas & Korupsi | Internal |
| `benturan` | Benturan | 6 | Integritas & Korupsi | Internal |
| `wbs` | WBS | 6 | Pelaporan | Internal |
| `pengaduan` | Pengaduan | 6 | Pelayanan Publik | Layanan |
| `budaya-zi` | Budaya ZI | 7 | Budaya & 5R | Internal |
| `pens-joss` | PENS JOSS | 6 | Pelayanan Publik | Internal |
| `5r` | 5R | 7 | Budaya & 5R | Internal |

Catatan: instrumen `pengaduan` adalah **survei persepsi** tentang kanal pengaduan, bukan kanal
pelaporan WBS. Kanal WBS adalah modul tiket terpisah.

## Statistik

Dihitung di browser oleh `hitungAgregat` (`src/data/survey/statistics.js`):

- Skor baris: `(rata-rata butir / 4) × 100`
- Indeks instrumen: `total skor / (jumlah butir × 4 × n) × 100`
- Median, SD sampel (n−1), CI 95% (`indeks ± 1,96 × SD/√n`)
- Proporsi setuju (jawaban 3–4), distribusi 1–4 dengan pembulatan largest remainder
- Cronbach alpha; `—` bila n < 2 atau varian total 0
- Delta: indeks periode terpilih − indeks pembanding
- Arah perubahan: `≥ +0,5` naik, `≤ −0,5` turun, selain itu stabil
- Rekomendasi: prioritas **Tinggi** / **Pantau** berdasarkan rata-rata butir, proporsi jawaban
  1–2, perubahan bermakna, dan kecukupan n (ambang di `AMBANG`)

Periode yang tersedia: 2024 Ganjil, 2025 Genap, 2025 Ganjil, 2026 Genap, 2026 Ganjil
(berjalan, default). Periode ditentukan dari `created_at` dalam **WIB (UTC+7)**.

Jawaban terbuka tidak pernah ditampilkan mentah. Jawaban > 300 karakter atau mengandung kata
seperti `Rp`, `juta`, `miliar`, `dugaan`, `melaporkan`, `fiktif`, `mark up` ditandai sensitif
dan dihitung sebagai "ditahan untuk tinjauan WBS".

## Modul WBS

- Satu kanal laporan: dugaan pelanggaran integritas. Keluhan fasilitas/kepuasan layanan
  dialihkan ke **SatisView** (alamat masih kosong di `reportCategories.js`).
- Kategori laporan: 11 kategori dalam 3 grup (korupsi, penyalahgunaan wewenang, etika).
- Kode laporan baru `WBS-TAHUN-NNNN`; kode lama `ADU-TAHUN-NNNN` tetap bisa dilacak.
- Bila Supabase dikonfigurasi, laporan dikirim lewat Edge Function `kirim-laporan`; lampiran
  diunggah ke bucket privat `lampiran-laporan` memakai signed upload URL.
- Lampiran maksimal **3 file**, **10MB/file**, format PDF/Word/JPG/PNG.
- Rate limit **5 laporan / 10 menit / IP** (tanpa captcha).
- Pelacakan publik memakai RPC `lacak_laporan` yang tidak mengembalikan PII.
- Tanpa Supabase, laporan disimpan di `localStorage` (`iv2_pengaduan`) dan lampiran di
  IndexedDB (`iv2_lampiran`).
- Halaman **Kelola Pengaduan** dan **Laporan** masih membaca mirror lokal/seed; membaca DB
  lintas browser menunggu Supabase Auth admin + policy SELECT/UPDATE.

## Supabase

`schema.sql` membuat:

- `survey_responses` — jawaban survei (`data_jawaban` jsonb), RLS SELECT untuk anon
- `pengaduan` dan `whistleblowing` — tiket laporan, akses langsung anon dicabut
- Trigger `isi_kode_laporan` — kode `ADU-`/`WBS-` otomatis
- `lacak_laporan(text)` — pelacakan publik tanpa PII
- `rate_limit_laporan` + `cek_rate_limit(...)` — pembatas kirim per IP
- Bucket privat `lampiran-laporan` dengan batas 10MB dan MIME yang diizinkan

Edge Functions:

| Function | Fungsi |
|---|---|
| `webhook-survei` | Menerima submit Google Form, INSERT ke `survey_responses` |
| `kirim-laporan` | Validasi + INSERT laporan pengaduan/WBS |
| `buat-upload-lampiran` | Membuat signed upload URL lampiran |
| `ambil-lampiran` | Membuat signed download URL lampiran (admin) |

Deploy dari root project:

```bash
supabase functions deploy webhook-survei --no-verify-jwt
supabase functions deploy kirim-laporan --use-api
supabase functions deploy buat-upload-lampiran --use-api
supabase functions deploy ambil-lampiran --use-api
supabase secrets set WEBHOOK_SECRET=ganti-dengan-string-acak
```

Migrasi `supabase/migrations/20261026000000_aggregate_views.sql` bersifat **additive** dan
**belum dijalankan**. Isinya index, view agregat tanpa email/teks terbuka, dan RPC
`survey_aggregate`. Frontend saat ini masih membaca tabel mentah lewat REST.

## Backend FastAPI (opsional)

Folder `backend/` berisi alternatif webhook + baca data memakai psycopg2/asyncpg. Frontend
**tidak** memanggil backend ini. Statusnya legacy dan belum lengkap: `backend/main.py`
mengimpor `app.main`, sedangkan `app/main.py` belum ada di tree. Jangan mengubah backend
kalau yang ingin diubah adalah perilaku dashboard.

## Batasan yang diketahui

- Login demo: `loginAs('sivitas' | 'admin')` hanya menulis `sessionStorage['iv2_session']`;
  password tidak dicek. Sesi hilang saat tab ditutup.
- RLS `survey_responses` masih memberi anon akses SELECT seluruh baris, termasuk
  `email_responden` dan jawaban terbuka. Perketat sebelum publik.
- Data WBS admin belum lintas perangkat (masih `localStorage`/seed).
- Ivy masih mockup hardcoded.
- `frontend/package.json` bernama `frontend2` (sisa penamaan tema "bento"); folder sebenarnya
  `frontend/`.
- Beberapa komponen sisa iterasi lama masih ada tetapi tidak dipakai (`BentoGrid`,
  `ReportsTable`, `AddNewCard`, `ChartCard`, `HighlightCard`, `SoftStatCard`,
  `ItemDistributionBar`, `GroupComparisonBar`, `DataQualityBadges`).

## Dokumen terkait

- `PRD-IntegrityView-v3.md` — kebutuhan produk dan daftar halaman
- `DESIGN_SYSTEM.md` — palet, tipografi, komponen resmi
- `DESIGN2.md` — spesifikasi tema "bento"
- `AGENTS.md` — konvensi kerja dan pitfalls
- `alur.md` — peta proyek dan alur data yang lebih rinci (dokumen lokal, tidak di-track)
