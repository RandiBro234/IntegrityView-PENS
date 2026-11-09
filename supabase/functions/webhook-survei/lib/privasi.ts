const KOLOM_EMAIL = new Set([
  'email',
  'email address',
  'alamat email',
  'email responden',
  'surel',
  'respondent email',
  '__respondent_email'
]);

function kunciEmail(kunci: string): boolean {
  const bersih = kunci.replace(/^\uFEFF/, '').trim().toLowerCase();
  return KOLOM_EMAIL.has(bersih) || bersih.includes('email');
}

/** Buang kunci email dari payload sebelum disimpan/dibaca frontend. */
export function sanitasiDataJawaban(
  data: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).filter(([kunci]) => !kunciEmail(kunci))
  );
}

/** Hash email dengan pepper server-side. Email asli tidak pernah disimpan. */
export async function hashEmail(email: string): Promise<string> {
  const pepper = Deno.env.get('RESPONDENT_HASH_PEPPER');
  if (!pepper) {
    throw new Error('RESPONDENT_HASH_PEPPER belum diset');
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(email.trim().toLowerCase())
  );

  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
