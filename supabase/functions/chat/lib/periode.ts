/* Mendeteksi periode yang dimaksud pertanyaan.

   Data survei sekarang mencakup 5 periode (2024-ganjil sampai 2026-ganjil).
   Tanpa deteksi ini, chatbot selalu menjawab untuk periode terbaru, sehingga
   pertanyaan seperti "berapa indeks SPAK semester 2025 genap?" dijawab
   "data tidak tersedia" padahal datanya ada.

   Modul ini murni supaya bisa dites dengan Node.
*/

export interface HasilDeteksi {
  /* Periode yang diminta, atau null bila tidak disebut (pakai terbaru). */
  periode: string | null;
  /* true bila pengguna menyebut periode secara eksplisit. */
  eksplisit: boolean;
}

const NAMA_SEMESTER = '(ganjil|genap)';

/* Urutkan periode dari terbaru ke terlama. Ganjil (Sep-Feb) terjadi setelah
   genap (Mar-Agu) pada tahun yang sama, jadi urutan teks tidak bisa dipakai. */
export function urutkanPeriode(periode: string[] = []): string[] {
  const kunci = (p: string) => {
    const [tahun, semester] = p.split('-');
    return Number(tahun) * 10 + (semester === 'ganjil' ? 1 : 0);
  };
  return (periode ?? []).slice().sort((a, b) => kunci(b) - kunci(a));
}

export function deteksiPeriode(pertanyaan: string, tersedia: string[] = []): HasilDeteksi {
  const teks = pertanyaan.toLowerCase();
  const urut = urutkanPeriode(tersedia ?? []);

  /* 1. Tahun + semester, urutan bebas: "2025 genap", "genap 2025",
        "2025-genap", "semester genap 2025". */
  const tahunDulu = new RegExp(`(20\\d{2})\\D{0,12}${NAMA_SEMESTER}`, 'i');
  const semesterDulu = new RegExp(`${NAMA_SEMESTER}\\D{0,12}(20\\d{2})`, 'i');

  let cocok = teks.match(tahunDulu);
  let tahun: string | null = null;
  let semester: string | null = null;
  if (cocok) {
    tahun = cocok[1];
    semester = cocok[2];
  } else {
    cocok = teks.match(semesterDulu);
    if (cocok) {
      semester = cocok[1];
      tahun = cocok[2];
    }
  }

  if (tahun && semester) {
    const kandidat = `${tahun}-${semester}`;
    return { periode: kandidat, eksplisit: true };
  }

  /* 2. Kata penunjuk relatif. */
  if (/\bsemester\s+(lalu|kemarin|sebelumnya)\b|\bperiode\s+(lalu|sebelumnya)\b/i.test(teks)) {
    return { periode: urut[1] ?? null, eksplisit: true };
  }
  if (/\bsemester\s+(ini|sekarang)\b|\bperiode\s+(ini|sekarang)\b|\bterbaru\b/i.test(teks)) {
    return { periode: urut[0] ?? null, eksplisit: true };
  }

  /* 3. Tidak disebut: pakai periode terbaru. */
  return { periode: null, eksplisit: false };
}
