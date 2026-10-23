import './StatistikPanel.css';
import RecommendationList from '../instrumen/RecommendationList';
import { formatAngka, getStatistikInstrumen, getRekomendasi, SURVEI_INFO } from '../../data/mock';

export default function StatistikPanel({ selectedKey, dataset, onOpenDetail }) {
  if (!selectedKey) {
    return (
      <div className="spanel spanel--empty">
        <p>Pilih satu instrumen pada grafik di sebelah kiri untuk melihat ringkasan statistik dan rekomendasi.</p>
      </div>
    );
  }

  const info = SURVEI_INFO.find((s) => s.key === selectedKey);
  const st = getStatistikInstrumen(selectedKey, dataset);

  if (!st) {
    return (
      <div className="spanel spanel--empty">
        <p>Belum ada data untuk instrumen ini.</p>
      </div>
    );
  }

  const rekomendasi = getRekomendasi(selectedKey, dataset);
  const tampilKelompok = st.responden.dosen >= 5 && st.responden.tendik >= 5;

  return (
    <div className="spanel">
      <div className="spanel__head">
        <div>
          <p className="spanel__eyebrow">Instrumen Terpilih</p>
          <h3 className="spanel__title">{info?.namaPanjang || selectedKey}</h3>
        </div>
        <div className="spanel__head-right">
          <button type="button" className="spanel__full-link" onClick={() => onOpenDetail && onOpenDetail(selectedKey)}>
            Lihat Dashboard Lengkap
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </button>
          <span className={`spanel__badge ${st.sumber === 'riil' ? 'spanel__badge--riil' : ''}`}>
            {st.sumber === 'riil' ? 'Data riil' : 'Data simulasi'}
          </span>
        </div>
      </div>

      <div className="spanel__grid">
        <Stat label="Responden (n)" value={st.jumlahResponden.toLocaleString('id-ID')} />
        <Stat label="Rata-rata skor" value={formatAngka(st.skor) + '%'} />
        <Stat label="Median skor" value={formatAngka(st.median) + '%'} />
        <Stat label="Simpangan baku" value={formatAngka(st.simpanganBaku, 2)} />
        <Stat label="Setuju + Sangat Setuju" value={formatAngka(st.persenSetuju) + '%'} />
        <Stat label="Cronbach's alpha" value={formatAngka(st.alpha, 2)} />
        <Stat label="Jawaban seragam" value={formatAngka(st.persenSeragam) + '%'} />
        {tampilKelompok && (
          <Stat
            label="Dosen / Tendik"
            value={`${st.responden.dosen} / ${st.responden.tendik}`}
          />
        )}
      </div>

      <div className="spanel__divider" />

      <div className="spanel__rek">
        <p className="spanel__eyebrow" style={{ marginBottom: 10 }}>Rekomendasi Otomatis</p>
        <RecommendationList items={rekomendasi} max={4} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="spanel__stat">
      <span className="spanel__stat-value">{value}</span>
      <span className="spanel__stat-label">{label}</span>
    </div>
  );
}
