# IntegrityView

Platform Zona Integritas PENS untuk mengumpulkan, mengolah, dan menyajikan data survei integritas sekaligus mengelola kanal pelaporan **Whistleblowing System (WBS)**.

IntegrityView mencakup aplikasi web, layanan backend Supabase, database PostgreSQL, Edge Functions, serta backend FastAPI opsional. Aplikasi dapat berjalan dengan data Supabase atau mode simulasi lokal untuk pengembangan.

> Status: prototipe/demo. Login masih memakai akun yang dibuat manual dan mode tanpa Supabase memakai data simulasi serta penyimpanan browser.

## Fitur utama

- Landing page publik dan ringkasan kondisi survei.
- Dashboard analitik dengan filter periode, pembanding, dan kategori.
- Pusat survei dan detail instrumen.
- Perhitungan indeks, distribusi jawaban, median, simpangan baku, confidence interval, Cronbach alpha, delta, dan rekomendasi.
- Ekspor laporan ke PDF dan CSV.
- WBS untuk membuat, melacak, dan mengelola laporan pelanggaran integritas.
- Pengunggahan lampiran privat melalui signed upload URL.
- Panel admin untuk mengubah status, menambahkan catatan internal, dan membalas pelapor.
- Chatbot Ivy berbasis Edge Function, dengan mode lokal untuk pengembangan.
- Fallback data simulasi dan `localStorage`/`sessionStorage` saat Supabase belum dikonfigurasi.

## Tech stack

### Aplikasi web

- React 19
- Vite 8
- JavaScript (ES modules)
- Vanilla CSS dengan CSS variables
- `@supabase/supabase-js`
- `html2canvas` dan `jsPDF` untuk ekspor PDF
- `oxlint` untuk lint

### Data dan layanan

- Supabase Auth untuk autentikasi
- PostgreSQL untuk data survei dan laporan
- Row Level Security (RLS), trigger, RPC, dan private storage bucket
- Supabase Edge Functions berbasis Deno dan TypeScript
- Google Forms + Google Apps Script untuk alur masuk data survei

### Backend opsional

- FastAPI
- Uvicorn
- `asyncpg` dan `psycopg2-binary`
- Pandas
- Pydantic

### Deployment dan pengujian

- Vercel untuk deployment aplikasi web
- Node.js built-in test runner untuk pengujian chatbot dan fungsi terkait
- Supabase CLI untuk migrasi dan deployment Edge Functions

## Struktur proyek

```text
IntegrityView/
├── frontend/                 aplikasi React + Vite
│   ├── src/
│   │   ├── pages/            halaman aplikasi
│   │   ├── components/       komponen UI, dashboard, laporan, dan layout
│   │   ├── data/             konfigurasi instrumen, survei, laporan, dan chatbot
│   │   ├── lib/              utilitas Supabase, PDF, format data, dan motion
│   │   └── styles/           token desain dan style global
│   └── public/               aset publik
├── supabase/
│   ├── schema.sql            skema database, RLS, RPC, dan storage
│   ├── migrations/           migrasi database
│   └── functions/            webhook, laporan, lampiran, rekomendasi, dan chatbot
├── backend/                  backend FastAPI opsional/legacy
├── scripts/                  utilitas development, fixture, seed, dan pengujian
├── docs/                     dokumentasi teknis
├── vercel.json               konfigurasi deployment dari root repo
└── README.md
```

## Mulai cepat

Prasyarat: Node.js sesuai `frontend/.nvmrc` dan npm.

```bash
cd frontend
npm install
npm run dev
```

Buka URL yang muncul, biasanya `http://localhost:5173`.

Perintah yang tersedia dari folder `frontend/`:

```bash
npm run dev          # development server
npm run build        # build produksi ke frontend/dist/
npm run preview      # sajikan hasil build
npm run lint         # jalankan oxlint
npm run test:chatbot # jalankan test chatbot dengan Node.js
npm run dev:all      # jalankan layanan development terkait
```

## Konfigurasi environment

Salin `frontend/.env.example` menjadi `frontend/.env`:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_ENABLE_SIMULATION=true
VITE_ENABLE_DEMO_LAPORAN=true
```

Keterangan:

- `VITE_ENABLE_SIMULATION=true` mengaktifkan data simulasi saat data asli belum tersedia.
- `VITE_ENABLE_DEMO_LAPORAN=true` mengaktifkan seed laporan WBS demo.
- Vite membaca environment variable saat proses dimulai. Restart `npm run dev` setelah mengubah `.env`.
- Jangan commit `.env`, `sb_secret_...`, atau `DATABASE_URL` ke frontend.
- Akses admin memakai JWT Supabase. Jangan menambahkan token admin ke environment variable frontend.

## Alur data survei

```text
Google Form
  -> Google Apps Script
  -> Edge Function webhook-survei
  -> public.survey_responses
  -> frontend memuat dan menormalisasi data
  -> getReportData(filter) menghitung agregat
  -> landing, dashboard, detail instrumen, laporan, dan PDF
```

Data survei per pasangan instrumen dan periode memiliki satu sumber aktif:

```text
ada data asli? -> real
tidak ada data asli dan simulasi aktif? -> simulated
tidak ada data asli dan simulasi nonaktif? -> empty
```

Frontend memakai `getReportData(filter)` sebagai selector utama. Implementasi perhitungan berada di `frontend/src/data/survey/`.

## Modul WBS dan Supabase

Skema database berada di `supabase/schema.sql`. Migrasi tambahan berada di `supabase/migrations/`.

Edge Functions utama:

| Function | Fungsi |
|---|---|
| `webhook-survei` | Menerima submit Google Form dan menyimpan jawaban survei |
| `kirim-laporan` | Validasi dan menyimpan laporan WBS dengan JWT pengguna |
| `buat-upload-lampiran` | Membuat signed upload URL untuk lampiran |
| `kelola-laporan` | Operasi admin untuk daftar, ubah, dan balas laporan |
| `ambil-lampiran` | Membuat signed download URL untuk admin |
| `hitung-rekomendasi` | Mengolah rekomendasi dari data survei |
| `chat` | Menyediakan layanan chatbot Ivy |

Contoh deployment function dari root proyek:

```bash
supabase functions deploy webhook-survei --no-verify-jwt
supabase functions deploy kirim-laporan --use-api
supabase functions deploy buat-upload-lampiran --use-api
supabase functions deploy kelola-laporan --use-api
supabase functions deploy ambil-lampiran --use-api
```

Terapkan migrasi yang relevan sebelum deployment frontend yang memakai perubahan skema atau autentikasi.

## Deployment ke Vercel

Konfigurasi root `vercel.json` menjalankan:

- Install: `npm --prefix frontend install`
- Build: `npm --prefix frontend run build`
- Output: `frontend/dist`
- Rewrite SPA ke `index.html`

Tambahkan `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan flag fitur pada **Project Settings > Environment Variables**, lalu lakukan redeploy.

## Backend FastAPI opsional

`backend/` berisi alternatif webhook dan pembacaan data. Frontend utama tidak memanggil backend ini secara langsung. Jalankan hanya bila membutuhkan alur backend FastAPI:

```bash
cd backend
pip install -r requirements.txt
```

Backend ini berstatus opsional/legacy. Perubahan perilaku dashboard utama dilakukan di `frontend/` dan `supabase/`.

## Batasan yang diketahui

- Akun dibuat manual melalui Supabase Auth. Pendaftaran mandiri tidak digunakan.
- Ivy masih memiliki bagian jawaban lokal/hardcoded dan layanan chat memerlukan konfigurasi tambahan.
- Mode tanpa Supabase menyimpan sebagian data di `localStorage` dan lampiran lokal di IndexedDB.
- Backend FastAPI belum menjadi jalur runtime utama.
- Pastikan kebijakan RLS, akses data survei, dan konfigurasi storage ditinjau sebelum deployment publik.

## Dokumen terkait

- `docs/` untuk dokumentasi teknis dan spesifikasi.
- `frontend/.env.example` untuk contoh konfigurasi aplikasi.
- `supabase/schema.sql` untuk skema awal database.
- `supabase/migrations/` untuk perubahan skema.
- `DESIGN_SYSTEM.md` dan `DESIGN2.md` bila tersedia untuk referensi desain.
