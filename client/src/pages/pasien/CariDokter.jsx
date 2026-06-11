import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PasienSidebar from '../../components/PasienSidebar';
import MamoruChat from './Mamoruchat';
import { apiFetch } from '../../utils/api';
import { useNotif, PASIEN_NOTIFS } from '../../components/NotifPopup';

export default function PasienCari() {
  const navigate = useNavigate();
  const [dokters, setDokters] = useState([]);
  const [filter, setFilter] = useState('semua');
  const [booking, setBooking] = useState(null);
  const [tanggal, setTanggal] = useState('');
  const [jam, setJam] = useState('08:00');
  const [keluhan, setKeluhan] = useState('');
  const [loading, setLoading] = useState(false);
  const [jadwalDokter, setJadwalDokter] = useState([]);
  const [jamOptions, setJamOptions] = useState([]);
  const [tersediaMap, setTersediaMap] = useState({});
  const { bellButton, popup } = useNotif('notif-admin', PASIEN_NOTIFS, { background: 'rgba(255,255,255,0.4)' });
  const user = JSON.parse(sessionStorage.getItem('pasienUser') || '{}');

  useEffect(() => {
    async function load() {
      const res = await apiFetch('/dokter');
      if (!res?.success) return;
      setDokters(res.data);
      const hariIniIdx = new Date().getDay();
      const hariMap = ['Minggu','Senin','Selasa','Rabu',"Kamis","Jumat",'Sabtu'];
      const hariSaatIni = hariMap[hariIniIdx];
      const map = {};
      for (const d of res.data) {
        const j = await fetch(`/api/jadwal-publik/${d.id}`).then(r => r.json());
        map[d.id] = j.data?.length > 0;
      }
      setTersediaMap(map);
    }
    load();
  }, []);
  
  async function bukaBooking(d) {
    setBooking(d);
    setTanggal(''); setJam(''); setKeluhan('');
    const res = await fetch(`/api/jadwal-publik/${d.id}`, {
      cache: 'no-store'
    }).then(r => r.json());
    setJadwalDokter(res.data || []);
  }
  
  function onTanggalChange(tgl) {
    setTanggal(tgl);
    setJam('');
    const hariMap = ['Minggu','Senin','Selasa','Rabu',"Kamis","Jumat",'Sabtu'];
    const [y, m, d] = tgl.split('-').map(Number);
    const hari = hariMap[new Date(y, m - 1, d).getDay()];
    const jadwalHari = jadwalDokter.find(j => j.hari === hari);
    if (!jadwalHari) { setJamOptions([]); return; }
    const mulai = parseInt(jadwalHari.jam_mulai.slice(0,2));
    const selesai = parseInt(jadwalHari.jam_selesai.slice(0,2));
    const opts = [];
    for (let h = mulai; h < selesai; h++) opts.push(`${String(h).padStart(2,'0')}:00`);
    setJamOptions(opts);
  }
  
  async function konfirmasi() {
    if (!tanggal) { alert('Pilih tanggal dulu!'); return; }
    if (!keluhan) { alert('Isi keluhan dulu!'); return; }
    setLoading(true);
    const res = await apiFetch('/appointments', {
      method: 'POST',
      body: JSON.stringify({ dokter_id: booking.id, keluhan, tgl: tanggal, jam })
    });
    setLoading(false);
    if (res?.success) {
      setBooking(null); setTanggal(''); setKeluhan('');
      alert('✅ Booking berhasil! Tunggu konfirmasi dari dokter.');
    } else {
      alert(res?.message || 'Booking gagal.');
    }
  }

  const spesialisList = ['semua', 'tersedia', ...new Set(dokters.map(d => d.spesialis).filter(Boolean))];
  const filtered = dokters.filter(d => {
    if (filter === 'semua') return true;
    if (filter === 'tersedia') return tersediaMap[d.id] === true;
    return d.spesialis?.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="dashboard-layout">
      <PasienSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'linear-gradient(90deg,#7dd3fc,#38bdf8)' }}>
          <h1 style={{ color: '#1e3a5f' }}>Cari Dokter</h1>
          <div className="topbar-right">
            {bellButton}
            <button className="btn-logout" style={{ background: 'rgba(255,255,255,0.4)', color: '#1e3a5f', borderColor: 'rgba(255,255,255,0.5)' }} onClick={() => { sessionStorage.clear(); navigate('/pasien/login'); }}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div className="card">
            <div className="filter-row">
              {spesialisList.map(f => (
                <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`}
                  style={filter === f ? { background: '#1d4ed8', color: 'white', borderColor: '#1d4ed8' } : {}}
                  onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
            {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Tidak ada dokter.</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              {filtered.map(d => (
                <div key={d.id} style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                      {d.foto ? <img src={d.foto} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : '👤'}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{d.nama}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{d.spesialis}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>Rp {Number(d.harga).toLocaleString('id-ID')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: tersediaMap[d.id] === undefined ? '#9CA3AF' : tersediaMap[d.id] ? '#22c55e' : '#ef4444' }}>
                      {tersediaMap[d.id] === undefined ? '● Memuat...' : tersediaMap[d.id] ? '● Tersedia' : '● Tidak Tersedia'}
                    </span>
                    <button onClick={() => bukaBooking(d)}
                      style={{ padding: '8px 20px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Booking</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {booking && (
        <div className="modal-overlay open" onClick={() => setBooking(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Booking - {booking.nama}</div>
            <div className="form-group"><label>Tanggal</label>
              <input type="date" value={tanggal} onChange={e => onTanggalChange(e.target.value)} /></div>
            <div className="form-group"><label>Jam</label>
              <select value={jam} onChange={e => setJam(e.target.value)} disabled={!tanggal}>
                <option value="">-- Pilih jam --</option>
                {jamOptions.length === 0 && tanggal && <option disabled>Dokter tidak praktik hari ini</option>}
                {jamOptions.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Keluhan</label><textarea placeholder="Ceritakan keluhan Anda..." value={keluhan} onChange={e => setKeluhan(e.target.value)} /></div>
            <div className="modal-footer">
              <button className="btn-batal" onClick={() => setBooking(null)}>Batal</button>
              <button onClick={konfirmasi} disabled={loading} style={{ flex: 1, padding: 12, background: loading ? '#6B7280' : '#1d4ed8', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Memproses...' : 'Kirim Booking →'}
              </button>
            </div>
          </div>
        </div>
      )}
      <MamoruChat />
      {popup}
    </div>
  );
}
