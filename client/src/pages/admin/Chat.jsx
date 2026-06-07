import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { apiFetch } from '../../utils/api';

const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#6366f1'];

export default function AdminChat() {
  const navigate = useNavigate();
  const [dokters, setDokters] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const adminUser = JSON.parse(sessionStorage.getItem('adminUser') || '{}');
  const bottomRef = useRef();

  useEffect(() => {
    async function loadDokters() {
      const res = await apiFetch('/dokter');
      if (res?.success) { setDokters(res.data); if (res.data.length > 0) setActive(res.data[0]); }
    }
    loadDokters();
  }, []);

  useEffect(() => {
    if (!active) return;
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [active]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function loadMessages() {
    if (!active) return;
    const res = await apiFetch(`/chat/admin/${adminUser.id}/dokter/${active.id}`);
    if (res?.success) setMessages(res.data);
  }

  async function send() {
    if (!input.trim() || !active) return;
    await apiFetch('/chat', {
      method: 'POST',
      body: JSON.stringify({ sender_role: 'admin', sender_id: adminUser.id, receiver_role: 'dokter', receiver_id: active.id, pesan: input.trim() })
    });
    setInput('');
    loadMessages();
  }

  function logout() { sessionStorage.clear(); navigate('/admin/login'); }

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--navy)' }}>
          <h1>Chat Dokter</h1>
          <div className="topbar-right">
            <button className="btn-notif">🔔</button>
            <button className="btn-logout" onClick={logout}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', background: 'white', borderRadius: 14, overflow: 'hidden', minHeight: 500, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ borderRight: '1px solid var(--border)', padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>Chat dengan Dokter</div>
              {dokters.map((d, i) => (
                <div key={d.id} onClick={() => setActive(d)}
                  style={{ padding: 12, borderRadius: 10, cursor: 'pointer', marginBottom: 4, background: active?.id === d.id ? '#EFF6FF' : '', borderLeft: active?.id === d.id ? '3px solid var(--navy)' : '3px solid transparent', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar" style={{ background: colors[i % colors.length], width: 30, height: 30, fontSize: 11 }}>{d.nama?.charAt(0)}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{d.nama}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {active && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar" style={{ background: colors[dokters.findIndex(d => d.id === active.id) % colors.length], width: 32, height: 32, fontSize: 11 }}>{active.nama?.charAt(0)}</div>
                  {active.nama}
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
    </div>
  );
}
