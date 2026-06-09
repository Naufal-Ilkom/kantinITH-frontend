import React, { useState, useEffect } from 'react';
import PenggunaAdmin from './PenggunaAdmin';
import TransaksiAdmin from './TransaksiAdmin';
import LaporanAdmin from './LaporanAdmin';
import TopupAdmin from './TopupAdmin';
import './DashboardAdmin.css';

const DashboardAdmin = () => {
  const [activeTab, setActiveTab] = useState('pengguna');
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // State untuk Sidebar Mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  // Ambil data admin dari localStorage
  const user = JSON.parse(localStorage.getItem('user')) || { username: 'Admin' };

  // Menyesuaikan sidebar saat ukuran layar berubah (Resize)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fungsi tutup sidebar saat menu diklik di HP
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login'; // Sesuaikan rute login kamu
  };

  return (
    <div className="app-layout">
      
      {/* Overlay Gelap untuk Mobile */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar-fixed ${!isSidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          KantinITH <span style={{fontSize: '14px', color: '#FF8C00'}}>Admin</span>
        </div>
        <nav className="nav-stack">
          <button className={`nav-btn ${activeTab === 'pengguna' ? 'active' : ''}`} onClick={() => handleTabClick('pengguna')}>Kelola Pengguna</button>
          <button className={`nav-btn ${activeTab === 'transaksi' ? 'active' : ''}`} onClick={() => handleTabClick('transaksi')}>Semua Transaksi</button>
          <button className={`nav-btn ${activeTab === 'topup' ? 'active' : ''}`} onClick={() => handleTabClick('topup')}>Manajemen Top Up</button>
          <button className={`nav-btn ${activeTab === 'laporan' ? 'active' : ''}`} onClick={() => handleTabClick('laporan')}>Laporan Sistem</button>
        </nav>
      </aside>

      <div className="viewport-main">
        {/* Navbar Top */}
        <header className="navbar-top">
          <button 
            className="btn-toggle-sidebar" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            ☰
          </button>

          <div className="header-right">
            <span className="greeting">Halo, <strong>{user.username}</strong></span>
            <div className="avatar-container">
              <div className="avatar-circle" onClick={() => setShowProfileModal(true)}>
                {user.username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Konten Utama */}
        <main className="scroll-viewport">
          {activeTab === 'pengguna' && <PenggunaAdmin />}
          {activeTab === 'transaksi' && <TransaksiAdmin />}
          {activeTab === 'topup' && <TopupAdmin />}
          {activeTab === 'laporan' && <LaporanAdmin />}
        </main>
      </div>

      {/* MODAL PROFIL ADMIN */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="profile-modal-content">
            <div className="modal-header">
              <h2>Data Administrator</h2>
              <button className="close-modal" onClick={() => setShowProfileModal(false)}>&times;</button>
            </div>
            <div className="profile-modal-body">
              <div className="profile-avatar-large">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <h3 className="profile-name-large">{user.username}</h3>
              
              <div className="profile-data-list">
                <p><strong>Peran</strong> : Super Admin</p>
                <p><strong>Akses</strong> : Seluruh Sistem</p>
                <p><strong>Status</strong> : Aktif</p>
              </div>
            </div>
            <div className="profile-modal-footer">
              <button className="btn-logout-full" onClick={handleLogout}>Keluar Akun</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;