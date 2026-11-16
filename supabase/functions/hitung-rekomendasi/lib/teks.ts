/* Praproses teks komentar berbahasa Indonesia.

   Dipakai oleh Edge Function hitung-rekomendasi. Semua berjalan lokal: teks
   komentar tidak pernah keluar dari sistem. Yang dikirim ke model bahasa nanti
   hanya kata kunci hasil penyaringan.

   Tiga tahap:
     1. normalisasi  — huruf kecil, buang URL/email/angka/tanda baca
     2. stopword     — buang kata yang tidak membawa topik
     3. stemming     — buang imbuhan supaya "pelaporan" dan "melaporkan" bertemu

   Stemming di sini sengaja konservatif: hanya imbuhan yang umum, dan hasil
   akhir minimal 4 huruf. Stemmer lengkap (Nazief-Adriani) bisa menggantikan
   fungsi `akarKata` tanpa mengubah pemanggil.
*/

/* Kata yang tidak membawa topik. Disusun dari daftar kata fungsi bahasa
   Indonesia yang paling sering muncul di komentar survei. */
export const STOPWORD: ReadonlySet<string> = new Set([
  'ada', 'adalah', 'adanya', 'adapun', 'agak', 'agar', 'akan', 'akankah', 'akhirnya',
  'aku', 'amat', 'amatlah', 'anda', 'andalah', 'antar', 'antara', 'antaranya',
  'apa', 'apaan', 'apabila', 'apakah', 'apalagi', 'apatah', 'artinya', 'asal',
  'asalkan', 'atas', 'atau', 'ataukah', 'ataupun', 'awalnya',
  'bagai', 'bagaikan', 'bagaimana', 'bagaimanakah', 'bagaimanapun', 'bagi',
  'bagian', 'bahkan', 'bahwa', 'bahwasanya', 'baik', 'bakal', 'bakalan',
  'balik', 'banyak', 'bapak', 'baru', 'bawah', 'beberapa', 'begini', 'begitu',
  'belakang', 'belum', 'belumkah', 'berarti', 'bercanda', 'berapa', 'berbagai',
  'bersama', 'betul', 'biasa', 'bila', 'bilakah', 'bisa', 'bisakah', 'boleh',
  'bolehkah', 'bolehlah', 'buat', 'bukan', 'bukankah', 'bukanlah', 'bukannya',
  'bumi', 'cara', 'cukup', 'cukupkah', 'cukuplah', 'cuma',
  'dahulu', 'dalam', 'dan', 'dapat', 'dari', 'daripada', 'dasar', 'datang',
  'dekat', 'demi', 'demikian', 'demikianlah', 'dengan', 'depan', 'di', 'dia',
  'diakhiri', 'diakhirinya', 'dialah', 'diantara', 'diantaranya', 'diberi',
  'diberikan', 'diberikannya', 'dibuat', 'dibuatnya', 'didapat', 'didatangkan',
  'digunakan', 'diibaratkan', 'diibaratkannya', 'dinginkan', 'dijawab',
  'dikatakan', 'dikatakannya', 'dikerjakan', 'diketahui', 'diketahuinya',
  'dilakukan', 'dilakukannya', 'dilihat', 'dimaksud', 'dimaksudkan',
  'dimaksudkannya', 'dimaksudnya', 'dimana', 'dimanakah', 'dipastikan', 'diperbuat',
  'diperbuatnya', 'dipergunakan', 'diperkirakan', 'diperlihatkan', 'diperlukan',
  'diperlukannya', 'dipersoalkan', 'dipertanyakan', 'dipunyai', 'diri', 'dirinya',
  'disampaikan', 'disebut', 'disebutkan', 'disebutkannya', 'disini', 'disinilah',
  'ditambahkan', 'ditandaskan', 'ditanya', 'ditanyai', 'ditanyakan', 'ditegaskan',
  'ditujukan', 'ditunjuk', 'ditunjuki', 'ditunjukkan', 'ditunjukkannya',
  'ditunjuknya', 'dituturkan', 'dituturkannya', 'diucapkan', 'diucapkannya',
  'diungkapkan', 'dong', 'dua', 'dulu',
  'empat', 'enggak', 'engkau',
  'guna', 'gunakan',
  'hal', 'hampir', 'hanya', 'hanyalah', 'harus', 'haruslah', 'harusnya',
  'hendak', 'hendaklah', 'hendaknya', 'hingga',
  'ia', 'ialah', 'ibarat', 'ibaratkan', 'ibaratnya', 'ibu', 'ikut', 'ingat',
  'ingin', 'inilah', 'ini', 'itu', 'itulah',
  'jadi', 'jadilah', 'jadinya', 'jangan', 'jangankan', 'janganlah', 'jauh',
  'jawab', 'jawaban', 'jawabnya', 'jelas', 'jelaskan', 'jelaslah', 'jelasnya',
  'jika', 'jikalau', 'juga', 'jumlah', 'jumlahnya', 'justru',
  'kala', 'kalau', 'kalaulah', 'kalaupun', 'kalian', 'kami', 'kamilah', 'kamu',
  'kamulah', 'kan', 'kapan', 'kapankah', 'kapanpun', 'karena', 'karenanya',
  'kasus', 'kata', 'katakan', 'katakanlah', 'katanya', 'ke', 'keadaan',
  'kebetulan', 'kecil', 'kedua', 'keduanya', 'keinginan', 'kelamaan', 'kelihatan',
  'kelihatannya', 'kelima', 'keluar', 'kembali', 'kemudian', 'kemungkinan',
  'kemungkinannya', 'kenapa', 'kepada', 'kepadanya', 'kesampaian', 'keseluruhan',
  'keseluruhannya', 'keterlaluan', 'ketika', 'khususnya', 'kini', 'kinilah',
  'kira', 'kira-kira', 'kiranya', 'kita', 'kitalah', 'kok', 'kurang',
  'lagi', 'lagian', 'lah', 'lain', 'lainnya', 'lalu', 'lama', 'lamanya',
  'lanjut', 'lanjutnya', 'lebih', 'lewat', 'lima', 'luar',
  'macam', 'maka', 'makanya', 'makin', 'malah', 'malahan', 'mampu', 'mampukah',
  'mana', 'manakala', 'manalagi', 'masa', 'masalah', 'masalahnya', 'masih',
  'masihkah', 'masing', 'mau', 'maupun', 'melainkan', 'melakukan', 'melalui',
  'melihat', 'melihatnya', 'memang', 'memastikan', 'memberi', 'memberikan',
  'membuat', 'memerlukan', 'memihak', 'meminta', 'memintakan', 'memisalkan',
  'memperbuat', 'mempergunakan', 'memperkirakan', 'memperlihatkan', 'mempersiapkan',
  'mempersoalkan', 'mempertanyakan', 'mempunyai', 'memulai', 'memungkinkan',
  'menaiki', 'menambahkan', 'menandaskan', 'menanti', 'menantikan', 'menanya',
  'menanyai', 'menanyakan', 'mendapat', 'mendapatkan', 'mendatang', 'mendatangi',
  'mendatangkan', 'menegaskan', 'mengakhiri', 'mengapa', 'mengatakan',
  'mengatakannya', 'mengenai', 'mengerjakan', 'mengetahui', 'menggunakannya',
  'menghendaki', 'mengibaratkan', 'mengibaratkannya', 'mengingat', 'mengingatkan',
  'menginginkan', 'mengira', 'mengucapkan', 'mengucapkannya', 'mengungkapkan',
  'menjadi', 'menjawab', 'menjelaskan', 'menuju', 'menunjuk', 'menunjuki',
  'menunjukkan', 'menunjuknya', 'menurut', 'menuturkan', 'menyampaikan',
  'menyangkut', 'menyatakan', 'menyebutkan', 'menyeberangi', 'menyeluruh',
  'menyiapkan', 'merasa', 'mereka', 'merekalah', 'merupakan', 'meski', 'meskipun',
  'meyakini', 'meyakinkan', 'minta', 'mirip', 'misal', 'misalkan', 'misalnya',
  'mula', 'mulai', 'mulailah', 'mulanya', 'mungkin', 'mungkinkah',
  'nah', 'naik', 'namun', 'nanti', 'nantinya', 'nyaris', 'nyatanya',
  'oleh', 'olehnya',
  'pada', 'padahal', 'padanya', 'pak', 'paling', 'panjang', 'pantas', 'para',
  'pasti', 'pastilah', 'penting', 'pentingnya', 'per', 'percuma', 'perlu',
  'perlukah', 'perlunya', 'pernah', 'persoalan', 'pertama', 'pertama-tama',
  'pertanyaan', 'pertanyakan', 'pihak', 'pihaknya', 'pukul', 'pula', 'pun',
  'punya',
  'rasa', 'rasanya', 'rata', 'rupanya',
  'saat', 'saatnya', 'saja', 'sajalah', 'saling', 'sama', 'sama-sama', 'sambil',
  'sampai', 'sampai-sampai', 'sampaikan', 'sana', 'sangat', 'sangatlah', 'satu',
  'saya', 'sayalah', 'se', 'sebab', 'sebabnya', 'sebagai', 'sebagaimana',
  'sebagainya', 'sebagian', 'sebaik', 'sebaiknya', 'sebaliknya', 'sebanyak',
  'sebegini', 'sebegitu', 'sebelum', 'sebelumnya', 'sebenarnya', 'seberapa',
  'sebesar', 'sebetulnya', 'sebisanya', 'sebuah', 'sebut', 'sebutlah', 'sebutnya',
  'secara', 'secukupnya', 'sedang', 'sedangkan', 'sedemikian', 'sedikit',
  'sedikitnya', 'seenaknya', 'segala', 'segalanya', 'segera', 'seharusnya',
  'sehingga', 'seingat', 'sejak', 'sejauh', 'sejenak', 'sejumlah', 'sekadar',
  'sekadarnya', 'sekali', 'sekali-kali', 'sekalian', 'sekaligus', 'sekalipun',
  'sekarang', 'sekaranglah', 'sekecil', 'seketika', 'sekiranya', 'sekitar',
  'sekitarnya', 'sekurangnya', 'sela', 'selain', 'selaku', 'selalu', 'selama',
  'selama-lamanya', 'selamanya', 'selanjutnya', 'seluruh', 'seluruhnya', 'semacam',
  'semakin', 'semampu', 'semampunya', 'semasa', 'semasih', 'semata', 'semata-mata',
  'semaunya', 'sementara', 'semisal', 'semisalnya', 'sempat', 'semua', 'semuanya',
  'semula', 'sendiri', 'sendirian', 'sendirinya', 'seolah', 'seorang', 'sepanjang',
  'sepantasnya', 'sepantasnyalah', 'seperlunya', 'seperti', 'sepertinya',
  'sepihak', 'sering', 'seringnya', 'serta', 'serupa', 'sesaat', 'sesama',
  'sesampai', 'sesegera', 'sesekali', 'seseorang', 'sesuai', 'sesuatu',
  'sesuatunya', 'sesudah', 'sesudahnya', 'setelah', 'setempat', 'setengah',
  'seterusnya', 'setiap', 'setiba', 'setibanya', 'setidak-tidaknya',
  'setidaknya', 'setinggi', 'seusai', 'sewaktu', 'siap', 'siapa', 'siapakah',
  'siapapun', 'sini', 'sinilah', 'situ', 'situasi', 'suatu', 'sudah', 'sudahkah',
  'sudahlah', 'supaya',
  'tadi', 'tadinya', 'tahu', 'tahun', 'tak', 'tambah', 'tambahnya', 'tampak',
  'tampaknya', 'tandas', 'tandasnya', 'tanpa', 'tanya', 'tanyakan', 'tanyanya',
  'tapi', 'tegas', 'tegasnya', 'telah', 'tempat', 'tengah', 'tentang',
  'tentu', 'tentulah', 'tentunya', 'tepat', 'terakhir', 'terasa', 'terbanyak',
  'terdapat', 'terdiri', 'terhadap', 'terhadapnya', 'teringat',
  'terjadi', 'terjadilah', 'terjadinya', 'terkira', 'terlalu', 'terlebih',
  'terlihat', 'termasuk', 'ternyata', 'tersampaikan', 'tersebut', 'tersebutlah',
  'tertentu', 'tertuju', 'terus', 'terutama', 'tetap', 'tetapi', 'tiap',
  'tidak', 'tidakkah', 'tidaklah', 'tiga', 'tinggi', 'toh',
  'tunjuk', 'turut', 'tutur', 'tuturnya',
  'ucap', 'ucapnya', 'ujar', 'ujarnya', 'umum', 'umumnya', 'untuk',
  'wah', 'waktu', 'waktunya', 'walau', 'walaupun', 'wong',
  'yaitu', 'yakin', 'yakni', 'yang'
]);

/* Keterangan yang terlalu umum untuk jadi topik, meski bukan stopword. */
export const KATA_UMUM: ReadonlySet<string> = new Set([
  'sudah', 'belum', 'bisa', 'dapat', 'harus', 'perlu', 'lebih', 'kurang',
  'baik', 'buruk', 'bagus', 'jelek', 'cukup', 'sangat', 'agak',
  'mohon', 'terima', 'kasih', 'terimakasih', 'semoga', 'sekian',
  'demikian', 'terkait', 'mengenai', 'perihal', 'hal',
  'tetap', 'tetapi', 'namun', 'juga', 'saja', 'masih', 'lagi',
  'orang', 'pihak', 'semua', 'setiap', 'beberapa', 'banyak',
  'sesuai', 'sesuainya', 'seperti', 'misalnya', 'contoh'
]);

/* Buang URL, email, dan sebutan akun. */
const POLA_URL = /https?:\/\/\S+|www\.\S+/gi;
const POLA_EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const POLA_AKUN = /@\w+/g;

/* Normalisasi dasar: huruf kecil, tanpa URL/email/angka/tanda baca. */
export function normalisasi(teks: string): string {
  return String(teks ?? '')
    .toLowerCase()
    .replace(POLA_URL, ' ')
    .replace(POLA_EMAIL, ' ')
    .replace(POLA_AKUN, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenisasi(teks: string): string[] {
  const bersih = normalisasi(teks);
  if (!bersih) return [];
  return bersih.split(' ').filter(Boolean);
}

/* ---------------------------------------------------------------------
   Stemming ringan
   --------------------------------------------------------------------- */

const AKHIRAN = ['kannya', 'annya', 'inya', 'nya', 'kah', 'lah', 'pun', 'tah', 'kan', 'an'];

const AWALAN = [
  'memper', 'menge', 'meng', 'meny', 'mem', 'men', 'me',
  'pember', 'penge', 'peng', 'peny', 'pem', 'pen', 'per', 'pe',
  'berke', 'ber', 'be',
  'ter', 'te',
  'dike', 'di', 'ke', 'se'
];

/* Imbuhan yang menyerap huruf pertama kata dasar. "menyampaikan" berasal dari
   "sampaikan", bukan "ampaikan". Tanpa pemulihan ini, akar katanya rusak. */
const PEMULIH: Record<string, string> = { meny: 's', peny: 's' };

function buangAkhiran(kata: string): string {
  for (const akhiran of AKHIRAN) {
    if (kata.length - akhiran.length >= 4 && kata.endsWith(akhiran)) {
      return kata.slice(0, -akhiran.length);
    }
  }
  return kata;
}

function buangAwalan(kata: string): string {
  for (const awalan of AWALAN) {
    if (kata.length - awalan.length >= 4 && kata.startsWith(awalan)) {
      const sisa = kata.slice(awalan.length);
      const hurufPulih = PEMULIH[awalan];
      return hurufPulih ? hurufPulih + sisa : sisa;
    }
  }
  return kata;
}

/* Akar kata perkiraan. Satu putaran saja: awalan lalu akhiran. Dua putaran
   membuat "kepentingan" terus tergerus menjadi "ting". */
export function akarKata(kata: string): string {
  const hasil = buangAkhiran(buangAwalan(kata));
  return hasil.length >= 4 ? hasil : kata;
}

/* Token akhir untuk TF-IDF: dinormalisasi, tanpa stopword, sudah di-stem. */
export function praproses(teks: string): string[] {
  return tokenBermakna(teks).map((x) => x.akar);
}

/* Sama seperti praproses, tetapi menyimpan bentuk asli sebelum di-stem.
   Dibutuhkan untuk menampilkan label kelompok dengan kata yang terbaca
   manusia ("transparansi", bukan "transpar"). */
export function tokenBermakna(teks: string): Array<{ asal: string; akar: string }> {
  return tokenisasi(teks)
    .filter((k) => k.length >= 3)
    .filter((k) => !STOPWORD.has(k))
    .filter((k) => !KATA_UMUM.has(k))
    .map((k) => ({ asal: k, akar: akarKata(k) }))
    .filter((x) => x.akar.length >= 4)
    .filter((x) => !STOPWORD.has(x.akar))
    .filter((x) => !KATA_UMUM.has(x.akar));
}

/* Bigram (dua kata berdampingan) supaya frasa seperti "kanal pelaporan"
   tetap utuh, tidak pecah jadi dua kata terpisah. */
export function bigram(tokens: string[]): string[] {
  const hasil: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) hasil.push(`${tokens[i]}_${tokens[i + 1]}`);
  return hasil;
}

/* Kata yang menyatakan tindakan atau keadaan, bukan topik. Kata seperti
   "dipertahankan" atau "ditingkatkan" sering muncul di komentar, tetapi tidak
   menjawab "apa yang dibahas". Kata ini tetap dipakai saat klasterisasi;
   yang dibuang hanya dari label dan kata kunci yang ditampilkan. */
export const KATA_TINDAKAN: ReadonlySet<string> = new Set([
  'pertahan', 'pertahana', 'tahan', 'bantu', 'dukung', 'perbarui',
  'tingkat', 'ingkat', 'olak', 'adak', 'jaga', 'jalan', 'akses',
  'sedia', 'sampai', 'terap', 'guna', 'pakai', 'buat', 'lakukan',
  'beri', 'ambil', 'lihat', 'tunjuk', 'siap', 'mulai', 'lanjut',
  'kembang', 'ubah', 'tambah', 'kurang', 'tinggal', 'kenal', 'rasa',
  'harap', 'minta', 'usul', 'urus', 'ukur', 'hitung', 'catat', 'rutin'
]);

/* Kata yang dikirim ke model bahasa: disaring, tanpa nama diri, maksimal 5.
   `namaKapital` berisi kata yang seluruhnya kapital di teks asli; kata seperti
   itu sering singkatan unit atau nama orang, jadi dibuang. */
export function kataKunciUntukModel(
  kata: string[],
  maksimal = 5,
  namaKapital: ReadonlySet<string> = new Set<string>()
): string[] {
  const hasil: string[] = [];

  for (const k of kata) {
    if (k.length < 4 || k.length > 24) continue;
    if (/\d/.test(k)) continue;
    if (k.includes('_')) continue;
    if (namaKapital.has(k.toLowerCase())) continue;
    if (hasil.includes(k)) continue;
    hasil.push(k);
    if (hasil.length >= maksimal) break;
  }

  return hasil;
}

/* Kata yang ditulis kapital seluruhnya di teks asli. Dipakai menyaring nama
   diri dan singkatan sebelum kata kunci dikirim ke model bahasa. */
export function kataKapital(teksList: string[]): Set<string> {
  const hasil = new Set<string>();
  for (const teks of teksList) {
    for (const kata of String(teks).match(/\b[A-Z][A-Z0-9]{2,}\b/g) ?? []) {
      hasil.add(kata.toLowerCase());
    }
  }
  return hasil;
}
