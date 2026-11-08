/* Validasi permintaan POST /chat.

   Aturan dari 07-chatbot.md bagian 2 [1]:
   - pertanyaan kosong atau lebih dari 300 karakter -> 422
   - instrumen opsional, tetapi bila dikirim harus dikenal

   `PayloadError` sengaja dipakai ulang dari _shared/errors.ts supaya endpoint
   bisa memetakannya ke 422 dengan satu aturan.
*/

import { PayloadError } from '../../_shared/errors.ts';
import type { Registri } from './tipe.ts';

export const MAKS_PERTANYAAN = 300;

export interface ChatMasuk {
  pertanyaan: string;
  instrumen: string | null;
}

export function validasiChat(body: unknown, registri: Registri): ChatMasuk {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new PayloadError('Body harus berupa objek JSON.');
  }

  const data = body as Record<string, unknown>;

  if (typeof data.pertanyaan !== 'string') {
    throw new PayloadError('pertanyaan wajib diisi.');
  }
  const pertanyaan = data.pertanyaan.trim();
  if (!pertanyaan) {
    throw new PayloadError('pertanyaan tidak boleh kosong.');
  }
  if (pertanyaan.length > MAKS_PERTANYAAN) {
    throw new PayloadError(`pertanyaan maksimal ${MAKS_PERTANYAAN} karakter.`);
  }

  let instrumen: string | null = null;
  if (data.instrumen != null && data.instrumen !== '') {
    if (typeof data.instrumen !== 'string') {
      throw new PayloadError('instrumen harus berupa teks.');
    }
    const kunci = data.instrumen.trim();
    if (kunci.length > 60) {
      throw new PayloadError('instrumen terlalu panjang.');
    }
    /* Dikenal lewat slug, nama pendek, atau alias nama database. Tidak harus
       punya agregat: nama tak dikenal cukup diabaikan oleh pemilih konteks,
       tetapi nilai sampah yang jelas (mis. berisi markup) ditolak. */
    const alias = registri.alias[kunci.toLowerCase().replace(/[^a-z0-9]/g, '')];
    const dikenal = Boolean(alias) || registri.instrumen.some((i) => i.slug === kunci.toLowerCase());
    if (!dikenal) throw new PayloadError(`instrumen "${kunci}" tidak dikenal.`);
    instrumen = kunci;
  }

  return { pertanyaan, instrumen };
}
