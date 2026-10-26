import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import SatisViewLink from '../components/laporan/SatisViewLink';
import {
  getUser, isAdmin, getPengaduan, updatePengaduan, tambahBalasan,
  getRingkasanPengaduan, STATUS_ADUAN, formatTanggal, formatTanggalWaktu
} from '../data/mock';
import {
  opsiFilterKategori, labelKategori, kunciKategori, dialihkanKeSatisView
} from '../data/reportCategories';
import './KelolaPengaduanPage.css';

const STATUS_BADGE = { 'Baru': 'badge-status-baru', 'Diproses': 'badge-status-diproses', 'Selesai': 'badge-status-selesai' };
const OPSI_KATEGORI = opsiFilterKategori();

export default function KelolaPengaduanPage({ onNavigate }) {
  const user = getUser();
  const admin = isAdmin();
  const [, setRefresh] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [cari, setCari] = useState('');
  const [terpilih, setTerpilih] = useState(null);

  const ringkas = getRingkasanPengaduan();

  const daftar = getPengaduan().filter((p) => {
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
  const segarkan = () => setRefresh((n) => n + 1);

  const detail = terpilih ? getPengaduan().find((p) => p.id === terpilih) : null;

  if (!admin) {
    return (
      <div className="app-shell">
        <Sidebar active="pengaduan" onNavigate={handleMenu} user={user} />
        <div className="app-main">
          <Topbar user={user} notifCount={0} onProfil={() => handleMenu('profil')} />
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
        <Topbar user={user} notifCount={ringkas.Baru} onProfil={() => handleMenu('profil')} />
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

          {daftar.length === 0 ? (
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
                  {daftar.map((p) => (
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

  const simpan = () => {
    if (status !== 'Baru' && !pic.trim()) {
      setError('PIC wajib diisi jika status bukan Baru.');
      return;
    }
    setError('');
    updatePengaduan(data.id, { status, pic: pic.trim(), catatanPublik: catatanPublik.trim(), catatanInternalBaru: catatanInternal.trim() || null });
    setCatatanPublik('');
    setCatatanInternal('');
    onSaved();
    onClose();
  };

  const kirimBalasan = () => {
    if (!balasanTeks.trim()) return;
    tambahBalasan(data.id, balasanTeks, [], adminNama);
    setBalasanTeks('');
    onSaved();
    onClose();
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

          {dialihkan && (
            <div className="kpo-info">
              Kategori laporan ini termasuk keluhan layanan atau fasilitas yang kini dialihkan ke{' '}
              <SatisViewLink />. Laporan tetap tersimpan dan bisa ditindaklanjuti di sini.
            </div>
          )}

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
              <button type="button" className="btn btn-primary" onClick={simpan}>Simpan Perubahan</button>
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
              <button type="button" className="btn btn-primary" onClick={kirimBalasan}>Kirim Balasan</button>
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
