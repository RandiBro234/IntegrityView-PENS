/* Satu-satunya sumber tautan Google Form.
   Daftar instrumen, slug, dan butir ada di instrumentConfig.js — file ini
   hanya meneruskan agar komponen lama tidak memuat URL sendiri. */
import { INSTRUMENTS, getInstrumen, getSurveyUrl } from './instrumentConfig.js';

export const SURVEY_LINKS = INSTRUMENTS.map((i) => ({
  slug: i.slug,
  nama: i.namaPanjang,
  url: i.url,
  requiresGoogleLogin: i.requiresGoogleLogin
}));

export function getSurveyLink(slug) {
  const instrumen = getInstrumen(slug);
  if (!instrumen) return null;
  return {
    slug: instrumen.slug,
    nama: instrumen.namaPanjang,
    url: instrumen.url,
    requiresGoogleLogin: instrumen.requiresGoogleLogin
  };
}

export { getSurveyUrl };
