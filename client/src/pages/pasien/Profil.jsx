import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PasienSidebar from '../../components/PasienSidebar';

export default function PasienProfil() {
  const navigate = useNavigate();
  const [foto, setFoto] = useState(null);
  const fileRef = useRef();

  function previewFoto(e) {
    const file = e.target.files[0];
    if (file) { const r = new FileReader(); r.onload = ev => setFoto(ev.target.result); r.readAsDataURL(file); }
  }

  return (
    <div className="dashboard-layout">
      <PasienSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'linear-gradient(90deg,#7dd3fc,#38bdf8)' }}>
          <h1 style={{ color: '#1e3a5f' }}>Profil Saya</h1>
          <div className="topbar-right">
            <button className="btn-notif" style={{ background: 'rgba(255,255,255,0.4)' }}>🔔</button>
            <button className="btn-logout" style={{ background: 'rgba(255,255,255,0.4)', color: '#1e3a5f', borderColor: 'rgba(255,255,255,0.5)' }} onClick={() => navigate('/pasien/login')}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div style={{ background: 'white', borderRadius: 14, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
              <div onClick={() => fileRef.current.click()} style={{ width: 90, height: 90, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0, overflow: 'hidden', cursor: 'pointer' }}>
                {foto ? <img src={foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
              </div>
              <button onClick={() => fileRef.current.click()} style={{ padding: '8px 18px', background: '#F3F4F6', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Upload foto</button>
              <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={previewFoto} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {[['Nama Lengkap','text'],['NIK','text'],['Tanggal Lahir','date'],['Telepon','tel'],['Email','email']].map(([label, type]) => (
                <div className="form-group" key={label}><label>{label}</label><input type={type} placeholder={type === 'date' ? undefined : 'Ketik disini'} /></div>
              ))}
              <div className="form-group"><label>Gender</label><select><option>Pilih Gender</option><option>Laki-laki</option><option>Perempuan</option></select></div>
            </div>
            {['Alamat','Riwayat Penyakit','Alergi'].map(label => (
              <div className="form-group" key={label}><label>{label}</label><textarea placeholder="Ketik disini" /></div>
            ))}
            <button onClick={() => alert('Profil berhasil disimpan!')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#4B8A8C', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginTop: 8 }}>💾 Simpan Profil</button>
          </div>
        </div>
      </div>
    </div>
  );
}
