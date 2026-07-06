import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PasienSidebar from '../../components/PasienSidebar';
import { useNotif } from '../../components/NotifPopup';
import { apiFetch } from '../../utils/api';
import MamoruChat from './Mamoruchat';
import ReminderBanner from '../../components/ReminderBanner';
import QRISModal from '../../components/QRISModal';

export default function PasienHome() {
  const navigate = useNavigate();
  const nama = localStorage.getItem('pasienNama') || 'Pasien';
  const user = JSON.parse(localStorage.getItem('pasienUser') || '{}');
  const { bellButton, popup } = useNotif('notif-pasien', { background: 'rgba(255,255,255,0.4)' });
  const [appointments, setAppointments] = useState([]);
  const [qrisTarget, setQrisTarget] = useState(null);

  // Rating popup state
  const [ratingPending, setRatingPending] = useState(null);
  const [bintang, setBintang] = useState(0);
  const [hoverBintang, setHoverBintang] = useState(0);
  const [komentar, setKomentar] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingMsg, setRatingMsg] = useState('');

  useEffect(() => {
    async function load() {
      const res = await apiFetch(`/appointments/pasien/${user.id}`);
      if (res?.success) setAppointments(res.data);

      // Cek apakah ada rekam medis yang belum dirating
      const pending = await apiFetch('/ulasan/pending');
      if (pending?.success && pending?.data?.length > 0) setRatingPending(pending.data[0]);
    }
    load();
  }, []);

  async function logout() {
    const rt = localStorage.getItem('refreshToken');
    if (rt) {
      await apiFetch('/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: rt })
      });
    }
    sessionStorage.clear();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/pasien/login');
  }

  async function konfirmasiBayar(id) {
    const res = await apiFetch(`/appointments/${id}/bayar`, { method: 'POST' });
    if (res?.success) {
      setQrisTarget(null);
      const updated = await apiFetch(`/appointments/pasien/${user.id}`);
      if (updated?.success) setAppointments(updated.data);
    } else {
      alert(res?.message || 'Gagal konfirmasi pembayaran.');
    }
  }

  async function submitRating() {
    if (!bintang) { setRatingMsg('Pilih bintang dulu!'); return; }
    setRatingLoading(true);
    setRatingMsg('');
    const res = await apiFetch('/ulasan', {
      method: 'POST',
      body: JSON.stringify({
        appointment_id: ratingPending.appointment_id,
        dokter_id: ratingPending.dokter_id,
        bintang,
        komentar
      })
    });
    setRatingLoading(false);
    if (res?.success) {
      setRatingPending(null);
      setBintang(0);
      setKomentar('');
    } else {
      setRatingMsg(res?.message || 'Gagal menyimpan ulasan.');
    }
  }

  const upcoming = appointments.filter(a => ['menunggu_bayar', 'menunggu', 'dikonfirmasi', 'refund'].includes(a.status));
  const recent = appointments.filter(a => a.status === 'selesai').slice(0, 1);

  return (
    <div className="dashboard-layout">
      <PasienSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'linear-gradient(90deg,#7dd3fc,#38bdf8)' }}>
          <h1 style={{ color: '#1e3a5f' }}>Portal Pasien</h1>
          <div className="topbar-right">
            {bellButton}
            <button className="btn-logout" style={{ background: 'rgba(255,255,255,0.4)', color: '#1e3a5f', borderColor: 'rgba(255,255,255,0.5)' }} onClick={logout}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <ReminderBanner
            storageKey="pwReminder_pasien"
            message="Anda belum mengganti password sejak akun ini dibuat. Segera ganti password demi keamanan."
            actionLabel="Ganti Password"
            actionTo="/pasien/settings"
          />
          <ReminderBanner
            storageKey="profilReminder_pasien"
            message="Lengkapi profil Anda dulu sebelum bisa booking dokter (No. HP, NIK, tanggal lahir, gender, alamat)."
            actionLabel="Lengkapi Profil"
            actionTo="/pasien/profil"
            color="#3b82f6"
          />
          <div style={{ background: 'linear-gradient(135deg,#bfdbfe,#93c5fd)', borderRadius: 14, padding: '24px 28px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e3a5f' }}>Selamat Datang, {nama}! 👋</h2>
            <p style={{ fontSize: 14, color: '#3b5a8a', marginTop: 4 }}>Kelola kesehatan Anda dengan mudah</p>
          </div>

          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 12 }}>Appointment Mendatang</div>
          {upcoming.length === 0 && (
            <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '16px 20px', marginBottom: 10, fontSize: 13, color: 'var(--text-muted)' }}>
              Tidak ada appointment mendatang.{' '}
              <span onClick={() => navigate('/pasien/cari-dokter')} style={{ color: 'var(--blue)', fontWeight: 600, cursor: 'pointer' }}>Booking sekarang →</span>
            </div>
          )}
          {upcoming.map(a => (
            <div key={a.id} style={{ background: '#EFF6FF', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{a.dokter_nama} - {a.spesialis}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {new Date(a.tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · {a.jam?.slice(0, 5)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  onClick={() => a.status === 'refund' ? navigate('/pasien/chat-cs') : undefined}
                  style={{
                    background: a.status === 'refund' ? '#9D174D' : a.status === 'menunggu_bayar' ? '#f59e0b' : '#1d4ed8',
                    color: 'white', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    cursor: a.status === 'refund' ? 'pointer' : 'default'
                  }}
                >
                  {a.status === 'dikonfirmasi' ? 'Terkonfirmasi'
                    : a.status === 'menunggu_bayar' ? 'Menunggu Pembayaran'
                    : a.status === 'refund' ? 'Refund → Chat CS'
                    : 'Menunggu'}
                </span>
                {a.status === 'menunggu_bayar' && (
                  <button
                    onClick={() => setQrisTarget(a)}
                    style={{ background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    💳 Bayar Sekarang
                  </button>
                )}
              </div>
            </div>
          ))}

          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 12, marginTop: 20 }}>Riwayat Konsultasi Terakhir</div>
          {recent.length === 0 && (
            <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '16px 20px', marginBottom: 10, fontSize: 13, color: 'var(--text-muted)' }}>Belum ada riwayat konsultasi.</div>
          )}
          {recent.map(a => (
            <div key={a.id} style={{ background: '#F9FAFB', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{a.dokter_nama}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {new Date(a.tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · {a.jam?.slice(0, 5)} · {a.keluhan}
                </div>
              </div>
              <span onClick={() => navigate('/pasien/riwayat')} style={{ color: 'var(--blue)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Lihat Detail</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── POPUP RATING (muncul kalau ada pending) ── */}
      {ratingPending && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>⭐</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e3a5f', marginBottom: 4 }}>Bagaimana konsultasinya?</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
              Berikan penilaian untuk <strong>{ratingPending.dokter_nama}</strong>
            </div>

            {/* Bintang */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              {[1,2,3,4,5].map(n => (
                <span
                  key={n}
                  onClick={() => setBintang(n)}
                  onMouseEnter={() => setHoverBintang(n)}
                  onMouseLeave={() => setHoverBintang(0)}
                  style={{ fontSize: 36, cursor: 'pointer', color: n <= (hoverBintang || bintang) ? '#FBBF24' : '#D1D5DB', transition: 'color 0.15s' }}
                >★</span>
              ))}
            </div>

            {/* Komentar */}
            <textarea
              placeholder="Tulis komentar (opsional)..."
              value={komentar}
              onChange={e => setKomentar(e.target.value)}
              rows={3}
              style={{ width: '100%', borderRadius: 10, border: '1.5px solid #E5E7EB', padding: '10px 14px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }}
            />

            {ratingMsg && (
              <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 10, fontWeight: 600 }}>{ratingMsg}</div>
            )}

            <button
              onClick={submitRating}
              disabled={ratingLoading}
              style={{ width: '100%', padding: 13, background: ratingLoading ? '#6B7280' : '#1d4ed8', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {ratingLoading ? 'Menyimpan...' : 'Kirim Ulasan →'}
            </button>
          </div>
        </div>
      )}

      <QRISModal appointment={qrisTarget} onClose={() => setQrisTarget(null)} onConfirm={konfirmasiBayar} />
      <MamoruChat />
      {popup}
    </div>
  );
}
