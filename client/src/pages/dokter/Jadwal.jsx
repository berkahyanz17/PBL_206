import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DokterSidebar from '../../components/DokterSidebar';

const initJadwal = [
  { id: 1, jam: '09:00', status: 'selesai', nama: 'Budi', keluhan: 'Sakit kepala' },
  { id: 2, jam: '10:00', status: 'berjalan', nama: 'Wulan', keluhan: 'Check up rutin' },
  { id: 3, jam: '11:00', status: 'menunggu', nama: 'Rina', keluhan: 'Flu ringan' },
];

export default function DokterJadwal() {
  const navigate = useNavigate();
  const [hajiApproved, setHajiApproved] = useState(false);
  const [hajiTolak, setHajiTolak] = useState(false);
  const [jadwal, setJadwal] = useState(initJadwal);
  const [modal, setModal] = useState(null);
  const [diagnosa, setDiagnosa] = useState('');
  const [catatan, setCatatan] = useState('');
  const [resep, setResep] = useState('');

  function approveHaji() {
    setHajiApproved(true);
    setJadwal(prev => [...prev, { id: 4, jam: '12:00', status: 'menunggu', nama: 'Haji', keluhan: 'Demam 3 hari' }]);
  }
  function mulai(id) {
    setJadwal(prev => prev.map(j => j.id === id ? { ...j, status: 'berjalan' } : j));
  }
  function submit() {
    if (!diagnosa) { alert('Isi diagnosa dulu!'); return; }
    setModal(null); setDiagnosa(''); setCatatan(''); setResep('');
    alert('✅ Hasil konsultasi berhasil dikirim ke pasien!');
  }

  const statusColor = { selesai: '#22c55e', berjalan: '#3b82f6', menunggu: 'var(--gold)' };
  const statusLabel = { selesai: '● Selesai', berjalan: '● Berjalan', menunggu: '● Menunggu' };

  return (
    <div className="dashboard-layout">
      <DokterSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--green)' }}>
          <h1>Jadwal Hari Ini</h1>
          <div className="topbar-right">
            <button className="btn-notif">🔔</button>
            <button className="btn-logout" onClick={() => navigate('/dokter/login')}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          {!hajiApproved && !hajiTolak && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>📅 Appointment Terbaru <span className="badge-pill badge-yellow">Perlu Konfirmasi</span></div>
              <table><thead><tr><th>Pasien</th><th>Keluhan</th><th>Waktu</th><th>Aksi</th></tr></thead>
                <tbody><tr>
                  <td style={{ fontWeight: 600 }}>Haji</td>
                  <td>Demam 3 hari</td>
                  <td>30/5/2026 10.00</td>
                  <td>
                    <button className="btn-action btn-approve" onClick={approveHaji}>Approve</button>
                    <button className="btn-action btn-tolak" onClick={() => { if (window.confirm('Tolak appointment Haji?')) setHajiTolak(true); }}>Tolak</button>
                  </td>
                </tr></tbody>
              </table>
            </div>
          )}
          {jadwal.map(j => (
            <div key={j.id} style={{ background: 'white', borderRadius: 12, padding: '18px 22px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 80, flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{j.jam}</div>
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2, color: statusColor[j.status] }}>{statusLabel[j.status]}</div>
              </div>
              <div style={{ width: 3, height: 50, background: 'var(--border)', borderRadius: 4, flexShrink: 0 }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{j.nama}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Keluhan: {j.keluhan}</div>
              </div>
              {j.status === 'menunggu' && <button onClick={() => mulai(j.id)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: '#F3F4F6', color: '#374151' }}>Mulai</button>}
              {j.status !== 'menunggu' && <button onClick={() => setModal(j)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: '#D1FAE5', color: '#065F46' }}>Selesai</button>}
            </div>
          ))}
        </div>
      </div>
      {modal && (
        <div className="modal-overlay open" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Input Hasil Konsultasi</div>
            <div style={{ background: '#D1FAE5', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 20 }}>👤 {modal.nama} - {modal.jam}</div>
            <div className="form-group"><label>Diagnosa</label><textarea placeholder="Ketik disini" value={diagnosa} onChange={e => setDiagnosa(e.target.value)} /></div>
            <div className="form-group"><label>Catatan Dokter</label><textarea placeholder="Ketik disini" value={catatan} onChange={e => setCatatan(e.target.value)} /></div>
            <div className="form-group"><label>Resep Obat</label><textarea placeholder="Ketik disini" value={resep} onChange={e => setResep(e.target.value)} /></div>
            <div className="modal-footer">
              <button className="btn-batal" onClick={() => setModal(null)}>Batal</button>
              <button onClick={submit} style={{ flex: 2, padding: 12, background: 'var(--green-dark)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Kirim ke Pasien</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
