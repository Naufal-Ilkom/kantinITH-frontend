import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DashboardPenjual.css';

const DashboardPenjual = ({ user }) => {
  const [katalogMenu, setKatalogMenu] = useState([]); 
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState(''); 
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const userFromStorage = user || JSON.parse(localStorage.getItem('user')) || { id: 1, username: 'Kantin' };

  const [formData, setFormData] = useState({ 
    id: null, 
    nama_produk: '', 
    kategori: 'makanan', // default lowercase
    harga: '', 
    stok: '', 
    gambar: '', 
    id_penjual: userFromStorage.id 
  });

  const getTokenConfig = () => {
    const token = localStorage.getItem('accessToken');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  const fetchMenu = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/menu?id_penjual=${userFromStorage.id}`, getTokenConfig());
      setKatalogMenu(res.data);
    } catch (err) {
      console.error("Gagal mengambil menu:", err);
      if (err.response && err.response.status === 401) {
        alert("Sesi Anda telah habis atau Token tidak valid. Silakan login kembali.");
      }
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const filteredMenu = katalogMenu.filter(item => {
    const matchKategori = filterKategori === 'Semua' || item.kategori.toLowerCase() === filterKategori.toLowerCase();
    const matchSearch = item.nama_produk.toLowerCase().startsWith(searchQuery.toLowerCase());
    return matchKategori && matchSearch;
  });

  const handleOpenAdd = () => {
    setFormData({ id: null, nama_produk: '', kategori: 'makanan', harga: '', stok: '', gambar: '', id_penjual: userFromStorage.id });
    setEditMode(false);
    setShowMenuModal(true);
  };

  const handleOpenEdit = (item) => {
    setFormData({ ...item, id_penjual: userFromStorage.id });
    setEditMode(true);
    setShowMenuModal(true);
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        const res = await axios.put(`http://127.0.0.1:5000/api/menu/${formData.id}`, formData, getTokenConfig());
        if (res.data.success) {
          alert('Menu diperbarui!');
          fetchMenu(); 
        }
      } else {
        const res = await axios.post('http://127.0.0.1:5000/api/menu', formData, getTokenConfig());
        if (res.data.success) {
          alert('Menu disimpan!');
          fetchMenu(); 
        }
      }
      setShowMenuModal(false);
    } catch (err) {
      console.error(err);
      alert('Gagal simpan data. ' + (err.response?.data?.message || ''));
    }
  };

  const handleDeleteMenu = async (id) => {
    if (window.confirm('Hapus menu ini?')) {
      try {
        const res = await axios.delete(`http://127.0.0.1:5000/api/menu/${id}?id_penjual=${userFromStorage.id}`, getTokenConfig());
        if (res.data.success) {
          alert('Menu dihapus!');
          fetchMenu();
        }
      } catch (err) {
        console.error("Gagal menghapus menu:", err);
      }
    }
  };

  return (
    <div className="content-container">
      
      <div className="section-header-inline">
        <h2 className="page-title">Kelola Menu Kantin</h2>
        <button className="btn-action-primary" onClick={handleOpenAdd}>+ Tambah Menu Baru</button>
      </div>

      <div className="search-bar-full">
        <input 
          type="text" 
          placeholder="🔍 Cari menu berdasarkan awalan nama (Contoh: Nasi...)" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input-full"
        />
      </div>

      <div className="filter-chips">
        {['Semua', 'makanan', 'minuman', 'dessert'].map(kategori => (
          <button 
            key={kategori} 
            onClick={() => setFilterKategori(kategori)} 
            className={`nav-btn-filter ${filterKategori === kategori ? 'active' : ''}`} 
            style={{ textTransform: 'capitalize' }}
          >
            {kategori}
          </button>
        ))}
      </div>
      
      <div className="menu-grid-layout">
        {filteredMenu.map((item) => (
          <div key={item.id} className="modern-card">
            <div className="card-img-container">
               {item.gambar ? <img src={item.gambar} alt={item.nama_produk} /> : <div className="no-image">No Image</div>}
            </div>
            
            <div className="card-body">
              <div className="card-header-info">
                 <span className="kategori-badge">{item.kategori}</span>
              </div>
              
              <h3 className="produk-title">{item.nama_produk}</h3>
              <p className="toko-text">🏪 Toko: {userFromStorage.username}</p>
              
              <div className="card-footer-info">
                <span className="price-text">Rp {item.harga.toLocaleString('id-ID')}</span>
                <span className="stock-label">Stok: {item.stok}</span>
              </div>
            </div>

            <div className="card-action-split">
              <button className="btn-edit" onClick={() => handleOpenEdit(item)}>Edit</button>
              <button className="btn-delete" onClick={() => handleDeleteMenu(item.id)}>Hapus</button>
            </div>
          </div>
        ))}
        
        {filteredMenu.length === 0 && (
          <div style={{ padding: '20px', color: '#94a3b8', width: '100%', fontSize: '15px' }}>Menu yang dicari tidak ditemukan...</div>
        )}
      </div>

      {showMenuModal && (
        <div className="modal-overlay">
          <div className="profile-modal-content" style={{ maxWidth: '500px' }}>
            <button className="close-modal" onClick={() => setShowMenuModal(false)}>&times;</button>
            <h2 style={{ marginBottom: '20px', textAlign: 'left' }}>{editMode ? 'Edit Menu' : 'Tambah Menu Baru'}</h2>
            
            <form onSubmit={handleSaveMenu} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div className="form-group">
                <label className="form-label">Nama Produk</label>
                <input 
                  type="text" 
                  required 
                  value={formData.nama_produk} 
                  onChange={(e) => setFormData({...formData, nama_produk: e.target.value})} 
                  className="form-input" 
                  placeholder="Contoh: Nasi Goreng Spesial"
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL Gambar</label>
                <input 
                  type="text" 
                  value={formData.gambar} 
                  onChange={(e) => setFormData({...formData, gambar: e.target.value})} 
                  className="form-input" 
                  placeholder="Contoh: https://link-gambar.com/foto.jpg"
                />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Harga (Rp)</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.harga} 
                    onChange={(e) => setFormData({...formData, harga: e.target.value})} 
                    className="form-input" 
                    placeholder="Contoh: 15000"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Stok</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.stok} 
                    onChange={(e) => setFormData({...formData, stok: e.target.value})} 
                    className="form-input" 
                    placeholder="Contoh: 20"
                  />
                </div>
              </div>

              {/* DROPDOWN KATEGORI MODERN */}
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select 
                  name="kategori"
                  value={formData.kategori} 
                  onChange={(e) => setFormData({...formData, kategori: e.target.value})} 
                  className="form-input custom-dropdown"
                >
                  <option value="makanan">Makanan</option>
                  <option value="minuman">Minuman</option>
                  <option value="dessert">Dessert</option>
                </select>
              </div>

              <button type="submit" className="btn-modal-full" style={{ background: '#FF8C00', color: 'white', marginTop: '10px' }}>Simpan Menu</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPenjual;