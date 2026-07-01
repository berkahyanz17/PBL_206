import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { apiFetch } from '../../utils/api';
import { useNotif } from '../../components/NotifPopup';

const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#6366f1'];
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 menit
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const NEAR_BOTTOM_PX = 80;

function fmtTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function isOnline(lastActive) {
  if (!lastActive) return false;
  return Date.now() - new Date(lastActive).getTime() < ONLINE_THRESHOLD_MS;
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

// Sisipkan separator tanggal sebelum pesan pertama tiap hari
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

export default function AdminChat() {
  const navigate = useNavigate();
  const [dokters, setDokters] = useState([]);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showJumpBtn, setShowJumpBtn] = useState(false);
  const [jumpMode, setJumpMode] = useState('neutral');
  const prevCount = useRef(0);
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const scrollRef = useRef();
  const bottomRef = useRef();
  const fileInputRef = useRef();
  const hasScrolledInitial = useRef(false);
  const { bellButton, popup } = useNotif('notif-admin');

  useEffect(() => {
    loadDokters();
    const interval = setInterval(loadDokters, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!active) return;
    hasScrolledInitial.current = false;
    setJumpMode('neutral');
    loadMessages(true);
    markRead(active.id);
    const interval = setInterval(() => loadMessages(false), 5000);
    return () => clearInterval(interval);
  }, [active]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!hasScrolledInitial.current) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
        setTimeout(() => { el.scrollTop = el.scrollHeight; }, 150);
      });
      hasScrolledInitial.current = true;
      prevCount.current = messages.length;
      setShowJumpBtn(false);
      return;
    }
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const hasNew = messages.length > prevCount.current;
    prevCount.current = messages.length;
    if (distFromBottom > NEAR_BOTTOM_PX) {
      setShowJumpBtn(true);
      if (hasNew) setJumpMode('new');
    } else {
      setShowJumpBtn(false);
    }
  }, [messages]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom > NEAR_BOTTOM_PX) {
      setShowJumpBtn(true);
    } else {
      setShowJumpBtn(false);
      setJumpMode('neutral');
    }
  }

  function jumpToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowJumpBtn(false);
    setJumpMode('neutral');
  }

  async function loadDokters() {
    const [resDokter, resPreview] = await Promise.all([
      apiFetch('/dokter'),
      apiFetch('/chat/preview')
    ]);
    if (!resDokter?.success) return;
    const previews = resPreview?.success ? resPreview.data : [];
    const merged = resDokter.data.map(d => {
      const p = previews.find(pv => pv.dokter_id === d.id);
      return {
        ...d,
        lastMsg: p?.pesan || '',
        lastTime: p?.created_at || null,
        lastActive: p?.last_active || null,
        unread: p?.unread_count || 0
      };
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

  async function markRead(dokterId) {
    await apiFetch(`/chat/read/${dokterId}`, { method: 'PATCH' });
    setDokters(prev => prev.map(d => d.id === dokterId ? { ...d, unread: 0 } : d));
  }

  async function send() {
    if ((!input.trim() && !file) || !active) return;
    const form = new FormData();
    form.append('sender_role', 'admin');
    form.append('sender_id', adminUser.id);
    form.append('receiver_role', 'dokter');
    form.append('receiver_id', active.id);
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

  async function logout() { const rt = localStorage.getItem('refreshToken'); if (rt) { await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) }); } sessionStorage.clear(); localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); navigate('/admin/login'); }

  function selectDokter(d) {
    setActive(d);
    if (d.unread > 0) markRead(d.id);
  }

  const filteredDokters = dokters.filter(d => d.nama?.toLowerCase().includes(search.toLowerCase()));
  const rows = withDateSeparators(messages);

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
          <div className={`chat-panel with-list${active ? ' mobile-chat-open' : ''}`}>
            <div className="chat-sidebar">
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>Chat dengan Dokter</div>
              <input
                placeholder="Cari dokter..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, marginBottom: 12, fontFamily: 'inherit' }}
              />
              {filteredDokters.map((d) => {
                const i = dokters.findIndex(x => x.id === d.id);
                const online = isOnline(d.lastActive);
                return (
                  <div key={d.id} onClick={() => selectDokter(d)}
                    style={{ padding: 12, borderRadius: 10, cursor: 'pointer', marginBottom: 4, background: active?.id === d.id ? '#EFF6FF' : '', borderLeft: active?.id === d.id ? '3px solid var(--navy)' : '3px solid transparent', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div className="avatar" style={{ background: colors[i % colors.length], width: 30, height: 30, fontSize: 11 }}>{d.nama?.charAt(0)}</div>
                      <div style={{ position: 'absolute', bottom: -2, right: -2, width: 9, height: 9, borderRadius: '50%', background: online ? '#22c55e' : '#9ca3af', border: '2px solid white' }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{d.nama}</div>
                      {d.lastMsg && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {d.lastMsg}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      {d.lastTime && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmtTime(d.lastTime)}</div>}
                      {d.unread > 0 && (
                        <div style={{ background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 10, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                          {d.unread}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredDokters.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>Dokter tidak ditemukan.</div>
              )}
            </div>

            <div className="chat-main">
              {active && (
                <div className="chat-header">
                  <button className="chat-back-btn" onClick={() => setActive(null)} title="Kembali ke daftar dokter">←</button>
                  <div style={{ position: 'relative' }}>
                    <div className="avatar" style={{ background: colors[dokters.findIndex(d => d.id === active.id) % colors.length], width: 32, height: 32, fontSize: 11 }}>{active.nama?.charAt(0)}</div>
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 9, height: 9, borderRadius: '50%', background: isOnline(active.lastActive) ? '#22c55e' : '#9ca3af', border: '2px solid white' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{active.nama}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{isOnline(active.lastActive) ? 'Online' : 'Offline'}</div>
                  </div>
                </div>
              )}

              <div className="chat-messages-wrap">
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
                  const isSent = m.sender_role === 'admin';
                  const isDeleted = !!m.deleted_at;
                  return (
                    <div key={row.key} className={`msg-row ${isSent ? 'sent' : 'received'}`}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                        {isSent && !isDeleted && (
                          <button className="msg-del-btn" onClick={() => deleteMessage(m.id)} title="Hapus pesan">🗑</button>
                        )}
                        <div className={`msg ${isSent ? 'sent' : 'received'}`}>
                          {isDeleted ? (
                            <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Pesan telah dihapus</span>
                          ) : (
                            <>
                              {m.file_url && m.file_type === 'image' && (
                                <a href={m.file_url} target="_blank" rel="noreferrer">
                                  <img src={m.file_url} alt="lampiran" className="msg-img" onLoad={() => { if (hasScrolledInitial.current) { const el = scrollRef.current; if (el && el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX + 250) el.scrollTop = el.scrollHeight; } }} style={{ marginBottom: m.pesan ? 6 : 0 }} />
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
              </div>
              {showJumpBtn && (
                <button className={`chat-jump-btn ${jumpMode === 'new' ? '' : 'neutral'}`} onClick={jumpToBottom}>
                  {jumpMode === 'new' ? '↓ Pesan baru' : '↓'}
                </button>
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
