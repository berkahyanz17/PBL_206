import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PasienSidebar from '../../components/PasienSidebar';

const dokters = [
  { nama: 'Dr. Sarah Melati', spesialis: 'umum', rating: '4.8', harga: 'Rp. 150.000', tersedia: true },
  { nama: 'Dr. Kuro Tetsuro', spesialis: 'umum', rating: '4.6', harga: 'Rp. 150.000', tersedia: true },
  { nama: 'Dr. Ichinose Guren', spesialis: 'spesialis dalam', rating: '4.9', harga: 'Rp. 200.000', tersedia: true },
  { nama: 'Dr. Dazai Osamu', spesialis: 'anak', rating: '4.7', harga: 'Rp. 100.000', tersedia: false },
];

export default function PasienCari() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('semua');
  const [booking, setBooking] = useState(null);
  const [tanggal, setTanggal] = useState('');
  const [jam, setJam] = useState('08:00');
  const [keluhan, setKeluhan] = useState('');

  const filtered = dokters.filter(d => {
    if (filter === 'semua') return true;
    if (filter === 'tersedia') return d.tersedia;
    return d.spesialis === filter;
  });

  function konfirmasi() {
    if (!tanggal) { alert('Pilih tanggal dulu!'); return; }
    if (!keluhan) { alert('Isi keluhan dulu!'); return; }
    setBooking(null); setTanggal(''); setKeluhan('');
    alert('✅ Booking berhasil!\nTunggu konfirmasi dari klinik.');
  }

  return (
    <div className="dashboard-layout">
      <PasienSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'linear-gradient(90deg,#7dd3fc,#38bdf8)' }}>
          <h1 style={{ color: '#1e3a5f' }}>Cari Dokter</h1>
          <div className="topbar-right">
            <button className="btn-notif" style={{ background: 'rgba(255,255,255,0.4)' }}>🔔</button>
            <button className="btn-logout" style={{ background: 'rgba(255,255,255,0.4)', color: '#1e3a5f', borderColor: 'rgba(255,255,255,0.5)' }} onClick={() => navigate('/pasien/login')}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div className="card">
            <div className="filter-row">
              {['semua','umum','spesialis dalam','anak','tersedia'].map(f => (
                <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`}
                  style={filter === f ? { background: '#1d4ed8', color: 'white', borderColor: '#1d4ed8' } : {}}
                  onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              {filtered.map(d => (
                <div key={d.nama} style={{ background: d.tersedia ? 'white' : '#F3F4F6', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', opacity: d.tersedia ? 1 : 0.65 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, filter: d.tersedia ? 'none' : 'grayscale(100%)' }}>👤</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: d.tersedia ? 'inherit' : '#9CA3AF' }}>{d.nama}</div>
                      <div style={{ fontSize: 12, color: d.tersedia ? 'var(--text-muted)' : '#9CA3AF', marginTop: 2 }}>{d.spesialis}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: d.tersedia ? 'inherit' : '#9CA3AF' }}>⭐ {d.rating}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: d.tersedia ? 'inherit' : '#9CA3AF' }}>{d.harga}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: d.tersedia ? '#22c55e' : '#ef4444' }}>{d.tersedia ? '● Tersedia' : '● Tidak Tersedia'}</span>
                    <button onClick={() => d.tersedia && setBooking(d.nama)} disabled={!d.tersedia}
                      style={{ padding: '8px 20px', background: d.tersedia ? '#1d4ed8' : '#D1D5DB', color: d.tersedia ? 'white' : '#9CA3AF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: d.tersedia ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>Booking</button>
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
            <div className="modal-title">Booking - {booking}</div>
            <div className="form-group"><label>Tanggal</label><input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} /></div>
            <div className="form-group"><label>Jam</label><select value={jam} onChange={e => setJam(e.target.value)}>{['08:00','09:00','10:00','11:00','13:00','14:00','15:00'].map(j => <option key={j}>{j}</option>)}</select></div>
            <div className="form-group"><label>Keluhan</label><textarea placeholder="Ceritakan keluhan Anda..." value={keluhan} onChange={e => setKeluhan(e.target.value)} /></div>
            <div className="modal-footer">
              <button className="btn-batal" onClick={() => setBooking(null)}>Batal</button>
              <button onClick={konfirmasi} style={{ flex: 1, padding: 12, background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Kirim Booking →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
