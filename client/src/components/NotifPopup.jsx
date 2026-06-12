import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../utils/api';

export function useNotif(id, buttonStyle = {}) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    async function fetchNotifs() {
      const res = await apiFetch('/notifikasi');
      if (res?.success) {
        setItems(res.data.map(n => ({
          icon: n.icon,
          iconColor: n.icon_color,
          text: n.text,
          time: n.time,
          unread: !n.is_read
        })));
      }
    }
    fetchNotifs();
  }, []);

  const unreadCount = items.filter(i => i.unread).length;
  const showBadge = unreadCount > 0 && !dismissed;

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

  async function toggle() {
    const opening = !open;
    setOpen(opening);
    if (opening) {
      setDismissed(true);
      await apiFetch('/notifikasi/read', { method: 'PATCH' });
      setItems(prev => prev.map(i => ({ ...i, unread: false })));
    }
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
