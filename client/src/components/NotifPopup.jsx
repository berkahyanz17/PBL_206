import { useEffect, useRef, useState } from 'react';

// ─── Styles (injected once) ───────────────────────────────────────────────────
const CSS = `
.notif-popup {
  position: fixed; top: 64px; right: 24px; width: 320px;
  background: white; border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  z-index: 99999; overflow: hidden; display: none;
  animation: notifSlideDown .2s ease;
}
.notif-popup.open { display: block; }
@keyframes notifSlideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.notif-popup-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px 10px; border-bottom: 1px solid #F3F4F6;
}
.notif-popup-title { font-size: 14px; font-weight: 700; color: #111827; }
.notif-popup-close {
  background: none; border: none; font-size: 18px;
  cursor: pointer; color: #6B7280; line-height: 1;
}
.notif-list { max-height: 320px; overflow-y: auto; }
.notif-item {
  display: flex; gap: 12px; padding: 12px 16px;
  border-bottom: 1px solid #F9FAFB; cursor: pointer;
  transition: background .15s;
}
.notif-item:hover { background: #F9FAFB; }
.notif-item:last-child { border-bottom: none; }
.notif-item.unread { background: #EFF6FF; }
.notif-icon {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
}
.notif-icon.blue   { background: #DBEAFE; }
.notif-icon.green  { background: #D1FAE5; }
.notif-icon.orange { background: #FEF3C7; }
.notif-text  { font-size: 13px; font-weight: 600; color: #111827; line-height: 1.4; }
.notif-time  { font-size: 11px; color: #9CA3AF; margin-top: 3px; }
.notif-empty { padding: 28px 16px; text-align: center; color: #9CA3AF; font-size: 13px; }
.notif-badge {
  position: absolute; top: -4px; right: -4px;
  width: 17px; height: 17px; background: #ef4444;
  border-radius: 50%; font-size: 10px; font-weight: 700;
  color: white; display: flex; align-items: center; justify-content: center;
}
`;

if (typeof document !== 'undefined' && !document.getElementById('notif-popup-style')) {
  const tag = document.createElement('style');
  tag.id = 'notif-popup-style';
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * NotifPopup
 *
 * Props:
 *   id       – unique popup id, e.g. "notif-admin"
 *   items    – array of { icon, iconColor, text, time, unread }
 *
 * Usage:
 *   const { bellButton, popup } = useNotif('notif-admin', ADMIN_NOTIFS);
 *   // put bellButton in topbar-right, popup anywhere in the page root
 */
export function useNotif(id, items = []) {
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
    <button
      className="btn-notif"
      data-notif-btn={id}
      onClick={toggle}
      style={{ position: 'relative' }}
    >
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
