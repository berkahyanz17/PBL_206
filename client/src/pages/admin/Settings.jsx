import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { apiFetch } from '../../utils/api';
import { useNotif } from '../../components/NotifPopup';

const KLINIK_FIELDS = [
  // [key, label, placeholder, textarea?]
  ['klinik_nama',          'Nama Klinik',              'HealthSync Clinic',                            false],
  ['klinik_alamat',        'Alamat',                   'Jl. Sehat No. 1, Kota Sehat',                  true ],
  ['klinik_jam_buka',      'Jam Operasional',          'Senin–Jumat 08.00–17.00, Sabtu 08.00–13.00',   false],
  ['klinik_telepon',       'Nomor Telepon',            '(021) 1234-5678',                              false],
  ['klinik_email',         'Email Klinik',             'info@healthsync.id',                           false],
  ['klinik_whatsapp',      'WhatsApp',                 '08xx-xxxx-xxxx',                               false],
  ['mamoru_greeting',      'Sapaan Mamoru',            'Halo! Saya Mamoru...',                         true ],
  ['mamoru_darurat_msg',   'Pesan Darurat Mamoru',     'Untuk kondisi darurat, segera...',             true ],
  ['mamoru_context_extra', 'Konteks Tambahan Mamoru',  'Info tambahan: promo, dokter cuti, dll.',      true ],
];

export default function AdminSettings() {
  const navigate = useNavigate();

  // Password
  const [pwLama,    setPwLama]    = useState('');
  const [pwBaru,    setPwBaru]    = useState('');
  const [pwKonfirm, setPwKonfirm] = useState('');

  // Telegram & notif
  const [telegramId, setTelegramId] = useState('');
  const [editTg,     setEditTg]     = useState(false);
  const [notif,      setNotif]      = useState({ pasienBaru: true, appointment: true, chatDokter: false });

  // Klinik settings
  const [klinik,       setKlinik]       = useState({});
  const [savingKlinik, setSavingKlinik] = useState(false);
  const [savedKlinik,  setSavedKlinik]  = useState(false);

  const { bellButton, popup } = useNotif('notif-admin');

  useEffect(() => {
    async function load() {
      // Load notif settings
      const res = await apiFetch('/notif-settings');
      if (res?.success) {
        setTelegramId(res.data.telegram_chat_id || '');
        setNotif({
          pasienBaru: !!res.data.notif_pasien_baru,
          appointment: !!res.data.notif_appointment,
          chatDokter: !!res.data.notif_chat_dokter,
        });
      }
      // Load klinik settings
      const res2 = await apiFetch('/klinik-settings');
      if (res2?.success) setKlinik(res2.data || {});
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

  async function simpanKlinik() {
    setSavingKlinik(true); setSavedKlinik(false);
    const res = await apiFetch('/klinik-settings', { method: 'PATCH', body: JSON.stringify(klinik) });
    setSavingKlinik(false);
    if (res?.success) { setSavedKlinik(true); setTimeout(() => setSavedKlinik(false), 3000); }
    else alert(res?.message || 'Gagal menyimpan pengaturan klinik.');
  }

  async function simpanNotif(overrideTg, overrideNotif) {
    const tg = overrideTg !== undefined ? overrideTg : telegramId;
    const n  = overrideNotif !== undefined ? overrideNotif : notif;
    await apiFetch('/notif-settings', {
      method: 'PATCH',
      body: JSON.stringify({
        telegram_chat_id:  tg,
        notif_pasien_baru: n.pasienBaru  ? 1 : 0,
        notif_appointment: n.appointment ? 1 : 0,
        notif_chat_dokter: n.chatDokter  ? 1 : 0,
      }),
    });
  }

  async function logout() { const rt = localStorage.getItem('refreshToken'); if (rt) { await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) }); } sessionStorage.clear(); localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); navigate('/admin/login'); }

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid #E5E7EB', borderRadius: 9,
    fontSize: 14, fontFamily: 'inherit',
    background: '#F9FAFB', outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle = {
    display: 'block', fontSize: 13,
    fontWeight: 600, color: '#374151', marginBottom: 5,
  };
  const sectionTitleStyle = {
    fontSize: 11, fontWeight: 800,
    textTransform: 'uppercase', letterSpacing: '0.08em',
    color: '#9CA3AF', marginBottom: 16,
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--navy)' }}>
          <h1>Pengaturan</h1>
          <div className="topbar-right">
            {bellButton}
            <button className="btn-logout" onClick={logout}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div className="card" style={{ maxWidth: 600 }}>

            {/* ── Ganti Password ── */}
            <div style={{ marginBottom: 28 }}>
              <div style={sectionTitleStyle}>🔑 Ganti Password</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Password Lama',              pwLama,    setPwLama   ],
                  ['Password Baru',              pwBaru,    setPwBaru   ],
                  ['Konfirmasi Password Baru',   pwKonfirm, setPwKonfirm],
                ].map(([label, val, set]) => (
                  <div key={label}>
                    <label style={labelStyle}>{label}</label>
                    <input type="password" value={val} onChange={e => set(e.target.value)}
                      placeholder={label} style={inputStyle} />
                  </div>
                ))}
              </div>
              <button onClick={simpanPassword}
                style={{ marginTop: 16, padding: '10px 22px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                💾 Simpan Password
              </button>
            </div>

            {/* ── Notifikasi Telegram ── */}
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 24, marginBottom: 28 }}>
              <div style={sectionTitleStyle}>🔔 Notifikasi Telegram</div>
              <div style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Telegram Chat ID</label>
                  {editTg
                    ? <input value={telegramId} onChange={e => setTelegramId(e.target.value)}
                        placeholder="Contoh: 123456789" style={inputStyle} />
                    : <div style={{ fontSize: 14, color: telegramId ? '#111827' : '#9CA3AF', padding: '10px 0' }}>
                        {telegramId || 'Belum diset'}
                      </div>
                  }
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                    Kirim /start ke bot lalu cek ID kamu di @userinfobot
                  </div>
                </div>
                {editTg
                  ? <button onClick={async () => {
                      await simpanNotif(telegramId, notif);
                      setEditTg(false);
                      alert('✅ Telegram ID tersimpan!');
                    }}
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
                ['pasienBaru', 'Ada Pasien Baru Mendaftar',  'Notif saat ada pasien baru registrasi ke sistem'],
                ['appointment','Appointment Masuk',           'Notif saat pasien membuat booking baru'],
                ['chatDokter', 'Pesan Chat dari Dokter',      'Notif saat dokter mengirim pesan'],
              ].map(([key, label, sub]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #F9FAFB', cursor: 'pointer' }}>
                  <input type="checkbox" checked={notif[key]}
                    onChange={e => {
                      const updated = { ...notif, [key]: e.target.checked };
                      setNotif(updated);
                      simpanNotif(telegramId, updated);
                    }}
                    style={{ width: 16, height: 16, marginTop: 2, accentColor: 'var(--navy)', cursor: 'pointer', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* ── Pengaturan Klinik & Mamoru ── */}
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 24 }}>
              <div style={sectionTitleStyle}>⚙️ Pengaturan Klinik & Mamoru</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16, lineHeight: 1.6 }}>
                Data ini otomatis dibaca Mamoru saat menjawab pasien. Daftar dokter aktif sudah otomatis dari database.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {KLINIK_FIELDS.map(([key, label, placeholder, isTextarea]) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    {isTextarea
                      ? <textarea rows={3} placeholder={placeholder}
                          value={klinik[key] || ''}
                          onChange={e => setKlinik(k => ({ ...k, [key]: e.target.value }))}
                          style={{ ...inputStyle, resize: 'vertical' }} />
                      : <input type="text" placeholder={placeholder}
                          value={klinik[key] || ''}
                          onChange={e => setKlinik(k => ({ ...k, [key]: e.target.value }))}
                          style={inputStyle} />
                    }
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
                <button onClick={simpanKlinik} disabled={savingKlinik}
                  style={{ padding: '10px 22px', background: savingKlinik ? '#93c5fd' : 'var(--navy)', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: savingKlinik ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {savingKlinik ? '💾 Menyimpan...' : '💾 Simpan Pengaturan Klinik'}
                </button>
                {savedKlinik && <span style={{ color: '#16a34a', fontSize: 13, fontWeight: 600 }}>✅ Tersimpan!</span>}
              </div>
            </div>

          </div>
        </div>
      </div>
      {popup}
    </div>
  );
}
