import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DokterSidebar from '../../components/DokterSidebar';
import { apiFetch } from '../../utils/api';

export default function DokterSettings() {
  const navigate = useNavigate();
  const [pwLama, setPwLama] = useState('');
  const [pwBaru, setPwBaru] = useState('');
  const [pwKonfirm, setPwKonfirm] = useState('');
  const [notif, setNotif] = useState({ chatAdmin: true, appointment: true });

  async function simpanPassword() {
    if (!pwLama) return alert('Masukkan password lama.');
    if (pwBaru.length < 8) return alert('Password baru minimal 8 karakter.');
    if (pwBaru !== pwKonfirm) return alert('Konfirmasi password tidak cocok.');
    const res = await apiFetch('/admin/password', {
      method: 'PATCH',
      body: JSON.stringify({ pwLama, pwBaru })
    });
    if (res?.success) { alert('✅ Password berhasil diubah!'); setPwLama(''); setPwBaru(''); setPwKonfirm(''); }
    else alert(res?.message || 'Gagal mengubah password.');
  }

  function logout() { sessionStorage.clear(); navigate('/dokter/login'); }

  return (
    <div className="dashboard-layout">
      <DokterSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--green)' }}>
          <h1>Pengaturan</h1>
          <div className="topbar-right">
            <button className="btn-notif">🔔</button>
            <button className="btn-logout" onClick={logout}>🚪 Logout</button>
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
              <button onClick={simpanPassword} style={{ marginTop: 16, padding: '10px 22px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                💾 Simpan Perubahan
              </button>
            </div>
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 16 }}>🔔 Notifikasi Telegram</div>
              {[
                ['chatAdmin', 'Chat Baru dari Admin', 'Notif saat admin mengirim pesan'],
                ['appointment', 'Appointment Pasien Baru', 'Notif saat ada pasien booking ke kamu'],
              ].map(([key, label, sub]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #F9FAFB', cursor: 'pointer' }}>
                  <input type="checkbox" checked={notif[key]} onChange={e => setNotif(p => ({ ...p, [key]: e.target.checked }))}
                    style={{ width: 16, height: 16, marginTop: 2, accentColor: 'var(--green)', cursor: 'pointer', flexShrink: 0 }} />
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
    </div>
  );
}
