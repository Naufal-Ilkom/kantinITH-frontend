import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ConfirmationModal from '../../components/ConfirmationModal';
import './RiwayatPembeli.css';

const RiwayatPembeli = () => {
  const [riwayatTransaksi, setRiwayatTransaksi] = useState([]);
  const [activeTab, setActiveTab] = useState('belum-selesai');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // State Fitur Ulasan
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem('user')) || {};

  const fetchRiwayat = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('http://localhost:5000/api/pesan', config);

      const dataRiwayat = Array.isArray(response.data) ? response.data : [];
      const riwayatSaya = dataRiwayat.filter(trx => trx.id_pembeli == user.id);
      riwayatSaya.sort((a, b) => b.id - a.id);

      setRiwayatTransaksi(riwayatSaya);
      setLoading(false);
    } catch (error) {
      console.error("Gagal mengambil riwayat", error);
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (user.id) fetchRiwayat();
  }, [user.id, fetchRiwayat]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const openConfirmationModal = (orderId) => {
    setSelectedOrderId(orderId);
    setModalOpen(true);
  };

  const closeConfirmationModal = () => {
    setModalOpen(false);
    setSelectedOrderId(null);
  };

  const openReviewModal = (order) => {
    setSelectedOrderForReview(order);
    setRating(0);
    setComment('');
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedOrderForReview(null);
  };

  const executeSubmitReview = async () => {
    if (!selectedOrderForReview || rating === 0) return;
    setReviewSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.post(
        `http://localhost:5000/api/menu/${selectedOrderForReview.id_menu}/reviews`,
        {
          id_pesanan: selectedOrderForReview.id,
          id_pembeli: user.id,
          rating: rating,
          komentar: comment
        },
        config
      );

      if (response.data.success) {
        setSuccessMessage(response.data.message || "Ulasan berhasil dikirim!");
        closeReviewModal();
        await fetchRiwayat(); 
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Gagal mengirimkan ulasan pesanan."
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const executeCancelOrder = async () => {
    if (!selectedOrderId) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.put(
        `http://localhost:5000/api/pesanan/${selectedOrderId}/cancel`,
        {},
        config
      );

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        const updatedUser = { ...user, saldo: response.data.saldoBaru };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        await fetchRiwayat();
        closeConfirmationModal();
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Gagal membatalkan pesanan. Terjadi kesalahan jaringan."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const transaksiSelesai = riwayatTransaksi.filter(
    trx => trx.status === 'selesai' || trx.status === 'dibatalkan' || trx.status === 'ditolak'
  );
  const transaksiBelumSelesai = riwayatTransaksi.filter(
    trx => trx.status !== 'selesai' && trx.status !== 'dibatalkan' && trx.status !== 'ditolak'
  );

  const dataToDisplay = activeTab === 'selesai' ? transaksiSelesai : transaksiBelumSelesai;

  if (loading) return <div style={{ padding: '20px', color: '#94a3b8' }}>Memuat riwayat...</div>;

  return (
    <div className="content-container">
      <h2 className="page-title">Riwayat Transaksi</h2>

      {successMessage && <div className="notification-success">✓ {successMessage}</div>}
      {errorMessage && <div className="notification-error">✕ {errorMessage}</div>}

      {/* TAB */}
      <div className="tab-container">
        <button
          className={`tab-button ${activeTab === 'belum-selesai' ? 'active' : ''}`}
          onClick={() => setActiveTab('belum-selesai')}
        >
          Belum Selesai ({transaksiBelumSelesai.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'selesai' ? 'active' : ''}`}
          onClick={() => setActiveTab('selesai')}
        >
          Selesai / Dibatalkan ({transaksiSelesai.length})
        </button>
      </div>

      {/* ========== TABEL — DESKTOP ========== */}
      <div className="riwayat-table-wrapper">
        <table className="modern-table">
          <thead>
            <tr>
              <th>ID Pesanan</th>
              <th>Nama Penjual</th>
              <th>Detail Pesanan</th>
              <th>Total Harga</th>
              <th>Waktu Pesanan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {dataToDisplay.length > 0 ? (
              dataToDisplay.map((trx) => (
                <tr key={trx.id}>
                  <td><strong>ORD-{trx.id}</strong></td>
                  <td>{trx.Penjual?.username || 'N/A'}</td>
                  <td>{trx.detail_item}</td>
                  <td>Rp {Number(trx.total_harga).toLocaleString()}</td>
                  <td style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {new Date(trx.createdAt).toLocaleString('id-ID')}
                  </td>
                  <td>
                    <span className={`status-badge ${trx.status?.toLowerCase() || 'menunggu'}`}>
                      {trx.status || 'Menunggu'}
                    </span>
                  </td>
                  <td>
                    {trx.status?.toLowerCase() === 'menunggu' ? (
                      <button
                        onClick={() => openConfirmationModal(trx.id)}
                        disabled={actionLoading}
                        className="btn-batalkan"
                      >
                        {actionLoading ? 'Proses...' : 'Batalkan'}
                      </button>
                    ) : trx.status?.toLowerCase() === 'selesai' ? (
                      trx.Review ? (
                        <button className="btn-ulas-selesai" disabled>
                          Sudah Diulas ✓
                        </button>
                      ) : (
                        <button onClick={() => openReviewModal(trx)} className="btn-ulas-table">
                          Ulas ⭐
                        </button>
                      )
                    ) : (
                      <span style={{ fontSize: '12px', color: '#cbd5e1' }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty-state">Belum ada transaksi ditemukan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ========== CARD LIST — MOBILE ========== */}
      <div className="riwayat-card-list">
        {dataToDisplay.length > 0 ? (
          dataToDisplay.map((trx) => (
            <div key={trx.id} className="riwayat-card">
              <div className="riwayat-card-header">
                <span className="riwayat-card-id">ORD-{trx.id}</span>
                <span className={`status-badge ${trx.status?.toLowerCase() || 'menunggu'}`}>
                  {trx.status || 'Menunggu'}
                </span>
              </div>

              <div className="riwayat-card-body">
                <div className="riwayat-card-row">
                  <span className="riwayat-card-label">Penjual</span>
                  <span className="riwayat-card-value">{trx.Penjual?.username || 'N/A'}</span>
                </div>
                <div className="riwayat-card-row">
                  <span className="riwayat-card-label">Detail</span>
                  <span className="riwayat-card-value">{trx.detail_item}</span>
                </div>
                <div className="riwayat-card-row">
                  <span className="riwayat-card-label">Total</span>
                  <span className="riwayat-card-value harga">Rp {Number(trx.total_harga).toLocaleString()}</span>
                </div>
                <div className="riwayat-card-row">
                  <span className="riwayat-card-label">Waktu</span>
                  <span className="riwayat-card-value" style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {new Date(trx.createdAt).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {trx.status?.toLowerCase() === 'menunggu' && (
                <div className="riwayat-card-footer">
                  <button onClick={() => openConfirmationModal(trx.id)} disabled={actionLoading} className="btn-batalkan">
                    {actionLoading ? 'Proses...' : 'Batalkan Pesanan'}
                  </button>
                </div>
              )}

              {trx.status?.toLowerCase() === 'selesai' && (
                <div className="riwayat-card-footer">
                  {trx.Review ? (
                    <button className="btn-ulas-selesai-mobile" disabled>
                      Sudah Memberikan Ulasan ✓
                    </button>
                  ) : (
                    <button onClick={() => openReviewModal(trx)} className="btn-ulas-mobile-submit">
                      Beri Ulasan Pesanan ⭐
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '14px' }}>
            Belum ada transaksi ditemukan.
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={modalOpen}
        title="Batalkan Pesanan"
        message="Yakin ingin membatalkan pesanan ini? Saldo Anda akan dikembalikan secara penuh."
        onConfirm={executeCancelOrder}
        onCancel={closeConfirmationModal}
        isLoading={actionLoading}
        confirmText="Ya, Batalkan"
        cancelText="Batal"
        isDangerous={true}
      />

      {/* POPUP MODAL INPUT REVIEW */}
      {showReviewModal && selectedOrderForReview && (
        <div className="review-popup-overlay">
          <div className="review-popup-box">
            <h3 className="review-popup-title">Beri Ulasan Kuliner</h3>
            <p className="review-popup-subtitle">
              Bagaimana kualitas rasa dari <strong>{selectedOrderForReview.detail_item}</strong>?
            </p>

            <div className="star-selection-container">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className="star-selection-item"
                  style={{ color: i <= (hoverRating || rating) ? '#FF8C00' : '#e2e8f0' }}
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(i)}
                >
                  ★
                </span>
              ))}
            </div>

            {rating > 0 && (
              <span className="star-selection-label">
                {['', 'Buruk sekali 😞', 'Kurang cocok 😐', 'Cukup lumayan 🙂', 'Bagus & Enak 😋', 'Sangat Lezat! 😍'][rating]}
              </span>
            )}

            <textarea
              className="review-popup-textarea"
              placeholder="Tulis testimoni rasa makanan di sini... (opsional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />

            <div className="review-popup-actions">
              <button type="button" className="btn-popup-cancel" onClick={closeReviewModal} disabled={reviewSubmitting}>
                Kembali
              </button>
              <button type="button" className="btn-popup-submit" disabled={reviewSubmitting || rating === 0} onClick={executeSubmitReview}>
                {reviewSubmitting ? 'Mengirim...' : 'Kirim Penilaian'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiwayatPembeli;