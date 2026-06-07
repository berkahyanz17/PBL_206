import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DokterLupa() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [konfirm, setKonfirm] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  function kirim() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Masukkan email yang valid.'); return; }
    setError(''); setSent(true);
    setTimeout(() => setStep(2), 2000);
  }

  function simpan() {
    if (pw.length < 8) { setError('Password minimal 8 karakter.'); return; }
    if (pw !== konfirm) { setError('Password dan konfirmasi tidak cocok.'); return; }
    alert('✅ Password berhasil diubah! Silakan login.');
    navigate('/dokter/login');
  }

  const Topbar = () => (
    <div style={{ background: 'var(--green-dark)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'white', fontWeight: 700, fontSize: 16 }}>🩺 Klinik App</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {['1.Input Email', '2.Password Baru'].map((t, i) => (
          <div key={t} style={{ padding: '7px 20px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, background: step === i + 1 ? 'white' : 'rgba(255,255,255,0.1)', color: step === i + 1 ? 'var(--green-dark)' : 'white' }}>{t}</div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ background: 'linear-gradient(160deg,#6ee7b7 0%,#34d399 50%,#059669 100%)', minHeight: '100vh' }}>
      <Topbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', maxWidth: 800, width: '100%', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ background: 'var(--green-dark)', padding: '48px 40px', color: 'white' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>{step === 1 ? 'Lupa Password?' : 'Buat Password Baru'}</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 32, lineHeight: 1.7 }}>{step === 1 ? 'Tenang, kami bantu reset password kamu lewat email.' : 'Gunakan password yang kuat agar akun kamu tetap aman.'}</p>
            {step === 1 ? ['📧 Link dikirim ke email kamu', '⏱️ Link berlaku 15 menit', '🔒 Aman & terenkripsi'].map(f => <div key={f} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 14 }}>{f}</div>)
              : ['🔑 Minimal 8 karakter', '🔤 Kombinasi huruf & angka', '🚫 Jangan pakai password lama'].map(f => <div key={f} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 14 }}>{f}</div>)}
          </div>
          <div style={{ background: 'white', padding: '48px 40px' }}>
            {step === 1 ? (
              <>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>🔓</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Reset Password</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>Masukkan email yang terdaftar.</p>
                {sent && <div style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 8, padding: '12px 14px', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>✅ Link reset telah dikirim! Cek inbox atau spam.</div>}
                <div className="form-group"><label>Alamat Email</label><input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
                {error && <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{error}</div>}
                <button onClick={kirim} style={{ width: '100%', padding: 12, background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 10 }}>✉️ Kirim Link Reset</button>
                <button onClick={() => navigate('/dokter/login')} style={{ width: '100%', padding: 12, background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>← Kembali Login</button>
              </>
            ) : (
              <>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>🔒</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Password Baru</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>Masukkan password baru untuk akunmu.</p>
                <div className="form-group"><label>Password Baru</label><input type="password" placeholder="Min 8 karakter" value={pw} onChange={e => setPw(e.target.value)} /></div>
                <div className="form-group"><label>Konfirmasi Password</label><input type="password" placeholder="Ulangi password baru" value={konfirm} onChange={e => setKonfirm(e.target.value)} /></div>
                {error && <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{error}</div>}
                <button onClick={simpan} style={{ width: '100%', padding: 12, background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>💾 Simpan Password Baru</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
