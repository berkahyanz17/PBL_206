import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { apiFetch } from '../../utils/api';
import { useNotif } from '../../components/NotifPopup';

const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'];

export default function AdminDokter() {
  const navigate = useNavigate();
  const [dokters, setDokters] = useState([]);
  const [filter, setFilter] = useState('semua');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nama: '', email: '', password: '', spesialis: '', no_str: '', harga: '' });
  const [showPw, setShowPw] = useState(false);
  const { bellButton, popup } = useNotif('notif-admin');

  // Rating & ulasan per dokter (dimuat sekali untuk semua dokter di tabel)
  const [ratingMap, setRatingMap] = useState({}); // { [dokterId]: { rata_rata, total, data: [] } }
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingDokter, setRatingDokter] = useState(null); // { id, nama }
  const [loadingRating, setLoadingRating] = useState(false);

  useEffect(() => { loadDokters(); }, []);

  async function loadDokters() {
    setLoading(true);
    const res = await apiFetch('/dokter');
    if (res?.success) {
      setDokters(res.data);
      loadRatingSemuaDokter(res.data);
    }
    setLoading(false);
  }

  // Ambil rata-rata rating + total ulasan untuk tiap dokter (dipakai buat badge di kolom Rating)
  async function loadRatingSemuaDokter(list) {
    const entries = await Promise.all(
      list.map(async (d) => {
        const res = await apiFetch(`/ulasan/dokter/${d.id}`);
        return [d.id, { rata_rata: res?.rata_rata, total: res?.total || 0, data: res?.data || [] }];
      })
    );
    setRatingMap(Object.fromEntries(entries));
  }

  function renderBintang(nilai, ukuran = 14) {
    return [1, 2, 3, 4, 5].map((n) => (
      <span key={n} style={{ fontSize: ukuran, color: n <= Math.round(nilai) ? '#FBBF24' : '#D1D5DB' }}>★</span>
    ));
  }

  async function bukaRatingDokter(d) {
    setRatingDokter(d);
    setShowRatingModal(true);
    // Kalau belum ada di cache, ambil dari server
    if (!ratingMap[d.id]) {
      setLoadingRating(true);
      const res = await apiFetch(`/ulasan/dokter/${d.id}`);
      setRatingMap((prev) => ({ ...prev, [d.id]: { rata_rata: res?.rata_rata, total: res?.total || 0, data: res?.data || [] } }));
      setLoadingRating(false);
    }
  }

  async function hapus(id, nama) {
    if (!window.confirm('Hapus ' + nama + '?')) return;
    await apiFetch(`/dokter/${id}`, { method: 'DELETE' });
    loadDokters();
  }

  async function tambah() {
    if (!form.nama || !form.email || !form.password) return;
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    await apiFetch('/dokter', { method: 'POST', body: fd });
    setShowModal(false);
    setForm({ nama: '', email: '', password: '', spesialis: '', no_str: '', harga: '' });
    loadDokters();
  }

  async function logout() { const rt = localStorage.getItem('refreshToken'); if (rt) { await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) }); } sessionStorage.clear(); localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); navigate('/admin/login'); }

  const spesialisList = ['semua', ...new Set(dokters.map(d => d.spesialis).filter(Boolean))];
  const filtered = dokters.filter(d => filter === 'semua' || d.spesialis === filter);

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--navy)' }}>
          <h1>Daftar Dokter</h1>
          <div className="topbar-right">
            {bellButton}<button className="btn-logout" onClick={logout}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="section-title" style={{ margin: 0 }}>Kelola Dokter</div>
            <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Tambah Dokter</button>
          </div>
          <div className="filter-row">
            {spesialisList.map(f => (
              <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`}
                style={filter === f ? { background: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' } : {}}
                onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>
          <div className="card">
            <div className="table-wrap">
              {loading ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data...</div> : (
                <table>
                  <thead><tr><th>Nama</th><th>Spesialisasi</th><th>No. STR</th><th>Harga</th><th>Rating</th><th>Aksi</th></tr></thead>
                  <tbody>
                    {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data.</td></tr>}
                    {filtered.map((d, i) => {
                      const r = ratingMap[d.id];
                      return (
                        <tr key={d.id}>
                          <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="avatar" style={{ background: colors[i % colors.length] }}>{d.nama?.charAt(0)}</div><span style={{ fontWeight: 600 }}>{d.nama}</span></div></td>
                          <td>{d.spesialis}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{d.no_str}</td>
                          <td style={{ fontWeight: 700 }}>Rp {Number(d.harga).toLocaleString('id-ID')}</td>
                          <td>
                            {r && r.total > 0 ? (
                              <button type="button" onClick={() => bukaRatingDokter(d)} style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                                <span style={{ fontWeight: 800, color: '#D97706', fontSize: 13 }}>{r.rata_rata}</span>
                                <span style={{ color: '#FBBF24', fontSize: 12 }}>★</span>
                                <span style={{ color: '#92400E', fontSize: 11, fontWeight: 600 }}>({r.total})</span>
                              </button>
                            ) : (
                              <button type="button" onClick={() => bukaRatingDokter(d)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 12, fontFamily: 'inherit' }}>Belum ada ulasan</button>
                            )}
                          </td>
                          <td><button className="btn-del" onClick={() => hapus(d.id, d.nama)}>🗑️</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay open" onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Tambah Dokter</h3>
              <button onClick={() => setShowModal(false)} style={{ background: '#F3F4F6', border: 'none', width: 34, height: 34, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
           {[['nama','Nama Lengkap','text'],['email','Email','email'],['password','Password','password'],['spesialis','Spesialisasi','text'],['no_str','No. STR','text'],['harga','Harga Konsultasi','number']].map(([key, label, type]) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              {key === 'password' ? (
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} placeholder={label} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                    {showPw ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              ) : (
                <input type={type} placeholder={label} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              )}
            </div>
          ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => setShowModal(false)} className="btn-batal" style={{ flex: 1 }}>Batal</button>
              <button onClick={tambah} style={{ flex: 1, padding: 12, background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {showRatingModal && ratingDokter && (
        <div className="modal-overlay open" onClick={() => setShowRatingModal(false)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 0, width: '100%', maxWidth: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>⭐ Rating &amp; Ulasan — {ratingDokter.nama}</h3>
              <button onClick={() => setShowRatingModal(false)} style={{ background: '#F3F4F6', border: 'none', width: 34, height: 34, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 24, overflowY: 'auto' }}>
              {loadingRating ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>Memuat ulasan...</div>
              ) : (
                <>
                  {(() => {
                    const r = ratingMap[ratingDokter.id] || { rata_rata: null, total: 0, data: [] };
                    return (
                      <>
                        <div style={{ background: '#FFF7ED', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                          <span style={{ fontSize: 32, fontWeight: 800, color: '#D97706' }}>{r.rata_rata ?? '–'}</span>
                          <div>
                            <div style={{ fontSize: 18 }}>{renderBintang(r.rata_rata || 0, 18)}</div>
                            <div style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>{r.total} ulasan</div>
                          </div>
                        </div>
                        <div className="table-wrap">
                          <table>
                            <thead><tr><th>Pasien</th><th>Rating</th><th>Komentar</th><th>Tanggal</th></tr></thead>
                            <tbody>
                              {r.data.length === 0 && (
                                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#9CA3AF', padding: 16 }}>Belum ada ulasan untuk dokter ini.</td></tr>
                              )}
                              {r.data.map((u) => (
                                <tr key={u.id}>
                                  <td style={{ fontWeight: 600 }}>{u.pasien_nama}</td>
                                  <td>{renderBintang(u.bintang, 13)}</td>
                                  <td style={{ color: 'var(--text-muted)' }}>{u.komentar || '-'}</td>
                                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                    {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #F3F4F6' }}>
              <button onClick={() => setShowRatingModal(false)} className="btn-batal" style={{ width: '100%' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
      {popup}
    </div>
  );
}
