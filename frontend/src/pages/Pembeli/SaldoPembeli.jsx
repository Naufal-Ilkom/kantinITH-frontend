import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SaldoPembeli.css';

const SaldoPembeli = ({ userBalance, setUserBalance }) => {
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topupHistory, setTopupHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const user = JSON.parse(localStorage.getItem('user')) || { id: null };
  const token = localStorage.getItem('accessToken');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchTopupHistory();
  }, []);

  const fetchTopupHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/topup-request/user/${user.id}`, config);
      setTopupHistory(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching topup history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUpRequest = async (e) => {
    e.preventDefault();
    const nominal = Number(topUpAmount);
    if (!nominal || nominal <= 0) {
      alert('Masukkan nominal yang valid!');
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/api/topup-request', {
        id_user: user.id,
        jumlah: nominal,
        tipe: 'topup_saldo'
      }, config);

      if (response.data.success) {
        alert('Request top up berhasil dibuat! Menunggu persetujuan admin...');
        setTopUpAmount('');
        fetchTopupHistory();
        setShowModal(false);
      }
    } catch (err) {
      console.error("Error creating topup request:", err);
      alert('Gagal membuat request top up');
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'menunggu': return 'menunggu';
      case 'disetujui': return 'disetujui';
      case 'ditolak': return 'ditolak';
      default: return 'menunggu';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'menunggu': return '⏳ Menunggu';
      case 'disetujui': return '✓ Disetujui';
      case 'ditolak': return '✗ Ditolak';
      default: return status;
    }
  };

  return (
    <div className="content-container-full">
      <div className="balance-full-width-wrapper">
        <h2 className="page-title" style={{ marginBottom: '20px', color: '#1e293b', fontWeight: 800 }}>Saldo</h2>

        {/* HERO SALDO */}
        <div className="balance-card-hero">
          <p>Sisa Saldo Anda</p>
          <h1>Rp {(userBalance || 0).toLocaleString('id-ID')}</h1>
        </div>

        {/* CARD ISI ULANG */}
        <div className="topup-form-full">
          <div
            className="topup-form-full-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <h3>Isi Ulang Saldo</h3>
              <p>Ajukan permintaan top up untuk admin ACC.</p>
            </div>
            <button className="btn-buat-request" onClick={() => setShowModal(true)}>
              + Buat Request
            </button>
          </div>
        </div>

        {/* RIWAYAT */}
        <div style={{ marginTop: '28px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
            Riwayat Permintaan Top Up
          </h3>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              Memuat riwayat...
            </div>
          ) : topupHistory.length > 0 ? (
            <>
              {/* TABEL — DESKTOP */}
              <div className="topup-table-wrapper">
                <table className="topup-table">
                  <thead>
                    <tr>
                      <th>ID Permintaan</th>
                      <th>Nominal</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topupHistory.map((topup) => (
                      <tr key={topup.id}>
                        <td><strong>REQ-{String(topup.id).padStart(4, '0')}</strong></td>
                        <td><strong style={{ color: '#FF8C00' }}>Rp {Number(topup.jumlah).toLocaleString('id-ID')}</strong></td>
                        <td style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {new Date(topup.createdAt).toLocaleString('id-ID')}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`topup-status-badge ${getStatusClass(topup.status)}`}>
                            {getStatusLabel(topup.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* CARD LIST — MOBILE */}
              <div className="topup-card-list">
                {topupHistory.map((topup) => (
                  <div key={topup.id} className="topup-card">
                    <div className="topup-card-header">
                      <span className="topup-card-id">REQ-{String(topup.id).padStart(4, '0')}</span>
                      <span className={`topup-status-badge ${getStatusClass(topup.status)}`}>
                        {getStatusLabel(topup.status)}
                      </span>
                    </div>
                    <div className="topup-card-body">
                      <div className="topup-card-row">
                        <span className="topup-card-label">Nominal</span>
                        <span className="topup-card-value nominal">
                          Rp {Number(topup.jumlah).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="topup-card-row">
                        <span className="topup-card-label">Tanggal</span>
                        <span className="topup-card-value" style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {new Date(topup.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="topup-empty">
              Belum ada permintaan top up.
            </div>
          )}
        </div>
      </div>

      {/* MODAL TOPUP */}
      {showModal && (
        <div className="modal-overlay-topup">
          <div className="modal-box-topup">
            <h3>Buat Permintaan Top Up</h3>
            <p>Masukkan nominal yang ingin Anda top up. Permintaan akan dikirim ke admin untuk disetujui.</p>

            <form onSubmit={handleTopUpRequest}>
              <input
                type="number"
                placeholder="Contoh: 50000"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                required
                className="modal-input-topup"
              />
              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-modal-submit">
                  Kirim Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaldoPembeli;