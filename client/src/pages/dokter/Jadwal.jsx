import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DokterSidebar from '../../components/DokterSidebar';
import { apiFetch } from '../../utils/api';

export default function DokterJadwal() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [modal, setModal] = useState(null);
  const [diagnosa, setDiagnosa] = useState('');
  const [catatan, setCatatan] = useState('');
  const [resep, setResep] = useState('');
  const user = JSON.parse(sessionStorage.getItem('dokterUser') || '{}');

  useEffect(() => { loadAppts(); }, []);

  async function loadAppts() {
    const res = await apiFetch(`/appointments/dokter/${user.id}`);
    if (res?.success) setAppointments(res.data);
  }

  async function updateStatus(id, status) {
    await apiFetch(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    loadAppts();
  }

  async function submitRekam() {
    if (!diagnosa) { alert('Isi diagnosa dulu!'); return; }
    await apiFetch('/rekam-medis', {
      method: 'POST',
      body: JSON.stringify({ appointment_id: modal.id, diagnosa, resep, catatan })
    });
    setModal(null); setDiagnosa(''); setCatatan(''); setResep('');
    alert('✅ Hasil konsultasi berhasil disimpan!');
    loadAppts();
  }

  function logout() { sessionStorage.clear(); navigate('/dokter/login'); }

  const statusColor = { selesai: '#22c55e', dikonfirmasi: '#3b82f6', menunggu: 'var(--gold)', ditolak: '#ef4444' };
  const statusLabel = { selesai: '● Selesai', dikonfirmasi: '● Berjalan', menunggu: '● Menunggu', ditolak: '● Ditolak' };

  const pending = appointments.filter(a => a.status === 'menunggu');
  const aktif = appointments.filter(a => a.status === 'dikonfirmasi' || a.status === 'selesai');

  return (
    <div className="dashboard-layout">
      <DokterSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--green)' }}>
          <h1>Jadwal Hari Ini</h1>
          <div className="topbar-right">
            <button className="btn-notif">🔔</button>
            <button className="btn-logout" onClick={logout}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          {pending.length > 0 && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>📅 Perlu Konfirmasi <span className="badge-pill badge-yellow">{pending.length}</span></div>
              <table>
                <thead><tr><th>Pasien</th><th>Keluhan</th><th>Tgl & Jam</th><th>Aksi</th></tr></thead>
                <tbody>
                  {pending.map(a => (
                    <tr key={a.id}>
                      <td>{new Date(a.tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · {a.jam?.slice(0, 5)}</td>
                      <td>{a.keluhan}</td>
                      <td>{a.tgl} · {a.jam}</td>
                      <td>
                        <button className="btn-action btn-approve" onClick={() => updateStatus(a.id, 'dikonfirmasi')}>Approve</button>
                        <button className="btn-action btn-tolak" onClick={() => { if (window.confirm('Tolak?')) updateStatus(a.id, 'ditolak'); }}>Tolak</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {aktif.length === 0 && pending.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Tidak ada jadwal hari ini.</div>
          )}
          {aktif.map(j => (
            <div key={j.id} style={{ background: 'white', borderRadius: 12, padding: '18px 22px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 110, flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{j.jam?.slice(0, 5)}</div>
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2, color: statusColor[j.status] }}>{statusLabel[j.status]}</div>
              </div>
              <div style={{ width: 3, height: 50, background: 'var(--border)', borderRadius: 4, flexShrink: 0 }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{j.pasien_nama}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Keluhan: {j.keluhan}</div>
              </div>
              {j.status === 'dikonfirmasi' && (
                <button onClick={() => setModal(j)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: '#D1FAE5', color: '#065F46' }}>Selesai</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay open" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Input Hasil Konsultasi</div>
            <div style={{ background: '#D1FAE5', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 20 }}>👤 {modal.pasien_nama} - {modal.jam}</div>
            <div className="form-group"><label>Diagnosa</label><textarea placeholder="Ketik diagnosa" value={diagnosa} onChange={e => setDiagnosa(e.target.value)} /></div>
            <div className="form-group"><label>Catatan Dokter</label><textarea placeholder="Catatan tambahan" value={catatan} onChange={e => setCatatan(e.target.value)} /></div>
            <div className="form-group"><label>Resep Obat</label><textarea placeholder="Resep obat" value={resep} onChange={e => setResep(e.target.value)} /></div>
            <div className="modal-footer">
              <button className="btn-batal" onClick={() => setModal(null)}>Batal</button>
              <button onClick={submitRekam} style={{ flex: 2, padding: 12, background: 'var(--green-dark)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Kirim ke Pasien</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
