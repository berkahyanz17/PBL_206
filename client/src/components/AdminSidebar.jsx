import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { icon: '⊞', label: 'Dashboard', path: '/admin/dashboard' },
  { icon: '📅', label: 'Appointments', path: '/admin/appointments' },
  { icon: '🩺', label: 'Daftar Dokter', path: '/admin/dokter' },
  { icon: '👥', label: 'Data Pasien', path: '/admin/pasien' },
  { icon: '💬', label: 'Chat Dokter', path: '/admin/chat' },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <aside className="sidebar" style={{ background: 'var(--navy)' }}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" style={{ background: 'var(--navy-light)' }}>🛡️</div>
        <span>Admin Panel</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <div key={item.path} className={`nav-item${pathname === item.path ? ' active' : ''}`} onClick={() => navigate(item.path)}>
            <span className="nav-icon">{item.icon}</span> {item.label}
          </div>
        ))}
      </nav>
    </aside>
  );
}
