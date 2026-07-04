import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DokterLupa() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function kirim() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Masukkan email yang valid.'); return; }
    setError('');
    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.success) setSent(true);
    else setError(data.message || 'Gagal mengirim email.');
  }

  const Topbar = () => (
    <div style={{ background: 'var(--green-dark)', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 10, color: 'white', fontWeight: 700, fontSize: 16 }}>
      🩺 Klinik App
    </div>
  );

  return (
    <div style={{ background: 'linear-gradient(160deg,#6ee7b7 0%,#34d399 50%,#059669 100%)', minHeight: '100vh' }}>
      <Topbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', maxWidth: 800, width: '100%', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ background: 'var(--green-dark)', padding: '48px 40px', color: 'white' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Lupa Password?</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 32, lineHeight: 1.7 }}>Tenang, kami bantu reset password kamu lewat email dengan mudah dan aman</p>
            {['📧 Link dikirim ke email kamu', '⏱️ Link berlaku 1 jam', '🔒 Aman & terenkripsi'].map(f => (
              <div key={f} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 14 }}>{f}</div>
            ))}
          </div>
          <div style={{ background: 'white', padding: '48px 40px' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>🔓</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Reset Password</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>Masukkan email yang terdaftar.</p>
            {sent && <div style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 8, padding: '12px 14px', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>✅ Link reset telah dikirim! Cek inbox atau spam.</div>}
            <div className="form-group"><label>Alamat Email</label><input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
            {error && <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{error}</div>}
            <button onClick={kirim} style={{ width: '100%', padding: 12, background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 10 }}>✉️ Kirim Link Reset</button>
            <button onClick={() => navigate('/dokter/login')} style={{ width: '100%', padding: 12, background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>← Kembali Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}
