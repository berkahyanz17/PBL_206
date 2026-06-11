import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DokterSidebar from '../../components/DokterSidebar';

const NOTIF_DATA = [
  { id: 1, icon: '💬', iconClass: 'blue', title: 'Chat baru dari Admin', time: '10 menit lalu', unread: true },
  { id: 2, icon: '📅', iconClass: 'green', title: 'Pasien baru booking ke kamu', time: '1 jam lalu', unread: false },
];

export default function DokterSettings() {
  const navigate = useNavigate();
  const [pwLama, setPwLama] = useState('');
  const [pwBaru, setPwBaru] = useState('');
  const [pwKonfirm, setPwKonfirm] = useState('');
  const [notif, setNotif] = useState({ chatAdmin: true, appointment: true });
  const [showNotif, setShowNotif] = useState(false);
  const [notifList, setNotifList] = useState(NOTIF_DATA);
  const notifRef = useRef();

  useEffect(() => {
    function handleClick(e) { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unread = notifList.filter(n => n.unread).length;

  function simpanPassword() {
    if (!pwLama) return alert('Masukkan password lama.');
    if (pwBaru.length < 8) return alert('Password baru minimal 8 karakter.');
    if (pwBaru !== pwKonfirm) return alert('Konfirmasi password tidak cocok.');
    alert('✅ Password berhasil diubah!');
    setPwLama(''); setPwBaru(''); setPwKonfirm('');
  }

  function logout() { sessionStorage.clear(); navigate('/dokter/login'); }

  return (
    <div className="dashboard-layout">
      <DokterSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--green)' }}>
          <h1>Pengaturan</h1>
          <div className="topbar-right">
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button className="btn-notif" onClick={() => setShowNotif(v => !v)} style={{ position: 'relative' }}>
                🔔
                {unread > 0 && <span className="notif-badge">{unread}</span>}
              </button>
              {showNotif && (
                <div className="notif-popup open" style={{ position: 'absolute', top: 48, right: 0, left: 'auto' }}>
                  <div className="notif-popup-header">
                    <span className="notif-popup-title">🔔 Notifikasi</span>
                    <button className="notif-popup-close" onClick={() => setShowNotif(false)}>✕</button>
                  </div>
                  <div className="notif-list">
                    {notifList.length === 0 && <div className="notif-empty">Tidak ada notifikasi</div>}
                    {notifList.map(n => (
                      <div key={n.id} className={`notif-item${n.unread ? ' unread' : ''}`}
                        onClick={() => setNotifList(l => l.map(x => x.id === n.id ? { ...x, unread: false } : x))}>
                        <div className={`notif-icon ${n.iconClass}`}>{n.icon}</div>
                        <div>
                          <div className="notif-text">{n.title}</div>
                          <div className="notif-time">{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="btn-logout" onClick={logout}>🚪 Logout</button>
          </div>
        </div>

        <div className="content-area">
          <div className="settings-card">
            <div className="settings-block">
              <div className="settings-section-title">🔑 Ganti Password</div>
              <div className="settings-pw-grid">
                {[['Password Lama', pwLama, setPwLama, 'Masukkan password lama'],
                  ['Password Baru', pwBaru, setPwBaru, 'Min 8 karakter'],
                  ['Konfirmasi Password Baru', pwKonfirm, setPwKonfirm, 'Ulangi password baru']
                ].map(([label, val, set, ph]) => (
                  <div key={label} className="settings-field">
                    <label>{label}</label>
                    <input type="password" value={val} onChange={e => set(e.target.value)} placeholder={ph} />
                  </div>
                ))}
              </div>
              <button className="btn-settings-save" style={{ background: 'var(--green)' }} onClick={simpanPassword}>💾 Simpan Perubahan</button>
            </div>

            <div className="settings-block">
              <div className="settings-section-title">🔔 Notifikasi Telegram</div>
              {[
                ['chatAdmin', 'Chat Baru dari Admin', 'Notif Telegram saat admin mengirim pesan'],
                ['appointment', 'Appointment Pasien Baru', 'Notif Telegram saat ada pasien booking ke kamu'],
              ].map(([key, label, sub]) => (
                <label key={key} className="settings-row">
                  <input type="checkbox" className="settings-check" checked={notif[key]}
                    style={{ accentColor: 'var(--green)' }}
                    onChange={e => setNotif(p => ({ ...p, [key]: e.target.checked }))} />
                  <div className="settings-row-label">
                    <div className="settings-label">{label}</div>
                    <div className="settings-sub">{sub}</div>
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
