import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { apiFetch } from '../../utils/api';
import { useNotif } from '../../components/NotifPopup';

const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#6366f1'];

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminChat() {
  const navigate = useNavigate();
  const [dokters, setDokters] = useState([]);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const bottomRef = useRef();
  const { bellButton, popup } = useNotif('notif-admin');

  useEffect(() => {
    loadDokters();
    const interval = setInterval(loadDokters, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!active) return;
    loadMessages(true);
    const interval = setInterval(() => loadMessages(false), 5000);
    return () => clearInterval(interval);
  }, [active]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function loadDokters() {
    const [resDokter, resPreview] = await Promise.all([
      apiFetch('/dokter'),
      apiFetch('/chat/preview')
    ]);
    if (!resDokter?.success) return;
    const previews = resPreview?.success ? resPreview.data : [];
    const merged = resDokter.data.map(d => {
      const p = previews.find(pv => pv.dokter_id === d.id);
      return { ...d, lastMsg: p?.pesan || '', lastTime: p?.created_at || null };
    }).sort((a, b) => new Date(b.lastTime || 0) - new Date(a.lastTime || 0));
    setDokters(merged);
    setActive(prev => prev ?? merged[0] ?? null);
  }

  async function loadMessages(showLoading) {
    if (!active) return;
    if (showLoading) setLoadingMsgs(true);
    const res = await apiFetch(`/chat/admin/${adminUser.id}/dokter/${active.id}`);
    if (res?.success) setMessages(res.data);
    if (showLoading) setLoadingMsgs(false);
  }

  async function send() {
    if (!input.trim() || !active) return;
    await apiFetch('/chat', {
      method: 'POST',
      body: JSON.stringify({ sender_role: 'admin', sender_id: adminUser.id, receiver_role: 'dokter', receiver_id: active.id, pesan: input.trim() })
    });
    setInput('');
    loadMessages(false);
  }

  async function logout() { const rt = localStorage.getItem('refreshToken'); if (rt) { await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) }); } sessionStorage.clear(); localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); navigate('/admin/login'); }

  const filteredDokters = dokters.filter(d => d.nama?.toLowerCase().includes(search.toLowerCase()));

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
            <div style={{ borderRight: '1px solid var(--border)', padding: 16, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>Chat dengan Dokter</div>
              <input
                placeholder="Cari dokter..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, marginBottom: 12, fontFamily: 'inherit' }}
              />
              {filteredDokters.map((d) => {
                const i = dokters.findIndex(x => x.id === d.id);
                return (
                  <div key={d.id} onClick={() => setActive(d)}
                    style={{ padding: 12, borderRadius: 10, cursor: 'pointer', marginBottom: 4, background: active?.id === d.id ? '#EFF6FF' : '', borderLeft: active?.id === d.id ? '3px solid var(--navy)' : '3px solid transparent', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar" style={{ background: colors[i % colors.length], width: 30, height: 30, fontSize: 11, flexShrink: 0 }}>{d.nama?.charAt(0)}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{d.nama}</div>
                      {d.lastMsg && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {d.lastMsg}
                        </div>
                      )}
                    </div>
                    {d.lastTime && <div style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{fmtTime(d.lastTime)}</div>}
                  </div>
                );
              })}
              {filteredDokters.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>Dokter tidak ditemukan.</div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {active && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar" style={{ background: colors[dokters.findIndex(d => d.id === active.id) % colors.length], width: 32, height: 32, fontSize: 11 }}>{active.nama?.charAt(0)}</div>
                  {active.nama}
                </div>
              )}
              <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 300, overflowY: 'auto' }}>
                {loadingMsgs ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>Memuat pesan...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>Belum ada pesan. Mulai percakapan!</div>
                ) : messages.map((m, i) => {
                  const isSent = m.sender_role === 'admin';
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isSent ? 'flex-end' : 'flex-start' }}>
                      <div className={`msg ${isSent ? 'sent' : 'received'}`}
                        style={isSent ? { background: 'var(--navy)', color: 'white', borderRadius: '12px 4px 12px 12px' } : {}}>
                        {m.pesan}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{fmtTime(m.created_at)}</div>
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
