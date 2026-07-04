import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Banner pengingat yang muncul sekali per sesi login, dibaca dari sessionStorage.
 * key: nama flag di sessionStorage yang diset saat login (mis. "pwReminder_dokter").
 * Setelah tombol diklik atau ditutup, flag dihapus supaya tidak muncul lagi sebelum login ulang.
 */
export default function ReminderBanner({ storageKey, message, actionLabel, actionTo, color = '#f59e0b' }) {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(sessionStorage.getItem(storageKey) === '1');
  }, [storageKey]);

  if (!show) return null;

  function dismiss() {
    sessionStorage.removeItem(storageKey);
    setShow(false);
  }

  function goAction() {
    sessionStorage.removeItem(storageKey);
    setShow(false);
    navigate(actionTo);
  }

  return (
    <div style={{
      background: '#FFFBEB', border: `1px solid ${color}`, color: '#92400E',
      borderRadius: 10, padding: '12px 16px', marginBottom: 16,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, flexWrap: 'wrap', fontSize: 13
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <span style={{ fontWeight: 600 }}>{message}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={goAction} style={{ background: color, color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          {actionLabel}
        </button>
        <button onClick={dismiss} style={{ background: 'none', border: 'none', color: '#92400E', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px' }} title="Tutup">✕</button>
      </div>
    </div>
  );
}
