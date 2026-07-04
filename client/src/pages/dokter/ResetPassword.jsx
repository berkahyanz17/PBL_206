import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function DokterReset() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pw, setPw] = useState('');
  const [konfirm, setKonfirm] = useState('');
  const [error, setError] = useState('');

  async function simpan() {
    if (!pw || !konfirm) { setError('Semua kolom harus diisi.'); return; }
    if (pw.length < 8) { setError('Password minimal 8 karakter.'); return; }
    if (pw !== konfirm) { setError('Konfirmasi password tidak cocok.'); return; }

    const token = searchParams.get('token');
    if (!token) { setError('Token tidak valid.'); return; }

    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: pw })
    });
    const data = await res.json();
    if (data.success) {
      alert('✅ Password berhasil diubah! Silakan login.');
      navigate('/dokter/login');
    } else {
      setError(data.message || 'Gagal reset password.');
    }
  }

  return (
    <div style={{ background: 'linear-gradient(160deg,#6ee7b7 0%,#34d399 50%,#059669 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', maxWidth: 800, width: '100%', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ background: 'var(--green-dark)', padding: '48px 40px', color: 'white' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Buat Password Baru</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 32, lineHeight: 1.7 }}>Gunakan password yang kuat agar akun kamu tetap aman.</p>
          {['🔑 Minimal 8 karakter', '🔤 Kombinasi huruf & angka', '🚫 Jangan pakai password lama'].map(f => (
            <div key={f} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>{f}</div>
          ))}
        </div>
        <div style={{ background: 'white', padding: '48px 40px' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>🔒</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Password Baru</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>Masukkan password baru untuk akunmu.</p>
          {error && <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{error}</div>}
          <div className="form-group"><label>Password Baru</label><input type="password" placeholder="Min 8 karakter" value={pw} onChange={e => setPw(e.target.value)} /></div>
          <div className="form-group"><label>Konfirmasi Password</label><input type="password" placeholder="Ulangi password baru" value={konfirm} onChange={e => setKonfirm(e.target.value)} /></div>
          <button onClick={simpan} style={{ width: '100%', padding: 12, background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 10 }}>💾 Simpan Password Baru</button>
          <button onClick={() => navigate('/dokter/lupa-password')} style={{ width: '100%', padding: 12, background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>← Kembali</button>
        </div>
      </div>
    </div>
  );
}
