import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DokterSidebar from '../../components/DokterSidebar';

export default function DokterProfil() {
  const navigate = useNavigate();
  const [foto, setFoto] = useState(null);
  const fileRef = useRef();

  function previewFoto(e) {
    const file = e.target.files[0];
    if (file) { const r = new FileReader(); r.onload = ev => setFoto(ev.target.result); r.readAsDataURL(file); }
  }

  return (
    <div className="dashboard-layout">
      <DokterSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--green)' }}>
          <h1>Profil Dokter</h1>
          <div className="topbar-right"><button className="btn-notif">🔔</button><button className="btn-logout" onClick={() => navigate('/dokter/login')}>🚪 Logout</button></div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              {['Nama Lengkap','Spesialisasi','No.STR','Email','Telepon','Tahun Pengalaman'].map(label => (
                <div className="form-group" key={label}><label>{label}</label><input type="text" placeholder="Ketik disini" /></div>
              ))}
            </div>
            <div className="form-group"><label>Bio</label><textarea placeholder="Ketik disini" /></div>
            <button onClick={() => alert('Profil berhasil diupdate!')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'var(--green-dark)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginTop: 8 }}>💾 Update Profil</button>
          </div>
        </div>
      </div>
    </div>
  );
}
