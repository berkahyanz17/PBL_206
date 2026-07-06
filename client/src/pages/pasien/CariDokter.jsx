import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PasienSidebar from '../../components/PasienSidebar';
import MamoruChat from './Mamoruchat';
import { apiFetch } from '../../utils/api';
import { useNotif } from '../../components/NotifPopup';
import QRISModal from '../../components/QRISModal';

export default function PasienCari() {
  const navigate = useNavigate();
  const [dokters, setDokters] = useState([]);
  const [filter, setFilter] = useState('semua');
  const [tersediaMap, setTersediaMap] = useState({});
  const { bellButton, popup } = useNotif('notif-admin', { background: 'rgba(255,255,255,0.4)' });

  // State detail modal
  const [detail, setDetail] = useState(null);
  const [ulasan, setUlasan] = useState([]);
  const [rataRata, setRataRata] = useState(null);
  const [totalUlasan, setTotalUlasan] = useState(0);
  const [loadingUlasan, setLoadingUlasan] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [qrisTarget, setQrisTarget] = useState(null);

  // State booking
  const [tanggal, setTanggal] = useState('');
  const [jam, setJam] = useState('');
  const [keluhan, setKeluhan] = useState('');
  const [loading, setLoading] = useState(false);
  const [jadwalDokter, setJadwalDokter] = useState([]);
  const [jamOptions, setJamOptions] = useState([]);
  const [jamKosongKarenaLewat, setJamKosongKarenaLewat] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await apiFetch('/dokter');
      if (!res?.success) return;
      setDokters(res.data);
      const map = {};
      for (const d of res.data) {
        const j = await apiFetch(`/jadwal-publik/${d.id}`);
        map[d.id] = j?.data?.length > 0;
      }
      setTersediaMap(map);
    }
    load();
  }, []);

  async function bukaDetail(d) {
    setDetail(d);
    setShowBookingForm(false);
    setTanggal(''); setJam(''); setKeluhan(''); setJamKosongKarenaLewat(false);
    setLoadingUlasan(true);
    const [ulasanRes, jadwalRes] = await Promise.all([
      apiFetch(`/ulasan/dokter/${d.id}`),
      apiFetch(`/jadwal-publik/${d.id}`, { cache: 'no-store' })
    ]);
    setUlasan(ulasanRes?.data || []);
    setRataRata(ulasanRes?.rata_rata);
    setTotalUlasan(ulasanRes?.total || 0);
    setJadwalDokter(jadwalRes?.data || []);
    setLoadingUlasan(false);
  }

  function onTanggalChange(tgl) {
    setTanggal(tgl);
    setJam('');
    setJamKosongKarenaLewat(false);
    const hariMap = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const [y, m, d] = tgl.split('-').map(Number);
    const hari = hariMap[new Date(y, m - 1, d).getDay()];
    const jadwalHari = jadwalDokter.find(j => j.hari === hari);
    if (!jadwalHari) { setJamOptions([]); return; }
    const mulai = parseInt(jadwalHari.jam_mulai.slice(0, 2));
    const selesai = parseInt(jadwalHari.jam_selesai.slice(0, 2));
    let opts = [];
    for (let h = mulai; h < selesai; h++) opts.push(`${String(h).padStart(2, '0')}:00`);

    // Booking minimal 1 jam sebelumnya: kalau tanggal yang dipilih hari ini,
    // buang slot jam yang kurang dari 1 jam dari sekarang.
    const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    if (tgl === todayStr) {
      const totalSebelum = opts.length;
      const batasMinimal = new Date(Date.now() + 60 * 60 * 1000);
      opts = opts.filter(j => new Date(`${tgl}T${j}:00`) >= batasMinimal);
      if (totalSebelum > 0 && opts.length === 0) setJamKosongKarenaLewat(true);
    }
    setJamOptions(opts);
  }

  async function konfirmasi() {
    if (!tanggal) { alert('Pilih tanggal dulu!'); return; }
    if (!jam) { alert('Pilih jam dulu!'); return; }
    if (!keluhan) { alert('Isi keluhan dulu!'); return; }

    // Pastikan profil pasien sudah lengkap sebelum booking
    const user = JSON.parse(localStorage.getItem('pasienUser') || '{}');
    const profilRes = await apiFetch(`/pasien/${user.id}/profil`);
    const p = profilRes?.data || {};
    const lengkap = !!(p.no_hp && p.nik && p.tgl_lahir && p.gender && p.alamat);
    if (!lengkap) {
      alert('Lengkapi profil Anda dulu (No. HP, NIK, tanggal lahir, gender, alamat) sebelum booking dokter.');
      navigate('/pasien/profil');
      return;
    }

    setLoading(true);
    const res = await apiFetch('/appointments', {
      method: 'POST',
      body: JSON.stringify({ dokter_id: detail.id, keluhan, tgl: tanggal, jam })
    });
    setLoading(false);
    if (res?.success) {
      // Langsung buka QRIS: booking baru dibuat berstatus menunggu_bayar,
      // biar pasien bisa langsung scan & bayar tanpa balik ke Home dulu.
      setQrisTarget({
        id: res.id,
        dokter_nama: detail.nama,
        harga: detail.harga,
        tgl: tanggal,
        jam
      });
      setDetail(null);
    } else {
      alert(res?.message || 'Booking gagal.');
    }
  }

  async function konfirmasiBayar(id) {
    const res = await apiFetch(`/appointments/${id}/bayar`, { method: 'POST' });
    if (res?.success) {
      setQrisTarget(null);
      alert('✅ Pembayaran berhasil dikonfirmasi! Appointment kamu sekarang menunggu konfirmasi dari klinik.');
      navigate('/pasien/home');
    } else {
      alert(res?.message || 'Gagal konfirmasi pembayaran.');
    }
  }

  function renderBintang(nilai, ukuran = 16) {
    return [1,2,3,4,5].map(n => (
      <span key={n} style={{ fontSize: ukuran, color: n <= Math.round(nilai) ? '#FBBF24' : '#D1D5DB' }}>★</span>
    ));
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
            <button className="btn-logout" style={{ background: 'rgba(255,255,255,0.4)', color: '#1e3a5f', borderColor: 'rgba(255,255,255,0.5)' }}
              onClick={async () => {
                const rt = localStorage.getItem('refreshToken');
                if (rt) await apiFetch('/logout', { method: 'POST', body: JSON.stringify({ refreshToken: rt }) });
                localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); localStorage.removeItem('pasienUser');
                navigate('/pasien/login');
              }}>🚪 Logout</button>
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

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Tidak ada dokter.</div>
            )}

            <div className="dokter-grid">
              {filtered.map(d => (
                <div key={d.id} className="dokter-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                      {d.foto ? <img src={d.foto} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="" /> : '👤'}
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
                    <button onClick={() => bukaDetail(d)}
                      style={{ padding: '8px 20px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DETAIL DOKTER */}
      {detail && (
        <div className="modal-overlay open" onClick={() => setDetail(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}
            style={{ maxWidth: 500, maxHeight: '85vh', overflowY: 'auto' }}>

            {/* Info Dokter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                {detail.foto ? <img src={detail.foto} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="" /> : '👤'}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{detail.nama}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{detail.spesialis}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1d4ed8', marginTop: 2 }}>
                  Rp {Number(detail.harga).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Rata-rata bintang */}
            <div style={{ background: '#FFF7ED', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#D97706' }}>{rataRata ?? '–'}</span>
              <div>
                <div style={{ display: 'flex', gap: 2 }}>{renderBintang(rataRata || 0, 18)}</div>
                <div style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>{totalUlasan} ulasan</div>
              </div>
            </div>

            {/* Daftar Ulasan */}
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Ulasan Pasien</div>
            {loadingUlasan && (
              <div style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 12 }}>Memuat ulasan...</div>
            )}
            {!loadingUlasan && ulasan.length === 0 && (
              <div style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 12 }}>Belum ada ulasan untuk dokter ini.</div>
            )}
            {ulasan.slice(0, 3).map((u, i) => (
              <div key={i} style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{u.pasien_nama}</span>
                  <div style={{ display: 'flex', gap: 2 }}>{renderBintang(u.bintang, 14)}</div>
                </div>
                {u.komentar && <div style={{ fontSize: 13, color: '#4B5563' }}>{u.komentar}</div>}
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                  {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            ))}
            {totalUlasan > 3 && (
              <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginBottom: 8 }}>
                Menampilkan 3 ulasan terbaru dari {totalUlasan} ulasan
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1.5px solid #E5E7EB', margin: '16px 0' }} />

            {/* Tombol toggle booking */}
            <button
              onClick={() => setShowBookingForm(v => !v)}
              style={{
                width: '100%', padding: '12px 16px',
                background: showBookingForm ? '#F3F4F6' : '#1d4ed8',
                color: showBookingForm ? '#374151' : 'white',
                border: '1.5px solid #E5E7EB', borderRadius: 10,
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                marginBottom: showBookingForm ? 16 : 0
              }}>
              <span>📅 Buat Janji Temu</span>
              <span>{showBookingForm ? '▲' : '▾'}</span>
            </button>

            {/* Form Booking */}
            {showBookingForm && (
              <>
                <div className="modal-title" style={{ marginBottom: 12 }}>Booking - {detail.nama}</div>
                <div className="form-group">
                  <label>Tanggal</label>
                  <input type="date" value={tanggal} onChange={e => onTanggalChange(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Jam</label>
                  <select value={jam} onChange={e => setJam(e.target.value)} disabled={!tanggal}>
                    <option value="">-- Pilih jam --</option>
                    {jamOptions.length === 0 && tanggal && <option disabled>{jamKosongKarenaLewat ? 'Tidak ada jam tersedia (minimal booking 1 jam sebelumnya)' : 'Dokter tidak praktik hari ini'}</option>}
                    {jamOptions.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Keluhan</label>
                  <textarea placeholder="Ceritakan keluhan Anda..." value={keluhan} onChange={e => setKeluhan(e.target.value)} />
                </div>
                <div className="modal-footer">
                  <button className="btn-batal" onClick={() => setDetail(null)}>Batal</button>
                  <button onClick={konfirmasi} disabled={loading}
                    style={{ flex: 1, padding: 12, background: loading ? '#6B7280' : '#1d4ed8', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {loading ? 'Memproses...' : 'Kirim Booking →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <QRISModal appointment={qrisTarget} onClose={() => setQrisTarget(null)} onConfirm={konfirmasiBayar} />
      <MamoruChat />
      {popup}
    </div>
  );
}
