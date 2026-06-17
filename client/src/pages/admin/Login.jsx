import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useRef } from 'react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const captchaRef = useRef(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username || !password) { setError('Username dan password harus diisi.'); return; }
    if (!captchaToken) { setError('⚠️ Harap selesaikan captcha terlebih dahulu.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, captchaToken })
      });
      const data = await res.json();
      console.log('Login response:', data);
      if (data.success) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Login gagal.');
        captchaRef.current?.resetCaptcha();
        setCaptchaToken('');
      }
    } catch (err) {
      console.log('Login error:', err);
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <span onClick={() => navigate('/')} style={{ position: 'absolute', top: 0, left: 0, padding: '16px 24px', color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>← Kembali</span>
      <div style={{ background: 'white', borderRadius: 20, padding: '40px 44px', width: '100%', maxWidth: 440, position: 'relative', zIndex: 1, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'slideUp 0.4s ease' }}>
        <div style={{ width: 80, height: 80, borderRadius: 18, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>🛡️</div>
        <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 800 }}>Admin Login</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 6, marginBottom: 28 }}>Masuk ke panel administrasi</p>
        <div className="form-group">
          <label>Username</label>
          <input type="text" placeholder="Masukkan Username" value={username} onChange={e => setUsername(e.target.value)}
            style={{ borderColor: 'var(--border)' }} onFocus={e => e.target.style.borderColor = 'var(--navy)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input type={showPw ? 'text' : 'password'} placeholder="Masukkan Password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ paddingRight: 44, borderColor: 'var(--border)' }} onFocus={e => e.target.style.borderColor = 'var(--navy)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
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
        {/* hCaptcha */}
        <div style={{ marginBottom: 22, display: 'flex', justifyContent: 'center' }}>
          <HCaptcha
            sitekey={import.meta.env.VITE_HCAPTCHA_SITEKEY}
            onVerify={token => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken('')}
            ref={captchaRef}
          />
        </div>
        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 14, textAlign: 'center' }}>{error}</div>}
        <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: 14, background: loading ? '#6B7280' : 'var(--navy)', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Memproses...' : 'Login'}
        </button>
      </div>
    </div>
  );
}
