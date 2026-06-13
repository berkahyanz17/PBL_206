import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { apiFetch } from '../../utils/api';
import { useNotif } from '../../components/NotifPopup';

export default function AdminSettings() {
  const navigate = useNavigate();
  const [pwLama, setPwLama] = useState('');
  const [pwBaru, setPwBaru] = useState('');
  const [pwKonfirm, setPwKonfirm] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [editTg, setEditTg] = useState(false);
  const [notif, setNotif] = useState({ pasienBaru: true, appointment: true, chatDokter: false });
  const { bellButton, popup } = useNotif('notif-admin');

  useEffect(() => {
    async function load() {
      const res = await apiFetch('/notif-settings');
      if (res?.success) {
        setTelegramId(res.data.telegram_chat_id || '');
        setNotif({ pasienBaru: !!res.data.notif_pasien_baru, appointment: !!res.data.notif_appointment, chatDokter: !!res.data.notif_chat_dokter });
      }
    }
    load();
  }, []);

  async function simpanPassword() {
    if (!pwLama) return alert('Masukkan password lama.');
    if (pwBaru.length < 8) return alert('Password baru minimal 8 karakter.');
    if (pwBaru !== pwKonfirm) return alert('Konfirmasi password tidak cocok.');
    const res = await apiFetch('/admin/password', { method: 'PATCH', body: JSON.stringify({ pwLama, pwBaru }) });
    if (res?.success) { alert('✅ Password berhasil diubah!'); setPwLama(''); setPwBaru(''); setPwKonfirm(''); }
    else alert(res?.message || 'Gagal mengubah password.');
  }

  function logout() { sessionStorage.clear(); navigate('/admin/login'); }

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--navy)' }}>
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
              <button onClick={simpanPassword} style={{ marginTop: 16, padding: '10px 22px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                💾 Simpan Perubahan
              </button>
            </div>
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 16 }}>🔔 Notifikasi Telegram</div>
              <div style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Telegram Chat ID</label>
                  {editTg
                    ? <input value={telegramId} onChange={e => setTelegramId(e.target.value)} placeholder="Contoh: 123456789"
                        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', background: '#F9FAFB', outline: 'none' }} />
                    : <div style={{ fontSize: 14, color: telegramId ? '#111827' : '#9CA3AF', padding: '10px 0' }}>{telegramId || 'Belum diset'}</div>
                  }
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Kirim /start ke bot lalu cek ID kamu di @userinfobot</div>
                </div>
                {editTg
                  ? <button onClick={async () => { await apiFetch('/notif-settings', { method: 'PATCH', body: JSON.stringify({ telegram_chat_id: telegramId }) }); setEditTg(false); }}
                      style={{ padding: '8px 16px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 }}>
                      Simpan
                    </button>
                  : <button onClick={() => setEditTg(true)}
                      style={{ padding: '8px 16px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 }}>
                      ✏️ Edit
                    </button>
                }
              </div>
              {[
                ['pasienBaru', 'Ada Pasien Baru Mendaftar', 'Notif saat ada pasien baru registrasi ke sistem'],
                ['appointment', 'Appointment Masuk', 'Notif saat pasien membuat booking baru'],
                ['chatDokter', 'Pesan Chat dari Dokter', 'Notif saat dokter mengirim pesan'],
              ].map(([key, label, sub]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #F9FAFB', cursor: 'pointer' }}>
                  <input type="checkbox" checked={notif[key]} onChange={e => setNotif(p => ({ ...p, [key]: e.target.checked }))}
                    style={{ width: 16, height: 16, marginTop: 2, accentColor: 'var(--navy)', cursor: 'pointer', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 24, marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 12 }}>⚙️ Pengaturan Klinik & Mamoru</div>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
                Atur informasi klinik, kontak, dan konteks yang dibaca Mamoru saat menjawab pasien.
              </p>
              <button
                onClick={() => navigate('/admin/klinik-settings')}
                style={{ padding: '10px 22px', background: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #bfdbfe', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ⚙️ Buka Pengaturan Klinik →
              </button>
            </div>
          </div>
        </div>
      </div>
      {popup}
    </div>
  );
}
