import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
const navItems = [
  { icon: '🏠', label: 'Home', path: '/pasien/home' },
  { icon: '🔍', label: 'Cari Dokter', path: '/pasien/cari-dokter' },
  { icon: '📅', label: 'Riwayat Konsultasi', path: '/pasien/riwayat' },
  { icon: '🎧', label: 'Chat CS', path: '/pasien/chat-cs' },
  { icon: '👤', label: 'Profil Saya', path: '/pasien/profil' },
  { icon: '⚙️', label: 'Pengaturan', path: '/pasien/settings' },
];
export default function PasienSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
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
        style={{ background: '#0e7490' }}>☰</button>

      <div className={`sidebar-backdrop${open ? ' open' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar${open ? ' open' : ''}`} style={{ background: 'linear-gradient(180deg,#7dd3fc 0%,#38bdf8 100%)' }}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon" style={{ background: 'rgba(255,255,255,0.25)' }}>👤</div>
          <span style={{ color: '#1e3a5f' }}>Pasien Panel</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <div key={item.path} className={`nav-item${pathname === item.path ? ' active' : ''}`}
              onClick={() => goTo(item.path)}
              style={pathname !== item.path ? { color: '#1e3a5f' } : {}}>
              <span className="nav-icon">{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
