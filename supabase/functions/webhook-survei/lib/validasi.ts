export class PayloadError extends Error {}

export function validasiData(data: unknown): Record<string, unknown> {
  if (
    typeof data !== 'object' ||
    data === null ||
    Array.isArray(data) ||
    Object.keys(data).length === 0
  ) {
    throw new PayloadError(
      'data kosong. Cek trigger Apps Script: From form > On form submit, ' +
        'dan pastikan payload berisi e.namedValues / e.response.'
    );
  }
  return data as Record<string, unknown>;
}
