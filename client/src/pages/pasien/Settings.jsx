import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PasienSidebar from '../../components/PasienSidebar';
import MamoruChat from './Mamoruchat';
import { apiFetch } from '../../utils/api';
import { useNotif, PASIEN_NOTIFS } from '../../components/NotifPopup';

export default function PasienSettings() {
  const navigate = useNavigate();
  const [pwLama, setPwLama] = useState('');
  const [pwBaru, setPwBaru] = useState('');
  const [pwKonfirm, setPwKonfirm] = useState('');
  const [notif, setNotif] = useState({ approveAppt: true, pengingat: true });
  const { bellButton, popup } = useNotif('notif-pasien', PASIEN_NOTIFS, { background: 'rgba(255,255,255,0.4)' });

  async function simpanPassword() {
    if (!pwLama) return alert('Masukkan password lama.');
    if (pwBaru.length < 8) return alert('Password baru minimal 8 karakter.');
    if (pwBaru !== pwKonfirm) return alert('Konfirmasi password tidak cocok.');
    const res = await apiFetch('/pasien/password', {
      method: 'PATCH',
      body: JSON.stringify({ pwLama, pwBaru })
    });
    if (res?.success) { alert('✅ Password berhasil diubah!'); setPwLama(''); setPwBaru(''); setPwKonfirm(''); }
    else alert(res?.message || 'Gagal mengubah password.');
  }
  
  function logout() { sessionStorage.clear(); navigate('/pasien/login'); }

  return (
    <div className="dashboard-layout">
      <PasienSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'linear-gradient(90deg,#7dd3fc,#38bdf8)' }}>
          <h1 style={{ color: '#1e3a5f' }}>Pengaturan</h1>
          <div className="topbar-right">
            {bellButton}
            <button className="btn-logout" style={{ background: 'rgba(255,255,255,0.4)', color: '#1e3a5f', borderColor: 'rgba(255,255,255,0.5)' }} onClick={logout}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div className="card" style={{ maxWidth: 600 }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 16 }}>🔑 Ganti Password</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[['Password Lama', pwLama, setPwLama], ['Password Baru', pwBaru, setPwBaru], ['Konfirmasi Password Baru', pwKonfirm, setPwKonfirm]].map(([label, val, set]) => (
                  <div key={label}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
                    <input type="password" value={val} onChange={e => set(e.target.value)} placeholder={label}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', background: '#F9FAFB', outline: 'none' }} />
                  </div>
                ))}
              </div>
              <button onClick={simpanPassword} style={{ marginTop: 16, padding: '10px 22px', background: 'var(--sky)', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                💾 Simpan Perubahan
              </button>
            </div>
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 16 }}>🔔 Notifikasi Telegram</div>
              {[
                ['approveAppt', 'Appointment Disetujui Dokter', 'Notif saat dokter approve booking kamu'],
                ['pengingat', 'Pengingat Jadwal', 'Notif H-1 sebelum jadwal konsultasi'],
              ].map(([key, label, sub]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #F9FAFB', cursor: 'pointer' }}>
                  <input type="checkbox" checked={notif[key]} onChange={e => setNotif(p => ({ ...p, [key]: e.target.checked }))}
                    style={{ width: 16, height: 16, marginTop: 2, accentColor: 'var(--sky)', cursor: 'pointer', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      <MamoruChat />
      {popup}
    </div>
  );
}
