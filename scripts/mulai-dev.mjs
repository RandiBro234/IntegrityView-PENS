/* Menjalankan dua server sekaligus: Vite (aplikasi web) dan server chatbot.

   Kenapa perlu dua: Vite hanya melayani frontend, sedangkan jawaban chatbot
   berasal dari proses terpisah yang memegang kunci API (kunci tidak boleh
   masuk ke bundle browser).

   Pakai:
     cd frontend
     npm run dev:all          -> buka browser otomatis
     npm run dev:all -- --no-open

   Ctrl+C sekali akan mematikan kedua proses.
*/

import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FRONTEND = resolve(AKAR, 'frontend');
const PORT_CHAT = Number(process.env.CHAT_PORT || 8787);
const bukaBrowser = !process.argv.includes('--no-open');

const proses = [];

function jalankan(nama, perintah, argumen, opsi = {}) {
  const anak = spawn(perintah, argumen, {
    cwd: opsi.cwd ?? AKAR,
    stdio: ['ignore', 'pipe', 'pipe'],
    /* shell sengaja TIDAK dipakai: path folder proyek mengandung "!" dan spasi,
       dan shell Windows memotongnya di karakter "!". */
    shell: false
  });

  const tulis = (aliran, warna) => (data) => {
    for (const baris of String(data).split(/\r?\n/)) {
      if (!baris.trim()) continue;
      aliran.write(`${warna}${nama.padEnd(6)}\u001b[0m ${baris}\n`);
    }
  };

  anak.stdout.on('data', tulis(process.stdout, '\u001b[36m'));
  anak.stderr.on('data', tulis(process.stderr, '\u001b[33m'));
  anak.on('exit', (kode) => {
    if (kode && kode !== 0) console.error(`${nama} berhenti dengan kode ${kode}`);
  });

  proses.push(anak);
  return anak;
}

function matikanSemua() {
  for (const anak of proses) {
    if (anak.exitCode !== null) continue;
    if (process.platform === 'win32') {
      /* taskkill /T mematikan juga anak proses (npm -> node -> vite). */
      spawn('taskkill', ['/pid', String(anak.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      anak.kill('SIGTERM');
    }
  }
}

for (const sinyal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sinyal, () => {
    matikanSemua();
    process.exit(0);
  });
}
process.on('exit', matikanSemua);

/* 1. Server chatbot */
jalankan('chat', 'node', ['--experimental-strip-types', resolve(AKAR, 'scripts/serve-chat.mjs')], {
  cwd: AKAR
});

/* 2. Vite, setelah jeda singkat supaya log chatbot tampil lebih dulu. */
setTimeout(() => {
  const argumen = ['run', 'dev', '--'];
  if (bukaBrowser) argumen.push('--open');
  /* npm di Windows berupa npm.cmd; tanpa shell kita harus menyebutnya eksplisit. */
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  jalankan('vite', npm, argumen, { cwd: FRONTEND });
}, 800);

console.log('');
console.log('  Aplikasi  : http://localhost:5173   (buka di browser)');
console.log(`  API chat  : http://127.0.0.1:${PORT_CHAT}   (hanya menerima POST)`);
console.log('  Hentikan  : Ctrl+C');
console.log('');
