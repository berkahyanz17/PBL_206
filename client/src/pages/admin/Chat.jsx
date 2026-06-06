import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';

const chatData = {
  'dr. Kuro Tetsuro': { init: 'KT', color: '#22c55e', messages: [{ type: 'received', text: 'Halo ada yang bisa saya bantu?' }, { type: 'sent', text: 'Mohon konfirmasi jadwal besok' }] },
  'dr. Ichinose Guren': { init: 'IG', color: '#3b82f6', messages: [{ type: 'received', text: 'Selamat siang Admin' }, { type: 'sent', text: 'Siang dok, ada update jadwal?' }, { type: 'received', text: 'Besok saya bisa sampai jam 3 sore' }] },
  'dr. Dazai Osamu': { init: 'DO', color: '#f59e0b', messages: [{ type: 'received', text: 'Permisi admin, ada pasien baru?' }, { type: 'sent', text: 'Ada 2 pasien baru untuk besok dok' }] },
};

export default function AdminChat() {
  const navigate = useNavigate();
  const [active, setActive] = useState('dr. Kuro Tetsuro');
  const [messages, setMessages] = useState(chatData);
  const [input, setInput] = useState('');

  function send() {
    if (!input.trim()) return;
    setMessages(prev => ({ ...prev, [active]: { ...prev[active], messages: [...prev[active].messages, { type: 'sent', text: input.trim() }] } }));
    setInput('');
  }

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--navy)' }}>
          <h1>Chat Dokter</h1>
          <div className="topbar-right">
            <button className="btn-notif">🔔</button>
            <button className="btn-logout" onClick={() => navigate('/admin/login')}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', background: 'white', borderRadius: 14, overflow: 'hidden', minHeight: 500, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ borderRight: '1px solid var(--border)', padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>Chat dengan Dokter</div>
              {Object.entries(messages).map(([nama, data]) => (
                <div key={nama} onClick={() => setActive(nama)}
                  style={{ padding: 12, borderRadius: 10, cursor: 'pointer', marginBottom: 4, background: active === nama ? '#EFF6FF' : '', borderLeft: active === nama ? '3px solid var(--navy)' : '3px solid transparent' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{nama}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="avatar" style={{ background: messages[active].color, width: 32, height: 32, fontSize: 11 }}>{messages[active].init}</div>
                {active}
              </div>
              <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 300 }}>
                {messages[active].messages.map((m, i) => (
                  <div key={i} className={`msg ${m.type}`} style={m.type === 'sent' ? { background: 'var(--navy)', color: 'white', alignSelf: 'flex-end', borderRadius: '12px 4px 12px 12px' } : {}}>{m.text}</div>
                ))}
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
