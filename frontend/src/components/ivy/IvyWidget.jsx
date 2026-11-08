import { useEffect, useRef, useState } from 'react';
import './IvyWidget.css';
import { chatSiap, tanyaChat, ChatError } from '../../data/chatApi';

/* Panel obrolan "Tanya Ivy".

   Bila Edge Function `chat` tersedia (lihat chatApi.js), pertanyaan dikirim ke
   sana dan jawabannya berasal dari data dashboard. Bila belum tersedia,
   komponen memakai jawaban contoh di bawah supaya aplikasi tetap berfungsi
   tanpa backend — pola yang sama dengan mock.js. */

const SAPAAN = 'Hai, saya Ivy. Tanya apa saja soal survei Zona Integritas atau cara pakai IntegrityView.';

const SARAN = ['Cara isi survei?', 'Apa itu skor ZI?', 'Di mana lihat laporan saya?'];

const CONTOH = [
  [
    /isi|form|kuesioner|jawab/i,
    'Survei diisi lewat Google Form, bukan di aplikasi ini. Buka menu Pusat Survei, pilih instrumen yang ingin dinilai, lalu tekan "Isi Survei". Satu instrumen sekitar 5-9 butir.',
  ],
  [
    /indeks|zi|skor|nilai/i,
    'Rata-rata skor ZI memakai skala 1–4: 1 = Sangat Tidak Setuju, 4 = Sangat Setuju. Angka 3,2 misalnya berarti responden cenderung Setuju. Angka ini berbeda dari "Setuju + Sangat Setuju", yang menghitung persentase jawaban orang.',
  ],
  [
    /lapor|wbs|pengaduan|adu|dugaan/i,
    'Laporan pelanggaran dikirim lewat kanal WBS di menu Pengaduan, bukan di sini. Setelah dikirim kamu dapat kode laporan (WBS-TAHUN-NNNN) untuk melacak status.',
  ],
  [
    /dashboard|grafik|periode|banding/i,
    'Dashboard menampilkan ringkasan periode terpilih dan perbandingannya dengan semester sebelumnya. Periode, pembanding, dan kategori bisa diubah di bagian atas halaman.',
  ],
  [
    /privasi|email|data|aman|rahasia/i,
    'Email responden hanya dipakai untuk menghitung jumlah responden unik dan membuang jawaban ganda. Jawaban terbuka tidak pernah ditampilkan mentah di halaman publik.',
  ],
];

const CADANGAN = 'Untuk prototipe ini saya baru bisa menjawab soal cara isi survei, skor ZI, dashboard, pelaporan WBS, dan privasi data. Untuk pertanyaan lain, hubungi pengelola Zona Integritas PENS.';

/* Jawaban contoh: dipakai hanya bila Edge Function belum tersedia. */
const jawabContoh = (teks) => {
  const cocok = CONTOH.find(([pola]) => pola.test(teks));
  return cocok ? cocok[1] : CADANGAN;
};

/* Balasan yang ditampilkan bila layanan gagal. Dipisah per status supaya
   pengguna tahu apakah harus menunggu (429) atau memang sedang gangguan (503). */
function pesanGalat(err) {
  if (err instanceof ChatError) {
    if (err.status === 429) return 'Terlalu sering bertanya. Coba lagi beberapa saat lagi.';
    if (err.status === 503) return 'Asisten sedang tidak tersedia. Coba lagi nanti.';
    return err.message;
  }
  return 'Asisten sedang tidak tersedia. Coba lagi nanti.';
}

/* Silang digambar sebagai SVG, bukan karakter "×", supaya tepat di tengah
   lingkaran tanpa terpengaruh metrik baseline font. */
function IkonSilang() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export default function IvyWidget({ instrumen = null }) {
  const [buka, setBuka] = useState(false);
  const [pesan, setPesan] = useState([{ dari: 'ivy', teks: SAPAAN }]);
  const [input, setInput] = useState('');
  const [mengetik, setMengetik] = useState(false);
  const timer = useRef(null);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!buka) return;
    inputRef.current?.focus();
    const esc = (e) => { if (e.key === 'Escape') setBuka(false); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [buka]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [pesan, mengetik]);

  const kirim = async (teks) => {
    const isi = teks.trim();
    if (!isi || mengetik) return;
    setPesan((lama) => [...lama, { dari: 'user', teks: isi }]);
    setInput('');
    setMengetik(true);

    if (!chatSiap) {
      /* Tanpa backend: tetap beri jawaban contoh setelah jeda singkat supaya
         ritmenya terasa sama dengan jawaban sungguhan. */
      timer.current = window.setTimeout(() => {
        setPesan((lama) => [...lama, { dari: 'ivy', teks: jawabContoh(isi) }]);
        setMengetik(false);
      }, 650);
      return;
    }

    try {
      const { jawaban } = await tanyaChat(isi, { instrumen });
      setPesan((lama) => [...lama, { dari: 'ivy', teks: jawaban }]);
    } catch (err) {
      setPesan((lama) => [...lama, { dari: 'ivy', teks: pesanGalat(err), galat: true }]);
    } finally {
      setMengetik(false);
    }
  };

  return (
    <div className="ivy">
      {buka && (
        <section className="ivy__panel" role="dialog" aria-label="Tanya Ivy, asisten IntegrityView">
          <header className="ivy__head">
            <span className="ivy__avatar" aria-hidden="true">IV</span>
            <div className="ivy__identitas">
              <p className="ivy__nama">Tanya Ivy</p>
              <p className="ivy__peran">Asisten IntegrityView</p>
            </div>
            <button type="button" className="ivy__tutup" onClick={() => setBuka(false)} aria-label="Tutup Ivy">
              <IkonSilang />
            </button>
          </header>

          <div className="ivy__body" ref={bodyRef} aria-live="polite">
            {pesan.map((p, i) => (
              <p
                key={i}
                className={`ivy__balon ivy__balon--${p.dari}${p.galat ? ' ivy__balon--galat' : ''}`.trim()}
              >
                {p.teks}
              </p>
            ))}
            {mengetik && <p className="ivy__balon ivy__balon--ivy ivy__balon--ketik">Ivy sedang menulis...</p>}
            {pesan.length === 1 && (
              <div className="ivy__saran">
                {SARAN.map((s) => (
                  <button type="button" key={s} className="ivy__chip" onClick={() => kirim(s)}>{s}</button>
                ))}
              </div>
            )}
          </div>

          <form
            className="ivy__form"
            onSubmit={(e) => { e.preventDefault(); kirim(input); }}
          >
            <input
              ref={inputRef}
              className="ivy__input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pertanyaan..."
              aria-label="Pertanyaan untuk Ivy"
              maxLength={300}
            />
            <button type="submit" className="ivy__kirim" disabled={!input.trim() || mengetik}>
              Kirim
            </button>
          </form>
          <p className="ivy__catatan">
            {chatSiap
              ? 'Jawaban dibuat AI dari data dashboard. Periksa angka di grafik bila perlu.'
              : 'Prototipe — jawaban masih contoh'}
          </p>
        </section>
      )}

      <button
        type="button"
        className={`ivy__bubble ${buka ? 'is-buka' : ''}`.trim()}
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        aria-label={buka ? 'Tutup Tanya Ivy' : 'Buka Tanya Ivy'}
      >
        {buka ? <IkonSilang /> : 'Tanya Ivy'}
      </button>
    </div>
  );
}
