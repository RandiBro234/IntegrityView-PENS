# Rancangan — Rekomendasi Berbasis Komentar Terbuka

**Tanggal:** 16 November 2026
**Status:** DRAF, menunggu tinjauan
**Pemilik keputusan:** pemilik proyek (Faiz)

---

## 1. Maksud

Sistem rekomendasi sekarang hanya membaca angka skala 1–4. Rekomendasi yang muncul selalu berbentuk
*"Perkuat aspek {nama butir}"* — generik, dan tidak mencerminkan apa yang sebenarnya ditulis responden.

Yang diinginkan: rekomendasi yang menyebut **apa kata responden** dan **langkah apa yang sebaiknya diambil**.

Contoh bentuk yang dituju:

> **Tinggi · dari komentar** — Prosedur pelaporan dianggap berbelit
> Poin responden: 20 komentar menyebut alur tidak jelas, 8 menyebut tidak tahu ke mana melapor.
> Saran langkah: Terbitkan alur pelaporan satu halaman dan tempel di tiap unit.

---

## 2. Tujuan dan batas

**Tujuan**
1. Mengelompokkan komentar terbuka menjadi topik, dengan jumlah topik ditentukan data (bukan manual).
2. Menyusun satu saran langkah singkat per topik.
3. Menggabungkan rekomendasi berbasis skor dan berbasis komentar menjadi **satu daftar** di dashboard.
4. Menampilkan bukti kuantitatif kualitas pengelompokan, untuk keperluan sidang.

**Bukan tujuan**
- Menampilkan komentar mentah kepada pengguna.
- Menggantikan perhitungan statistik yang sudah ada.
- Menganalisis sentimen.
- Menghasilkan rekomendasi kebijakan panjang; langkah harus singkat dan konkret.

**Anti-tujuan (dianggap gagal bila terjadi)**
- Kalimat komentar utuh terkirim ke penyedia model bahasa.
- Jumlah topik berubah setiap kali dihitung dengan data yang sama.
- Halaman dashboard melambat karena perhitungan dijalankan saat halaman dibuka.
- Dua kelompok komentar yang isinya sama muncul dengan kata berbeda di daftar yang sama.

---

## 3. Batasan nyata

Keragaman komentar di basis data per 16 Nov 2026:

| Instrumen | Komentar | Kalimat unik | Keragaman |
|---|---|---|---|
| SPAK | 207 | 156 | 75% |
| Gratifikasi | 192 | 140 | 73% |
| SPIP | 94 | 8 | 9% |
| Budaya ZI | 103 | 8 | 8% |
| SPKP / 5R / WBS / Benturan / Pengaduan / PENS JOSS | 70–98 | 8 | 8–11% |

Delapan instrumen memakai delapan kalimat tetap yang diulang. Konsekuensi yang **diterima secara sadar**:
klasterisasi di delapan instrumen itu akan menghasilkan paling banyak 8 kelompok, dengan silhouette tinggi
yang tidak bermakna. Ini dilaporkan apa adanya, bukan disembunyikan.

---

## 4. Keputusan yang sudah ditetapkan pemilik

| Hal | Keputusan |
|---|---|
| Cakupan | Sepuluh instrumen, lima periode |
| Pengelompokan komentar | NLP lokal (statistik), teks tidak keluar sistem |
| Saran langkah | Model bahasa, hanya menerima label kelompok |
| Pemicu pembaruan | Otomatis saat ada data baru (penanda kotor + job berkala) |
| Tampilan | Rekomendasi skor dan komentar **digabung satu daftar** |

---

## 5. Keputusan yang diambil perancang

Ditandai sebagai **panggilan perancang** — dapat diubah tanpa mengubah bentuk sistem.

1. **Klasterisasi di Edge Function (Deno/TypeScript)**, bukan di SQL. Alasan: stemming dan TF-IDF tidak
   tersedia di PL/pgSQL, dan panggilan model bahasa tidak mungkin dari dalam query.
2. **Tanpa Truncated SVD pada versi pertama.** Dimensi TF-IDF untuk ±200 dokumen masih wajar (300–600 term),
   k-means dengan kemiripan kosinus langsung berjalan cepat. SVD ditambahkan hanya bila dimensi melampaui 2000.
3. **Stemming ringan buatan sendiri** (awalan `me-`, `di-`, `ber-`, `ter-`, `pe-`, `per-`; akhiran `-kan`,
   `-an`, `-nya`, `-i`). Stemmer lengkap Nazief–Adriani dapat menggantikan tanpa mengubah antarmuka.
4. **k dibatasi 2..5** dan dipilih lewat silhouette score. Batas atas mencegah satu kalimat menjadi satu klaster.
5. **Silhouette dihitung pada sampel maksimal 300 dokumen** (biaya O(n²)).
6. **Komentar unik < 3 → tidak diklasterisasi**, hasilnya "belum cukup komentar".
7. **Tidak ada penggabungan otomatis** antara rekomendasi skor dan komentar. Keduanya dipertahankan karena
   menjawab pertanyaan berbeda (butir mana yang lemah vs apa yang dikeluhkan), dan masing-masing diberi
   penanda sumber. Yang dilarang hanya duplikasi **di dalam** rekomendasi komentar: dua kelompok yang
   kata kuncinya sama digabung sebelum disimpan.
8. **Hasil disimpan**, tidak dihitung ulang saat halaman dibuka.
9. **Kata kunci dikirim ke model bahasa setelah disaring** (lihat §7a). Kata yang menyerupai nama diri,
   berisi angka, atau kurang dari 4 huruf dibuang, maksimal 5 kata per kelompok.
10. **Prioritas rekomendasi komentar dari porsi kelompok** (lihat §8), bukan dari nilai rata-rata butir.
11. **Data sintetis ikut dihitung.** Delapan instrumen yang komentarnya hanya 8 kalimat tetap tetap masuk,
    dan karakteristik itu dicatat di laporan evaluasi, bukan disembunyikan dari sistem.

---

## 6. Arsitektur

```
survey_responses (insert)
        │ trigger AFTER INSERT (murah: insert on conflict do nothing)
        ▼
rekomendasi_kotor  (nama_instrumen, periode, ditandai_pada)
        │ pg_cron tiap 30 menit
        ▼
Edge Function hitung-rekomendasi   (verify_jwt = true, service role)
        │
        ├─ 1. ambil komentar satu kombinasi
        ├─ 2. preprocessing + TF-IDF + k-means + silhouette
        ├─ 3. label klaster dari kata teratas
        ├─ 4. kirim {instrumen, label, kata_kunci, jumlah} → model bahasa
        ├─ 5. tulis rekomendasi_terbuka
        └─ 6. hapus penanda kotor
        │
        ▼
Dashboard (satu daftar gabungan)   ·   Chatbot (konteks yang sama)
```

Batas privasi: langkah 4 hanya mengirim **kata kunci tersaring**, bukan kalimat komentar. Penyaringan
dijelaskan di §7a.

---

## 7. Model data

```sql
create table rekomendasi_kotor (
  nama_instrumen text not null,
  periode text not null,
  ditandai_pada timestamptz not null default now(),
  primary key (nama_instrumen, periode)
);

create table rekomendasi_terbuka (
  nama_instrumen text not null,
  periode text not null,
  label text not null,
  prioritas text not null check (prioritas in ('Tinggi', 'Sedang', 'Pantau')),
  jumlah integer not null,
  porsi numeric not null,
  kata_kunci text[] not null,
  saran_langkah text,
  hash_masukan text not null,
  silhouette numeric,
  jumlah_komentar integer not null,
  jumlah_unik integer not null,
  versi_algoritma smallint not null default 1,
  dihitung_pada timestamptz not null default now(),
  primary key (nama_instrumen, periode, label)
);
```

- `hash_masukan` = hash(label + jumlah + kata_kunci + `versi_algoritma`). Dipakai agar model bahasa tidak
  dipanggil ulang bila hasil klasterisasi tidak berubah, dan gugur otomatis saat algoritma berubah.
- `silhouette`, `jumlah_komentar`, `jumlah_unik` disimpan untuk bukti pada laporan.
- Penulisan hasil: hapus semua baris kombinasi itu, lalu tulis yang baru, dalam satu transaksi.

### 7a. Penyaringan kata kunci sebelum dikirim

| Aturan | Alasan |
|---|---|
| Buang kata kurang dari 4 huruf | Terlalu umum ("dan", "itu", "saya") |
| Buang kata berisi angka | Nomor, NIP, tanggal |
| Buang kata yang seluruhnya kapital di teks asli | Sering nama diri atau singkatan unit |
| Buang kata yang ada di daftar stopword | Sisa stemming yang lolos |
| Ambil maksimal 5 kata teratas | Menjaga prompt pendek |

Yang dikirim: `{ instrumen, periode, label, kata_kunci: [maks 5], jumlah }`. Tidak ada kalimat.

---

## 8. Prioritas dan penggabungan di dashboard

**Prioritas rekomendasi komentar** dari porsi kelompok terhadap seluruh komentar instrumen itu:

```
porsi ≥ 30%  → Tinggi
porsi ≥ 15%  → Sedang
porsi <  15% → Pantau
```

Contoh: 20 dari 60 komentar = 33% → Tinggi.

**Bentuk objek disamakan:**

```js
{
  sumber: 'skor' | 'komentar',
  prioritas: 'Tinggi' | 'Sedang' | 'Pantau',
  judul: string,
  dasar: string,               // angka, untuk sumber 'skor'
  poin_responden: string|null, // untuk sumber 'komentar'
  saran_langkah: string|null,
  kode_butir: string|null
}
```

**Urutan:** `Tinggi` → `Sedang` → `Pantau`; di dalam prioritas yang sama, rekomendasi berbasis skor lebih dulu.
Penanda sumber ditampilkan sebagai label kecil di antarmuka.

---

## 9. Evaluasi (bahan sidang)

Yang dihasilkan dan dapat dilaporkan:

1. **Cakupan komentar**: persentase komentar yang masuk kategori.
   Baseline kata kunci sekarang vs klasterisasi. Dugaan awal: baseline jauh lebih rendah karena hanya
   14 kata kunci.
2. **Silhouette score** per kombinasi instrumen–periode.
3. **Jumlah klaster vs jumlah kalimat unik**, khususnya di delapan instrumen sintetis — menunjukkan metode
   menemukan struktur yang memang ada di data.
4. **Tabel perbandingan** baseline vs metode usulan.

---

## 10. Risiko

| Risiko | Mitigasi |
|---|---|
| Hasil klasterisasi berubah antar-run | k-means dengan benih tetap; hasil disimpan |
| Delapan instrumen menghasilkan klaster trivial | Dilaporkan sebagai karakteristik data, bukan disembunyikan |
| Teks mentah bocor ke model bahasa | Hanya label dan jumlah yang dikirim; diuji dengan tes |
| Biaya model bahasa membengkak | `hash_masukan` mencegah panggilan ulang; job dibatasi 5 kombinasi sekali jalan |
| Edge Function terbuka untuk publik | `verify_jwt = true` + hanya service role |
| Perhitungan lambat di Edge Function | Silhouette pada sampel, k ≤ 5, maksimal 5 kombinasi per jalan |
| Stemming ringan keliru | Diuji dengan daftar kata uji; dapat diganti stemmer lengkap |

---

## 11. Yang diserahkan ke pelaksana

- Daftar stopword bahasa Indonesia (sekitar 200 kata).
- Penyetelan batas: 30 menit interval, 5 kombinasi per jalan, k maksimal 5, sampel silhouette 300.
- Pemilihan kalimat saran langkah: satu kalimat, maksimal 25 kata, tanpa nama orang.
- Penamaan Edge Function (`hitung-rekomendasi`) dan RPC pembaca.
- Strategi uji: unit test untuk preprocessing/TF-IDF/k-means/penyaringan kata kunci, uji integrasi
  untuk Edge Function, dan satu tes yang memastikan tidak ada kalimat komentar yang dikirim keluar.
- Sampel silhouette diambil deterministik (300 pertama setelah dedup), bukan acak.
- Label klaster yang bentrok diberi akhiran `#2`, `#3`.
- Trigger `DELETE` dan `UPDATE` juga menandai kotor, bukan hanya `INSERT`.
- Bila model bahasa gagal: baris tetap disimpan dengan `saran_langkah` kosong, dashboard menyembunyikan blok itu.
- Bila `pg_cron` tidak tersedia: sediakan RPC pemicu manual, dan catat di dokumentasi.
- Turunan periode dari `created_at` diimplementasi ulang di Deno dengan zona WIB, sama seperti
  `frontend/src/data/survey/normalize.js`.
- Chatbot ikut memakai rekomendasi komentar, karena konteksnya sama.
- Dashboard menampilkan "diperbarui X menit lalu" dari `dihitung_pada`.

---

## 12. Catatan untuk laporan

Delapan instrumen berasal dari data sintetis dengan 8 kalimat tetap. Hasil klasterisasi di instrumen itu
akan selalu menemukan paling banyak 8 kelompok dengan silhouette tinggi. Itu **bukti metode bekerja**,
bukan temuan tentang kondisi kampus. Perlu dinyatakan eksplisit di bagian batasan penelitian, dan
dipisahkan dari hasil SPAK dan Gratifikasi yang memakai komentar asli.
