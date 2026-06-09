import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LaporanAdmin.css';

const LaporanAdmin = () => {
  const [stats, setStats] = useState({ totalPerputaran: 0, totalPembeli: 0, totalPenjual: 0, totalPesanan: 0 });
  const [transaksi, setTransaksi] = useState([]);
  const [filterStatus, setFilterStatus] = useState('semua');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    fetchDataLaporan();
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDataLaporan = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [resLaporan, resUsers] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/laporan', { headers }),
        axios.get('http://localhost:5000/api/admin/users', { headers }),
      ]);

      const pesananSukses = resLaporan.data.filter(item => item.status === 'selesai');
      const totalUang = pesananSukses.reduce((sum, item) => sum + item.total_harga, 0);
      const pembeli = resUsers.data.filter(u => u.role === 'pembeli').length;
      const penjual = resUsers.data.filter(u => u.role === 'penjual').length;

      setStats({ totalPerputaran: totalUang, totalPembeli: pembeli, totalPenjual: penjual, totalPesanan: pesananSukses.length });
      setTransaksi(resLaporan.data);
    } catch (err) {
      console.error("Gagal memuat laporan:", err);
      alert("Gagal memuat laporan.");
    } finally {
      setLoading(false);
    }
  };

  const transaksiTerfilter = filterStatus === 'semua'
    ? transaksi
    : transaksi.filter(t => t.status === filterStatus);

  const statusStyle = (status) => {
    const map = {
      selesai:  { bg: '#d1fae5', color: '#10b981' },
      menunggu: { bg: '#fef3c7', color: '#d97706' },
    };
    const s = map[status] || { bg: '#fee2e2', color: '#ef4444' };
    return { background: s.bg, color: s.color, padding: '5px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', display: 'inline-block' };
  };

  const filterBtns = [
    { key: 'semua',    label: 'Semua' },
    { key: 'menunggu', label: 'Menunggu' },
    { key: 'selesai',  label: 'Selesai' },
  ];

  const statCards = [
    { label: 'Total Pembeli Aktif', value: stats.totalPembeli, unit: 'Mahasiswa', color: '#10b981' },
    { label: 'Total Kantin / Penjual', value: stats.totalPenjual, unit: 'Toko', color: '#FF8C00' },
    { label: 'Total Pesanan Sukses', value: stats.totalPesanan, unit: 'Pesanan', color: '#3b82f6' },
  ];

  return (
    <div className="content-container-laporan">
      <div className="laporan-top-header">
        <h2 className="page-title-laporan">Laporan Sistem Kantin ITH</h2>
        <button className="btn-refresh-laporan" onClick={fetchDataLaporan}>🔄 Refresh</button>
      </div>

      {loading && <div className="loading-bar-laporan">⏳ Memuat laporan...</div>}

      {!loading && (
        <>
          {/* Hero Card */}
          <div className="hero-card-laporan">
            <p className="hero-label">Total Perputaran Transaksi (Pesanan Selesai)</p>
            <h1 className="hero-value">Rp {stats.totalPerputaran.toLocaleString('id-ID')}</h1>
          </div>

          {/* Stat Grid */}
          <div className="stat-grid-laporan">
            {statCards.map((s, i) => (
              <div key={i} className="stat-card-laporan">
                <p className="stat-label">{s.label}</p>
                <div className="stat-value-row">
                  <span className="stat-number">{s.value}</span>
                  <span className="stat-unit" style={{ color: s.color }}>{s.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tabel Section */}
          <div className="table-section-laporan">
            <div className="table-section-header">
              <h3 className="section-title-laporan">Riwayat Transaksi Lengkap</h3>
              <div className="filter-bar-laporan">
                {filterBtns.map(f => (
                  <button
                    key={f.key}
                    className={`filter-btn-laporan ${filterStatus === f.key ? 'active' : ''}`}
                    onClick={() => setFilterStatus(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Table */}
            {!isMobile && (
              <div className="table-wrapper-laporan">
                <table className="table-laporan">
                  <thead>
                    <tr>
                      <th>ID Pesanan</th>
                      <th>Pembeli</th>
                      <th>Penjual</th>
                      <th>Detail Item</th>
                      <th style={{ textAlign: 'right' }}>Total Harga</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaksiTerfilter.length > 0 ? transaksiTerfilter.map((t) => (
                      <tr key={t.id}>
                        <td><strong>#{t.id}</strong></td>
                        <td>{t.Pembeli?.username || 'N/A'}</td>
                        <td>{t.Penjual?.username || 'N/A'}</td>
                        <td className="detail-item-cell" title={t.detail_item}>{t.detail_item || '-'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <strong style={{ color: '#FF8C00' }}>Rp {(t.total_harga || 0).toLocaleString('id-ID')}</strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={statusStyle(t.status)}>
                            {t.status?.charAt(0).toUpperCase() + t.status?.slice(1) || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="empty-row-laporan">
                          Tidak ada transaksi dengan status "{filterStatus}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Cards */}
            {isMobile && (
              <div className="card-list-laporan">
                {transaksiTerfilter.length > 0 ? transaksiTerfilter.map((t) => (
                  <div key={t.id} className="card-laporan">
                    <div className="card-laporan-header">
                      <strong className="card-laporan-id">#{t.id}</strong>
                      <span style={statusStyle(t.status)}>
                        {t.status?.charAt(0).toUpperCase() + t.status?.slice(1) || 'N/A'}
                      </span>
                    </div>
                    <div className="card-laporan-row">
                      <span className="card-laporan-label">Pembeli</span>
                      <strong>{t.Pembeli?.username || 'N/A'}</strong>
                    </div>
                    <div className="card-laporan-row">
                      <span className="card-laporan-label">Penjual</span>
                      <strong>{t.Penjual?.username || 'N/A'}</strong>
                    </div>
                    {t.detail_item && (
                      <div className="card-laporan-detail">{t.detail_item}</div>
                    )}
                    <div className="card-laporan-footer">
                      <span className="card-laporan-label">Total</span>
                      <strong style={{ color: '#FF8C00', fontSize: '16px' }}>
                        Rp {(t.total_harga || 0).toLocaleString('id-ID')}
                      </strong>
                    </div>
                  </div>
                )) : (
                  <div className="empty-card-laporan">
                    Tidak ada transaksi dengan status "{filterStatus}"
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LaporanAdmin;