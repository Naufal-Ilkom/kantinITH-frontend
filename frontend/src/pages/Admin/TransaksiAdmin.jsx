import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TransaksiAdmin.css';

const TransaksiAdmin = () => {
  const [viewTab, setViewTab] = useState('permintaan');
  const [semuaTransaksi, setSemuaTransaksi] = useState([]);
  const [permintaanDana, setPermintaanDana] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const token = localStorage.getItem('accessToken');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchAllData();
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const resLaporan = await axios.get('http://localhost:5000/api/admin/laporan', config);
      setSemuaTransaksi(resLaporan.data || []);
      const resTopup = await axios.get('http://localhost:5000/api/topup-requests', config);
      setPermintaanDana(resTopup.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      alert("Gagal mengambil data.");
      setLoading(false);
    }
  };

  const handleAccDana = async (id) => {
    if (!window.confirm("Setujui permintaan dana ini?")) return;
    try {
      await axios.patch(`http://localhost:5000/api/topup-approve/${id}`, { catatan_admin: 'Disetujui oleh admin' }, config);
      alert('Permintaan berhasil disetujui!');
      fetchAllData();
    } catch { alert('Gagal menyetujui permintaan'); }
  };

  const handleTolakDana = async (id) => {
    if (!window.confirm("Tolak permintaan dana ini?")) return;
    try {
      await axios.patch(`http://localhost:5000/api/topup-reject/${id}`, { catatan_admin: 'Ditolak oleh admin' }, config);
      alert('Permintaan berhasil ditolak!');
      fetchAllData();
    } catch { alert('Gagal menolak permintaan'); }
  };

  const StatusBadge = ({ status }) => {
    const map = {
      terima:    { label: 'Disetujui', color: '#10b981', bg: '#d1fae5' },
      tolak:     { label: 'Ditolak',   color: '#ef4444', bg: '#fee2e2' },
      menunggu:  { label: 'Menunggu',  color: '#f59e0b', bg: '#fef3c7' },
    };
    const s = map[status] || map.menunggu;
    return (
      <span style={{ background: s.bg, color: s.color, padding: '5px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '12px' }}>
        {s.label}
      </span>
    );
  };

  const TipeBadge = ({ tipe }) => {
    const isTopup = tipe === 'topup_saldo';
    return (
      <span style={{
        background: isTopup ? '#e0e7ff' : '#fce7f3',
        color: isTopup ? '#4f46e5' : '#db2777',
        padding: '5px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '12px'
      }}>
        {isTopup ? 'Top Up' : 'Withdraw'}
      </span>
    );
  };

  return (
    <div className="content-container-transaksi">

      {/* Header */}
      <h2 className="page-title-transaksi">Manajemen Transaksi & Dana</h2>

      {/* Tab Buttons */}
      <div className="tab-bar-transaksi">
        <button
          className={`tab-btn-transaksi ${viewTab === 'permintaan' ? 'active-orange' : ''}`}
          onClick={() => setViewTab('permintaan')}
        >
          🚨 Permintaan Dana
        </button>
        <button
          className={`tab-btn-transaksi ${viewTab === 'riwayat' ? 'active-dark' : ''}`}
          onClick={() => setViewTab('riwayat')}
        >
          🛍️ Riwayat Jual-Beli
        </button>
        <button className="tab-btn-transaksi btn-refresh" onClick={fetchAllData}>
          🔄 Refresh
        </button>
      </div>

      {loading && (
        <div className="loading-bar">⏳ Memuat data...</div>
      )}

      {/* ===================== TAB: PERMINTAAN ===================== */}
      {viewTab === 'permintaan' && !loading && (
        <div>
          <h3 className="section-title-transaksi">Daftar Antrean Permintaan</h3>

          {/* Desktop Table */}
          {!isMobile && (
            <div className="table-wrapper-transaksi">
              <table className="table-transaksi">
                <thead>
                  <tr>
                    <th>ID Permintaan</th>
                    <th>Pengguna</th>
                    <th>Jenis</th>
                    <th>Nominal</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {permintaanDana.length > 0 ? permintaanDana.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <strong>REQ-{req.id}</strong>
                        <div className="sub-text">{new Date(req.createdAt).toLocaleString('id-ID')}</div>
                      </td>
                      <td><strong>{req.User?.username || 'N/A'}</strong></td>
                      <td><TipeBadge tipe={req.tipe} /></td>
                      <td><strong style={{ fontSize: '15px' }}>Rp {(req.jumlah || 0).toLocaleString('id-ID')}</strong></td>
                      <td style={{ textAlign: 'center' }}><StatusBadge status={req.status} /></td>
                      <td style={{ textAlign: 'center' }}>
                        {req.status === 'menunggu' ? (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button className="btn-acc" onClick={() => handleAccDana(req.id)}>ACC</button>
                            <button className="btn-tolak" onClick={() => handleTolakDana(req.id)}>Tolak</button>
                          </div>
                        ) : (
                          <span className="sub-text">Selesai</span>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6" className="empty-row">Tidak ada permintaan dana</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile Cards */}
          {isMobile && (
            <div className="card-list-transaksi">
              {permintaanDana.length > 0 ? permintaanDana.map((req) => (
                <div key={req.id} className="card-transaksi">
                  <div className="card-trx-header">
                    <div>
                      <div className="card-trx-id">REQ-{req.id}</div>
                      <div className="sub-text">{new Date(req.createdAt).toLocaleString('id-ID')}</div>
                    </div>
                    <TipeBadge tipe={req.tipe} />
                  </div>
                  <div className="card-trx-row">
                    <span className="card-trx-label">Pengguna</span>
                    <strong>{req.User?.username || 'N/A'}</strong>
                  </div>
                  <div className="card-trx-row">
                    <span className="card-trx-label">Nominal</span>
                    <strong style={{ fontSize: '16px', color: '#0f172a' }}>
                      Rp {(req.jumlah || 0).toLocaleString('id-ID')}
                    </strong>
                  </div>
                  <div className="card-trx-footer">
                    <StatusBadge status={req.status} />
                    {req.status === 'menunggu' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-acc" onClick={() => handleAccDana(req.id)}>ACC</button>
                        <button className="btn-tolak" onClick={() => handleTolakDana(req.id)}>Tolak</button>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="empty-card">Tidak ada permintaan dana</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB: RIWAYAT ===================== */}
      {viewTab === 'riwayat' && !loading && (
        <div>
          <h3 className="section-title-transaksi">Semua Riwayat Jual-Beli</h3>

          {/* Desktop Table */}
          {!isMobile && (
            <div className="table-wrapper-transaksi">
              <table className="table-transaksi">
                <thead>
                  <tr>
                    <th>ID Transaksi</th>
                    <th>Tanggal</th>
                    <th>Pembeli</th>
                    <th>Penjual (Kantin)</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {semuaTransaksi.length > 0 ? semuaTransaksi.map((trx) => (
                    <tr key={trx.id}>
                      <td><strong>TRX-{trx.id}</strong></td>
                      <td>{new Date(trx.createdAt).toLocaleDateString('id-ID')}</td>
                      <td>{trx.Pembeli?.username || 'N/A'}</td>
                      <td>{trx.Penjual?.username || 'N/A'}</td>
                      <td><strong style={{ color: '#FF8C00', fontSize: '15px' }}>Rp {(trx.total_harga || 0).toLocaleString('id-ID')}</strong></td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="empty-row">Tidak ada transaksi</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile Cards */}
          {isMobile && (
            <div className="card-list-transaksi">
              {semuaTransaksi.length > 0 ? semuaTransaksi.map((trx) => (
                <div key={trx.id} className="card-transaksi">
                  <div className="card-trx-header">
                    <div className="card-trx-id">TRX-{trx.id}</div>
                    <strong style={{ color: '#FF8C00', fontSize: '15px' }}>
                      Rp {(trx.total_harga || 0).toLocaleString('id-ID')}
                    </strong>
                  </div>
                  <div className="card-trx-row">
                    <span className="card-trx-label">Tanggal</span>
                    <span>{new Date(trx.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="card-trx-row">
                    <span className="card-trx-label">Pembeli</span>
                    <strong>{trx.Pembeli?.username || 'N/A'}</strong>
                  </div>
                  <div className="card-trx-row">
                    <span className="card-trx-label">Penjual</span>
                    <strong>{trx.Penjual?.username || 'N/A'}</strong>
                  </div>
                </div>
              )) : (
                <div className="empty-card">Tidak ada transaksi</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransaksiAdmin;