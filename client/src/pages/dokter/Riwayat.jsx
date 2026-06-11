import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DokterSidebar from '../../components/DokterSidebar';
import { apiFetch } from '../../utils/api';
import { useNotif, DOKTER_NOTIFS } from '../../components/NotifPopup';

export default function DokterRiwayat() {
  const navigate = useNavigate();
  const [rekamList, setRekamList] = useState([]);
  const [pasienList, setPasienList] = useState([]);
  const [active, setActive] = useState(null);
  const [tab, setTab] = useState('riwayat');
  const { bellButton, popup } = useNotif('notif-dokter', DOKTER_NOTIFS);
  const user = JSON.parse(sessionStorage.getItem('dokterUser') || '{}');

  useEffect(() => {
    async function load() {
      const res = await apiFetch(`/rekam-medis/dokter/${user.id}`);
      if (res?.success) {
        setRekamList(res.data);
        const unique = [...new Map(res.data.map(r => [r.pasien_nama, r])).values()];
        setPasienList(unique);
        if (unique.length > 0) setActive(unique[0].pasien_nama);
      }
    }
    load();
  }, []);

  function logout() { sessionStorage.clear(); navigate('/dokter/login'); }

  const activeRekam = rekamList.filter(r => r.pasien_nama === active);
  const colors = ['#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899'];

  return (
    <div className="dashboard-layout">
      <DokterSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--green)' }}>
          <h1>Riwayat Konsultasi</h1>
          { bellButton }<button className="btn-logout" onClick={logout}>🚪 Logout</button></div>
        </div>
        <div className="content-area">
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 18 }}>
            <div style={{ background: 'white', borderRadius: 14, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>👥 Daftar Pasien</div>
              {pasienList.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada rekam medis.</div>}
              {pasienList.map((p, i) => (
                <div key={p.pasien_nama} onClick={() => setActive(p.pasien_nama)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, cursor: 'pointer', background: active === p.pasien_nama ? '#F0FDF4' : '', borderLeft: active === p.pasien_nama ? '3px solid var(--green)' : '3px solid transparent' }}>
                  <div className="avatar" style={{ background: colors[i % colors.length] }}>{p.pasien_nama?.charAt(0)}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.pasien_nama}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rekamList.filter(r => r.pasien_nama === p.pasien_nama).length} Kunjungan</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {active ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                    <div className="avatar" style={{ background: '#a855f7', width: 44, height: 44, fontSize: 14 }}>{active?.charAt(0)}</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{active}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {['riwayat', 'resep'].map(t => (
                      <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 18px', borderRadius: 20, border: tab === t ? 'none' : '1.5px solid var(--border)', background: tab === t ? 'var(--text-dark)' : 'white', color: tab === t ? 'white' : 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {t === 'riwayat' ? 'Riwayat Medis' : 'Resep Obat'}
                      </button>
                    ))}
                  </div>
                  {activeRekam.map((r, i) => (
                    <div key={i} style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>📅 {new Date(r.created_at).toLocaleDateString('id-ID')}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{r.diagnosa}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tab === 'riwayat' ? r.catatan : r.resep || 'Tidak ada resep.'}</div>
                    </div>
                  ))}
                </>
              ) : <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Pilih pasien di kiri.</div>}
            </div>
          </div>
        </div>
      </div>
      { popup }
    </div>
  );
}
