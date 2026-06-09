import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MenuDetail.css';

const MenuDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [menu, setMenu] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTokenConfig = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const [resMenu, resReviews] = await Promise.all([
        axios.get(`http://localhost:5000/api/menu/${id}`, getTokenConfig()),
        axios.get(`http://localhost:5000/api/menu/${id}/reviews`, getTokenConfig()),
      ]);
      setMenu(resMenu.data);
      setReviews(resReviews.data || []);
    } catch (err) {
      console.error('Gagal memuat detail menu:', err);
    } finally {
      setLoading(false);
    }
  }, [id, getTokenConfig]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleAddToCart = () => {
    const existing = JSON.parse(sessionStorage.getItem('pendingCart') || '[]');
    const found = existing.find(i => i.id === menu.id);
    if (!found) {
      sessionStorage.setItem('pendingCart', JSON.stringify([...existing, { ...menu, qty: 1 }]));
    }
    navigate('/pembeli/dashboard');
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const StarDisplay = ({ value, size = 16 }) => (
    <span className="star-wrapper">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= value ? '#FF8C00' : '#e2e8f0', fontSize: size }}>★</span>
      ))}
    </span>
  );

  if (loading) return (
    <div className="detail-loading">
      <div className="detail-spinner" />
      <p>Memuat detail menu...</p>
    </div>
  );

  if (!menu) return (
    <div className="detail-loading">
      <p>Menu tidak ditemukan.</p>
      <button className="btn-back-error" onClick={() => navigate('/pembeli/dashboard')}>← Kembali</button>
    </div>
  );

  return (
    <div className="detail-container">
      {/* Tombol Kembali Atas */}
      <button className="btn-back-global" onClick={() => navigate('/pembeli/dashboard')}>
        ← Kembali ke Daftar Menu
      </button>

      {/* Main Layout Card */}
      <div className="detail-card-layout">
        
        {/* Kolom Kiri: Gambar */}
        <div className="detail-img-section">
          {menu.gambar ? (
            <img src={menu.gambar} alt={menu.nama_produk} className="detail-main-image" />
          ) : (
            <div className="detail-image-placeholder">🍽️ No Image</div>
          )}
        </div>

        {/* Kolom Kanan: Detail Informasi */}
        <div className="detail-info-section">
          <span className="info-badge-kategori">{menu.kategori}</span>
          <h1 className="info-nama-produk">{menu.nama_produk}</h1>
          <p className="info-pemilik-toko">
            Oleh <span className="owner-highlight">{menu.User?.username || menu.user?.username || 'Kantin ITH'}</span>
          </p>

          {/* Rating Summary */}
          <div className="info-rating-row">
            <span className="rating-avg-box">⭐ {avgRating || '0.0'}</span>
            <StarDisplay value={Math.round(avgRating || 0)} size={18} />
            <span className="rating-count-text">({reviews.length} Ulasan)</span>
          </div>

          <hr className="detail-divider" />

          {/* Harga & Stok */}
          <div className="info-price-stock-row">
            <div className="price-box">
              <span className="price-label">Harga Satuan</span>
              <h2 className="price-number">Rp {(menu.harga || 0).toLocaleString('id-ID')}</h2>
            </div>
            <div className="stock-box">
              <span className={`stock-badge ${menu.stok <= 0 ? 'out' : menu.stok <= 5 ? 'low' : 'safe'}`}>
                {menu.stok <= 0 ? 'Habis' : `Stok: ${menu.stok}`}
              </span>
            </div>
          </div>

          {/* Deskripsi Produk */}
          {menu.deskripsi && (
            <div className="info-deskripsi-box">
              <h4>Deskripsi</h4>
              <p>{menu.deskripsi}</p>
            </div>
          )}

          {/* Tombol Aksi */}
          <button
            className="btn-action-cart"
            onClick={handleAddToCart}
            disabled={menu.stok <= 0}
          >
            {menu.stok <= 0 ? 'Stok Tidak Tersedia' : '＋ Tambah ke Keranjang'}
          </button>
        </div>
      </div>

      {/* Section Ulasan Pembeli */}
      <div className="detail-reviews-section">
        <h3 className="reviews-section-title">Ulasan & Penilaian</h3>
        
        <div className="reviews-list-container">
          {reviews.length === 0 ? (
            <div className="reviews-empty-box">
              💬 Belum ada ulasan untuk menu ini.
            </div>
          ) : (
            reviews.map((r, i) => (
              <div key={r.id || i} className="review-item-card">
                <div className="review-item-top">
                  <div className="reviewer-profile-flex">
                    <div className="reviewer-avatar-circle">
                      {(r.Pembeli?.username || r.pembeli || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="reviewer-meta">
                      <h5 className="reviewer-name">{r.Pembeli?.username || r.pembeli || 'Pelanggan'}</h5>
                      <div className="reviewer-stars-flex">
                        <StarDisplay value={r.rating} size={12} />
                        {r.createdAt && (
                          <span className="review-timestamp">
                            {new Date(r.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {r.komentar && <p className="review-body-text">“{r.komentar}”</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuDetail;