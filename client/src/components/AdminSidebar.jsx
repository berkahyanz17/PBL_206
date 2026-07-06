import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const navItems = [
  { icon: '🖥️', label: 'Dashboard', path: '/admin/dashboard' },
  { icon: '📅', label: 'Appointments', path: '/admin/appointments' },
  { icon: '🩺', label: 'Daftar Dokter', path: '/admin/dokter' },
  { icon: '👥', label: 'Data Pasien', path: '/admin/pasien' },
  { icon: '💬', label: 'Chat Dokter', path: '/admin/chat' },
  { icon: '🎧', label: 'Chat CS Pasien', path: '/admin/chat-cs' },
  { icon: '⚙️', label: 'Pengaturan', path: '/admin/settings' },
];
export default function AdminSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

    // Tutup sidebar kalau layar diperbesar ke desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth > 768) setOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Tutup sidebar saat navigasi
  function goTo(path) { navigate(path); setOpen(false); }
  
  return (
    <>
      {/* Tombol hamburger (muncul di HP) */}
      <button className="sidebar-toggle" onClick={() => setOpen(o => !o)}>☰</button>

      {/* Backdrop gelap saat sidebar terbuka */}
      <div className={`sidebar-backdrop${open ? ' open' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar${open ? ' open' : ''}`} style={{ background: 'var(--navy)' }}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon" style={{ background: 'var(--navy-light)' }}>🛡️</div>
          <span>Admin Panel</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <div key={item.path} className={`nav-item${pathname === item.path ? ' active' : ''}`} onClick={() => goTo(item.path)}>
              <span className="nav-icon">{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
