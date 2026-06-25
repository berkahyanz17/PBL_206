import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
const navItems = [
  { icon: '📅', label: 'Jadwal', path: '/dokter/jadwal' },
  { icon: '📋', label: 'Riwayat Konsultasi', path: '/dokter/riwayat' },
  { icon: '🩺', label: 'Rekam Medis', path: '/dokter/rekam-medis' },
  { icon: '🗓️', label: 'Kelola Jadwal', path: '/dokter/kelola-jadwal' },
  { icon: '💬', label: 'Chat', path: '/dokter/chat' },
  { icon: '👤', label: 'Profil', path: '/dokter/profil' },
  { icon: '⚙️', label: 'Pengaturan', path: '/dokter/settings' },
];
export default function DokterSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('dokterUser') || '{}');
   const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => { if (window.innerWidth > 768) setOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  function goTo(path) { navigate(path); setOpen(false); }
  return (
  <>
    <button className="sidebar-toggle" onClick={() => setOpen(o => !o)}
      style={{ background: 'var(--green)' }}>☰</button>

    <div className={`sidebar-backdrop${open ? ' open' : ''}`} onClick={() => setOpen(false)} />

    <aside className={`sidebar${open ? ' open' : ''}`} style={{ background: 'var(--green)' }}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>🩺</div>
        <div>
          <span style={{ fontSize: 13 }}>{user.nama || 'Dokter'}</span>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{user.spesialis || ''}</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <div key={item.path} className={`nav-item${location.pathname === item.path ? ' active' : ''}`}
            onClick={() => goTo(item.path)}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>
    </aside>
  </>
);
}
