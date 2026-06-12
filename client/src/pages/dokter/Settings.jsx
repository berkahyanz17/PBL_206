import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DokterSidebar from '../../components/DokterSidebar';
import { apiFetch } from '../../utils/api';
import { useNotif } from '../../components/NotifPopup';

export default function DokterSettings() {
  const navigate = useNavigate();
  const [pwLama, setPwLama] = useState('');
  const [pwBaru, setPwBaru] = useState('');
  const [pwKonfirm, setPwKonfirm] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [editTg, setEditTg] = useState(false);
  const [notif, setNotif] = useState({ chatAdmin: true, appointment: true });
  const { bellButton, popup } = useNotif('notif-dokter');

  useEffect(() => {
    async function load() {
      const res = await apiFetch('/notif-settings');
      if (res?.success) {
        setTelegramId(res.data.telegram_chat_id || '');
        setNotif({ chatAdmin: !!res.data.notif_chat_admin, appointment: !!res.data.notif_appointment });
      }
    }
    load();
  }, []);

  async function simpanPassword() {
    if (!pwLama) return alert('Masukkan password lama.');
    if (pwBaru.length < 8) return alert('Password baru minimal 8 karakter.');
    if (pwBaru !== pwKonfirm) return alert('Konfirmasi password tidak cocok.');
    const res = await apiFetch('/dokter/password', { method: 'PATCH', body: JSON.stringify({ pwLama, pwBaru }) });
    if (res?.success) { alert('✅ Password berhasil diubah!'); setPwLama(''); setPwBaru(''); setPwKonfirm(''); }
    else alert(res?.message || 'Gagal mengubah password.');
  }

  async function simpanNotif() {
    const res = await apiFetch('/notif-settings', {
      method: 'PATCH',
      body: JSON.stringify({ telegram_chat_id: telegramId, notif_chat_admin: notif.chatAdmin, notif_appointment: notif.appointment })
    });
    if (res?.success) alert('✅ Pengaturan notifikasi disimpan!');
    else alert('Gagal menyimpan.');
  }

  function logout() { sessionStorage.clear(); navigate('/dokter/login'); }

  return (
    <div className="dashboard-layout">
      <DokterSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--green)' }}>
          <h1>Pengaturan</h1>
          <div className="topbar-right">
            {bellButton}<button className="btn-logout" onClick={logout}>🚪 Logout</button>
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
              <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Telegram Chat ID</label>
                {editTg
                  ? <input value={telegramId} onChange={e => setTelegramId(e.target.value)} placeholder="Contoh: 123456789"
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', background: '#F9FAFB', outline: 'none' }} />
                  : <div style={{ fontSize: 14, color: telegramId ? '#111827' : '#9CA3AF', padding: '10px 0' }}>{telegramId || 'Belum diset'}</div>
                }
              </div>
              {editTg
                ? <button onClick={async () => { await apiFetch('/notif-settings', { method: 'PATCH', body: JSON.stringify({ telegram_chat_id: telegramId }) }); setEditTg(false); }}
                    style={{ padding: '8px 16px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 20 }}>
                    Simpan
                  </button>
                : <button onClick={() => setEditTg(true)}
                    style={{ padding: '8px 16px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 20 }}>
                    ✏️ Edit
                  </button>
              }
            </div>
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
              <button onClick={simpanNotif} style={{ marginTop: 16, padding: '10px 22px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                💾 Simpan Pengaturan Notifikasi
              </button>
            </div>
          </div>
        </div>
      </div>
      {popup}
    </div>
  );
}
