import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DokterSidebar from '../../components/DokterSidebar';
import { apiFetch } from '../../utils/api';
import { useNotif } from '../../components/NotifPopup';

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function DokterChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [adminId, setAdminId] = useState(1);
  const { bellButton, popup } = useNotif('notif-dokter');
  const user = JSON.parse(localStorage.getItem('dokterUser') || '{}');
  const bottomRef = useRef();

  useEffect(() => {
    loadMessages(true);
    const interval = setInterval(() => loadMessages(false), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function loadMessages(showLoading) {
    if (showLoading) setLoadingMsgs(true);
    const res = await apiFetch(`/chat/dokter/${user.id}/admin/${adminId}`);
    if (res?.success) setMessages(res.data);
    if (showLoading) setLoadingMsgs(false);
  }

  async function send() {
    if (!input.trim()) return;
    await apiFetch('/chat', {
      method: 'POST',
      body: JSON.stringify({ sender_role: 'dokter', sender_id: user.id, receiver_role: 'admin', receiver_id: adminId, pesan: input.trim() })
    });
    setInput('');
    loadMessages(false);
  }

  async function logout() { const rt = localStorage.getItem('refreshToken'); if (rt) { await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) }); } sessionStorage.clear(); localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); navigate('/dokter/login'); }

  return (
    <div className="dashboard-layout">
      <DokterSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--green)' }}>
          <h1>Chat Admin</h1>
          <div className="topbar-right">
            {bellButton}<button className="btn-logout" onClick={logout}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ background: '#F9FAFB', padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar" style={{ background: '#22c55e', width: 36, height: 36, fontSize: 13 }}>AK</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Admin Klinik</div>
            </div>
            <div style={{ minHeight: 340, maxHeight: 400, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loadingMsgs ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>Memuat pesan...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>Belum ada pesan. Mulai percakapan!</div>
              ) : messages.map((m, i) => {
                const isSent = m.sender_role === 'dokter';
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isSent ? 'flex-end' : 'flex-start' }}>
                    <div className={`msg ${isSent ? 'sent' : 'received'}`}
                      style={isSent ? { background: 'var(--green-dark)', color: 'white', borderRadius: '12px 4px 12px 12px' } : {}}>
                      {m.pesan}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{fmtTime(m.created_at)}</div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="chat-input-row">
              <input className="chat-input" placeholder="Ketik disini" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
              <button onClick={send} style={{ padding: '10px 20px', background: 'var(--green-dark)', color: 'white', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Kirim</button>
            </div>
          </div>
        </div>
      </div>
      {popup}
    </div>
  );
}
