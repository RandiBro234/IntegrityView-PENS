# AGENTS.md — IntegrityView

Platform analitik Zona Integritas PENS (Politeknik Elektronika Negeri Surabaya):
pusat survei, dashboard analitik, dan kanal pengaduan/WBS. Frontend SPA React 19
+ Vite; backend data memakai Supabase (PostgreSQL + Edge Functions) dan FastAPI
opsional. Tanpa env Supabase, aplikasi tetap jalan dengan `mock.js` dan
`localStorage`/`sessionStorage`. Ini prototipe/demo: "angka" di dashboard bisa
berasal dari data riil atau simulasi.

## Layout

```
/                     dokumen (tidak di-track git)
  PRD-IntegrityView-v3.md    spesifikasi produk & daftar halaman
  DESIGN2.md                 spec tema "bento" yang dipakai implementasi ini
  DESIGN_SYSTEM.md           sistem desain resmi (palet/tipografi/komponen)
frontend/             aplikasi React; branch kerja saat ini `refactor`
  src/pages/          satu file per halaman (*.jsx + *.css)
  src/components/     layout/, cards/, dashboard/, instrumen/, tables/
  src/data/           mock.js, surveyData.js, instrumentConfig.js, laporanApi.js
  src/lib/reportPdf.js  ekspor PDF (html2canvas + jsPDF)
  src/styles/         tokens.css (CSS variables) + globals.css
supabase/             schema.sql + Edge Functions
  functions/webhook-survei/      webhook Google Form
  functions/kirim-laporan/       insert pengaduan/WBS + rate limit
  functions/buat-upload-lampiran/ signed upload URL lampiran
  functions/_shared/             helper Edge Function
backend/              FastAPI opsional (app/, routers/, services/, scripts/)
```

## Dev environment

Node 24 / npm 11 (dipakai: `v24.15.0`, npm `11.12.1`).

```bash
cd frontend
npm install
npm run dev        # vite, http://localhost:5173
```

## Build & lint

```bash
cd frontend
npm run build      # vite build -> dist/
npm run preview    # serve hasil build
npm run lint       # oxlint (config .oxlintrc.json)
```

Tidak ada test runner, tidak ada CI, tidak ada formatter — jangan mengarang
perintah `npm test` atau `npm run format`. `npm run lint` lulus dengan 2 warning
`react(only-export-components)` (2 di `ItemDistributionBar.jsx`, 1 di
`GroupComparisonBar.jsx`) yang memang sudah ada.

## Konvensi

- Routing tanpa router: `App.jsx` menyimpan `useState('landing' | 'auth' |
  'dashboard' | 'survei' | 'survei-form' | 'instrumen-detail' | 'pengaduan' |
  'kelola-pengaduan' | 'laporan' | 'profil')`. Menambah halaman = tambah cabang
  `if (page === ...)` di `App.jsx` + entri di `goMenu`/`Sidebar`.
- Halaman: satu default export `function XxxPage({ onNavigate, ... })` di
  `src/pages/XxxPage.jsx`, CSS-nya `XxxPage.css` yang diimpor langsung dari
  file JSX. Navigasi antar halaman lewat callback prop (`onNavigate`, `onBack`),
  bukan link.
- Komponen non-halaman di `src/components/<grup>/`, juga default export + CSS
  sebelahnya. Helper/konstanta tambahan diekspor named (`SkalaLegend`,
  `SKALA_WARNA`, `SKALA_LABEL`).
- CSS: class per halaman/komponen dengan prefix pendek yang konsisten
  (`idp-` InstrumentDetail, `rt-` ReportTemplate, `sform-` SurveiForm,
  `pg-` Pengaduan, `pf-` Profile, `lpr-` Laporan, `dqb-`, `reclist-`).
  Warna/radius/shadow selalu dari CSS variable `src/styles/tokens.css`
  (`var(--navy-900)`, `var(--orange-500)`, `var(--radius-card)`), jangan hardcode
  hex baru. Ikuti palet `DESIGN2.md` §2.
- Bahasa: identifier domain, komentar, dan seluruh UI berbahasa Indonesia
  (`getStatistikInstrumen`, `simpanResponse`, "Kelola Pengaduan"). Kode/teknis
  tetap Inggris. Pertahankan pola ini.
- Komentar: `/* ... */` singkat di atas blok logika yang tidak jelas (rumus
  statistik, perhitungan tinggi/lebar untuk render PDF).
- Data survei: `surveyData.js` + `instrumentConfig.js` (dataset selector).
  Data demo/fallback & seed pengaduan tetap di `mock.js`. Jangan mengimpor
  `api.js` (sudah tidak ada).
- Laporan/WBS: `laporanApi.js` memanggil Edge Function `kirim-laporan`,
  `buat-upload-lampiran`, dan RPC `lacak_laporan`. Lampiran maks. 3 file,
  10MB/file, PDF/Word/JPG/PNG; bucket privat `lampiran-laporan`; rate limit
  5 laporan/10 menit/IP (tanpa captcha). `lacak_laporan` tidak mengembalikan PII.
- Data & tipe domain terpusat di `mock.js`. `SURVEI_INFO` memuat 10 entri,
  tetapi `pengaduan` adalah sistem tiket tanpa distribusi jawaban 1-4, jadi
  `getInstrumenBerdata()` mengembalikan 9 instrumen survei dan itulah yang
  dipakai semua hitungan turunan (jumlah instrumen, rata-rata skor ZI, jumlah
  responden, daftar landing/pusat survei). Jangan menyalin data ke komponen;
  impor helper (`getInstrumenBerdata`, `getStatistikInstrumen`,
  `getRekomendasi`, `getRingkasanDashboard`, `formatAngka`). `RINGKASAN`
  (landing/auth) dan `getRingkasanDashboard()` (dashboard) membaca sumber yang
  sama, jadi angka tidak boleh di-hardcode di halaman.

## Pitfalls

- Tanpa env Supabase: menambah data "nyata" berarti menambah/mengubah
  `mock.js`. Semua halaman harus tetap berfungsi dengan mock.
- Halaman Kelola Pengaduan & Laporan masih lokal/seed; membaca DB lintas
  browser menunggu Supabase Auth admin + policy SELECT/UPDATE.
- `VITE_ENABLE_DEMO_LAPORAN=false` mematikan seed pengaduan/WBS demo tanpa
  menghapus mirror `localStorage`.
- Rate limit per IP bisa terasa ketat di jaringan NAT kampus (banyak pengguna
  satu IP). Ubah `BATAS_KIRIM`/`JENDELA_MENIT` di `_shared/limit.ts` bila perlu.
- Storage: jawaban survei di `localStorage['iv2_responses']`, pengaduan di
  `iv2_pengaduan`, sesi login di `sessionStorage['iv2_session']`. Sesi hilang di
  tab baru; untuk reset state demo, hapus key tersebut lewat DevTools.
- Login tidak memvalidasi apa pun: `loginAs('sivitas' | 'admin')` langsung
  membuat sesi dari `ROLES` di `mock.js`. Role `admin` membuka halaman
  Kelola Pengaduan dan Laporan; item `Laporan` disembunyikan dari Sidebar untuk
  non-admin.
- Ekspor PDF (`src/lib/reportPdf.js`) bergantung pada class DOM `.rt__page` di
  `ReportTemplate.jsx`: satu `.rt__page` = satu halaman A4. Mengubah struktur
  tersebut mematahkan ekspor; `html2canvas`/`jsPDF` hanya ada sebagai
  dependency runtime browser.
- Port 5173 sering sudah dipakai; Vite otomatis pindah ke 5174 (lihat
  `frontend/dev.log`). Jangan hardcode `localhost:5173`.
- `package.json` bernama `frontend2` dan README menyebut folder `frontend2/`,
  tetapi foldernya `frontend/` — nama itu sisa tema "bento" (Theme 2).
- Git repo ada di root; `frontend/dist/`, env, dan dokumen lokal di-ignore.
  Branch kerja saat ini `refactor` (commit laporan belum di-push).
- Halaman detail instrumen memakai layout satu layar (`height: calc(100dvh -
  132px)`). Pada viewport pendek (`max-height: 700px`) layout itu dilepas dan
  halaman mengalir, karena kolom kanan (Rekomendasi + Kualitas Data) tidak muat
  dan akan terpotong. Uji perubahan layout di 1280x650, 1440x780, 1920x950.
- Bug yang sudah diketahui: di `LaporanPage.jsx` `handleMenu` dipakai sebelum
  dideklarasikan pada cabang non-admin (ReferenceError). Tidak terjangkau lewat
  Sidebar karena item `Laporan` hanya tampil untuk admin.
