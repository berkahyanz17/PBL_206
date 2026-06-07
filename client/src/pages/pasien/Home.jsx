import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PasienSidebar from '../../components/PasienSidebar';

const QUICK_REPLIES = [
  { label: '📅 Cara Booking Dokter',      text: 'Bagaimana cara booking dokter?' },
  { label: '📋 Lihat Hasil Konsultasi',   text: 'Di mana saya bisa lihat hasil konsultasi saya?' },
  { label: '👤 Ubah Profil',              text: 'Bagaimana cara mengubah profil saya?' },
  { label: '📞 Hubungi Support',          text: 'Saya ingin menghubungi support klinik.' },
];

export default function PasienHome() {
  const navigate  = useNavigate();
  const nama      = sessionStorage.getItem('pasienNama') || 'Pasien';
  const token     = sessionStorage.getItem('token') || '';

  const [chatOpen,  setChatOpen]  = useState(false);
  const [messages,  setMessages]  = useState([{ type: 'bot', text: `Halo, ${nama}! 👋 Ada yang bisa Mamoru bantu?` }]);
  const [showQuick, setShowQuick] = useState(true);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);

  // ── Kirim ke backend /api/mamoru ──────────────────────────────────────────
  async function sendToMamoru(userText) {
    if (!userText.trim() || loading) return;

    const userMsg = { type: 'user', text: userText.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setShowQuick(false);
    setLoading(true);

    try {
      const res = await fetch('/api/mamoru', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pesan: userText.trim(),
          // kirim history tanpa pesan user terbaru (sudah kita tambahkan di atas)
          history: messages
        })
      });

      const data = await res.json();
      const botText = data.reply || 'Maaf, ada gangguan. Coba lagi ya.';
      setMessages(prev => [...prev, { type: 'bot', text: botText }]);
    } catch {
      setMessages(prev => [...prev, { type: 'bot', text: '❌ Tidak bisa terhubung ke server. Periksa koneksi kamu.' }]);
    } finally {
      setLoading(false);
    }
  }

  function quickReply(text) { sendToMamoru(text); }
  function sendBot()        { sendToMamoru(input); }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-layout">
      <PasienSidebar />
      <div className="main-content">

        {/* Topbar */}
        <div className="topbar" style={{ background: 'linear-gradient(90deg,#7dd3fc,#38bdf8)' }}>
          <h1 style={{ color: '#1e3a5f' }}>Portal Pasien</h1>
          <div className="topbar-right">
            <button className="btn-notif" style={{ background: 'rgba(255,255,255,0.4)' }}>🔔</button>
            <button
              className="btn-logout"
              style={{ background: 'rgba(255,255,255,0.4)', color: '#1e3a5f', borderColor: 'rgba(255,255,255,0.5)' }}
              onClick={() => navigate('/pasien/login')}
            >🚪 Logout</button>
          </div>
        </div>

        {/* Content */}
        <div className="content-area">
          <div style={{ background: 'linear-gradient(135deg,#bfdbfe,#93c5fd)', borderRadius: 14, padding: '24px 28px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e3a5f' }}>Selamat Datang, {nama}! 👋</h2>
            <p style={{ fontSize: 14, color: '#3b5a8a', marginTop: 4 }}>Kelola kesehatan Anda dengan mudah</p>
          </div>

          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 12 }}>Appointment Mendatang</div>
          <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Dr. Sarah Melati - Umum</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Kamis, 22 Mei 2026 · 10:00 WIB</div>
            </div>
            <span style={{ background: '#1d4ed8', color: 'white', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Terkonfirmasi</span>
          </div>

          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 12, marginTop: 20 }}>Riwayat Konsultasi Terakhir</div>
          <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Dr. Sarah Melati</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Kamis, 22 Mei 2026 · Flu</div>
            </div>
            <span onClick={() => navigate('/pasien/riwayat')} style={{ color: 'var(--blue)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Lihat Detail</span>
          </div>
        </div>
      </div>

      {/* FAB */}
      <div
        onClick={() => setChatOpen(!chatOpen)}
        style={{ position: 'fixed', bottom: 28, right: 28, width: 52, height: 52, borderRadius: '50%', background: '#e0f2fe', border: '2px solid #7dd3fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, cursor: 'pointer', zIndex: 200, boxShadow: '0 4px 16px rgba(56,189,248,0.3)' }}
      >💬</div>

      {/* Chatbot window */}
      {chatOpen && (
        <div style={{ position: 'fixed', bottom: 90, right: 28, width: 340, background: 'white', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideUp 0.3s ease', zIndex: 300 }}>

          {/* Header */}
          <div style={{ background: '#3b82f6', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🤖</span>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Mamoru</span>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginLeft: 4 }}>• AI Assistant</span>
            <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer', marginLeft: 'auto' }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ minHeight: 200, maxHeight: 280, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  background: m.type === 'bot' ? '#F3F4F6' : '#1d4ed8',
                  color: m.type === 'bot' ? 'inherit' : 'white',
                  borderRadius: m.type === 'bot' ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                  padding: '10px 14px',
                  fontSize: 13,
                  maxWidth: '85%',
                  alignSelf: m.type === 'bot' ? 'flex-start' : 'flex-end',
                  whiteSpace: 'pre-line'
                }}
              >{m.text}</div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{ background: '#F3F4F6', borderRadius: '4px 12px 12px 12px', padding: '10px 14px', fontSize: 13, maxWidth: '85%', alignSelf: 'flex-start', color: '#6B7280' }}>
                ⏳ Mamoru sedang mengetik...
              </div>
            )}
          </div>

          {/* Quick replies */}
          {showQuick && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 16px 10px' }}>
              {QUICK_REPLIES.map(q => (
                <button
                  key={q.label}
                  onClick={() => quickReply(q.text)}
                  style={{ padding: '10px 14px', background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
                >{q.label}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              style={{ flex: 1, padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: 20, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              placeholder="Ketik pesan..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && sendBot()}
              disabled={loading}
            />
            <button
              onClick={sendBot}
              disabled={loading}
              style={{ width: 36, height: 36, borderRadius: '50%', background: loading ? '#93c5fd' : '#1d4ed8', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 16, color: 'white' }}
            >➤</button>
          </div>
        </div>
      )}
    </div>
  );
}
