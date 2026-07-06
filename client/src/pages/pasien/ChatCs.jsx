import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PasienSidebar from '../../components/PasienSidebar';
import { apiFetch } from '../../utils/api';
import { useNotif } from '../../components/NotifPopup';

function fmtTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function PasienChatCS() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [jenis, setJenis] = useState('Komplain');
  const [deskripsi, setDeskripsi] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const scrollRef = useRef();
  const { bellButton, popup } = useNotif('notif-pasien', { background: 'rgba(255,255,255,0.4)' });

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function load(showLoading) {
    if (showLoading) setLoading(true);
    const res = await apiFetch('/cs-tickets/mine');
    if (res?.success) {
      setTickets(res.data);
      const terbuka = res.data.find(t => t.status !== 'ditutup');
      if (terbuka) {
        const mres = await apiFetch(`/cs-tickets/${terbuka.id}/messages`);
        if (mres?.success) setMessages(mres.data);
      }
    }
    if (showLoading) setLoading(false);
  }

  async function kirimPesan(ticketId) {
    const text = input.trim();
    if (!text) return;
    setInput('');
    const res = await apiFetch(`/cs-tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ pesan: text })
    });
    if (res?.success === false) { alert(res.message || 'Gagal mengirim.'); return; }
    load(false);
  }

  async function submitTiket() {
    if (!deskripsi.trim()) { setFormError('Isi deskripsi dulu!'); return; }
    setSubmitting(true);
    setFormError('');
    const res = await apiFetch('/cs-tickets', {
      method: 'POST',
      body: JSON.stringify({ jenis: jenis === 'Refund' ? 'refund' : 'komplain', kategori: jenis, deskripsi: deskripsi.trim() })
    });
    setSubmitting(false);
    if (res?.success === false) { setFormError(res.message || 'Gagal mengirim tiket.'); return; }
    setDeskripsi('');
    load(true);
  }

  async function logout() { const rt = localStorage.getItem('refreshToken'); if (rt) { await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) }); } sessionStorage.clear(); localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); navigate('/pasien/login'); }

  const terbuka = tickets.find(t => t.status !== 'ditutup');

  return (
    <div className="dashboard-layout">
      <PasienSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'linear-gradient(90deg,#7dd3fc,#38bdf8)' }}>
          <h1 style={{ color: '#1e3a5f' }}>Chat CS</h1>
          <div className="topbar-right">
            {bellButton}
            <button className="btn-logout" style={{ background: 'rgba(255,255,255,0.4)', color: '#1e3a5f', borderColor: 'rgba(255,255,255,0.5)' }} onClick={logout}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Memuat data...</div>
          ) : terbuka ? (
            <div className="chat-panel with-list mobile-chat-open" style={{ gridTemplateColumns: '1fr' }}>
              <div className="chat-main">
                <div className="chat-header">
                  <div className="avatar" style={{ background: terbuka.jenis === 'refund' ? '#9D174D' : '#3b82f6', width: 32, height: 32, fontSize: 14 }}>
                    {terbuka.jenis === 'refund' ? '💸' : '🎫'}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>CS HealthSync{terbuka.jenis === 'refund' ? ' — Refund' : ''}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {terbuka.status === 'menunggu_approval' ? 'Menunggu approval admin' : (terbuka.kategori || 'Komplain')}
                    </div>
                  </div>
                </div>

                {terbuka.status === 'menunggu_approval' && (
                  <div style={{ margin: 16, padding: 14, background: '#FEF3C7', color: '#92400E', borderRadius: 10, fontSize: 13 }}>
                    ⏳ Tiket kamu sedang menunggu approval admin. Ruang chat akan otomatis terbuka begitu admin approve tiket ini.
                  </div>
                )}

                <div className="chat-messages-wrap">
                  <div className="chat-messages" ref={scrollRef}>
                    {messages.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>Belum ada pesan.</div>
                    ) : messages.map(m => (
                      <div key={m.id} className={`msg-row ${m.sender_role === 'pasien' ? 'sent' : 'received'}`}>
                        <div className={`msg ${m.sender_role === 'pasien' ? 'sent' : 'received'}`}>{m.pesan}</div>
                        <div className="msg-meta">{fmtTime(m.created_at)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {terbuka.status === 'aktif' && (
                  <div className="chat-input-row">
                    <input className="chat-input" placeholder="Ketik pesan ke CS..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && kirimPesan(terbuka.id)} />
                    <button onClick={() => kirimPesan(terbuka.id)} style={{ padding: '10px 20px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Kirim</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📝 Buat Tiket Chat CS</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>Dibatasi 1x submit per hari untuk jaga beban kerja admin.</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Kategori</label>
                <select value={jenis} onChange={e => setJenis(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit' }}>
                  <option value="Komplain">Komplain</option>
                  <option value="Refund">Refund</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Deskripsi</label>
                <textarea value={deskripsi} onChange={e => setDeskripsi(e.target.value)} placeholder="Jelaskan kendala/pertanyaan kamu..." rows={4}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
              {formError && <div style={{ color: '#DC2626', fontSize: 12.5, marginBottom: 10 }}>{formError}</div>}
              <button disabled={submitting} onClick={submitTiket}
                style={{ width: '100%', padding: 12, background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: submitting ? 'default' : 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Mengirim...' : 'Kirim Tiket →'}
              </button>
            </div>
          )}
        </div>
      </div>
      {popup}
    </div>
  );
}
