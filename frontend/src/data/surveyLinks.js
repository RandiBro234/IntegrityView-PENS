/* Satu-satunya sumber tautan Google Form survei.
   Slug harus sama dengan key instrumen di SURVEI_INFO agar kartu Pusat Survei,
   tombol detail instrumen, dan redirect route lama memakai data yang sama.
   requiresGoogleLogin menandai form yang mewajibkan akun Google sebelum diisi. */
export const SURVEY_LINKS = [
  {
    slug: 'spak',
    nama: 'Survei Persepsi Anti Korupsi',
    url: 'https://forms.gle/DqJ3woNo2VzbJRHcA',
    requiresGoogleLogin: true
  },
  {
    slug: 'spkp',
    nama: 'Survei Persepsi Kualitas Pelayanan',
    url: 'https://forms.gle/RXHTbKFQEnmG1HBp7',
    // TODO: konfirmasi apakah form ini mewajibkan login Google.
    requiresGoogleLogin: false
  },
  {
    slug: 'spip',
    nama: 'Penerapan SPIP',
    url: 'https://forms.gle/L24oZngpbbs9n3Kf7',
    // TODO: konfirmasi apakah form ini mewajibkan login Google.
    requiresGoogleLogin: false
  },
  {
    slug: 'gratifikasi',
    nama: 'Pengendalian Gratifikasi',
    url: 'https://forms.gle/sYjGdzRsxKkbXzc8A',
    // TODO: konfirmasi apakah form ini mewajibkan login Google.
    requiresGoogleLogin: false
  },
  {
    slug: 'benturan',
    nama: 'Penanganan Benturan Kepentingan',
    url: 'https://forms.gle/y9B4WccmjXhnPvt17',
    // TODO: konfirmasi apakah form ini mewajibkan login Google.
    requiresGoogleLogin: false
  },
  {
    slug: 'wbs',
    nama: 'Whistleblowing System (WBS)',
    url: 'https://forms.gle/nAve1DzXiEaoGq998',
    // TODO: konfirmasi apakah form ini mewajibkan login Google.
    requiresGoogleLogin: false
  },
  {
    slug: 'pengaduan',
    nama: 'Pengaduan Masyarakat',
    url: 'https://forms.gle/vvWAH5dSVh145rjm9',
    // TODO: konfirmasi apakah form ini mewajibkan login Google.
    requiresGoogleLogin: false
  },
  {
    slug: 'budaya-zi',
    nama: 'Budaya Integritas/ZI',
    url: 'https://forms.gle/GziP5cwDwJ69S3Tq5',
    // TODO: konfirmasi apakah form ini mewajibkan login Google.
    requiresGoogleLogin: false
  },
  {
    slug: 'pens-joss',
    nama: 'Budaya Kerja PENS JOSS',
    url: 'https://forms.gle/gWemUcZBFhUcbzpC8',
    // TODO: konfirmasi apakah form ini mewajibkan login Google.
    requiresGoogleLogin: false
  },
  {
    slug: '5r',
    nama: 'Implementasi 5R',
    url: 'https://forms.gle/AV12MNFhrv3GckZH7',
    // TODO: konfirmasi apakah form ini mewajibkan login Google.
    requiresGoogleLogin: false
  }
];

const PETA = new Map(SURVEY_LINKS.map((item) => [item.slug, item]));

export function getSurveyLink(slug) {
  return PETA.get(slug) || null;
}

export function getSurveyUrl(slug) {
  return PETA.get(slug)?.url || null;
}
