import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PasienDaftar() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nama: '', email: '', hp: '', pass: '', konfirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, val) { setForm(prev => ({ ...prev, [field]: val })); }

  async function daftar() {
    if (!form.nama || !form.email || !form.hp || !form.pass || !form.konfirm) { setError('Semua kolom harus diisi.'); return; }
    if (form.pass.length < 8) { setError('Password minimal 8 karakter.'); return; }
    if (form.pass !== form.konfirm) { setError('Konfirmasi password tidak cocok.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/pasien/daftar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: form.nama, email: form.email, no_hp: form.hp, password: form.pass })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Pendaftaran berhasil! Silakan login.');
        navigate('/pasien/login');
      } else {
        setError(data.message || 'Pendaftaran gagal.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'linear-gradient(160deg,#7dd3fc 0%,#38bdf8 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <span onClick={() => navigate('/pasien/login')} style={{ position: 'absolute', top: 0, left: 0, padding: '16px 24px', color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>← Kembali</span>
      <div style={{ background: 'white', borderRadius: 20, padding: '40px 44px', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', animation: 'slideUp 0.4s ease' }}>
        <div style={{ width: 80, height: 80, borderRadius: 18, background: 'linear-gradient(135deg,#7dd3fc,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>👤</div>
        <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 800 }}>Daftar Akun</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 6, marginBottom: 28 }}>Buat akun untuk akses layanan kesehatan</p>
        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>{error}</div>}
        <div className="form-group"><label>Nama Lengkap</label><input type="text" placeholder="Masukkan Nama Lengkap" value={form.nama} onChange={e => set('nama', e.target.value)} /></div>
        <div className="form-group"><label>Email</label><input type="email" placeholder="Masukkan Email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
        <div className="form-group"><label>No.Hp</label><input type="tel" placeholder="08XXXXXXXXXX" value={form.hp} onChange={e => set('hp', e.target.value)} /></div>
        <div className="form-group"><label>Password</label><input type="password" placeholder="Min 8 karakter" value={form.pass} onChange={e => set('pass', e.target.value)} /></div>
        <div className="form-group"><label>Konfirmasi Password</label><input type="password" placeholder="Ulangi password" value={form.konfirm} onChange={e => set('konfirm', e.target.value)} /></div>
        <button onClick={daftar} disabled={loading} style={{ width: '100%', padding: 14, background: loading ? '#6B7280' : '#4B8A8C', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}>
          {loading ? 'Mendaftar...' : 'Daftar'}
        </button>
      </div>
    </div>
  );
}
