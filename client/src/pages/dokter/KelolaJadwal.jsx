import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DokterSidebar from '../../components/DokterSidebar';

const hari = ['Senin','Selasa','Rabu','Kamis',"Jum'at",'Sabtu','Minggu'];

export default function DokterKelola() {
  const navigate = useNavigate();
  const [jadwal, setJadwal] = useState(hari.map(h => ({ hari: h, aktif: false, mulai: '08:00', selesai: '16:00' })));

  function toggle(i) { setJadwal(prev => prev.map((j, idx) => idx === i ? { ...j, aktif: !j.aktif } : j)); }
  function setTime(i, field, val) { setJadwal(prev => prev.map((j, idx) => idx === i ? { ...j, [field]: val } : j)); }

  return (
    <div className="dashboard-layout">
      <DokterSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--green)' }}>
          <h1>Kelola Jadwal</h1>
          <div className="topbar-right"><button className="btn-notif">🔔</button><button className="btn-logout" onClick={() => navigate('/dokter/login')}>🚪 Logout</button></div>
        </div>
        <div className="content-area">
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Kelola Jadwal Praktik</div>
            {jadwal.map((j, i) => (
              <div key={j.hari} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#F9FAFB', borderRadius: 10, padding: '14px 18px', marginBottom: 10 }}>
                <div style={{ width: 80, fontSize: 14, fontWeight: 600 }}>{j.hari}</div>
                <input type="checkbox" checked={j.aktif} onChange={() => toggle(i)} style={{ width: 18, height: 18, accentColor: 'var(--green)' }} />
                <input type="time" value={j.mulai} onChange={e => setTime(i, 'mulai', e.target.value)} disabled={!j.aktif}
                  style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: j.aktif ? 'white' : '#F3F4F6', opacity: j.aktif ? 1 : 0.5 }} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>s/d</span>
                <input type="time" value={j.selesai} onChange={e => setTime(i, 'selesai', e.target.value)} disabled={!j.aktif}
                  style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: j.aktif ? 'white' : '#F3F4F6', opacity: j.aktif ? 1 : 0.5 }} />
              </div>
            ))}
            <button onClick={() => alert('Jadwal berhasil disimpan!')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'var(--green-dark)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginTop: 8 }}>💾 Simpan Jadwal</button>
          </div>
        </div>
      </div>
    </div>
  );
}
