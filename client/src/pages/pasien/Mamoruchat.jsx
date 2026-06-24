import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../utils/api';

const QUICK_REPLIES = [
  { label: '📅 Cara Booking Dokter',     text: 'Bagaimana cara booking dokter?' },
  { label: '📋 Lihat Hasil Konsultasi',  text: 'Di mana saya bisa lihat hasil konsultasi saya?' },
  { label: '👤 Ubah Profil',             text: 'Bagaimana cara mengubah profil saya?' },
  { label: '🕐 Jam & Kontak Klinik',     text: 'Apa jam operasional dan kontak klinik?' },
  { label: '📞 Hubungi Support',         text: 'Saya ingin menghubungi support klinik.' },
];

const INITIAL_MSG = (nama) => ({
  type: 'bot',
  text: `Halo, ${nama}! 👋 Saya *Mamoru*, asisten virtual HealthSync Clinic.\nAda yang bisa saya bantu hari ini?`,
});

// ─── Render teks dengan bold (*text*) sederhana ──────────────────────────
function BotText({ text }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <span style={{ whiteSpace: 'pre-line' }}>
      {parts.map((p, i) =>
        p.startsWith('*') && p.endsWith('*')
          ? <strong key={i}>{p.slice(1, -1)}</strong>
          : p
      )}
    </span>
  );
}

// ─── Typing dots animation ────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 2px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: '#93c5fd',
          animation: 'mamoroBounce 1.2s infinite ease-in-out',
          animationDelay: `${i * 0.2}s`
        }} />
      ))}
      <style>{`
        @keyframes mamoroBounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40%            { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function MamoruChat() {
  const nama  = localStorage.getItem('pasienNama') || 'Pasien';
  const token = localStorage.getItem('accessToken') || '';

  const [chatOpen,  setChatOpen]  = useState(false);
  const [messages,  setMessages]  = useState([INITIAL_MSG(nama)]);
  const [showQuick, setShowQuick] = useState(true);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [unread,    setUnread]    = useState(0);   // badge counter

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input saat chat dibuka
  useEffect(() => {
    if (chatOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [chatOpen]);

  function resetChat() {
    setMessages([INITIAL_MSG(nama)]);
    setShowQuick(true);
    setInput('');
  }

  async function sendToMamoru(userText) {
    const text = userText.trim();
    if (!text || loading) return;
  
    setMessages(prev => [...prev, { type: 'user', text }]);
    setInput('');
    setShowQuick(false);
    setLoading(true);
  
    try {
      const data = await apiFetch('/mamoru', {  // ✅ use apiFetch, no /api prefix, no manual auth
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pesan: text, history: messages, pasienNama: nama })
      });
  
      const reply = data.reply || 'Maaf, ada gangguan. Coba lagi ya.';  // ✅ data is already parsed
      setMessages(prev => [...prev, { type: 'bot', text: reply }]);
      if (!chatOpen) setUnread(n => n + 1);
    } catch (err) {
      console.error('[MamoruChat] Error:', err.message);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: '❌ Tidak bisa terhubung ke server. Pastikan koneksi internet kamu aktif.'
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Keyframe animasi slide-up ── */}
      <style>{`
        @keyframes mamoruSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes mamoruFabPulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(56,189,248,0.35); }
          50%       { box-shadow: 0 4px 24px rgba(56,189,248,0.6);  }
        }
      `}</style>

      {/* ── FAB ── */}
      <div
        onClick={() => setChatOpen(o => !o)}
        title="Mamoru — AI Assistant"
        style={{
          position: 'fixed', bottom: 28, right: 28,
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #bfdbfe, #38bdf8)',
          border: '2px solid #7dd3fc',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, cursor: 'pointer', zIndex: 200,
          animation: 'mamoruFabPulse 3s infinite',
          transition: 'transform 0.15s',
        }}
      >
        {chatOpen ? '✕' : '💬'}
        {/* Badge unread */}
        {!chatOpen && unread > 0 && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            background: '#ef4444', color: 'white',
            borderRadius: '50%', width: 18, height: 18,
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{unread}</div>
        )}
      </div>

      {/* ── Chat window ── */}
      {chatOpen && (
        <div style={{
          position: 'fixed', bottom: 90, right: 28, width: 340,
          background: 'white', borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', zIndex: 300,
          animation: 'mamoruSlideUp 0.25s ease',
          maxHeight: 520,
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16
            }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 14, lineHeight: 1 }}>Mamoru</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 }}>AI Assistant · HealthSync</div>
            </div>
            {/* Tombol reset */}
            <button
              onClick={resetChat}
              title="Reset chat"
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none',
                color: 'white', fontSize: 14, cursor: 'pointer',
                borderRadius: 6, padding: '4px 8px',
                transition: 'background 0.2s'
              }}
            >🔄</button>
            <button
              onClick={() => setChatOpen(false)}
              style={{
                background: 'none', border: 'none',
                color: 'white', fontSize: 18, cursor: 'pointer',
                marginLeft: 4
              }}
            >✕</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: '14px 14px 8px',
            display: 'flex', flexDirection: 'column', gap: 10,
            minHeight: 180, maxHeight: 300,
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: m.type === 'bot' ? 'row' : 'row-reverse',
                alignItems: 'flex-end', gap: 6,
              }}>
                {m.type === 'bot' && (
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#eff6ff', border: '1.5px solid #bfdbfe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, flexShrink: 0,
                  }}>🤖</div>
                )}
                <div style={{
                  background: m.type === 'bot' ? '#F3F4F6' : 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                  color: m.type === 'bot' ? '#1f2937' : 'white',
                  borderRadius: m.type === 'bot' ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                  padding: '9px 13px', fontSize: 13,
                  maxWidth: '80%', lineHeight: 1.5,
                }}>
                  {m.type === 'bot' ? <BotText text={m.text} /> : m.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: '#eff6ff', border: '1.5px solid #bfdbfe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12
                }}>🤖</div>
                <div style={{
                  background: '#F3F4F6', borderRadius: '4px 12px 12px 12px',
                  padding: '9px 13px',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {showQuick && !loading && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 5,
              padding: '0 12px 10px', borderTop: '1px solid #f0f0f0'
            }}>
              <div style={{ fontSize: 11, color: '#9ca3af', padding: '8px 0 2px' }}>Pilih pertanyaan cepat:</div>
              {QUICK_REPLIES.map(q => (
                <button key={q.label} onClick={() => sendToMamoru(q.text)}
                  style={{
                    padding: '9px 12px', background: '#F9FAFB',
                    border: '1px solid #e5e7eb', borderRadius: 10,
                    fontSize: 12, textAlign: 'left', cursor: 'pointer',
                    fontFamily: 'inherit', color: '#374151',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.target.style.background = '#eff6ff'; e.target.style.borderColor = '#bfdbfe'; }}
                  onMouseLeave={e => { e.target.style.background = '#F9FAFB'; e.target.style.borderColor = '#e5e7eb'; }}
                >{q.label}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <input
              ref={inputRef}
              style={{
                flex: 1, padding: '9px 14px',
                border: '1.5px solid #e5e7eb', borderRadius: 20,
                fontSize: 13, fontFamily: 'inherit', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e  => e.target.style.borderColor = '#3b82f6'}
              onBlur={e   => e.target.style.borderColor = '#e5e7eb'}
              placeholder="Ketik pesan..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !loading && sendToMamoru(input)}
              disabled={loading}
            />
            <button
              onClick={() => sendToMamoru(input)}
              disabled={loading || !input.trim()}
              title="Kirim"
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: loading || !input.trim() ? '#93c5fd' : '#1d4ed8',
                border: 'none',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: 15, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, transform 0.1s',
                flexShrink: 0,
              }}
            >➤</button>
          </div>
        </div>
      )}
    </>
  );
}
