/* Perapian teks jawaban sebelum dikirim ke browser.

   Model bahasa kadang tetap menulis markdown (**tebal**, bullet dengan tanda
   bintang, judul dengan #) walaupun sudah diminta tidak. Panel obrolan
   menampilkan teks apa adanya, jadi penanda itu muncul sebagai karakter
   mentah dan membuat jawaban terlihat berantakan.

   Fungsi ini membuang penanda tersebut dan merapikan spasi, tanpa mengubah
   isi atau angka. Paragraf tetap dipisah baris kosong supaya bisa ditampilkan
   sebagai beberapa paragraf.
*/

export function rapikanJawaban(teks: string): string {
  return (
    teks
      /* Blok kode dan inline code: buang penandanya, isinya tetap. */
      .replace(/```[a-zA-Z]*\n?/g, '')
      .replace(/`([^`]*)`/g, '$1')
      /* **tebal** / __tebal__ / *miring* */
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1$2')
      /* Judul markdown di awal baris. */
      .replace(/^#{1,6}\s+/gm, '')
      /* Bullet "- " atau "* " jadi "• " supaya tetap terbaca sebagai daftar. */
      .replace(/^\s*[-*+]\s+/gm, '• ')
      /* Nomor urut markdown "1. " dibiarkan, hanya spasinya dirapatkan. */
      .replace(/[ \t]+$/gm, '')
      /* Lebih dari satu baris kosong berderet dijadikan satu pemisah paragraf. */
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}
