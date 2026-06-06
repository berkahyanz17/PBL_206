import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DokterSidebar from '../../components/DokterSidebar';

const riwayatData = [
  { nama: 'Budi', tgl: '30/5/2026', diagnosis: 'Check up Rutin', badge: 'green', catatan: 'Kondisi baik, tekanan darah normal', detail: { usia: '34 tahun', jk: 'Laki-laki', noRM: 'RM-2026-001', keluhan: 'Sakit kepala ringan', catatan: 'Kondisi baik, tekanan darah normal 120/80 mmHg.', resep: 'Vitamin C 500mg 1×1 (pagi)', tindak: 'Kontrol kembali 3 bulan lagi.' } },
  { nama: 'Haji', tgl: '28/5/2026', diagnosis: 'Demam', badge: 'yellow', catatan: 'Diberi obat parasetamol 3x1', detail: { usia: '52 tahun', jk: 'Laki-laki', noRM: 'RM-2026-002', keluhan: 'Demam tinggi selama 3 hari', catatan: 'Suhu tubuh 38.9°C saat pemeriksaan.', resep: 'Paracetamol 500mg 3×1', tindak: 'Kontrol kembali dalam 3 hari.' } },
  { nama: 'Wulan', tgl: '25/5/2026', diagnosis: 'Check up Rutin', badge: 'green', catatan: 'Semua hasil lab dalam batas normal', detail: { usia: '28 tahun', jk: 'Perempuan', noRM: 'RM-2026-003', keluhan: 'Check up rutin tahunan', catatan: 'Semua hasil lab normal.', resep: 'Tidak ada resep.', tindak: 'Check up berikutnya 1 tahun lagi.' } },
];

export default function DokterRiwayat() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const filtered = riwayatData.filter(r => r.nama.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="dashboard-layout">
      <DokterSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--green)' }}>
          <h1>Riwayat Konsultasi</h1>
          <div className="topbar-right"><button className="btn-notif">🔔</button><button className="btn-logout" onClick={() => navigate('/dokter/login')}>🚪 Logout</button></div>
        </div>
        <div className="content-area">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F9FAFB', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
            <span>🔍</span><input type="text" placeholder="Cari nama pasien..." style={{ flex: 1, border: 'none', background: 'none', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead><tr><th>Tanggal</th><th>Pasien</th><th>Diagnosis</th><th>Catatan</th><th>Aksi</th></tr></thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{r.tgl}</td>
                    <td style={{ fontWeight: 600 }}>{r.nama}</td>
                    <td><span className={`badge-pill badge-${r.badge}`} style={{ padding: '4px 12px' }}>{r.diagnosis}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.catatan}</td>
                    <td><button className="btn-action btn-detail" onClick={() => setDetail(r)}>Lihat Detail</button></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>😔 Tidak ada pasien dengan nama tersebut</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {detail && (
        <div className="modal-overlay open" onClick={() => setDetail(null)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 560, animation: 'slideUp 0.3s ease', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>Detail Riwayat Konsultasi</h3>
              <button onClick={() => setDetail(null)} style={{ background: '#F3F4F6', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: 'linear-gradient(135deg,var(--green-dark),var(--green))', borderRadius: 14, padding: '22px 24px', marginBottom: 20, color: 'white', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>{detail.nama.charAt(0)}</div>
              <div><div style={{ fontSize: 20, fontWeight: 800 }}>{detail.nama}</div><div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>📅 {detail.tgl}</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {[['No. Rekam Medis', detail.detail.noRM], ['Usia / Jenis Kelamin', detail.detail.usia + ' · ' + detail.detail.jk]].map(([label, val]) => (
                <div key={label} style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{val}</div>
                </div>
              ))}
              {[['Keluhan', detail.detail.keluhan], ['Diagnosis', detail.detail.catatan], ['Resep Obat', detail.detail.resep], ['Tindak Lanjut', detail.detail.tindak]].map(([label, val]) => (
                <div key={label} style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px 16px', gridColumn: '1/-1' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{val}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setDetail(null)} className="btn-batal" style={{ width: '100%' }}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
