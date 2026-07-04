import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DokterLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleLogin() {
    if (!email || !password) { setError('Email/No.STR dan password harus diisi.'); return; }
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
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('dokterUser', JSON.stringify(data.user));
        localStorage.setItem('dokterNama', data.user.nama);
        if (!data.user.password_changed) sessionStorage.setItem('pwReminder_dokter', '1');
        navigate('/dokter/jadwal');
      } else {
        setError(data.message || 'Login gagal.');
      }
    } catch (err) {
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
        <div className="form-group">
          <label>Email / No.STR</label>
          <input type="text" placeholder="Masukkan Email / No.STR" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input type={showPw ? 'text' : 'password'} placeholder="Masukkan Password" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 44 }} />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
              {showPw ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', marginBottom: 22 }}>
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
