import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PasienSidebar from '../../components/PasienSidebar';
import MamoruChat from './Mamoruchat';
import { apiFetch } from '../../utils/api';
import { useNotif, PASIEN_NOTIFS } from '../../components/NotifPopup';

export default function PasienProfil() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nama: '', email: '', no_hp: '', nik: '', tgl_lahir: '', gender: '', alamat: '', riwayat_penyakit: '', alergi: '' });
  const [foto, setFoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  const user = JSON.parse(sessionStorage.getItem('pasienUser') || '{}');
  const { bellButton, popup } = useNotif('notif-pasien', PASIEN_NOTIFS, { background: 'rgba(255,255,255,0.4)' });

  useEffect(() => {
    async function load() {
      const res = await apiFetch(`/pasien/${user.id}/profil`);
      if (res?.success) {
        const d = res.data;
        setForm({
          nama: d.nama || '', email: d.email || '', no_hp: d.no_hp || '',
          nik: d.nik || '', tgl_lahir: d.tgl_lahir?.slice(0,10) || '',
          gender: d.gender || '', alamat: d.alamat || '',
          riwayat_penyakit: d.riwayat_penyakit || '', alergi: d.alergi || ''
        });
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

    const res = await fetch(`/api/pasien/${user.id}/profil`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
      body: formData
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      alert('Profil berhasil disimpan!');
      const res2 = await apiFetch(`/pasien/${user.id}/profil`);
      if (res2?.success && res2.data.foto) setFoto(res2.data.foto);
    }
  }

  function logout() { sessionStorage.clear(); navigate('/pasien/login'); }

  return (
    <div className="dashboard-layout">
      <PasienSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'linear-gradient(90deg,#7dd3fc,#38bdf8)' }}>
          <h1 style={{ color: '#1e3a5f' }}>Profil Saya</h1>
          <div className="topbar-right">
            {bellButton}
            <button className="btn-logout" style={{ background: 'rgba(255,255,255,0.4)', color: '#1e3a5f', borderColor: 'rgba(255,255,255,0.5)' }} onClick={logout}>🚪 Logout</button>
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
              {[['nama','Nama Lengkap','text'],['nik','NIK','text'],['tgl_lahir','Tanggal Lahir','date'],['no_hp','Telepon','tel'],['email','Email','email']].map(([key, label, type]) => (
                <div className="form-group" key={key}>
                  <label>{label}</label>
                  <input type={type} placeholder={type === 'date' ? undefined : 'Ketik disini'} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="form-group">
                <label>Gender</label>
                <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                  <option value="">Pilih Gender</option>
                  <option>Laki-laki</option>
                  <option>Perempuan</option>
                </select>
              </div>
            </div>
            {[['alamat','Alamat'],['riwayat_penyakit','Riwayat Penyakit'],['alergi','Alergi']].map(([key, label]) => (
              <div className="form-group" key={key}>
                <label>{label}</label>
                <textarea placeholder="Ketik disini" value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
            <button onClick={simpan} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: saving ? '#6B7280' : '#4B8A8C', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginTop: 8 }}>
              {saving ? 'Menyimpan...' : '💾 Simpan Profil'}
            </button>
          </div>
        </div>
      </div>
      <MamoruChat />
      {popup}
    </div>
  );
}
