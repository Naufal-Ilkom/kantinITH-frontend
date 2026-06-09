import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DashboardPenjual.css'; 

const ManageMenu = () => {
  const [menus, setMenus] = useState([]);
  const [filter, setFilter] = useState('Semua');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name_produk: '',
    gambar: '',
    harga: '',
    stok: '',
    kategori: 'Makanan' // Makanan otomatis terpilih pertama kali
  });

  const userLogin = JSON.parse(localStorage.getItem('user')); 

  const fetchMenus = async () => {
    if (!userLogin) return; 
    try {
      const response = await axios.get(`http://localhost:5000/api/menu?id_penjual=${userLogin.id}`);
      setMenus(response.data);
    } catch (error) {
      console.error("Gagal mengambil data menu:", error);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Yakin ingin menghapus menu ini?");
    if (confirmDelete) {
      try {
        await axios.delete(`http://localhost:5000/api/menu/${id}?id_penjual=${userLogin.id}`);
        alert("Menu berhasil dihapus!");
        fetchMenus(); 
      } catch (error) {
        alert("Gagal menghapus menu. Pastikan Anda pemiliknya.");
      }
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddMenu = async (e) => {
    e.preventDefault();
    console.log("Data dikirim:", formData);
    alert("Menu berhasil ditambahkan! (Simulasi)");
    setIsModalOpen(false);
  };

  const filteredMenus = menus.filter(menu => {
    if (filter === 'Semua') return true;
    return menu.kategori.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="manage-menu-container">
      <div className="header-menu" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Kelola Menu Kantin</h2>
        <button 
          className="btn-tambah" 
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: '#333', color: 'white', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', border: 'none' }}>
          + Tambah Menu Baru
        </button>
      </div>

      <div className="filter-tabs" style={{ margin: '20px 0', gap: '10px', display: 'flex' }}>
        <button className={filter === 'Semua' ? 'active nav-btn-filter' : 'nav-btn-filter'} onClick={() => setFilter('Semua')}>Semua</button>
        <button className={filter === 'Makanan' ? 'active nav-btn-filter' : 'nav-btn-filter'} onClick={() => setFilter('Makanan')}>Makanan</button>
        <button className={filter === 'Minuman' ? 'active nav-btn-filter' : 'nav-btn-filter'} onClick={() => setFilter('Minuman')}>Minuman</button>
      </div>

      <div className="menu-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {filteredMenus.map((item) => (
          <div className="menu-card" key={item.id} style={{ border: '1px solid #ddd', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#fff', paddingBottom: '10px' }}>
            <img src={item.gambar} alt={item.name_produk} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
            <div style={{ padding: '15px' }}>
              <p style={{ color: '#FF8C00', fontSize: '12px', fontWeight: 'bold', margin: '0' }}>{item.kategori.toUpperCase()}</p>
              <h3 style={{ margin: '5px 0' }}>{item.name_produk}</h3>
              <p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px 0' }}>
                 Toko: {item.User ? item.User.username : (userLogin ? userLogin.username : 'Unknown')}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#FF8C00', fontWeight: 'bold', fontSize: '18px' }}>
                  Rp {item.harga.toLocaleString('id-ID')}
                </span>
                <span style={{ fontSize: '12px', color: '#999' }}>Stok: {item.stok}</span>
              </div>
            </div>
            <div style={{ display: 'flex', borderTop: '1px solid #eee' }}>
              <button style={{ flex: 1, padding: '10px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', borderRight: '1px solid #eee' }}>Edit</button>
              <button onClick={() => handleDelete(item.id)} style={{ flex: 1, padding: '10px', border: 'none', backgroundColor: 'transparent', color: 'red', cursor: 'pointer' }}>Hapus</button>
            </div>
          </div>
        ))}
        {filteredMenus.length === 0 && (
            <p style={{ color: 'gray', padding: '20px 0' }}>Belum ada menu di kategori ini.</p>
        )}
      </div>

      {/* MODAL TAMBAH MENU */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="profile-modal-content">
            <button className="close-modal" onClick={() => setIsModalOpen(false)}>×</button>
            <h2 style={{ textAlign: 'left', margin: '0 0 20px 0', color: '#0f172a' }}>Tambah Menu Baru</h2>
            
            <div className="form-scroll-container">
              <form onSubmit={handleAddMenu}>
                
                {/* PENAMBAHAN PLACEHOLDER (Teks Contoh) */}
                <div className="form-group">
                  <label className="form-label">Nama Produk</label>
                  <input 
                    type="text" 
                    name="name_produk" 
                    className="form-input" 
                    value={formData.name_produk} 
                    onChange={handleInputChange} 
                    placeholder="Contoh: Nasi Goreng Spesial" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">URL Gambar</label>
                  <input 
                    type="url" 
                    name="gambar" 
                    className="form-input" 
                    value={formData.gambar} 
                    onChange={handleInputChange} 
                    placeholder="Contoh: https://link-gambar.com/foto.jpg" 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Harga (Rp)</label>
                    <input 
                      type="number" 
                      name="harga" 
                      className="form-input" 
                      value={formData.harga} 
                      onChange={handleInputChange} 
                      placeholder="Contoh: 15000" 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Stok</label>
                    <input 
                      type="number" 
                      name="stok" 
                      className="form-input" 
                      value={formData.stok} 
                      onChange={handleInputChange} 
                      placeholder="Contoh: 20" 
                      required 
                    />
                  </div>
                </div>

                {/* --- MURNI TOMBOL, BUKAN DROPDOWN --- */}
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <div className="kategori-selector">
                    {['Makanan', 'Minuman', 'Dessert'].map((kat) => (
                      <button
                        key={kat}
                        type="button" /* type="button" agar tidak memicu form submit */
                        className={`kategori-btn ${formData.kategori === kat ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, kategori: kat })}
                      >
                        {kat}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-action-primary btn-modal-full" style={{ marginTop: '20px' }}>
                  Simpan Menu
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageMenu;