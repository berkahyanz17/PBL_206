// Taruh di: client/src/pages/admin/KlinikSettings.jsx
// Tambahkan route di AdminRouter: <Route path="/admin/klinik-settings" element={<KlinikSettings />} />
// Tambahkan link di sidebar admin: { path: '/admin/klinik-settings', icon: '⚙️', label: 'Pengaturan Klinik' }

import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { apiFetch } from '../../utils/api';

const FIELDS = [
  // [key, label, placeholder, kategori, textarea?]
  ['klinik_nama',         'Nama Klinik',            'HealthSync Clinic',           'umum',    false],
  ['klinik_alamat',       'Alamat Klinik',           'Jl. Sehat No. 1, ...',        'umum',    true ],
  ['klinik_jam_buka',     'Jam Operasional',         'Senin–Jumat 08.00–17.00, ...' ,'umum',   false],
  ['klinik_telepon',      'Nomor Telepon',           '(021) 1234-5678',             'kontak',  false],
  ['klinik_email',        'Email Klinik',            'info@healthsync.id',          'kontak',  false],
  ['klinik_whatsapp',     'WhatsApp',                '08xx-xxxx-xxxx',              'kontak',  false],
  ['mamoru_greeting',     'Sapaan Mamoru',           'Halo! Saya Mamoru...',        'mamoru',  true ],
  ['mamoru_darurat_msg',  'Pesan Darurat Mamoru',    'Untuk kondisi darurat...',    'mamoru',  true ],
  ['mamoru_context_extra','Konteks Tambahan Mamoru', 'Info tambahan untuk Mamoru (nama dokter pengganti, promo, dll)...', 'mamoru', true],
];

const KATEGORI_LABEL = {
  umum:   '🏥 Informasi Klinik',
  kontak: '📞 Kontak',
  mamoru: '🤖 Pengaturan Mamoru',
};

export default function KlinikSettings() {
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await apiFetch('/klinik-settings');
      if (res?.success) setForm(res.data || {});
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true); setSaved(false);
    const res = await apiFetch('/klinik-settings', { method: 'PATCH', body: JSON.stringify(form) });
    setSaving(false);
    if (res?.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  // Group fields by kategori
  const grouped = {};
  FIELDS.forEach(([key, label, placeholder, kat, ta]) => {
    if (!grouped[kat]) grouped[kat] = [];
    grouped[kat].push({ key, label, placeholder, ta });
  });

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <div className="main-content">
        <div className="topbar">
          <h1>⚙️ Pengaturan Klinik & Mamoru</h1>
        </div>
        <div className="content-area" style={{ maxWidth: 700 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Memuat pengaturan...</div>
          ) : (
            <>
              {Object.entries(grouped).map(([kat, fields]) => (
                <div key={kat} style={{
                  background: 'white', borderRadius: 14,
                  padding: '20px 24px', marginBottom: 20,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--text-dark)' }}>
                    {KATEGORI_LABEL[kat]}
                  </div>
                  {fields.map(({ key, label, placeholder, ta }) => (
                    <div key={key} style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
                        {label}
                      </label>
                      {ta ? (
                        <textarea
                          rows={3}
                          style={{
                            width: '100%', boxSizing: 'border-box',
                            padding: '9px 12px', border: '1.5px solid var(--border)',
                            borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
                            resize: 'vertical', outline: 'none',
                          }}
                          placeholder={placeholder}
                          value={form[key] || ''}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        />
                      ) : (
                        <input
                          type="text"
                          style={{
                            width: '100%', boxSizing: 'border-box',
                            padding: '9px 12px', border: '1.5px solid var(--border)',
                            borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none',
                          }}
                          placeholder={placeholder}
                          value={form[key] || ''}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {/* Info box Mamoru */}
              <div style={{
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13
              }}>
                <strong>💡 Tentang Konteks Mamoru</strong>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#374151', lineHeight: 1.8 }}>
                  <li>Mamoru otomatis membaca data di atas setiap kali pasien bertanya.</li>
                  <li>Daftar dokter aktif juga otomatis di-inject dari database.</li>
                  <li>"Konteks Tambahan" bisa diisi info musiman: promo, dokter cuti, dll.</li>
                  <li>Notifikasi Telegram dikirim hanya untuk pesan <strong>darurat</strong> atau <strong>butuh admin</strong>.</li>
                </ul>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: saving ? '#93c5fd' : '#1d4ed8',
                  color: 'white', border: 'none', borderRadius: 10,
                  padding: '11px 28px', fontSize: 14, fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? '💾 Menyimpan...' : '💾 Simpan Pengaturan'}
              </button>
              {saved && (
                <span style={{ marginLeft: 14, color: '#16a34a', fontSize: 13, fontWeight: 600 }}>
                  ✅ Tersimpan!
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
