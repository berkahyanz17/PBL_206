import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DokterLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twofa, setTwofa] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // 2FA state
  const [step, setStep] = useState('login');
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');

  async function handleLogin() {
    if (!email || !password) { setError('Email/No.STR dan password harus diisi.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/dokter/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, twofa })
      });
      const data = await res.json();
      if (data.success && data.require2FA) {
        setTempToken(data.tempToken);
        setStep('2fa');
      } else if (data.success) {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('dokterUser', JSON.stringify(data.user));
        navigate('/dokter/jadwal');
      } else {
        setError(data.message || 'Login gagal.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally { setLoading(false); }
  }

  async function handleVerify2FA() {
    if (!otp) { setError('Masukkan kode OTP.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/dokter/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, otp })
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('dokterUser', JSON.stringify(data.user));
        navigate('/dokter/jadwal');
      } else {
        setError(data.message || 'OTP salah atau expired.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally { setLoading(false); }
  }

  // ── 2FA step ──────────────────────────────────────────────────────────────
  if (step === '2fa') return (
    <div style={{ background: 'var(--green)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '40px 44px', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ width: 80, height: 80, borderRadius: 18, background: 'linear-gradient(135deg,#4ade80,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>🔐</div>
        <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 800 }}>Verifikasi 2FA</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 6, marginBottom: 28 }}>Kode OTP telah dikirim ke email Anda</p>
        <div className="form-group">
          <label>Kode OTP</label>
          <input type="text" placeholder="6 digit kode OTP" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6}
            style={{ letterSpacing: 8, fontSize: 20, textAlign: 'center' }} />
        </div>
        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 14, textAlign: 'center' }}>{error}</div>}
        <button onClick={handleVerify2FA} disabled={loading} style={{ width: '100%', padding: 14, background: loading ? '#6B7280' : 'var(--green-dark)', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Memverifikasi...' : 'Verifikasi'}
        </button>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 14, cursor: 'pointer' }}
          onClick={() => { setStep('login'); setOtp(''); }}>
          ← Kembali ke login
        </p>
      </div>
    </div>
  );

  // ── login step ────────────────────────────────────────────────────────────
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
