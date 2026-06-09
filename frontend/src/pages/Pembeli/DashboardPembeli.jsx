import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DashboardPembeli.css';

const DashboardPembeli = ({ userBalance, setUserBalance, user, setUser }) => {
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCartModal, setShowCartModal] = useState(false);
  const [cart, setCart] = useState([]);
  const [katalogMenu, setKatalogMenu] = useState([]);

  const getTokenConfig = () => {
    const token = localStorage.getItem('accessToken');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchUserBalance = async () => {
    if (!user || !user.id) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/users/${user.id}`, getTokenConfig());
      if (response.data) {
        setUserBalance(response.data.saldo);
        setUser(prevUser => {
          const updatedUser = { ...prevUser, saldo: response.data.saldo };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          return updatedUser;
        });
      }
    } catch (err) { console.error("Error fetching balance:", err); }
  };

  const fetchMenu = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/menu', getTokenConfig());
      setKatalogMenu(response.data);
    } catch (err) { console.error("Gagal mengambil menu:", err); }
  };

  useEffect(() => {
    fetchMenu();
    fetchUserBalance();

    // Ambil pending cart yang dikembalikan dari halaman MenuDetail
    const pending = JSON.parse(sessionStorage.getItem('pendingCart') || '[]');
    if (pending.length > 0) {
      setCart(pending);
      sessionStorage.removeItem('pendingCart');
      setShowCartModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredMenu = katalogMenu.filter(item => {
    const matchCategory = selectedCategory === 'Semua' || item.kategori?.toLowerCase() === selectedCategory.toLowerCase();
    const matchSearch = item.nama_produk.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const getSellerId = (item) => item.id_user || item.User?.id || item.user?.id;

  // e.stopPropagation() penting agar klik tombol tidak trigger navigasi ke detail
  const addToCart = (e, item) => {
    e.stopPropagation();
    const existingItem = cart.find(i => i.id === item.id);
    if (existingItem) {
      if (existingItem.qty < item.stok) {
        setCart(cart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      } else {
        alert(`Maksimal pembelian ${item.nama_produk} adalah ${item.stok}`);
      }
    } else {
      if (item.stok > 0) {
        setCart([...cart, { ...item, qty: 1, id_penjual: getSellerId(item) }]);
      }
    }
  };

  const buyNow = (e, item) => {
    e.stopPropagation();
    const existingItem = cart.find(i => i.id === item.id);
    if (!existingItem && item.stok > 0) {
      setCart([...cart, { ...item, qty: 1, id_penjual: getSellerId(item) }]);
    }
    setShowCartModal(true);
  };

  const updateQty = (id, action) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        if (action === 'add') {
          if (item.qty < item.stok) return { ...item, qty: item.qty + 1 };
          else { alert(`Stok ${item.nama_produk} hanya ${item.stok}`); return item; }
        } else {
          return { ...item, qty: Math.max(1, item.qty - 1) };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  const calculateTotal = () => cart.reduce((acc, curr) => acc + (curr.harga * curr.qty), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const detailString = cart.map(item => `${item.nama_produk} (${item.qty})`).join(", ");
    try {
      const response = await axios.post('http://localhost:5000/api/pesan', {
        id_pembeli: user.id,
        total_harga: calculateTotal(),
        detail_pesanan: detailString,
        items_raw: cart
      }, getTokenConfig());

      if (response.data.success || response.status === 200 || response.status === 201) {
        alert("Pembayaran Berhasil! Dana Anda ditahan sistem sampai pesanan diselesaikan penjual.");
        const sisaSaldo = response.data.sisaSaldo !== undefined ? response.data.sisaSaldo : (userBalance - calculateTotal());
        setUserBalance(sisaSaldo);
        setUser(prevUser => {
          const updatedUser = { ...prevUser, saldo: sisaSaldo };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          return updatedUser;
        });
        setCart([]);
        setShowCartModal(false);
        fetchMenu();
        fetchUserBalance();
      }
    } catch (err) {
      alert(`Sistem Error: ${err.response?.data?.message || err.message}`);
    }
  };

  // Tampilkan bintang rata-rata jika backend sudah mengembalikan avg_rating
  const StarRow = ({ avg }) => {
    if (!avg) return null;
    const rounded = Math.round(avg);
    return (
      <div className="card-star-row">
        {[1,2,3,4,5].map(i => (
          <span key={i} style={{ color: i <= rounded ? '#f59e0b' : '#e2e8f0', fontSize: 13 }}>★</span>
        ))}
        <span className="card-star-score">{parseFloat(avg).toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="content-container">
      <div className="section-header-inline">
        <h2 className="page-title">Menu Pilihan Hari Ini</h2>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Cari nama makanan atau minuman..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '14px 18px',
            borderRadius: '12px', border: '1.5px solid #cbd5e1',
            fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Filter */}
      <div className="filter-chips">
        {['Semua', 'Makanan', 'Minuman', 'Dessert'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`nav-btn-filter ${selectedCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid Menu */}
      <div className="menu-grid-layout">
        {filteredMenu.map((item) => {
          const cartItem = cart.find(i => i.id === item.id);
          const isMaxReached = cartItem && cartItem.qty >= item.stok;

          return (
            <div
              key={item.id}
              className="modern-card"
              onClick={() => navigate(`/pembeli/menu/${item.id}`)}
              style={{ cursor: 'pointer' }}
            >
              {/* Gambar */}
              <div className="card-img-container" style={{ position: 'relative' }}>
                {item.gambar
                  ? <img src={item.gambar} alt={item.nama_produk} />
                  : <div className="no-image">🍽️</div>
                }
                {item.stok <= 0 && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.45)',
                    borderRadius: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: 15, letterSpacing: 1
                  }}>
                    Habis
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="card-body">
                <span className="kategori-badge">{item.kategori}</span>
                <h3>{item.nama_produk}</h3>
                <p className="kantin-label">
                  {item.User?.username || item.user?.username || 'Kantin'}
                </p>

                {/* Bintang — muncul jika backend sudah ada avg_rating */}
                <StarRow avg={item.avg_rating} />

                <div className="card-footer">
                  <span className="price-text">Rp {item.harga.toLocaleString('id-ID')}</span>
                  <span className="stock-label">Stok: {item.stok}</span>
                </div>
              </div>

              {/* Tombol — pakai e.stopPropagation() */}
              <div style={{ display: 'flex', gap: '6px', padding: '0 10px 10px' }}>
                <button
                  type="button"
                  onClick={(e) => addToCart(e, item)}
                  disabled={item.stok <= 0 || isMaxReached}
                  style={{
                    flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
                    fontWeight: 'bold', fontFamily: 'inherit', fontSize: 13,
                    background: isMaxReached || item.stok <= 0 ? '#cbd5e1' : '#f1f5f9',
                    color: isMaxReached || item.stok <= 0 ? '#64748b' : '#334155',
                    cursor: isMaxReached || item.stok <= 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  + Keranjang
                </button>
                <button
                  type="button"
                  onClick={(e) => buyNow(e, item)}
                  disabled={item.stok <= 0}
                  style={{
                    flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
                    fontWeight: 'bold', fontFamily: 'inherit', fontSize: 13,
                    color: 'white',
                    background: item.stok <= 0 ? '#cbd5e1' : '#FF8C00',
                    cursor: item.stok <= 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Pesan
                </button>
              </div>
            </div>
          );
        })}

        {filteredMenu.length === 0 && (
          <div style={{ padding: '40px', color: '#94a3b8', width: '100%', textAlign: 'center', fontWeight: 600 }}>
            Menu "{searchQuery}" tidak ditemukan
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      <button
        type="button"
        className="btn-cart-floating"
        onClick={() => setShowCartModal(true)}
        aria-label="Buka keranjang belanja"
      >
        🛒
        {cart.length > 0 && (
          <span className="cart-badge">{cart.reduce((a, b) => a + b.qty, 0)}</span>
        )}
      </button>

      {/* Modal Keranjang */}
      {showCartModal && (
        <div className="modal-overlay">
          <div className="cart-modal-content">
            <div className="modal-header">
              <h2>Keranjang Belanja</h2>
              <button className="close-modal" onClick={() => setShowCartModal(false)}>&times;</button>
            </div>
            <div className="cart-items-container">
              {cart.map((item) => (
                <div key={item.id} className="cart-item-row">
                  <div className="item-info">
                    <div className="item-name">{item.nama_produk}</div>
                    <div className="item-price">
                      Rp {item.harga.toLocaleString('id-ID')}
                      <span style={{ color: '#94a3b8' }}> x {item.qty}</span>
                    </div>
                  </div>
                  <div className="qty-controls">
                    <button className="qty-btn" onClick={() => updateQty(item.id, 'minus')}>-</button>
                    <span className="qty-number">{item.qty}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.id, 'add')}>+</button>
                    <button className="btn-delete-item" onClick={() => removeFromCart(item.id)}>🗑️</button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Keranjang kosong</p>
              )}
            </div>
            <div className="cart-footer">
              <div className="total-bar">
                <span>Total:</span>
                <span style={{ color: '#FF8C00', fontWeight: 800 }}>
                  Rp {calculateTotal().toLocaleString('id-ID')}
                </span>
              </div>
              {calculateTotal() > userBalance && (
                <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 700, margin: '4px 0 0', textAlign: 'right' }}>
                  Saldo kamu: Rp {(userBalance || 0).toLocaleString('id-ID')}
                </p>
              )}
              <button
                type="button"
                className="btn-checkout-modal"
                onClick={handleCheckout}
                disabled={cart.length === 0 || calculateTotal() > userBalance}
              >
                {calculateTotal() > userBalance ? "Saldo Tidak Cukup" : "Bayar Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPembeli;