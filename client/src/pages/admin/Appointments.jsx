import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { apiFetch } from '../../utils/api';
import { useNotif } from '../../components/NotifPopup';
/*
const initAppts = [
  { id: 1, pasien: 'Andi Yohee', keluhan: 'Sakit kepala, Demam', dokter: 'dr. Dazai Osamu', spesialis: 'Umum', tgl: '24 Mei', jam: '15.00', status: 'menunggu' },
  { id: 2, pasien: 'Budiman', keluhan: 'Pusing, mual', dokter: 'dr. Kuro Tetsuro', spesialis: 'Umum', tgl: '25 Mei', jam: '09.00', status: 'menunggu' },
  { id: 3, pasien: 'Megumi', keluhan: 'Muntah, batuk pilek', dokter: 'dr. Kuro Tetsuro', spesialis: 'Umum', tgl: '24 Mei', jam: '13.30', status: 'dikonfirmasi' },
  { id: 4, pasien: 'Natsuki Seba', keluhan: 'Check up rutin', dokter: 'dr. Ichinose Guren', spesialis: 'Spesialis Dalam', tgl: '22 Mei', jam: '10.00', status: 'selesai' },
];*/
// Daftar alasan tolak/refund standar. id 6 = "Lainnya", diisi manual oleh admin.
const alasanRefundDaftar = [
  { id: 1, judul: 'Jadwal tidak tersedia', desc: 'Dokter penuh, cuti, atau klinik tutup di waktu yang dipilih. Silakan reschedule ke jadwal lain.' },
  { id: 2, judul: 'Data/Appointment tidak lengkap atau tidak valid', desc: 'Keluhan, riwayat penyakit, NIK, atau info pasien salah/kurang (data tampak palsu/asal).' },
  { id: 3, judul: 'Masalah pembayaran', desc: 'Nominal pembayaran salah, bukti pembayaran tidak valid, atau pembayaran gagal.' },
  { id: 4, judul: 'Ketidaksesuaian medis', desc: 'Layanan tidak cocok dengan spesialisasi dokter, butuh rujukan dulu, atau kondisi darurat yang harus ke IGD.' },
  { id: 5, judul: 'Kebijakan sistem', desc: 'Melebihi batas waktu reschedule/cancel, pasien masuk daftar blokir, atau appointment dianggap spam.' },
  { id: 6, judul: 'Lainnya', desc: 'Alasan lain di luar kategori di atas — tulis manual di bawah.' }
];
export default function AdminAppointments() {
  const navigate = useNavigate();
  const [appts, setAppts] = useState([]);
  const [filter, setFilter] = useState('semua');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotif, setShowNotif] = useState(false);
  const [alasanTarget, setAlasanTarget] = useState(null); // { id, nama } appointment yg lagi ditolak & butuh alasan
  const [alasanTerpilih, setAlasanTerpilih] = useState(null); // id 1-6
  const [alasanLainnyaText, setAlasanLainnyaText] = useState('');
  const [notifList, setNotifList] = useState([
    { id: 1, icon: '👥', iconClass: 'blue', title: 'Pasien baru mendaftar', time: '5 menit lalu', unread: true },
    { id: 2, icon: '📅', iconClass: 'orange', title: 'Appointment masuk', time: '30 menit lalu', unread: true },
    { id: 3, icon: '💬', iconClass: 'blue', title: 'Pesan dari Dokter', time: 'Kemarin', unread: false },
    ]);
  const notifRef = useRef();
  const unread = notifList.filter(n => n.unread).length;
  const { bellButton, popup } = useNotif('notif-admin');
  useEffect(() => { loadAppts(); }, []);
  useEffect(() => {
  function handleClick(e) { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); }
  document.addEventListener('mousedown', handleClick);
  return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  async function loadAppts() {
    setLoading(true);
    const res = await apiFetch('/appointments');
    if (res?.success) setAppts(res.data);
    setLoading(false);
  }

  async function forward(id) {
    await apiFetch(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'dikonfirmasi' })
    });
    loadAppts();
  }

  async function tolak(id, nama, paid) {
    if (!paid) {
      // Belum pernah bayar -> tolak biasa, gak ada uang jadi gak perlu refund
      if (!window.confirm(`Tolak appointment ${nama}? (Belum ada pembayaran masuk, jadi tidak perlu refund)`)) return;
      await apiFetch(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ditolak' })
      });
      loadAppts();
      return;
    }
    // Sudah bayar -> minta admin pilih alasan dulu sebelum tiket refund dibuat
    setAlasanTarget({ id, nama });
    setAlasanTerpilih(null);
    setAlasanLainnyaText('');
  }

  function batalAlasanRefund() {
    setAlasanTarget(null);
    setAlasanTerpilih(null);
    setAlasanLainnyaText('');
  }

  async function konfirmasiTolakRefund() {
    if (!alasanTerpilih) { alert('Pilih salah satu alasan dulu ya!'); return; }
    const opt = alasanRefundDaftar.find(a => a.id === alasanTerpilih);
    let alasanDeskripsi;
    if (alasanTerpilih === 6) {
      if (!alasanLainnyaText.trim()) { alert('Isi dulu alasan lainnya di kotak teks!'); return; }
      alasanDeskripsi = alasanLainnyaText.trim();
    } else {
      alasanDeskripsi = opt.desc;
    }
    await apiFetch(`/appointments/${alasanTarget.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ditolak', alasanKategori: opt.judul, alasanDeskripsi })
    });
    batalAlasanRefund();
    loadAppts();
  }

  async function logout() { const rt = localStorage.getItem('refreshToken'); if (rt) { await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) }); } sessionStorage.clear(); localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); navigate('/admin/login'); }
  const filtered = appts.filter(a => filter === 'semua' || a.status === filter);
  const statusLabel = { menunggu: 'Menunggu', dikonfirmasi: 'Dikonfirmasi Dokter', selesai: 'Selesai', ditolak: 'Ditolak', refund: 'Refund' };

  // Appointment dianggap "lewat jam" kalau tgl+jam sudah lampau tapi belum diproses/selesai.
  function sudahLewatJam(a) {
    if (!a.tgl || !a.jam) return false;
    if (a.status !== 'menunggu' && a.status !== 'dikonfirmasi') return false;
    const waktu = new Date(`${new Date(a.tgl).toISOString().slice(0, 10)}T${a.jam.length === 5 ? a.jam + ':00' : a.jam}`);
    return waktu < new Date();
  }

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--navy)' }}>
          <h1>Appointments</h1>
          <div className="topbar-right">
            {bellButton}
            <button className="btn-logout" onClick={logout}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div className="filter-row">
            {['semua', 'menunggu', 'dikonfirmasi', 'selesai', 'ditolak', 'refund'].map(f => (
              <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`}
                style={filter === f ? { background: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' } : {}}
                onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>
          <div className="card">
            <div className="table-wrap">
              {loading ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data...</div> : (
                <table>
                  <thead><tr><th>Pasien</th><th>Dokter</th><th>Tgl &amp; Jam</th><th>Status</th><th>Aksi</th></tr></thead>
                  <tbody>
                    {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data.</td></tr>}
                    {filtered.map(a => {
                      const lewat = sudahLewatJam(a);
                      return (
                      <tr key={a.id} style={lewat ? { opacity: 0.55, filter: 'grayscale(0.5)' } : {}}>
                        <td><div style={{ fontWeight: 600 }}>{a.pasien_nama}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.keluhan}</div></td>
                        <td><div style={{ fontWeight: 600 }}>{a.dokter_nama}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.spesialis}</div></td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{new Date(a.tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.jam?.slice(0, 5)}{lewat && <span style={{ marginLeft: 6, color: '#9CA3AF' }}>⏱ lewat jam</span>}</div>
                        </td>
                        <td><span className={`badge ${a.status === 'ditolak' ? 'tolak' : a.status === 'refund' ? 'refund' : a.status}`}>{statusLabel[a.status]}</span></td>
                        <td>
                          {a.status === 'menunggu' ? (<>
                            <button className="btn-action btn-forward" onClick={() => forward(a.id)}>Forward</button>
                            <button className="btn-action btn-tolak" style={{ marginLeft: 6 }} onClick={() => tolak(a.id, a.pasien_nama, a.paid)}>Tolak</button>
                          </>) : (
                            <button className="btn-action btn-detail" onClick={() => setDetail(a)}>Detail</button>
                          )}
                        </td>
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

      {detail && (
        <div className="modal-overlay open" onClick={() => setDetail(null)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'slideUp 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Detail Appointment</h3>
              <button onClick={() => setDetail(null)} style={{ background: '#F3F4F6', border: 'none', width: 34, height: 34, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#0D1B4B,#1a2a6c)', borderRadius: 14, padding: '20px 24px', marginBottom: 18, color: 'white', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>{detail.pasien_nama?.charAt(0)}</div>
              <div><div style={{ fontSize: 20, fontWeight: 800 }}>{detail.pasien_nama}</div><div style={{ fontSize: 13, opacity: 0.8, marginTop: 3 }}>{detail.dokter_nama} · {detail.spesialis}</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Tanggal &amp; Jam</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{new Date(detail.tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · {detail.jam?.slice(0, 5)}</div>
              </div>
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14 }}><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Status</div><div style={{ fontSize: 14, fontWeight: 700 }}>{statusLabel[detail.status]}</div></div>
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, gridColumn: '1/-1' }}><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Keluhan</div><div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{detail.keluhan}</div></div>
            </div>
            <button onClick={() => setDetail(null)} style={{ width: '100%', padding: 13, background: '#F3F4F6', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Tutup</button>
          </div>
        </div>
      )}

      {alasanTarget && (
        <div className="modal-overlay open" onClick={batalAlasanRefund}>
          <div style={{ background: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'slideUp 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>💸 Alasan Tolak &amp; Refund — {alasanTarget.nama}</h3>
              <button onClick={batalAlasanRefund} style={{ background: '#F3F4F6', border: 'none', width: 34, height: 34, borderRadius: '50%', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12 }}>
              Pasien ini sudah bayar, jadi akan otomatis dibuatkan tiket REFUND. Pilih alasan penolakan — alasan ini akan otomatis muncul di pesan pertama tiket refund pasien.
            </div>
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              {alasanRefundDaftar.map(a => (
                <label key={a.id} className={`alasan-opsi${alasanTerpilih === a.id ? ' selected' : ''}`} onClick={() => setAlasanTerpilih(a.id)}>
                  <input type="radio" name="alasan-refund-radio" checked={alasanTerpilih === a.id} onChange={() => setAlasanTerpilih(a.id)} />
                  <div>
                    <div className="arf-title">{a.id}. {a.judul}</div>
                    <div className="arf-desc">{a.desc}</div>
                  </div>
                </label>
              ))}
              {alasanTerpilih === 6 && (
                <textarea className="alasan-lainnya-textarea" placeholder="Tulis alasan lainnya di sini..." value={alasanLainnyaText} onChange={e => setAlasanLainnyaText(e.target.value)} />
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={batalAlasanRefund} style={{ flex: 1, padding: 12, background: '#F3F4F6', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Batal</button>
              <button onClick={konfirmasiTolakRefund} style={{ flex: 1, padding: 12, background: '#9D174D', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Tolak &amp; Buat Tiket Refund</button>
            </div>
          </div>
        </div>
      )}
      {popup}
    </div>
  );
}
