/* Inti logika endpoint /chat, dipisah dari Deno.serve supaya bisa dites dengan
   Node tanpa menjalankan Edge Runtime.

   Alur (07-chatbot.md bagian 2):
     validasi -> ambil data -> pilih konteks -> susun prompt -> panggil LLM
     -> cari kode butir yang disebut -> { jawaban, dasar }

   Semua ketergantungan luar (data, LLM, rate limit) dioper sebagai parameter,
   jadi tes bisa memakai stub dan tidak menyentuh jaringan.
*/

import { PayloadError } from '../../_shared/errors.ts';
import { pilihInstrumen, rakitKonteksSatu, rakitKonteksSemua, type Konteks } from './konteks.ts';
import { susunPesan } from './prompt.ts';
import { LlmTidakTersedia } from './llm.ts';
import { rapikanJawaban } from './format.ts';
import { validasiChat } from './validasi.ts';
import type { Registri } from './tipe.ts';
import type { HasilKumpulan } from './sumber.ts';

export interface Hasil {
  status: number;
  body: Record<string, unknown>;
}

export interface Ketergantungan {
  registri: Registri;
  /* Ambil data agregat yang sudah dihitung. Melempar error bila database gagal. */
  ambilData: () => Promise<HasilKumpulan>;
  /* Panggil LLM dengan pesan yang sudah disusun. */
  tanyaLlm: (pesan: { system: string; user: string }) => Promise<string>;
  /* true = masih boleh lanjut. */
  cekBatas: () => Promise<boolean>;
}

/* Kode butir yang muncul di teks jawaban. Pencocokan teks biasa, bukan model. */
export function cariDasar(jawaban: string, kodeTersedia: string[]): string[] {
  const teks = jawaban.toLowerCase();
  return kodeTersedia.filter((kode) => {
    const aman = kode.toLowerCase();
    return new RegExp(`(?<![a-z0-9])${aman}(?![a-z0-9])`, 'i').test(teks);
  });
}

function kodeDariKonteks(konteks: Konteks): string[] {
  if ('butir' in konteks) return konteks.butir.map((b) => b.kode);
  return konteks.instrumen.map((i) => i.butir_terendah?.kode).filter((k): k is string => Boolean(k));
}

export async function jawabChat(body: unknown, deps: Ketergantungan): Promise<Hasil> {
  /* 1. Validasi */
  let masuk;
  try {
    masuk = validasiChat(body, deps.registri);
  } catch (err) {
    if (err instanceof PayloadError) return { status: 422, body: { error: err.message } };
    throw err;
  }

  /* 2. Batas pemakaian */
  const boleh = await deps.cekBatas();
  if (!boleh) {
    return { status: 429, body: { error: 'Terlalu banyak pertanyaan. Coba lagi nanti.' } };
  }

  /* 3. Data + konteks */
  let data: HasilKumpulan;
  try {
    data = await deps.ambilData();
  } catch (err) {
    console.error('chatbot: gagal membaca data', err instanceof Error ? err.message : err);
    return { status: 503, body: { kode: 'chatbot_tidak_tersedia', error: 'Data survei sedang tidak dapat dibaca.' } };
  }

  if (!data.perInstrumen.length) {
    return {
      status: 200,
      body: {
        jawaban: 'Belum ada data survei yang bisa dijelaskan di dashboard.',
        dasar: []
      }
    };
  }

  const dipilih = pilihInstrumen(masuk.pertanyaan, masuk.instrumen, deps.registri);
  let konteks: Konteks;
  if (dipilih) {
    const satu = data.perInstrumen.find((d) => d.instrumen.slug === dipilih.slug);
    if (!satu) {
      return {
        status: 200,
        body: {
          jawaban: `Data ${dipilih.nama} belum tersedia di dashboard untuk periode ini.`,
          dasar: []
        }
      };
    }
    konteks = rakitKonteksSatu(satu.agregat, satu.instrumen, deps.registri.ambang, satu.rekomendasi);
  } else {
    konteks = rakitKonteksSemua(
      data.perInstrumen.map((d) => ({
        agregat: d.agregat,
        instrumen: d.instrumen,
        judulRekomendasi: d.rekomendasi.map((r) => r.judul)
      }))
    );
  }

  /* 4. LLM */
  let jawaban: string;
  try {
    jawaban = await deps.tanyaLlm(susunPesan(konteks, masuk.pertanyaan));
  } catch (err) {
    if (err instanceof LlmTidakTersedia) {
      console.error('chatbot: LLM tidak tersedia:', err.message);
      return {
        status: 503,
        body: { kode: 'chatbot_tidak_tersedia', error: 'Asisten sedang tidak tersedia. Coba lagi nanti.' }
      };
    }
    throw err;
  }

  /* 4b. Rapikan penanda markdown yang lolos dari aturan prompt. */
  jawaban = rapikanJawaban(jawaban);

  /* 5. Kode butir yang disebut jawaban */
  return { status: 200, body: { jawaban, dasar: cariDasar(jawaban, kodeDariKonteks(konteks)) } };
}
