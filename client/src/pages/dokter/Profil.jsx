import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DokterSidebar from '../../components/DokterSidebar';
import { apiFetch } from '../../utils/api';
import { useNotif, DOKTER_NOTIFS } from '../../components/NotifPopup';

export default function DokterProfil() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nama: '', spesialis: '', no_str: '', email: '', harga: '', bio: '' });
  const [foto, setFoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const { bellButton, popup } = useNotif('notif-dokter', DOKTER_NOTIFS);
  const fileRef = useRef();
  const user = JSON.parse(sessionStorage.getItem('dokterUser') || '{}');

  useEffect(() => {
    async function load() {
      const res = await apiFetch(`/dokter/${user.id}/profil`);
      if (res?.success) {
        const d = res.data;
        setForm({ nama: d.nama || '', spesialis: d.spesialis || '', no_str: d.no_str || '', email: d.email || '', harga: d.harga || '', bio: d.bio || '' });
        if (d.foto) setFoto(d.foto);
      }
    }
    load();
  }, []);

  function previewFoto(e) {
    const file = e.target.files[0];
    if (file) { const r = new FileReader(); r.onload = ev => setFoto(ev.target.result); r.readAsDataURL(file); }
  }

  async function simpan() {
    setSaving(true);
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    if (fileRef.current?.files[0]) formData.append('foto', fileRef.current.files[0]);

    const res = await fetch(`/api/dokter/${user.id}/profil`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
      body: formData
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) alert('Profil berhasil diupdate!');
  }

  function logout() { sessionStorage.clear(); navigate('/dokter/login'); }

  return (
    <div className="dashboard-layout">
      <DokterSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--green)' }}>
          <h1>Profil Dokter</h1>
          <div className="topbar-right">
            {bellButton}<button className="btn-logout" onClick={logout}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div style={{ background: 'white', borderRadius: 14, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
              <div onClick={() => fileRef.current.click()} style={{ width: 90, height: 90, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0, overflow: 'hidden', cursor: 'pointer' }}>
                {foto ? <img src={foto.startsWith('data:') ? foto : foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
              </div>
              <button onClick={() => fileRef.current.click()} style={{ padding: '8px 18px', background: '#F3F4F6', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Upload foto</button>
              <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={previewFoto} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              {[['nama','Nama Lengkap'],['spesialis','Spesialisasi'],['no_str','No.STR'],['email','Email'],['harga','Harga Konsultasi']].map(([key, label]) => (
                <div className="form-group" key={key}>
                  <label>{label}</label>
                  <input type="text" placeholder="Ketik disini" value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div className="form-group"><label>Bio</label><textarea placeholder="Ketik disini" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} /></div>
            <button onClick={simpan} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: saving ? '#6B7280' : 'var(--green-dark)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginTop: 8 }}>
              {saving ? 'Menyimpan...' : '💾 Update Profil'}
            </button>
          </div>
        </div>
      </div>
      {popup}
    </div>
  );
}
