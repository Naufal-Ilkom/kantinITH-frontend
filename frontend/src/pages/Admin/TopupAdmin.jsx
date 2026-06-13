import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { formatDate } from '../../utils/dateFormatter';
import './TopupAdmin.css';

const TopupAdmin = () => {
  const [topupRequests, setTopupRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('menunggu');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const token = localStorage.getItem('accessToken');
  // Memasukkan config ke dalam useMemo atau membiarkannya, namun agar aman dengan useCallback, kita definisikan ulang di dalam atau dipastikan dependensinya konstan
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // PERBAIKAN: Membungkus fungsi dengan useCallback dan menambahkan dependensi yang diperlukan
  const fetchTopupRequests = useCallback(async () => {
    try {
      setLoading(true);
      const url = filterStatus === 'semua'
        ? 'http://localhost:5000/api/topup-requests'
        : `http://localhost:5000/api/topup-requests/status/${filterStatus}`;
      const response = await axios.get(url, config);
      setTopupRequests(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching topup requests:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]); // Mengikuti perubahan filterStatus untuk mengambil data baru

  // PERBAIKAN: Menambahkan fetchTopupRequests ke dalam dependency array useEffect
  useEffect(() => {
    fetchTopupRequests();
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchTopupRequests]);

  const handleApprove = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/topup-approve/${id}`, { catatan_admin: catatan }, config);
      alert('Topup berhasil disetujui!');
      closeModal(); 
      fetchTopupRequests();
    } catch { 
      alert('Gagal menyetujui topup'); 
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/topup-reject/${id}`, { catatan_admin: catatan }, config);
      alert('Topup berhasil ditolak!');
      closeModal(); 
      fetchTopupRequests();
    } catch { 
      alert('Gagal menolak topup'); 
    }
  };

  const openModal = (request, action) => {
    setSelectedRequest({ ...request, action });
    setCatatan('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setCatatan('');
  };

  const TipeBadge = ({ tipe }) => {
    const isTopup = tipe === 'topup_saldo';
    return (
      <span style={{
        background: isTopup ? '#e0e7ff' : '#fce7f3',
        color: isTopup ? '#4f46e5' : '#db2777',
        padding: '5px 12px', borderRadius: '8px',
        fontWeight: 700, fontSize: '12px'
      }}>
        {isTopup ? '💰 Top Up' : '🔄 Tarik Saldo'}
      </span>
    );
  };

  const StatusBadge = ({ status }) => {
    const map = {
      menunggu:   { label: '⏳ Menunggu', color: '#f59e0b', bg: '#fef3c7' },
      disetujui: { label: '✓ Disetujui', color: '#10b981', bg: '#d1fae5' },
      ditolak:   { label: '✗ Ditolak',   color: '#ef4444', bg: '#fee2e2' },
    };
    const s = map[status] || map.menunggu;
    return (
      <span style={{ background: s.bg, color: s.color, padding: '5px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '12px' }}>
        {s.label}
      </span>
    );
  };

  const filters = [
    { key: 'menunggu',  label: '⏳ Menunggu',  activeColor: '#FF8C00' },
    { key: 'disetujui', label: '✓ Disetujui',  activeColor: '#10b981' },
    { key: 'ditolak',   label: '✗ Ditolak',    activeColor: '#ef4444' },
    { key: 'semua',     label: '📊 Semua',      activeColor: '#1e293b' },
  ];

  return (
    <div className="content-container-topup">
      <h2 className="page-title-topup">Manajemen Top Up & Tarik Saldo</h2>

      {/* Filter Buttons */}
      <div className="filter-bar-topup">
        {filters.map(f => (
          <button
            key={f.key}
            className="filter-btn-topup"
            style={filterStatus === f.key
              ? { background: f.activeColor, color: 'white', boxShadow: `0 4px 12px ${f.activeColor}55` }
              : {}}
            onClick={() => setFilterStatus(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <div className="loading-bar-topup">⏳ Memuat data...</div>}

      {/* Desktop Table */}
      {!loading && !isMobile && (
        <div className="table-wrapper-topup">
          <table className="table-topup">
            <thead>
              <tr>
                <th>ID Permintaan</th>
                <th>Pengguna</th>
                <th>Tipe</th>
                <th>Nominal</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {topupRequests.length > 0 ? topupRequests.map((req) => (
                <tr key={req.id}>
                  <td>
                    <strong>REQ-{String(req.id).padStart(4, '0')}</strong>
                    <div className="sub-text-topup">{formatDate(req.createdAt)}</div>
                  </td>
                  <td>
                    <strong>{req.User?.username || 'N/A'}</strong>
                    <div className="sub-text-topup">Role: {req.User?.role || 'N/A'}</div>
                  </td>
                  <td><TipeBadge tipe={req.tipe} /></td>
                  <td><strong style={{ fontSize: '15px' }}>Rp {Number(req.jumlah).toLocaleString('id-ID')}</strong></td>
                  <td style={{ textAlign: 'center' }}><StatusBadge status={req.status} /></td>
                  <td style={{ textAlign: 'center' }}>
                    {req.status === 'menunggu' ? (
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button className="btn-acc-topup" onClick={() => openModal(req, 'approve')}>✓ ACC</button>
                        <button className="btn-tolak-topup" onClick={() => openModal(req, 'reject')}>✗ Tolak</button>
                      </div>
                    ) : (
                      <span className="sub-text-topup">Sudah diproses</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="empty-row-topup">Tidak ada permintaan ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Cards */}
      {!loading && isMobile && (
        <div className="card-list-topup">
          {topupRequests.length > 0 ? topupRequests.map((req) => (
            <div key={req.id} className="card-topup">
              <div className="card-topup-header">
                <div>
                  <div className="card-topup-id">REQ-{String(req.id).padStart(4, '0')}</div>
                  <div className="sub-text-topup">{formatDate(req.createdAt)}</div>
                </div>
                <TipeBadge tipe={req.tipe} />
              </div>
              <div className="card-topup-row">
                <span className="card-topup-label">Pengguna</span>
                <div style={{ textAlign: 'right' }}>
                  <strong>{req.User?.username || 'N/A'}</strong>
                  <div className="sub-text-topup">Role: {req.User?.role || 'N/A'}</div>
                </div>
              </div>
              <div className="card-topup-row">
                <span className="card-topup-label">Nominal</span>
                <strong style={{ fontSize: '16px', color: '#0f172a' }}>
                  Rp {Number(req.jumlah).toLocaleString('id-ID')}
                </strong>
              </div>
              <div className="card-topup-footer">
                <StatusBadge status={req.status} />
                {req.status === 'menunggu' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-acc-topup" onClick={() => openModal(req, 'approve')}>✓ ACC</button>
                    <button className="btn-tolak-topup" onClick={() => openModal(req, 'reject')}>✗ Tolak</button>
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="empty-card-topup">Tidak ada permintaan ditemukan</div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="modal-overlay-topup">
          <div className="modal-box-topup">
            <div className="modal-topup-header">
              <h3>{selectedRequest.action === 'approve' ? '✓ Setujui Permintaan' : '✗ Tolak Permintaan'}</h3>
              <button className="btn-close-topup" onClick={closeModal}>✕</button>
            </div>

            <div className="modal-topup-info">
              <div className="modal-topup-row">
                <span>Pengguna</span>
                <strong>{selectedRequest.User?.username}</strong>
              </div>
              <div className="modal-topup-row">
                <span>Tipe</span>
                <TipeBadge tipe={selectedRequest.tipe} />
              </div>
              <div className="modal-topup-row">
                <span>Nominal</span>
                <strong style={{ fontSize: '16px' }}>Rp {Number(selectedRequest.jumlah).toLocaleString('id-ID')}</strong>
              </div>
            </div>

            <textarea
              placeholder="Catatan admin (opsional)"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="textarea-topup"
            />

            <div className="modal-topup-actions">
              <button className="btn-cancel-topup" onClick={closeModal}>Batal</button>
              <button
                className={selectedRequest.action === 'approve' ? 'btn-confirm-acc' : 'btn-confirm-tolak'}
                onClick={() => selectedRequest.action === 'approve'
                  ? handleApprove(selectedRequest.id)
                  : handleReject(selectedRequest.id)
                }
              >
                {selectedRequest.action === 'approve' ? '✓ Setujui' : '✗ Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopupAdmin;