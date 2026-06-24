import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { apiFetch } from '../../utils/api';
import { useNotif } from '../../components/NotifPopup';

const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#6366f1'];

export default function AdminChat() {
  const navigate = useNavigate();
  const [dokters, setDokters] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const bottomRef = useRef();
  const { bellButton, popup } = useNotif('notif-admin');

  useEffect(() => {
    loadDokters(true);
    const interval = setInterval(() => loadDokters(false), 5000);
    return () => clearInterval(interval);
  }, []);

  async function markRead(dokterId) {
    await apiFetch(`/chat/read/${dokterId}`, { method: 'PATCH' });
  }

  async function loadDokters(isFirstLoad) {
    const res = await apiFetch('/chat/preview');
    if (res?.success) {
      setDokters(res.data);
      if (isFirstLoad && res.data.length > 0) {
        const first = res.data[0];
        setActive(first);
        if (first.unread_count > 0) await markRead(first.dokter_id);
      }
    }
  }

  function isOnline(lastActive) {
    if (!lastActive) return false;
    return (Date.now() - new Date(lastActive).getTime()) < 2 * 60 * 1000;
  }

  useEffect(() => {
    if (!active) return;
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [active]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function loadMessages() {
    if (!active) return;
    const res = await apiFetch(`/chat/admin/${adminUser.id}/dokter/${active.dokter_id}`);
    if (res?.success) setMessages(res.data);
  }

  async function selectDokter(d) {
    setActive(d);
    if (d.unread_count > 0) {
      await markRead(d.dokter_id);
      loadDokters(false);
    }
  }

  async function send() {
    if (!input.trim() || !active) return;
    await apiFetch('/chat', {
      method: 'POST',
      body: JSON.stringify({ sender_role: 'admin', sender_id: adminUser.id, receiver_role: 'dokter', receiver_id: active.dokter_id, pesan: input.trim() })
    });
    setInput('');
    loadMessages();
  }

  async function logout() { const rt = localStorage.getItem('refreshToken'); if (rt) { await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) }); } sessionStorage.clear(); localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); navigate('/admin/login'); }

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--navy)' }}>
          <h1>Chat Dokter</h1>
          <div className="topbar-right">
            {bellButton}<button className="btn-logout" onClick={logout}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', background: 'white', borderRadius: 14, overflow: 'hidden', minHeight: 500, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ borderRight: '1px solid var(--border)', padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>Chat dengan Dokter</div>
              {dokters.map((d, i) => (
                <div key={d.dokter_id} onClick={() => selectDokter(d)}
                  style={{ padding: 12, borderRadius: 10, cursor: 'pointer', marginBottom: 4, background: active?.dokter_id === d.dokter_id ? '#EFF6FF' : '', borderLeft: active?.dokter_id === d.dokter_id ? '3px solid var(--navy)' : '3px solid transparent', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'relative' }}>
                    <div className="avatar" style={{ background: colors[i % colors.length], width: 30, height: 30, fontSize: 11 }}>{d.dokter_nama?.charAt(0)}</div>
                    <div style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%', background: isOnline(d.last_active) ? '#22c55e' : '#9ca3af', border: '2px solid white' }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{d.dokter_nama}</div>
                  {d.unread_count > 0 && (
                    <div style={{ background: '#ef4444', color: 'white', fontSize: 11, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                      {d.unread_count}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {active && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar" style={{ background: colors[dokters.findIndex(d => d.dokter_id === active.dokter_id) % colors.length], width: 32, height: 32, fontSize: 11 }}>{active.dokter_nama?.charAt(0)}</div>
                  <div>
                    <div>{active.dokter_nama}</div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: isOnline(active.last_active) ? '#22c55e' : 'var(--text-muted)' }}>
                      {isOnline(active.last_active) ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
              )}
              <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 300, overflowY: 'auto' }}>
                {messages.map((m, i) => {
                  const isSent = m.sender_role === 'admin';
                  return (
                    <div key={i} className={`msg ${isSent ? 'sent' : 'received'}`}
                      style={isSent ? { background: 'var(--navy)', color: 'white', alignSelf: 'flex-end', borderRadius: '12px 4px 12px 12px' } : {}}>
                      {m.pesan}
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="chat-input-row">
                <input className="chat-input" placeholder="Ketik pesan" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
                <button onClick={send} style={{ padding: '10px 20px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Kirim</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {popup}
    </div>
  );
}
