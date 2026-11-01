export function pertama(nilai: unknown): string | null {
  if (Array.isArray(nilai)) return nilai.length ? String(nilai[0]) : null;
  if (nilai === null || nilai === undefined) return null;
  return String(nilai);
}

export function ambilEmail(data: Record<string, unknown>): string | null {
  const prioritas = [
    'email address', 'email', 'alamat email', 'email responden',
    'surel', 'respondent email', '__respondent_email'
  ];
  const entri = Object.entries(data);

  for (const target of prioritas) {
    for (const [kunci, nilai] of entri) {
      if (kunci.trim().toLowerCase() === target) {
        const v = pertama(nilai);
        if (v) return v;
      }
    }
  }

  for (const [kunci, nilai] of entri) {
    if (kunci.toLowerCase().includes('email')) {
      const v = pertama(nilai);
      if (v) return v;
    }
  }
  return null;
}
