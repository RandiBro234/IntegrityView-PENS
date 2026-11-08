import { readFile } from 'node:fs/promises';

const f = JSON.parse(await readFile('supabase/functions/chat/tests/fixtures/agregat-db.json', 'utf8'));
console.log('sumber:', f._sumber, '| kasus:', f.kasus.length);
for (const k of f.kasus) {
  console.log(`  ${k.slug.padEnd(12)} ${k.periode}  n=${String(k.n).padStart(3)}  butir=${k.agregat.butir.length}  alpha=${k.agregat.alpha?.toFixed(4)}`);
}
const s = JSON.stringify(f);
console.log('ukuran:', (s.length / 1024).toFixed(1), 'KB');

// Audit PII: tidak boleh ada email, komentar terbuka, atau id baris.
const pola = [
  ['email', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/],
  ['email_responden', /email_responden/],
  ['komentar terbuka', /"terbuka"\s*:\s*"[^"]+"/],
  ['respondentId', /respondentId/]
];
for (const [nama, re] of pola) {
  const m = s.match(re);
  console.log(`  ${nama.padEnd(18)}: ${m ? 'DITEMUKAN -> ' + m[0].slice(0, 60) : 'tidak ada'}`);
}
