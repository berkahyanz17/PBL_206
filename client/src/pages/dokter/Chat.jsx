import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DokterSidebar from '../../components/DokterSidebar';
import { apiFetch } from '../../utils/api';
import { useNotif } from '../../components/NotifPopup';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const NEAR_BOTTOM_PX = 80;

function fmtTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function dateLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return 'Hari ini';
  if (sameDay(d, yesterday)) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function withDateSeparators(messages) {
  const out = [];
  let lastDay = null;
  for (const m of messages) {
    const day = new Date(m.created_at).toDateString();
    if (day !== lastDay) {
      out.push({ type: 'sep', key: `sep-${day}`, label: dateLabel(m.created_at) });
      lastDay = day;
    }
    out.push({ type: 'msg', key: m.id, data: m });
  }
  return out;
}

export default function DokterChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [showJumpBtn, setShowJumpBtn] = useState(false);
  const [adminId, setAdminId] = useState(1);
  const { bellButton, popup } = useNotif('notif-dokter');
  const user = JSON.parse(localStorage.getItem('dokterUser') || '{}');
  const scrollRef = useRef();
  const bottomRef = useRef();
  const fileInputRef = useRef();

  useEffect(() => {
    loadMessages(true);
    markRead();
    const interval = setInterval(() => loadMessages(false), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom < NEAR_BOTTOM_PX) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowJumpBtn(false);
    } else {
      setShowJumpBtn(true);
    }
  }, [messages]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowJumpBtn(distFromBottom > NEAR_BOTTOM_PX);
  }

  function jumpToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowJumpBtn(false);
  }

  async function loadMessages(showLoading) {
    if (showLoading) setLoadingMsgs(true);
    const res = await apiFetch(`/chat/dokter/${user.id}/admin/${adminId}`);
    if (res?.success) setMessages(res.data);
    if (showLoading) setLoadingMsgs(false);
  }

  async function markRead() {
    await apiFetch(`/chat/read-admin/${user.id}`, { method: 'PATCH' });
  }

  async function send() {
    if (!input.trim() && !file) return;
    const form = new FormData();
    form.append('sender_role', 'dokter');
    form.append('sender_id', user.id);
    form.append('receiver_role', 'admin');
    form.append('receiver_id', adminId);
    form.append('pesan', input.trim());
    if (file) form.append('file', file);

    const res = await apiFetch('/chat', { method: 'POST', body: form });
    if (res?.success === false) {
      setFileError(res.message || 'Gagal mengirim.');
      return;
    }
    setInput('');
    setFile(null);
    setFileError('');
    loadMessages(false);
  }

  function handlePickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      setFileError('Ukuran file maksimal 2MB.');
      e.target.value = '';
      return;
    }
    setFileError('');
    setFile(f);
  }

  async function deleteMessage(id) {
    if (!window.confirm('Hapus pesan ini?')) return;
    await apiFetch(`/chat/${id}`, { method: 'DELETE' });
    loadMessages(false);
  }

  async function logout() { const rt = localStorage.getItem('refreshToken'); if (rt) { await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) }); } sessionStorage.clear(); localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); navigate('/dokter/login'); }

  const rows = withDateSeparators(messages);

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
          <div className="chat-panel">
            <div className="chat-main">
              <div className="chat-header">
                <div className="avatar" style={{ background: '#22c55e', width: 36, height: 36, fontSize: 13 }}>AK</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Admin Klinik</div>
              </div>

              <div className="chat-messages" ref={scrollRef} onScroll={handleScroll}>
                {loadingMsgs ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>Memuat pesan...</div>
                ) : rows.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>Belum ada pesan. Mulai percakapan!</div>
                ) : rows.map((row) => {
                  if (row.type === 'sep') {
                    return <div key={row.key} className="chat-date-sep"><span>{row.label}</span></div>;
                  }
                  const m = row.data;
                  const isSent = m.sender_role === 'dokter';
                  const isDeleted = !!m.deleted_at;
                  return (
                    <div key={row.key} className={`msg-row ${isSent ? 'sent' : 'received'}`}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                        {isSent && !isDeleted && (
                          <button className="msg-del-btn" onClick={() => deleteMessage(m.id)} title="Hapus pesan">🗑</button>
                        )}
                        <div className={`msg ${isSent ? 'sent' : 'received'}`} style={isSent ? { background: 'var(--green-dark)' } : {}}>
                          {isDeleted ? (
                            <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Pesan telah dihapus</span>
                          ) : (
                            <>
                              {m.file_url && m.file_type === 'image' && (
                                <a href={m.file_url} target="_blank" rel="noreferrer">
                                  <img src={m.file_url} alt="lampiran" className="msg-img" style={{ marginBottom: m.pesan ? 6 : 0 }} />
                                </a>
                              )}
                              {m.file_url && m.file_type === 'file' && (
                                <a href={m.file_url} target="_blank" rel="noreferrer"
                                  style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'inherit', textDecoration: 'underline', marginBottom: m.pesan ? 6 : 0 }}>
                                  📎 Lihat file
                                </a>
                              )}
                              {m.pesan}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="msg-meta">
                        {fmtTime(m.created_at)}
                        {isSent && !isDeleted && (
                          <span style={{ color: m.is_read ? '#3b82f6' : 'var(--text-muted)' }}>{m.is_read ? '✓✓' : '✓'}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
                {showJumpBtn && (
                  <button className="chat-jump-btn" onClick={jumpToBottom}>↓ Pesan baru</button>
                )}
              </div>

              {fileError && <div className="chat-file-error">{fileError}</div>}
              {file && (
                <div className="chat-file-preview">
                  📎 {file.name} ({(file.size / 1024).toFixed(0)} KB)
                  <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 12 }}>✕ batal</button>
                </div>
              )}
              <div className="chat-input-row">
                <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handlePickFile} style={{ display: 'none' }} />
                <button className="chat-attach-btn" onClick={() => fileInputRef.current?.click()} title="Lampirkan file">📎</button>
                <input className="chat-input" placeholder="Ketik disini" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
                <button onClick={send} style={{ padding: '10px 20px', background: 'var(--green-dark)', color: 'white', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Kirim</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {popup}
    </div>
  );
}
