import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { apiFetch } from '../../utils/api';
import { useNotif } from '../../components/NotifPopup';

function fmtTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function labelJenis(t) {
  return t.jenis === 'refund' ? '💸 Refund' : `🎫 ${t.kategori || 'Komplain'}`;
}

function labelStatus(t) {
  if (t.status === 'menunggu_approval') return 'Menunggu approval';
  if (t.status === 'ditutup') return 'Ditutup';
  return 'Aktif';
}

export default function AdminChatCS() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const scrollRef = useRef();
  const hasScrolledInitial = useRef(false);
  const { bellButton, popup } = useNotif('notif-admin');

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!active) return;
    hasScrolledInitial.current = false;
    setConfirmClose(false);
    loadMessages(true);
    const interval = setInterval(() => loadMessages(false), 5000);
    return () => clearInterval(interval);
  }, [active?.id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function loadTickets() {
    const res = await apiFetch('/cs-tickets');
    if (!res?.success) return;
    setTickets(res.data);
    setActive(prev => {
      if (prev) {
        // refresh status objek aktif dari data terbaru
        const updated = res.data.find(t => t.id === prev.id);
        return updated || prev;
      }
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      return isMobile ? null : (res.data[0] ?? null);
    });
  }

  async function loadMessages(showLoading) {
    if (!active) return;
    if (showLoading) setLoadingMsgs(true);
    const res = await apiFetch(`/cs-tickets/${active.id}/messages`);
    if (res?.success) setMessages(res.data);
    if (showLoading) setLoadingMsgs(false);
  }

  async function send() {
    const text = input.trim();
    if (!text || !active) return;
    setInput('');
    const res = await apiFetch(`/cs-tickets/${active.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ pesan: text })
    });
    if (res?.success === false) { alert(res.message || 'Gagal mengirim.'); return; }
    loadMessages(false);
  }

  async function approve(id) {
    const res = await apiFetch(`/cs-tickets/${id}/approve`, { method: 'PATCH' });
    if (res?.success === false) { alert(res.message || 'Gagal approve.'); return; }
    loadTickets();
    loadMessages(false);
  }

  async function closeTicket(id) {
    const res = await apiFetch(`/cs-tickets/${id}/close`, { method: 'PATCH' });
    if (res?.success === false) { alert(res.message || 'Gagal menutup tiket.'); return; }
    setConfirmClose(false);
    loadTickets();
    loadMessages(false);
  }

  async function logout() { const rt = localStorage.getItem('refreshToken'); if (rt) { await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) }); } sessionStorage.clear(); localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); navigate('/admin/login'); }

  function selectTicket(t) { setActive(t); }

  const filtered = tickets.filter(t => (t.pasien_nama || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--navy)' }}>
          <h1>Chat CS Pasien</h1>
          <div className="topbar-right">
            {bellButton}<button className="btn-logout" onClick={logout}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div className={`chat-panel with-list${active ? ' mobile-chat-open' : ''}`}>
            <div className="chat-sidebar">
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>Tiket CS / Refund Pasien</div>
              <input
                placeholder="Cari nama pasien..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, marginBottom: 12, fontFamily: 'inherit' }}
              />
              {filtered.map(t => (
                <div key={t.id} onClick={() => selectTicket(t)}
                  style={{ padding: 12, borderRadius: 10, cursor: 'pointer', marginBottom: 4, background: active?.id === t.id ? '#EFF6FF' : '', borderLeft: active?.id === t.id ? '3px solid var(--navy)' : '3px solid transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{t.pasien_nama}</span>
                    {t.status === 'menunggu_approval' && (
                      <span style={{ background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 10, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{labelJenis(t)} · {labelStatus(t)}</div>
                  {t.last_pesan && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                      {t.last_sender === 'admin' ? 'Anda: ' : ''}{t.last_pesan}
                    </div>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>Belum ada tiket CS dari pasien.</div>
              )}
            </div>

            <div className="chat-main">
              {active && (
                <div className="chat-header">
                  <button className="chat-back-btn" onClick={() => setActive(null)} title="Kembali ke daftar tiket">←</button>
                  <div className="avatar" style={{ background: active.jenis === 'refund' ? '#9D174D' : '#3b82f6', width: 32, height: 32, fontSize: 14 }}>
                    {active.jenis === 'refund' ? '💸' : '🎫'}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{active.pasien_nama}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{labelJenis(active)} · {labelStatus(active)}</div>
                  </div>
                </div>
              )}

              <div className="chat-messages-wrap">
                <div className="chat-messages" ref={scrollRef}>
                  {!active ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>Pilih tiket dari daftar pasien di sebelah kiri.</div>
                  ) : loadingMsgs ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>Memuat pesan...</div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>Belum ada pesan.</div>
                  ) : messages.map(m => (
                    <div key={m.id} className={`msg-row ${m.sender_role === 'admin' ? 'sent' : 'received'}`}>
                      <div className={`msg ${m.sender_role === 'admin' ? 'sent' : 'received'}`}>{m.pesan}</div>
                      <div className="msg-meta">{fmtTime(m.created_at)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {active && active.status === 'menunggu_approval' && (
                <div className="chat-input-row">
                  <button onClick={() => approve(active.id)} style={{ width: '100%', padding: 10, background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✅ Approve tiket & mulai chat
                  </button>
                </div>
              )}

              {active && active.status === 'ditutup' && (
                <div className="chat-input-row">
                  <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>Tiket ini sudah ditutup.</span>
                </div>
              )}

              {active && active.status === 'aktif' && !confirmClose && (
                <div className="chat-input-row">
                  <input className="chat-input" placeholder="Ketik balasan ke pasien..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
                  <button onClick={send} style={{ padding: '10px 20px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Kirim</button>
                  <button onClick={() => setConfirmClose(true)} title="Tutup tiket" style={{ background: '#F3F4F6', border: 'none', width: 38, height: 38, borderRadius: '50%', fontSize: 15, cursor: 'pointer', flexShrink: 0 }}>🔒</button>
                </div>
              )}

              {active && active.status === 'aktif' && confirmClose && (
                <div className="chat-input-row">
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)', flex: 1 }}>Yakin tutup tiket ini? Pasien tidak bisa lagi mengirim pesan.</span>
                  <button onClick={() => closeTicket(active.id)} style={{ padding: '10px 16px', background: '#DC2626', color: 'white', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Ya, Tutup</button>
                  <button onClick={() => setConfirmClose(false)} style={{ background: '#F3F4F6', border: 'none', padding: '0 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer' }}>Batal</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {popup}
    </div>
  );
}
