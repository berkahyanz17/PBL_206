import { useNavigate } from 'react-router-dom';

export default function Index() {
  const navigate = useNavigate();
  return (
    <div>
      <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 48px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0D1B4B', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>❤️‍🩹</span> Klinik
        </div>
      </header>

      <div style={{ textAlign: 'center', padding: '80px 24px 48px' }}>
        <h1 style={{ fontSize: 48, fontWeight: 800, color: '#0D1B4B', letterSpacing: -1 }}>HealthSync Clinic</h1>
        <p style={{ fontSize: 16, color: '#6B7280', marginTop: 12 }}>Pilih role untuk melanjutkan ke panel yang sesuai</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '0 24px 80px', flexWrap: 'wrap' }}>
        {[
          { icon: '🛡️', name: 'Admin', desc: 'Kelola sistem, pasien, dan dokter', btnClass: '#0D1B4B', path: '/admin/login' },
          { icon: '🩺', name: 'Dokter', desc: 'Akses jadwal dan rekam medis', btnClass: 'linear-gradient(135deg,#22c55e,#16a34a)', path: '/dokter/login' },
          { icon: '👤', name: 'Pasien', desc: 'Buat janji dan lihat riwayat', btnClass: 'linear-gradient(135deg,#60a5fa,#3b82f6)', path: '/pasien/login' },
        ].map(r => (
          <div key={r.name} style={{ background: 'white', borderRadius: 20, padding: '40px 32px', width: 280, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}>
            <div style={{ width: 90, height: 90, borderRadius: 22, background: r.btnClass, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, margin: '0 auto 20px' }}>{r.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{r.name}</div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 24 }}>{r.desc}</div>
            <button onClick={() => navigate(r.path)}
              style={{ display: 'block', width: '100%', padding: 12, borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', background: r.btnClass, color: 'white', transition: 'opacity 0.2s' }}>
              Login sebagai {r.name} →
            </button>
          </div>
        ))}
      </div>

      <footer style={{ background: '#0D1B4B', color: 'rgba(255,255,255,0.7)', padding: '40px 48px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>❤️‍🩹 Klinik</div>
          <div style={{ fontSize: 13, maxWidth: 240, lineHeight: 1.6 }}>Melayani dengan sepenuh hati untuk kesehatan Anda</div>
        </div>
        <div><h4 style={{ color: 'white', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>📞 Kontak</h4><p style={{ fontSize: 13 }}>Darurat: (021) 119</p><p style={{ fontSize: 13 }}>Email: info@healthsync.web.id</p></div>
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>© 2026 Klinik<br />All rights reserved</div>
      </footer>
    </div>
  );
}
