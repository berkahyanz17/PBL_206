import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DokterLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twofa, setTwofa] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) { setError('Email/No.STR dan password harus diisi.'); return; }
    if (!twofa) { setError('⚠️ Harap aktifkan 2FA terlebih dahulu untuk keamanan akun.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/dokter/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('dokterUser', JSON.stringify(data.user));
        navigate('/dokter/jadwal');
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
    <div style={{ background: 'var(--green)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <span onClick={() => navigate('/')} style={{ position: 'absolute', top: 0, left: 0, padding: '16px 24px', color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>← Kembali</span>
      <div style={{ background: 'white', borderRadius: 20, padding: '40px 44px', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'slideUp 0.4s ease' }}>
        <div style={{ width: 80, height: 80, borderRadius: 18, background: 'linear-gradient(135deg,#4ade80,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>🩺</div>
        <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 800 }}>Dokter Login</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 6, marginBottom: 28 }}>Akses dashboard dokter</p>
        <div className="form-group"><label>Email / No.STR</label><input type="text" placeholder="Masukkan Email / No.STR" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="form-group"><label>Password</label><input type="password" placeholder="Masukkan Password" value={password} onChange={e => setPassword(e.target.value)} /></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="twofa" checked={twofa} onChange={e => setTwofa(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--green)' }} />
            <label htmlFor="twofa" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Enable 2FA</label>
          </div>
          <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/dokter/lupa-password')}>Lupa password?</span>
        </div>
        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 14, textAlign: 'center' }}>{error}</div>}
        <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: 14, background: loading ? '#6B7280' : 'var(--green-dark)', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Memproses...' : 'Login'}
        </button>
      </div>
    </div>
  );
}
