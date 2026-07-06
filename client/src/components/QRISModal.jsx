import { useState } from 'react';

function formatRupiah(n) {
  return 'Rp. ' + (n || 0).toLocaleString('id-ID');
}

export default function QRISModal({ appointment, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  if (!appointment) return null;

  const a = appointment;
  const dataQr = `HEALTHSYNC|${a.id}|${a.dokter_nama}|${a.harga}`;
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(dataQr);

  async function handleConfirm() {
    setLoading(true);
    await onConfirm(a.id);
    setLoading(false);
  }

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div
        style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: 4, fontSize: 18, fontWeight: 800 }}>💳 Pembayaran QRIS</div>
        <div style={{ textAlign: 'center', fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          Scan QR di bawah pakai e-wallet / m-banking untuk membayar
        </div>

        <div style={{ textAlign: 'center' }}>
          <img
            src={qrUrl}
            alt="QRIS Payment"
            style={{ width: 220, height: 220, border: '1.5px solid #E5E7EB', borderRadius: 12, padding: 10, background: '#fff', display: 'block', margin: '0 auto' }}
          />
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1d4ed8', margin: '14px 0 4px' }}>{formatRupiah(a.harga)}</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
            {a.dokter_nama} · {new Date(a.tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · {a.jam?.slice(0, 5)} WIB
          </div>
          <div style={{ fontSize: 11.5, color: '#ef4444', fontWeight: 600, marginTop: 6, marginBottom: 4 }}>
            ⏳ Slot booking-mu ditahan sementara sampai pembayaran dikonfirmasi
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: 13, background: '#F3F4F6', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{ flex: 1, padding: 13, background: loading ? '#6B7280' : '#1d4ed8', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {loading ? 'Memproses...' : '✅ Saya Sudah Bayar'}
          </button>
        </div>
      </div>
    </div>
  );
}
