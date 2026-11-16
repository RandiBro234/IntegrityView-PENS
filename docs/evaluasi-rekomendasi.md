# Evaluasi Rekomendasi Jawaban Terbuka

Dihasilkan oleh `scripts/evaluasi-rekomendasi.mjs` pada 2026-11-16.
Sumber: RPC `survey_rows_safe` (7256 baris). Isi komentar tidak dimuat di laporan ini.

## Ringkasan

| Ukuran | Nilai |
|---|---:|
| Komentar dianalisis (setelah dedup & saring sensitif) | 1093 |
| Baseline kata kunci: masuk kategori | 660 (60.4%) |
| Klasterisasi: punya kata bermakna | 1063 (97.3%) |
| Komentar tanpa kata bermakna | 30 |
| Kelompok terbentuk | 65 |
| Kombinasi dengan k=1 | 39 dari 50 |
| Silhouette rata-rata | 0.026 |

Cakupan klasterisasi lebih tinggi karena setiap komentar yang punya kata
bermakna selalu masuk satu kelompok. Cakupan tinggi **bukan** bukti pemisahan
yang baik: lihat silhouette. Nilai 0,00–0,05 berarti kelompok saling tumpang
tindih, dan itu wajar untuk jawaban terbuka yang topiknya bercampur.

## Per instrumen (seluruh periode)

| Instrumen | Komentar | Baseline | Klasterisasi | Kelompok | Silhouette |
|---|---:|---:|---:|---:|---:|
| SPAK | 188 | 106 (56.4%) | 171 (91.0%) | 9 | 0.050 |
| Gratifikasi | 174 | 101 (58.0%) | 161 (92.5%) | 7 | 0.040 |
| Budaya ZI | 103 | 66 (64.1%) | 103 (100.0%) | 7 | 0.023 |
| SPKP | 98 | 58 (59.2%) | 98 (100.0%) | 6 | 0.040 |
| 5R | 96 | 65 (67.7%) | 96 (100.0%) | 7 | 0.035 |
| SPIP | 94 | 59 (62.8%) | 94 (100.0%) | 6 | 0.020 |
| PENS JOSS | 91 | 54 (59.3%) | 91 (100.0%) | 7 | 0.010 |
| WBS | 90 | 62 (68.9%) | 90 (100.0%) | 5 | – |
| Benturan | 89 | 50 (56.2%) | 89 (100.0%) | 5 | – |
| Pengaduan | 70 | 39 (55.7%) | 70 (100.0%) | 6 | 0.000 |

## Per instrumen dan periode

| Instrumen | Periode | Komentar | Baseline | Klasterisasi | Kelompok | Silhouette |
|---|---|---:|---:|---:|---:|---:|
| 5R | 2026-ganjil | 22 | 17 (77.3%) | 22 (100.0%) | 2 | 0.040 |
| 5R | 2026-genap | 28 | 18 (64.3%) | 28 (100.0%) | 1 | – |
| 5R | 2025-ganjil | 18 | 13 (72.2%) | 18 (100.0%) | 1 | – |
| 5R | 2025-genap | 15 | 10 (66.7%) | 15 (100.0%) | 2 | 0.030 |
| 5R | 2024-ganjil | 13 | 7 (53.8%) | 13 (100.0%) | 1 | – |
| Benturan | 2026-ganjil | 18 | 11 (61.1%) | 18 (100.0%) | 1 | – |
| Benturan | 2026-genap | 19 | 8 (42.1%) | 19 (100.0%) | 1 | – |
| Benturan | 2025-ganjil | 29 | 17 (58.6%) | 29 (100.0%) | 1 | – |
| Benturan | 2025-genap | 11 | 6 (54.5%) | 11 (100.0%) | 1 | – |
| Benturan | 2024-ganjil | 12 | 8 (66.7%) | 12 (100.0%) | 1 | – |
| Budaya ZI | 2026-ganjil | 20 | 12 (60.0%) | 20 (100.0%) | 1 | – |
| Budaya ZI | 2026-genap | 15 | 10 (66.7%) | 15 (100.0%) | 2 | 0.000 |
| Budaya ZI | 2025-ganjil | 24 | 15 (62.5%) | 24 (100.0%) | 1 | – |
| Budaya ZI | 2025-genap | 21 | 10 (47.6%) | 21 (100.0%) | 2 | 0.045 |
| Budaya ZI | 2024-ganjil | 23 | 19 (82.6%) | 23 (100.0%) | 1 | – |
| Gratifikasi | 2026-ganjil | 114 | 66 (57.9%) | 101 (88.6%) | 3 | 0.040 |
| Gratifikasi | 2026-genap | 16 | 6 (37.5%) | 16 (100.0%) | 1 | – |
| Gratifikasi | 2025-ganjil | 11 | 8 (72.7%) | 11 (100.0%) | 1 | – |
| Gratifikasi | 2025-genap | 17 | 9 (52.9%) | 17 (100.0%) | 1 | – |
| Gratifikasi | 2024-ganjil | 16 | 12 (75.0%) | 16 (100.0%) | 1 | – |
| PENS JOSS | 2026-ganjil | 24 | 14 (58.3%) | 24 (100.0%) | 1 | – |
| PENS JOSS | 2026-genap | 17 | 11 (64.7%) | 17 (100.0%) | 1 | – |
| PENS JOSS | 2025-ganjil | 9 | 7 (77.8%) | 9 (100.0%) | 2 | 0.000 |
| PENS JOSS | 2025-genap | 13 | 8 (61.5%) | 13 (100.0%) | 1 | – |
| PENS JOSS | 2024-ganjil | 28 | 14 (50.0%) | 28 (100.0%) | 2 | 0.020 |
| Pengaduan | 2026-ganjil | 21 | 11 (52.4%) | 21 (100.0%) | 1 | – |
| Pengaduan | 2026-genap | 11 | 6 (54.5%) | 11 (100.0%) | 2 | 0.000 |
| Pengaduan | 2025-ganjil | 12 | 7 (58.3%) | 12 (100.0%) | 1 | – |
| Pengaduan | 2025-genap | 16 | 9 (56.3%) | 16 (100.0%) | 1 | – |
| Pengaduan | 2024-ganjil | 10 | 6 (60.0%) | 10 (100.0%) | 1 | – |
| SPAK | 2026-ganjil | 130 | 64 (49.2%) | 113 (86.9%) | 5 | 0.050 |
| SPAK | 2026-genap | 18 | 15 (83.3%) | 18 (100.0%) | 1 | – |
| SPAK | 2025-ganjil | 8 | 4 (50.0%) | 8 (100.0%) | 1 | – |
| SPAK | 2025-genap | 8 | 6 (75.0%) | 8 (100.0%) | 1 | – |
| SPAK | 2024-ganjil | 24 | 17 (70.8%) | 24 (100.0%) | 1 | – |
| SPIP | 2026-ganjil | 15 | 9 (60.0%) | 15 (100.0%) | 1 | – |
| SPIP | 2026-genap | 23 | 19 (82.6%) | 23 (100.0%) | 1 | – |
| SPIP | 2025-ganjil | 11 | 5 (45.5%) | 11 (100.0%) | 1 | – |
| SPIP | 2025-genap | 21 | 12 (57.1%) | 21 (100.0%) | 1 | – |
| SPIP | 2024-ganjil | 24 | 14 (58.3%) | 24 (100.0%) | 2 | 0.020 |
| SPKP | 2026-ganjil | 24 | 17 (70.8%) | 24 (100.0%) | 1 | – |
| SPKP | 2026-genap | 17 | 11 (64.7%) | 17 (100.0%) | 1 | – |
| SPKP | 2025-ganjil | 16 | 9 (56.3%) | 16 (100.0%) | 2 | 0.040 |
| SPKP | 2025-genap | 24 | 11 (45.8%) | 24 (100.0%) | 1 | – |
| SPKP | 2024-ganjil | 17 | 10 (58.8%) | 17 (100.0%) | 1 | – |
| WBS | 2026-ganjil | 16 | 12 (75.0%) | 16 (100.0%) | 1 | – |
| WBS | 2026-genap | 11 | 7 (63.6%) | 11 (100.0%) | 1 | – |
| WBS | 2025-ganjil | 28 | 20 (71.4%) | 28 (100.0%) | 1 | – |
| WBS | 2025-genap | 17 | 13 (76.5%) | 17 (100.0%) | 1 | – |
| WBS | 2024-ganjil | 18 | 10 (55.6%) | 18 (100.0%) | 1 | – |

## Batasan

- Delapan instrumen berasal dari data sintetis dengan 6–8 kalimat tetap.
  Kalimat yang berulang persis menghasilkan vektor TF-IDF identik, sehingga
  `pilihK` umumnya berhenti di k=1. Hasil di instrumen itu bukan temuan
  tentang kondisi kampus.
- SPAK dan Gratifikasi berisi komentar beragam, tetapi silhouette-nya tetap
  rendah. Artinya topik dalam satu instrumen memang bercampur, bukan pipeline
  yang rusak.
- Baseline hanya punya 14 pasangan kata kunci; dua di antaranya
  ("Tindak lanjut", "Antrean layanan") tidak pernah cocok.
