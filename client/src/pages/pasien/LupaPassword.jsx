import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PasienLupa() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  function kirim() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Masukkan email yang valid.'); return; }
    setError(''); setSent(true);
  }

  const Left = () => (
    <div style={{ background: '#1d4ed8', padding: '48px 40px', color: 'white' }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Lupa Password?</h2>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 32, lineHeight: 1.7 }}>Tenang, kami bantu reset password kamu lewat email dengan mudah dan aman</p>
      {['📧 Link dikirim ke email kamu','⏱️ Link berlaku 15 menit','🔒 Aman & terenkripsi'].map(f => <div key={f} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>{f}</div>)}
    </div>
  );

  return (
    <div style={{ background: 'linear-gradient(160deg,#7dd3fc 0%,#60a5fa 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', maxWidth: 800, width: '100%', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <Left />
        <div style={{ background: 'white', padding: '48px 40px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <span style={{ flex: 1, height: 4, borderRadius: 4, background: '#1d4ed8' }}></span>
            <span style={{ flex: 1, height: 4, borderRadius: 4, background: '#E5E7EB' }}></span>
          </div>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>🔓</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Reset Password</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>Masukkan email yang terdaftar.</p>
          {sent && <div style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 10, padding: '14px 16px', fontSize: 13, fontWeight: 600, marginBottom: 16, textAlign: 'center' }}>✅ Link reset telah dikirim! Cek email kamu.</div>}
          <div className="form-group"><label>Alamat Email</label><input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
          {error && <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{error}</div>}
          <button onClick={kirim} style={{ width: '100%', padding: 12, background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>✉️ Kirim Link Reset</button>
          {sent && <button onClick={() => navigate('/pasien/reset-password')} style={{ width: '100%', padding: 12, background: '#D1FAE5', border: '1.5px solid #22c55e', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 10, color: '#065F46' }}>➡️ Lanjut Isi Password Baru</button>}
          <button onClick={() => navigate('/pasien/login')} style={{ width: '100%', padding: 12, background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>← Kembali Login</button>
        </div>
      </div>
    </div>
  );
}
