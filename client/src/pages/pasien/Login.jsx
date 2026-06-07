import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PasienLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) { setError('Email/No.Hp dan password harus diisi.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/pasien/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('pasienUser', JSON.stringify(data.user));
        sessionStorage.setItem('pasienNama', data.user.nama);
        navigate('/pasien/home');
      } else {
        setError(data.message || 'Login gagal.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'linear-gradient(160deg,#7dd3fc 0%,#38bdf8 50%,#0ea5e9 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <span onClick={() => navigate('/')} style={{ position: 'absolute', top: 0, left: 0, padding: '16px 24px', color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>← Kembali</span>
      <div style={{ background: 'white', borderRadius: 20, padding: '40px 44px', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', animation: 'slideUp 0.4s ease' }}>
        <div style={{ width: 80, height: 80, borderRadius: 18, background: 'linear-gradient(135deg,#7dd3fc,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>👤</div>
        <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 800 }}>Pasien Login</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 6, marginBottom: 28 }}>Akses layanan kesehatan Anda</p>
        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>{error}</div>}
        <div className="form-group"><label>Email / No.Hp</label><input type="text" placeholder="Masukkan Email / No.Hp" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="form-group">
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input type={showPw ? 'text' : 'password'} placeholder="Masukkan Password" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 44 }} />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>👁️</button>
          </div>
        </div>
        <span onClick={() => navigate('/pasien/lupa-password')} style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 600, cursor: 'pointer', display: 'block', marginBottom: 20 }}>Lupa Password?</span>
        <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: 14, background: loading ? '#6B7280' : '#4B8A8C', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 14 }}>
          {loading ? 'Memproses...' : 'Login'}
        </button>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Belum punya akun? <span onClick={() => navigate('/pasien/daftar')} style={{ color: 'var(--blue)', fontWeight: 600, cursor: 'pointer' }}>Daftar Sekarang</span></div>
      </div>
    </div>
  );
}
