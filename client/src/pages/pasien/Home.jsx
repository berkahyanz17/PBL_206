import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PasienSidebar from '../../components/PasienSidebar';

const botReplies = {
  'Cara Booking Dokter': 'Untuk booking dokter:\n1. Pilih menu "Cari Dokter"\n2. Pilih dokter yang sesuai\n3. Klik tombol Booking\n4. Isi keluhan & pilih waktu\n5. Konfirmasi booking',
  'Lihat Hasil Konsultasi': 'Kamu bisa lihat riwayat konsultasi di menu "Riwayat Konsultasi" di sidebar kiri.',
  'Ubah Profil': 'Untuk ubah profil, klik menu "Profil Saya" di sidebar kiri.',
  'Hubungi Support': 'Hubungi kami di:\n📞 Darurat: (021) 119\n📧 support@healthsync.id',
};

export default function PasienHome() {
  const navigate = useNavigate();
  const nama = sessionStorage.getItem('pasienNama') || 'Pasien';
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([{ type: 'bot', text: 'Halo! Ada yang bisa saya bantu?' }]);
  const [showQuick, setShowQuick] = useState(true);
  const [input, setInput] = useState('');

  function quickReply(text) {
    setMessages(prev => [...prev, { type: 'user', text }, { type: 'bot', text: botReplies[text] || 'Baik, saya akan bantu!' }]);
    setShowQuick(false);
  }
  function sendBot() {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { type: 'user', text: input.trim() }, { type: 'bot', text: 'Terima kasih pesannya! Tim kami akan segera membantu. 😊' }]);
    setInput('');
  }

  return (
    <div className="dashboard-layout">
      <PasienSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'linear-gradient(90deg,#7dd3fc,#38bdf8)' }}>
          <h1 style={{ color: '#1e3a5f' }}>Portal Pasien</h1>
          <div className="topbar-right">
            <button className="btn-notif" style={{ background: 'rgba(255,255,255,0.4)' }}>🔔</button>
            <button className="btn-logout" style={{ background: 'rgba(255,255,255,0.4)', color: '#1e3a5f', borderColor: 'rgba(255,255,255,0.5)' }} onClick={() => navigate('/pasien/login')}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div style={{ background: 'linear-gradient(135deg,#bfdbfe,#93c5fd)', borderRadius: 14, padding: '24px 28px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e3a5f' }}>Selamat Datang, {nama}! 👋</h2>
            <p style={{ fontSize: 14, color: '#3b5a8a', marginTop: 4 }}>Kelola kesehatan Anda dengan mudah</p>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 12 }}>Appointment Mendatang</div>
          <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div><div style={{ fontSize: 14, fontWeight: 600 }}>Dr. Sarah Melati - Umum</div><div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Kamis, 22 Mei 2026 · 10:00 WIB</div></div>
            <span style={{ background: '#1d4ed8', color: 'white', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Terkonfirmasi</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 12, marginTop: 20 }}>Riwayat Konsultasi Terakhir</div>
          <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div><div style={{ fontSize: 14, fontWeight: 600 }}>Dr. Sarah Melati</div><div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Kamis, 22 Mei 2026 · Flu</div></div>
            <span onClick={() => navigate('/pasien/riwayat')} style={{ color: 'var(--blue)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Lihat Detail</span>
          </div>
        </div>
      </div>

      {/* FAB */}
      <div onClick={() => setChatOpen(!chatOpen)} style={{ position: 'fixed', bottom: 28, right: 28, width: 52, height: 52, borderRadius: '50%', background: '#e0f2fe', border: '2px solid #7dd3fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, cursor: 'pointer', zIndex: 200, boxShadow: '0 4px 16px rgba(56,189,248,0.3)' }}>💬</div>

      {/* Chatbot */}
      {chatOpen && (
        <div style={{ position: 'fixed', bottom: 90, right: 28, width: 340, background: 'white', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideUp 0.3s ease', zIndex: 300 }}>
          <div style={{ background: '#3b82f6', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🤖</span><span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Mamoru</span>
            <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer', marginLeft: 'auto' }}>✕</button>
          </div>
          <div style={{ minHeight: 200, maxHeight: 280, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ background: m.type === 'bot' ? '#F3F4F6' : '#1d4ed8', color: m.type === 'bot' ? 'inherit' : 'white', borderRadius: m.type === 'bot' ? '4px 12px 12px 12px' : '12px 4px 12px 12px', padding: '10px 14px', fontSize: 13, maxWidth: '85%', alignSelf: m.type === 'bot' ? 'flex-start' : 'flex-end', whiteSpace: 'pre-line' }}>{m.text}</div>
            ))}
          </div>
          {showQuick && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 16px 10px' }}>
              {Object.keys(botReplies).map(k => (
                <button key={k} onClick={() => quickReply(k)} style={{ padding: '10px 14px', background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>{k === 'Cara Booking Dokter' ? '📅' : k === 'Lihat Hasil Konsultasi' ? '📋' : k === 'Ubah Profil' ? '👤' : '📞'} {k}</button>
              ))}
            </div>
          )}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input style={{ flex: 1, padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: 20, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              placeholder="Ketik Pesan...." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendBot()} />
            <button onClick={sendBot} style={{ width: 36, height: 36, borderRadius: '50%', background: '#1d4ed8', border: 'none', cursor: 'pointer', fontSize: 16, color: 'white' }}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}
