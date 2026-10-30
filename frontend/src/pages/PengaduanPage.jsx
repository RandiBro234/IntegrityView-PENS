import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import {
  getUser, KATEGORI_ADUAN, savePengaduan, simpanPengaduanLokal, cariPengaduan,
  formatTanggal, formatTanggalWaktu
} from '../data/mock';
import { kirimLaporan, laporanApiSiap } from '../data/laporanApi';
import './PengaduanPage.css';

const HUBUNGAN = ['Mahasiswa', 'Dosen', 'Tenaga Kependidikan', 'Masyarakat Umum', 'Alumni'];
const TAHAP = ['Laporan Diterima', 'Sedang Diproses', 'Selesai Ditangani'];
const URUT = { 'Baru': 0, 'Diproses': 1, 'Selesai': 2 };

export default function PengaduanPage({ onNavigate, initialTab = 'buat', initialKode = '' }) {
  const user = getUser();
  const [tab, setTab] = useState(initialTab); // 'buat' | 'lacak'

  const handleMenu = (key) => onNavigate && onNavigate(key);

  return (
    <div className="app-shell">
      <Sidebar active="pengaduan" onNavigate={handleMenu} user={user} />
      <div className="app-main">
        <Topbar user={user} notifCount={user.role === 'admin' ? 3 : 0} onProfil={() => handleMenu('profil')} />
        <main className="app-content">
          <div className="pg-shell">
            <header className="pg-head">
              <div>
                <p className="label-eyebrow">Kanal Pelaporan</p>
                <h1 className="pg-head__title">Pengaduan &amp; Whistleblowing System</h1>
                <p className="pg-head__sub">
                  Sampaikan masalah layanan atau fasilitas, atau lacak status laporan memakai kode tracking.
                </p>
              </div>
            </header>

            <div className="pg-tabs" role="tablist" aria-label="Mode pengaduan">
              <button
                type="button" role="tab"
                aria-selected={tab === 'buat'}
                className={`pg-tab ${tab === 'buat' ? 'is-active' : ''}`}
                onClick={() => setTab('buat')}
              >
                Buat Laporan
              </button>
              <button
                type="button" role="tab"
                aria-selected={tab === 'lacak'}
                className={`pg-tab ${tab === 'lacak' ? 'is-active' : ''}`}
                onClick={() => setTab('lacak')}
              >
                Lacak Status
              </button>
            </div>

            {tab === 'buat' ? <BuatLaporan /> : <LacakStatus initialKode={initialKode} />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Buat laporan (multi-step) ---------- */

function BuatLaporan() {
  const [jenis, setJenis] = useState('pengaduan');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    judul: '', kategori: '', lokasi: '', deskripsi: '',
    anonim: false, nama_pelapor: '', kontak_pelapor: '', hubungan: '', setuju: false
  });
  const [errors, setErrors] = useState({});
  const [hasil, setHasil] = useState(null);
  const [mengirim, setMengirim] = useState(false);
  const [errorKirim, setErrorKirim] = useState('');

  const isWbs = jenis === 'wbs';
  const kategoriOpsi = isWbs ? [...KATEGORI_ADUAN, 'Pungli', 'Gratifikasi', 'Benturan Kepentingan'] : KATEGORI_ADUAN;

  const set = (k, v) => {
    setErrorKirim('');
    setForm((f) => ({ ...f, [k]: v }));
  };

  const validasiStep1 = () => {
    const e = {};
    if (!form.judul.trim()) e.judul = 'Judul wajib diisi.';
    if (!form.kategori) e.kategori = 'Kategori wajib dipilih.';
    if (!form.deskripsi.trim()) e.deskripsi = 'Deskripsi wajib diisi.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validasiStep2 = () => {
    const e = {};
    if (!form.anonim) {
      if (!form.nama_pelapor.trim()) e.nama_pelapor = 'Nama wajib diisi jika tidak anonim.';
      if (!form.kontak_pelapor.trim()) e.kontak_pelapor = 'Kontak wajib diisi jika tidak anonim.';
      if (!form.hubungan) e.hubungan = 'Pilih salah satu hubungan.';
    }
    if (!form.setuju) e.setuju = 'Persetujuan wajib dicentang.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = () => { if (validasiStep1()) setStep(1); };
  const prev = () => setStep(0);

  const submit = async (e) => {
    e.preventDefault();
    if (!validasiStep2()) return;

    const data = {
      jenis,
      judul: form.judul,
      kategori: form.kategori,
      lokasi: form.lokasi,
      deskripsi: form.deskripsi,
      anonim: form.anonim,
      nama_pelapor: form.nama_pelapor,
      kontak_pelapor: form.kontak_pelapor,
      hubungan: form.hubungan
    };

    /* Tanpa env Supabase, tetap simpan lokal agar demo tidak rusak. */
    if (!laporanApiSiap) {
      setHasil(savePengaduan(data));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrorKirim('');
    setMengirim(true);
    try {
      const row = await kirimLaporan(data);
      if (!row?.kode) throw new Error('Server tidak mengembalikan kode laporan.');

      const rec = {
        id: row.kode,
        jenis: row.jenis || jenis,
        judul: row.judul,
        kategori: row.kategori,
        lokasi: row.lokasi || '',
        deskripsi: row.deskripsi,
        anonim: !!row.anonim,
        nama_pelapor: row.nama_pelapor,
        kontak_pelapor: row.kontak_pelapor,
        hubungan: row.hubungan,
        status: row.status || 'Baru',
        pic: row.pic || '',
        waktuLapor: row.created_at || new Date().toISOString(),
        waktuUpdate: row.updated_at || row.created_at || new Date().toISOString(),
        riwayat: Array.isArray(row.riwayat) ? row.riwayat : [],
        catatanInternal: Array.isArray(row.catatan_internal) ? row.catatan_internal : [],
        balasan: Array.isArray(row.balasan) ? row.balasan : []
      };

      simpanPengaduanLokal(rec);
      setHasil(rec);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorKirim(err.message || 'Gagal mengirim laporan. Coba lagi.');
    } finally {
      setMengirim(false);
    }
  };

  if (hasil) {
    return (
      <div className="pg-card pg-sukses">
        <span className="pg-sukses__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </span>
        <h2>Laporan terkirim</h2>
        <p>Simpan kode berikut untuk melacak status penanganan.</p>
        <div className="pg-sukses__kode">{hasil.id}</div>
        <div className="pg-sukses__actions">
          <button type="button" className="btn btn-outline-navy" onClick={() => navigator.clipboard && navigator.clipboard.writeText(hasil.id)}>
            Salin Kode
          </button>
          <button type="button" className="btn btn-primary" onClick={() => { setHasil(null); setForm({ judul: '', kategori: '', lokasi: '', deskripsi: '', anonim: false, nama_pelapor: '', kontak_pelapor: '', hubungan: '', setuju: false }); setStep(0); }}>
            Buat Laporan Lain
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pg-card">
      <div className="pg-jenis" role="radiogroup" aria-label="Jenis laporan">
        <button
          type="button" role="radio" aria-checked={!isWbs}
          className={`pg-jenis__opt ${!isWbs ? 'is-active' : ''}`}
          onClick={() => setJenis('pengaduan')}
        >
          <span className="pg-jenis__title">Pengaduan Masyarakat</span>
          <span className="pg-jenis__desc">Fasilitas, administrasi, kualitas layanan.</span>
        </button>
        <button
          type="button" role="radio" aria-checked={isWbs}
          className={`pg-jenis__opt ${isWbs ? 'is-active' : ''}`}
          onClick={() => setJenis('wbs')}
        >
          <span className="pg-jenis__title">Whistleblowing System</span>
          <span className="pg-jenis__desc">Dugaan pelanggaran integritas, mendukung anonim.</span>
        </button>
      </div>

      <div className="pg-steps">
        <span className={`pg-dot ${step >= 0 ? 'is-active' : ''}`}>1</span>
        <span className="pg-steps__line" />
        <span className={`pg-dot ${step >= 1 ? 'is-active' : ''}`}>2</span>
        <span className="pg-steps__label">Langkah {step + 1} dari 2</span>
      </div>

      <form onSubmit={submit} noValidate>
        {step === 0 && (
          <>
            <Field label="Judul laporan" error={errors.judul}>
              <input type="text" placeholder="Ringkas dalam satu kalimat" value={form.judul} onChange={(e) => set('judul', e.target.value)} />
            </Field>
            <Field label="Kategori" error={errors.kategori}>
              <select value={form.kategori} onChange={(e) => set('kategori', e.target.value)}>
                <option value="">Pilih kategori</option>
                {kategoriOpsi.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </Field>
            <Field label="Lokasi / gedung terkait (opsional)">
              <input type="text" placeholder="Opsional" value={form.lokasi} onChange={(e) => set('lokasi', e.target.value)} />
            </Field>
            <Field label="Deskripsi lengkap" error={errors.deskripsi}>
              <textarea rows="5" placeholder="Jelaskan masalah, kapan terjadi, dan dampaknya" value={form.deskripsi} onChange={(e) => set('deskripsi', e.target.value)} />
            </Field>
            <div className="pg-actions">
              <button type="button" className="btn btn-primary" onClick={next}>Lanjut</button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="pg-note">
              <strong>Pilihan anonim.</strong> Jika memilih anonim, nama, kontak, dan hubungan Anda tidak disimpan. Status hanya bisa dilacak memakai kode {isWbs ? 'WBS' : 'ADU'}.
            </div>

            <label className="pg-check">
              <input type="checkbox" checked={form.anonim} onChange={(e) => set('anonim', e.target.checked)} />
              <span>Saya melapor secara anonim. Jangan simpan identitas saya.</span>
            </label>

            {!form.anonim && (
              <>
                <Field label="Nama lengkap" error={errors.nama_pelapor}>
                  <input type="text" value={form.nama_pelapor} onChange={(e) => set('nama_pelapor', e.target.value)} />
                </Field>
                <Field label="Email atau WhatsApp" error={errors.kontak_pelapor}>
                  <input type="text" value={form.kontak_pelapor} onChange={(e) => set('kontak_pelapor', e.target.value)} />
                </Field>
                <Field label="Hubungan dengan PENS" error={errors.hubungan}>
                  <select value={form.hubungan} onChange={(e) => set('hubungan', e.target.value)}>
                    <option value="">Pilih hubungan</option>
                    {HUBUNGAN.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </Field>
              </>
            )}

            <label className={`pg-check ${errors.setuju ? 'has-error' : ''}`}>
              <input type="checkbox" checked={form.setuju} onChange={(e) => set('setuju', e.target.checked)} />
              <span>Saya menyetujui ketentuan dan menyatakan informasi ini benar.</span>
            </label>
            {errors.setuju && <p className="pg-error">{errors.setuju}</p>}
            {errorKirim && <p className="pg-error">{errorKirim}</p>}

            <div className="pg-actions">
              <button type="button" className="btn btn-outline-navy" onClick={prev} disabled={mengirim}>Kembali</button>
              <button type="submit" className="btn btn-primary" disabled={mengirim}>
                {mengirim ? 'Mengirim...' : 'Kirim Laporan'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

/* ---------- Lacak status ---------- */

function LacakStatus({ initialKode }) {
  const [kode, setKode] = useState(initialKode || '');
  const [hasil, setHasil] = useState(initialKode ? cariPengaduan(initialKode) : null);
  const [dicari, setDicari] = useState(!!initialKode);
  const [error, setError] = useState('');

  const cari = (e) => {
    e.preventDefault();
    const v = kode.trim();
    if (!v) { setError('Masukkan kode terlebih dahulu.'); return; }
    setError('');
    setHasil(cariPengaduan(v));
    setDicari(true);
  };

  return (
    <div className="pg-lacak">
      <form className="pg-card pg-lacak__form" onSubmit={cari}>
        <Field label="Kode laporan" error={error}>
          <input type="text" placeholder="Contoh: ADU-2026-0001 atau WBS-2026-001" value={kode} onChange={(e) => setKode(e.target.value)} autoComplete="off" />
        </Field>
        <div className="pg-actions">
          <button type="submit" className="btn btn-primary">Lacak Sekarang</button>
        </div>
      </form>

      {dicari && (hasil ? <HasilLacak data={hasil} /> : (
        <div className="pg-card pg-state">
          <p className="pg-state__title">Kode tidak ditemukan</p>
          <p className="pg-state__text">Kode "{kode}" tidak cocok dengan laporan mana pun. Pengaduan berformat ADU-2026-0001, WBS berformat WBS-2026-001.</p>
        </div>
      ))}

      {!dicari && (
        <div className="pg-card pg-state">
          <p className="pg-state__title">Belum ada pencarian</p>
          <p className="pg-state__text">Masukkan kode tracking untuk melihat status penanganan laporan.</p>
        </div>
      )}
    </div>
  );
}

function HasilLacak({ data }) {
  const idx = URUT[data.status] != null ? URUT[data.status] : 0;
  const balasan = (data.balasan || []).slice().reverse();

  return (
    <div className="pg-card">
      <div className="pg-lacak__head">
        <span className="pg-kode">{data.id}</span>
        <span className={`badge badge-status badge-status-${data.status.toLowerCase()}`}>{data.status}</span>
      </div>
      <h2 className="pg-lacak__judul">{data.judul}</h2>
      <p className="pg-lacak__meta">Kategori {data.kategori} · Dilaporkan {formatTanggal(data.waktuLapor)}</p>

      <ol className="pg-timeline">
        {TAHAP.map((label, i) => {
          const r = data.riwayat[i];
          const state = i < idx ? 'is-done' : i === idx ? 'is-active' : 'is-pending';
          return (
            <li key={label} className={`pg-timeline__item ${state}`}>
              <span className="pg-timeline__dot">{i <= idx ? '✓' : i + 1}</span>
              <div>
                <p className="pg-timeline__title">{label}</p>
                <p className="pg-timeline__meta">{r ? formatTanggalWaktu(r.tanggal) : 'Belum ada'}</p>
                {r && r.catatan && <p className="pg-timeline__note">{r.catatan}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      {balasan.length > 0 && (
        <div className="pg-balasan-wrap">
          <h3 className="pg-lacak__sub">Balasan &amp; hasil penanganan</h3>
          {balasan.map((b) => (
            <div key={b.id} className="pg-balasan">
              <div className="pg-balasan__head">
                <span className="pg-balasan__oleh">{b.oleh}</span>
                <span className="pg-balasan__waktu">{formatTanggalWaktu(b.tanggal)}</span>
              </div>
              {b.teks && <p className="pg-balasan__teks">{b.teks}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className={`pg-field ${error ? 'has-error' : ''}`}>
      <label className="pg-label">{label}</label>
      {children}
      {error && <p className="pg-error">{error}</p>}
    </div>
  );
}
