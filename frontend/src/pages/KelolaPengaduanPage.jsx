import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import {
  getUser, isAdmin, getPengaduan, updatePengaduan, tambahBalasan,
  STATUS_ADUAN, formatTanggal, formatTanggalWaktu
} from '../data/mock';
import {
  opsiFilterKategori, labelKategori, kunciKategori, dialihkanKeSatisView
} from '../data/reportCategories';
import { ambilLampiranLokal } from '../lib/lampiranLokal';
import {
  ambilDaftarLaporan, ambilUrlLampiran, balasLaporan, kelolaApiSiap, perbaruiLaporan
} from '../data/laporanApi';
import './KelolaPengaduanPage.css';

const STATUS_BADGE = { 'Baru': 'badge-status-baru', 'Diproses': 'badge-status-diproses', 'Selesai': 'badge-status-selesai' };
const OPSI_KATEGORI = opsiFilterKategori();

export default function KelolaPengaduanPage({ onNavigate }) {
  const user = getUser();
  const admin = isAdmin();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [cari, setCari] = useState('');
  const [terpilih, setTerpilih] = useState(null);
  const [daftar, setDaftar] = useState(() => getPengaduan());

  const muatServer = useCallback(() => {
    if (!kelolaApiSiap) return;
    ambilDaftarLaporan()
      .then((rows) => setDaftar(rows))
      .catch((err) => console.warn('Gagal memuat laporan admin:', err.message));
  }, []);

  useEffect(() => {
    if (admin) muatServer();
  }, [admin, muatServer]);

  const ringkas = daftar.reduce((hasil, p) => {
    hasil.total += 1;
    hasil[p.status] = (hasil[p.status] || 0) + 1;
    return hasil;
  }, { total: 0, Baru: 0, Diproses: 0, Selesai: 0 });

  const daftarTampil = daftar.filter((p) => {
    const q = cari.trim().toLowerCase();
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterKategori && kunciKategori(p.kategori) !== filterKategori) return false;
    if (q && !(
      p.judul.toLowerCase().includes(q)
      || p.id.toLowerCase().includes(q)
      || labelKategori(p.kategori).toLowerCase().includes(q)
    )) return false;
    return true;
  });

  const handleMenu = (key) => onNavigate && onNavigate(key);
  const segarkan = () => {
    setDaftar(getPengaduan());
    muatServer();
  };

  const detail = terpilih ? daftar.find((p) => p.id === terpilih) : null;

  if (!admin) {
    return (
      <div className="app-shell">
        <Sidebar active="pengaduan" onNavigate={handleMenu} user={user} />
        <div className="app-main">
          <Topbar user={user} onProfil={() => handleMenu('profil')} onNavigate={handleMenu} />
          <main className="app-content">
            <div className="pg-guard">
              <h2>Halaman ini untuk admin Zona Integritas</h2>
              <p>Manajemen laporan WBS hanya dapat diakses setelah login sebagai admin.</p>
              <button type="button" className="btn btn-primary" onClick={() => handleMenu('beranda')}>
                Kembali ke Beranda
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar active="pengaduan" onNavigate={handleMenu} user={user} />
      <div className="app-main">
        <Topbar user={user} onProfil={() => handleMenu('profil')} onNavigate={handleMenu} />
        <main className="app-content">
          <header className="pg-head">
            <div>
              <p className="label-eyebrow">Manajemen · Admin</p>
              <h1 className="pg-head__title">Whistleblowing System</h1>
              <p className="pg-head__sub">
                Kelola laporan dugaan pelanggaran integritas, perbarui status, dan balas pelapor.
              </p>
            </div>
          </header>

          <div className="kpo-kpi">
            <KpiCard label="Total Laporan" value={ringkas.total} active={!filterStatus} onClick={() => setFilterStatus('')} />
            <KpiCard label="Baru" value={ringkas.Baru} tone="baru" active={filterStatus === 'Baru'} onClick={() => setFilterStatus(filterStatus === 'Baru' ? '' : 'Baru')} />
            <KpiCard label="Diproses" value={ringkas.Diproses} tone="diproses" active={filterStatus === 'Diproses'} onClick={() => setFilterStatus(filterStatus === 'Diproses' ? '' : 'Diproses')} />
            <KpiCard label="Selesai" value={ringkas.Selesai} tone="selesai" active={filterStatus === 'Selesai'} onClick={() => setFilterStatus(filterStatus === 'Selesai' ? '' : 'Selesai')} />
          </div>

          <div className="kpo-toolbar">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter status">
              <option value="">Semua status</option>
              {STATUS_ADUAN.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)} aria-label="Filter kategori">
              <option value="">Semua kategori</option>
              {OPSI_KATEGORI.map((grup) => (
                <optgroup key={grup.label} label={grup.label}>
                  {grup.opsi.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </optgroup>
              ))}
            </select>
            <input
              type="search"
              placeholder="Cari judul, kode, atau kategori"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
            />
          </div>

          {daftarTampil.length === 0 ? (
            <div className="kpo-empty">Tidak ada laporan yang cocok dengan filter ini.</div>
          ) : (
            <div className="kpo-table-wrap">
              <table className="kpo-table">
                <thead>
                  <tr>
                    <th>Kode</th><th>Judul</th><th>Kategori</th><th>Status</th><th>PIC</th><th>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {daftarTampil.map((p) => (
                    <tr key={p.id} className={terpilih === p.id ? 'is-selected' : ''} onClick={() => setTerpilih(p.id)}>
                      <td className="kpo-id">{p.id}</td>
                      <td className="kpo-judul">{p.judul}</td>
                      <td>
                        <span className={`kpo-chip ${dialihkanKeSatisView(p.kategori) ? 'kpo-chip--alih' : ''}`}>
                          {labelKategori(p.kategori)}
                        </span>
                      </td>
                      <td><span className={`badge badge-status ${STATUS_BADGE[p.status]}`}>{p.status}</span></td>
                      <td className="kpo-muted">{p.pic || 'Belum ditugaskan'}</td>
                      <td className="kpo-muted">{formatTanggal(p.waktuLapor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {detail && (
        <DetailPanel
          data={detail}
          onClose={() => setTerpilih(null)}
          onSaved={() => { segarkan(); }}
          adminNama={user.nama}
        />
      )}
    </div>
  );
}

/* Lampiran bukti pelapor. File demo tersimpan di IndexedDB (lokal), jadi admin
   di browser yang sama bisa membuka/mengunduhnya. Lampiran server dibuka lewat
   signed URL berumur pendek dari metadata path di database. */
function LampiranBukti({ kode, lampiran }) {
  const adaLokal = Array.isArray(lampiran) && lampiran.some((l) => l && l.lokal);
  /* Simpan hasil per kode; nilai lama otomatis dianggap kosong saat kode berganti. */
  const [muatan, setMuatan] = useState({ kode: null, files: null, gagal: false });
  const [sibuk, setSibuk] = useState('');
  const [pesan, setPesan] = useState('');

  useEffect(() => {
    if (!adaLokal) return undefined;
    let aktif = true;
    ambilLampiranLokal(kode)
      .then((files) => { if (aktif) setMuatan({ kode, files, gagal: false }); })
      .catch(() => { if (aktif) setMuatan({ kode, files: null, gagal: true }); });
    return () => { aktif = false; };
  }, [kode, adaLokal]);

  if (!Array.isArray(lampiran) || !lampiran.length) return null;
  const berkas = muatan.kode === kode ? muatan.files : null;
  const gagal = muatan.kode === kode ? muatan.gagal : false;

  /* Lampiran demo tersimpan di IndexedDB; lampiran server hanya punya path dan
     dibuka lewat signed URL berumur pendek dari Edge Function. */
  const ambilUrl = async (l, file, unduh) => {
    if (file?.blob) {
      const url = URL.createObjectURL(file.blob);
      if (unduh) {
        const a = document.createElement('a');
        a.href = url;
        a.download = file.nama || 'lampiran';
        a.click();
      } else {
        window.open(url, '_blank', 'noopener');
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      return;
    }
    if (!l.path) return;
    setSibuk(l.path);
    setPesan('');
    try {
      const url = await ambilUrlLampiran(l.path);
      if (unduh) {
        const a = document.createElement('a');
        a.href = url;
        a.download = l.nama || 'lampiran';
        a.click();
      } else {
        window.open(url, '_blank', 'noopener');
      }
    } catch (err) {
      setPesan(err.message || 'Gagal membuka lampiran.');
    } finally {
      setSibuk('');
    }
  };

  return (
    <section className="kpo-sec">
      <p className="kpo-sec__head">Lampiran bukti ({lampiran.length})</p>
      {gagal && <p className="kpo-sec__text kpo-muted">Gagal membaca lampiran dari perangkat ini.</p>}
      {pesan && <p className="kpo-error">{pesan}</p>}
      <ul className="kpo-lampiran">
        {lampiran.map((l, i) => {
          const file = berkas?.find((f) => f.nama === l.nama) || null;
          const tersedia = !!file?.blob || !!l.path;
          const sedang = sibuk === l.path;
          return (
            <li key={l.path || `${l.nama}-${i}`} className="kpo-lampiran__item">
              <span className="kpo-lampiran__ikon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3v5h5" />
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
                </svg>
              </span>
              <span className="kpo-lampiran__info">
                <span className="kpo-lampiran__nama" title={l.nama}>{l.nama || 'Lampiran'}</span>
                <span className="kpo-lampiran__meta">
                  {jenisBerkas(l.nama)} · {formatUkuran(l.ukuran)}
                </span>
              </span>
              {tersedia && (
                <span className="kpo-lampiran__aksi">
                  <button
                    type="button"
                    className="kpo-lampiran__btn"
                    onClick={() => ambilUrl(l, file, false)}
                    disabled={sedang}
                  >
                    {sedang ? 'Membuka…' : 'Buka'}
                  </button>
                  <button
                    type="button"
                    className="kpo-lampiran__btn"
                    onClick={() => ambilUrl(l, file, true)}
                    disabled={sedang}
                  >
                    Unduh
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function formatUkuran(bytes) {
  if (!bytes) return '-';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function jenisBerkas(nama) {
  const ext = String(nama || '').split('.').pop().toUpperCase();
  return ext && ext.length <= 5 ? ext : 'Berkas';
}

function KpiCard({ label, value, tone = '', active, onClick }) {
  return (
    <button type="button" className={`kpo-kpi__card ${active ? 'is-active' : ''} ${tone ? 'kpo-kpi__card--' + tone : ''}`} onClick={onClick}>
      <span className="kpo-kpi__label">{label}</span>
      <span className="kpo-kpi__value">{value}</span>
    </button>
  );
}

function DetailPanel({ data, onClose, onSaved, adminNama }) {
  const [status, setStatus] = useState(data.status);
  const [pic, setPic] = useState(data.pic || '');
  const [catatanPublik, setCatatanPublik] = useState('');
  const [catatanInternal, setCatatanInternal] = useState('');
  const [balasanTeks, setBalasanTeks] = useState('');
  const [error, setError] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);

  const simpan = async () => {
    if (status !== 'Baru' && !pic.trim()) {
      setError('PIC wajib diisi jika status bukan Baru.');
      return;
    }
    setError('');
    setMenyimpan(true);
    try {
      const patch = {
        status,
        pic: pic.trim(),
        catatanPublik: catatanPublik.trim(),
        catatanInternalBaru: catatanInternal.trim() || null
      };
      if (kelolaApiSiap) {
        await perbaruiLaporan({
          jenis: data.jenis,
          kode: data.id,
          status: patch.status,
          pic: patch.pic,
          catatanPublik: patch.catatanPublik,
          catatanInternalBaru: patch.catatanInternalBaru
        });
      }
      updatePengaduan(data.id, patch);
      setCatatanPublik('');
      setCatatanInternal('');
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setMenyimpan(false);
    }
  };

  const kirimBalasan = async () => {
    if (!balasanTeks.trim()) return;
    setError('');
    setMenyimpan(true);
    try {
      if (kelolaApiSiap) {
        await balasLaporan({
          jenis: data.jenis,
          kode: data.id,
          teks: balasanTeks.trim(),
          oleh: adminNama
        });
      }
      tambahBalasan(data.id, balasanTeks, [], adminNama);
      setBalasanTeks('');
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal mengirim balasan.');
    } finally {
      setMenyimpan(false);
    }
  };

  const balasan = (data.balasan || []).slice().reverse();
  const dialihkan = dialihkanKeSatisView(data.kategori);

  return (
    <div className="kpo-overlay" onClick={onClose} role="presentation">
      <div className="kpo-detail" role="dialog" aria-modal="true" aria-label={`Detail ${data.id}`} onClick={(e) => e.stopPropagation()}>
        <div className="kpo-detail__head">
          <div>
            <div className="kpo-detail__chips">
              <span className="kpo-id">{data.id}</span>
              <span className={`kpo-chip ${dialihkan ? 'kpo-chip--alih' : ''}`}>{labelKategori(data.kategori)}</span>
              {data.anonim && <span className="kpo-chip kpo-chip--anon">Anonim</span>}
            </div>
            <h2 className="kpo-detail__title">{data.judul}</h2>
          </div>
          <button type="button" className="kpo-detail__close" onClick={onClose} aria-label="Tutup">×</button>
        </div>

        <div className="kpo-detail__body">
          <section className="kpo-sec">
            <p className="kpo-sec__head">Deskripsi laporan</p>
            <p className="kpo-sec__text">{data.deskripsi}</p>
          </section>

          <LampiranBukti kode={data.id} lampiran={data.lampiran} />

          <div className="kpo-detail__split">
            <section className="kpo-sec">
              <p className="kpo-sec__head">Identitas pelapor</p>
              {data.anonim ? (
                <p className="kpo-sec__text kpo-anon">Pelapor memilih anonim. Identitas tidak tersimpan.</p>
              ) : (
                <ul className="kpo-dl">
                  <li><span>Nama</span><span>{data.nama_pelapor}</span></li>
                  <li><span>Kontak</span><span>{data.kontak_pelapor}</span></li>
                  <li><span>Hubungan</span><span>{data.hubungan}</span></li>
                </ul>
              )}
            </section>
            <section className="kpo-sec">
              <p className="kpo-sec__head">Metadata</p>
              <ul className="kpo-dl">
                <li><span>Kategori</span><span>{labelKategori(data.kategori)}</span></li>
                <li><span>Lokasi</span><span>{data.lokasi || 'Tidak disebutkan'}</span></li>
                <li><span>Waktu lapor</span><span>{formatTanggalWaktu(data.waktuLapor)}</span></li>
                <li><span>PIC saat ini</span><span>{data.pic || 'Belum ditugaskan'}</span></li>
              </ul>
            </section>
          </div>

          <section className="kpo-sec">
            <p className="kpo-sec__head">Perbarui status</p>
            <div className="kpo-form-row">
              <label className="kpo-field">
                <span className="kpo-field__label">Status baru</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_ADUAN.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="kpo-field">
                <span className="kpo-field__label">PIC (wajib jika bukan Baru)</span>
                <input type="text" value={pic} onChange={(e) => setPic(e.target.value)} placeholder="Unit penanggung jawab" />
              </label>
            </div>
            {error && <p className="kpo-error">{error}</p>}
            <label className="kpo-field" style={{ marginTop: 12 }}>
              <span className="kpo-field__label">Catatan publik (tampil ke pelapor)</span>
              <textarea rows="2" value={catatanPublik} onChange={(e) => setCatatanPublik(e.target.value)} placeholder="Tampil di riwayat laporan" />
            </label>
            <label className="kpo-field" style={{ marginTop: 12 }}>
              <span className="kpo-field__label">Catatan internal (tidak tampil)</span>
              <textarea rows="2" value={catatanInternal} onChange={(e) => setCatatanInternal(e.target.value)} placeholder="Hanya admin" />
            </label>
            <div className="kpo-actions">
              <button type="button" className="btn btn-primary" onClick={simpan} disabled={menyimpan}>
                {menyimpan ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </section>

          <section className="kpo-sec">
            <p className="kpo-sec__head">Balasan untuk pelapor</p>
            {balasan.length === 0 && <p className="kpo-sec__text kpo-muted">Belum ada balasan.</p>}
            {balasan.map((b) => (
              <div key={b.id} className="kpo-balasan">
                <div className="kpo-balasan__head">
                  <span className="kpo-balasan__oleh">{b.oleh}</span>
                  <span className="kpo-muted">{formatTanggalWaktu(b.tanggal)}</span>
                </div>
                <p className="kpo-sec__text">{b.teks}</p>
              </div>
            ))}
            <label className="kpo-field" style={{ marginTop: 12 }}>
              <span className="kpo-field__label">Tulis balasan</span>
              <textarea rows="2" value={balasanTeks} onChange={(e) => setBalasanTeks(e.target.value)} placeholder="Penjelasan hasil penanganan" />
            </label>
            <div className="kpo-actions">
              <button type="button" className="btn btn-primary" onClick={kirimBalasan} disabled={menyimpan}>
                {menyimpan ? 'Mengirim...' : 'Kirim Balasan'}
              </button>
            </div>
          </section>

          <section className="kpo-sec kpo-sec--internal">
            <p className="kpo-sec__head">Catatan internal tersimpan</p>
            {(data.catatanInternal && data.catatanInternal.length > 0) ? (
              <ul className="kpo-dl">
                {data.catatanInternal.map((c, i) => (
                  <li key={i}><span>{formatTanggal(c.tanggal)}</span><span>{c.catatan}</span></li>
                ))}
              </ul>
            ) : <p className="kpo-sec__text kpo-muted">Belum ada catatan internal.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
