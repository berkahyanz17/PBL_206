import { useEffect, useRef, useState } from 'react';

export function useNotif(id, items = [], buttonStyle = {}) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const popupRef = useRef(null);
  const unreadCount = items.filter(i => i.unread).length;
  const showBadge = unreadCount > 0 && !dismissed;

  // close on outside click
  useEffect(() => {
    function handler(e) {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        !e.target.closest(`[data-notif-btn="${id}"]`)
      ) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [id]);

  function toggle() {
    setOpen(o => !o);
    setDismissed(true); // hide badge once opened
  }

  const bellButton = (
    <button className="btn-notif" data-notif-btn={id} onClick={toggle}
      style={{ position: 'relative', ...buttonStyle }}>
      🔔
      {showBadge && <span className="notif-badge">{unreadCount}</span>}
    </button>
  );

  const popup = (
    <div ref={popupRef} className={`notif-popup${open ? ' open' : ''}`} id={id}>
      <div className="notif-popup-header">
        <span className="notif-popup-title">🔔 Notifikasi</span>
        <button className="notif-popup-close" onClick={() => setOpen(false)}>✕</button>
      </div>
      <div className="notif-list">
        {items.length === 0
          ? <div className="notif-empty">Tidak ada notifikasi.</div>
          : items.map((item, i) => (
            <div key={i} className={`notif-item${item.unread ? ' unread' : ''}`}>
              <div className={`notif-icon ${item.iconColor}`}>{item.icon}</div>
              <div>
                <div className="notif-text">{item.text}</div>
                <div className="notif-time">{item.time}</div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );

  return { bellButton, popup };
}

// ─── Per-role static notification data (frontend only, matches HTML reference) ─

export const ADMIN_NOTIFS = [
  { icon: '👤', iconColor: 'orange', text: 'Pasien baru mendaftar: Rina Kartika',              time: '2 menit lalu',  unread: true },
  { icon: '📅', iconColor: 'blue',   text: 'Booking baru masuk dari Budiman ke dr. Kuro',      time: '15 menit lalu', unread: true },
  { icon: '👤', iconColor: 'green',  text: 'Pasien baru mendaftar: Teguh Prasetyo',             time: '1 jam lalu',    unread: true },
  { icon: '📅', iconColor: 'blue',   text: 'Booking baru masuk dari Megumi ke dr. Ichinose',   time: '3 jam lalu',    unread: false },
];

export const DOKTER_NOTIFS = [
  { icon: '💬', iconColor: 'blue',  text: 'Admin: "Mohon konfirmasi jadwal besok"',            time: '10 menit lalu', unread: true },
  { icon: '📅', iconColor: 'green', text: 'Pasien baru booking: Budiman · 25 Mei 09:00',       time: '1 jam lalu',    unread: true },
  { icon: '📅', iconColor: 'green', text: 'Pasien baru booking: Wulan · 24 Mei 10:00',         time: '3 jam lalu',    unread: false },
];

export const PASIEN_NOTIFS = [
  { icon: '✅', iconColor: 'green', text: 'Dr. Sarah Melati menyetujui appointment kamu · 22 Mei 10:00', time: '30 menit lalu', unread: true },
  { icon: '📅', iconColor: 'blue',  text: 'Pengingat: Jadwal konsultasi besok 09:00 WIB',               time: 'Kemarin',       unread: false },
];
