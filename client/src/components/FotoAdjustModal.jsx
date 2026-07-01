import { useState, useRef, useEffect } from 'react';

/**
 * Modal untuk crop/zoom foto profil sebelum disimpan ke database.
 * Dipakai di dokter/Profil.jsx dan pasien/Profil.jsx.
 *
 * Props:
 * - src: string dataURL gambar mentah hasil pilih file (null = modal tertutup)
 * - onCancel: () => void
 * - onSave: (dataUrl, blob) => void  -> dipanggil setelah user klik "Simpan"
 */
export default function FotoAdjustModal({ src, onCancel, onSave }) {
  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0 });

  const [scale, setScale] = useState(1);
  const [slider, setSlider] = useState({ min: 0.5, max: 3, step: 0.01 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Reset posisi tiap kali gambar baru dibuka
  useEffect(() => {
    if (src) { setOffset({ x: 0, y: 0 }); setScale(1); }
  }, [src]);

  function handleImgLoad() {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img) return;
    const ww = wrap.offsetWidth;
    const wh = wrap.offsetHeight;
    const ratio = Math.max(ww / img.naturalWidth, wh / img.naturalHeight);
    setSlider({ min: ratio * 0.5, max: ratio * 4, step: ratio * 0.01 });
    setScale(ratio);
    setOffset({ x: 0, y: 0 });
  }

  function startDrag(clientX, clientY) {
    dragState.current = { dragging: true, startX: clientX - offset.x, startY: clientY - offset.y };
  }
  function moveDrag(clientX, clientY) {
    if (!dragState.current.dragging) return;
    setOffset({ x: clientX - dragState.current.startX, y: clientY - dragState.current.startY });
  }
  function endDrag() { dragState.current.dragging = false; }

  function handleSave() {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img) return;
    const ww = wrap.offsetWidth;
    const wh = wrap.offsetHeight;

    const canvas = document.createElement('canvas');
    canvas.width = ww;
    canvas.height = wh;
    const ctx = canvas.getContext('2d');

    // Clip lingkaran (foto profil bulat)
    ctx.save();
    ctx.beginPath();
    ctx.arc(ww / 2, wh / 2, ww / 2, 0, Math.PI * 2);
    ctx.clip();

    const nw = img.naturalWidth * scale;
    const nh = img.naturalHeight * scale;
    const x = (ww - nw) / 2 + offset.x;
    const y = (wh - nh) / 2 + offset.y;
    ctx.drawImage(img, x, y, nw, nh);
    ctx.restore();

    canvas.toBlob(blob => {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onSave(dataUrl, blob);
    }, 'image/jpeg', 0.92);
  }

  if (!src) return null;

  return (
    <div className="foto-modal-overlay open">
      <div className="foto-modal-box">
        <div className="foto-modal-title">🖼️ Sesuaikan Foto Profil</div>

        <div
          className="foto-crop-wrap"
          ref={wrapRef}
          onMouseDown={e => startDrag(e.clientX, e.clientY)}
          onMouseMove={e => moveDrag(e.clientX, e.clientY)}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={e => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); }}
          onTouchMove={e => { const t = e.touches[0]; moveDrag(t.clientX, t.clientY); }}
          onTouchEnd={endDrag}
        >
          <img
            ref={imgRef}
            src={src}
            className="foto-crop-img"
            draggable={false}
            onLoad={handleImgLoad}
            style={{
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
              left: '50%',
              top: '50%',
            }}
            alt="Pratinjau foto profil"
          />
        </div>

        <div className="foto-zoom-row">
          <label>🔍 Zoom</label>
          <input
            type="range"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={scale}
            onChange={e => setScale(parseFloat(e.target.value))}
          />
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>
          Geser foto untuk mengatur posisi
        </div>

        <div className="foto-modal-btns">
          <button className="btn-foto-batal" onClick={onCancel}>Batal</button>
          <button className="btn-foto-simpan" onClick={handleSave}>✓ Simpan</button>
        </div>
      </div>
    </div>
  );
}
