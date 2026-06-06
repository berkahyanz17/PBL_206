import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DokterSidebar from '../../components/DokterSidebar';

export default function DokterChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { type: 'received', text: 'Halo Dokter, ada yang bisa dibantu?' },
    { type: 'sent', text: 'Mohon konfirmasi jadwal besok' },
  ]);
  const [input, setInput] = useState('');

  function send() {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { type: 'sent', text: input.trim() }]);
    setInput('');
  }

  return (
    <div className="dashboard-layout">
      <DokterSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--green)' }}>
          <h1>Chat Admin</h1>
          <div className="topbar-right"><button className="btn-notif">🔔</button><button className="btn-logout" onClick={() => navigate('/dokter/login')}>🚪 Logout</button></div>
        </div>
        <div className="content-area">
          <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ background: '#F9FAFB', padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar" style={{ background: '#22c55e', width: 36, height: 36, fontSize: 13 }}>AK</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Admin Klinik</div>
            </div>
            <div style={{ minHeight: 340, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((m, i) => (
                <div key={i} className={`msg ${m.type}`} style={m.type === 'sent' ? { background: 'var(--green-dark)', color: 'white', alignSelf: 'flex-end', borderRadius: '12px 4px 12px 12px' } : {}}>{m.text}</div>
              ))}
            </div>
            <div className="chat-input-row">
              <input className="chat-input" placeholder="Ketik disini" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} style={{ borderColor: 'var(--border)' }} onFocus={e => e.target.style.borderColor = 'var(--green)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              <button onClick={send} style={{ padding: '10px 20px', background: 'var(--green-dark)', color: 'white', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Kirim</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
