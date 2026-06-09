import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ConfirmationModal from '../components/ConfirmationModal';
import '../pages/Pembeli/DashboardPembeli.css';

const PembeliLayout = ({ children, pageTitle }) => {
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem('user')) || { username: 'Guest', id: null, saldo: 0, role: 'pembeli' };
  });
  const [tempUsername, setTempUsername] = useState(user.username);
  const [tempEmail, setTempEmail] = useState(user.email || '');
  const [userBalance, setUserBalance] = useState(user.saldo || 0);

  const getTokenConfig = () => {
    const token = localStorage.getItem('accessToken');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setLogoutLoading(true);
    setTimeout(() => {
      localStorage.clear();
      setShowLogoutModal(false);
      navigate('/login');
    }, 300);
  };

  const fetchUserBalance = useCallback(async () => {
    if (!user.id) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/users/${user.id}`, getTokenConfig());
      if (response.data) {
        setUserBalance(response.data.saldo);
        const updatedUser = { ...user, saldo: response.data.saldo, email: response.data.email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (err) {
      if (err.response && err.response.status === 401) handleLogout();
    }
  }, [user]);

  useEffect(() => {
    fetchUserBalance();
  }, [fetchUserBalance]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);

    try {
      const response = await axios.put(
        `http://localhost:5000/api/users/${user.id}/profile`,
        {
          username: tempUsername,
          email: tempEmail
        },
        getTokenConfig()
      );

      if (response.data.success) {
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setEditMode(false);
        alert('Profile berhasil diperbarui!');
      }
    } catch (err) {
      console.error("Error update profile:", err);
      alert(err.response?.data?.message || 'Gagal memperbarui profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setTempUsername(user.username);
    setTempEmail(user.email || '');
    setEditMode(false);
  };

  useEffect(() => {
    if (editMode) {
      setTempUsername(user.username);
      setTempEmail(user.email || '');
    }
  }, [editMode, user]);

  const currentPath = window.location.pathname;
  const isMenuPage = currentPath === '/pembeli/dashboard';
  const isRiwayatPage = currentPath === '/pembeli/riwayat';
  const isSaldoPage = currentPath === '/pembeli/saldo';

  return (
    <div className="app-layout">
      <aside className="sidebar-fixed">
        <div className="sidebar-logo">KantinITH <span style={{fontSize: '14px', color: '#FF8C00'}}>{user.role}</span></div>
        <nav className="nav-stack">
          <button 
            className={`nav-btn ${isMenuPage ? 'active' : ''}`} 
            onClick={() => navigate('/pembeli/dashboard')}
          >
            Daftar Menu
          </button>
          <button 
            className={`nav-btn ${isRiwayatPage ? 'active' : ''}`} 
            onClick={() => navigate('/pembeli/riwayat')}
          >
            Riwayat
          </button>
          <button 
            className={`nav-btn ${isSaldoPage ? 'active' : ''}`} 
            onClick={() => navigate('/pembeli/saldo')}
          >
            Saldo
          </button>
          <button className="nav-btn" onClick={handleLogout} style={{marginTop: 'auto', color: '#e74c3c'}}>Keluar Akun</button>
        </nav>
      </aside>

      <div className="viewport-main">
        <header className="navbar-top">
          <div style={{display:'flex', flexDirection:'column', textAlign: 'right'}}>
            <span className="greeting">Halo, <strong>{user.username}</strong></span>
            <span style={{fontSize:'12px', color:'#27ae60', fontWeight:'bold'}}>Saldo: Rp {userBalance.toLocaleString()}</span>
          </div>
          <div className="avatar-container">
            <div className="avatar-circle" onClick={() => setShowProfileModal(true)}>{user.username.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <main className="scroll-viewport">
          {React.cloneElement(children, { userBalance, setUserBalance, user, setUser })}
        </main>
      </div>

      {showProfileModal && (
        <div className="modal-overlay">
          <div className="profile-modal-content">
            <button className="close-modal" style={{position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#999'}} onClick={() => {
              setShowProfileModal(false);
              setEditMode(false);
            }}>×</button>
            
            {!editMode ? (
              <>
                <div className="profile-avatar-large" style={{background: '#FF8C00', marginBottom: '15px'}}>{user.username.charAt(0).toUpperCase()}</div>
                <h2 className="profile-name-large" style={{marginBottom: '20px', color: '#333', fontSize: '24px', fontWeight: 'bold'}}>{user.username}</h2>
                <div className="profile-data-list" style={{
                  background: '#f5f5f5',
                  padding: '15px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  textAlign: 'left'
                }}>
                    <p style={{marginBottom: '10px', color: '#666'}}><strong>Email:</strong> <span style={{color: '#333'}}>{user.email}</span></p>
                    <p style={{marginBottom: '10px', color: '#666'}}><strong>Role:</strong> <span style={{color: '#FF8C00', fontWeight: 'bold', textTransform: 'capitalize'}}>{user.role}</span></p>
                    <p style={{marginBottom: '0', color: '#666'}}><strong>Saldo:</strong> <span style={{color: '#27ae60', fontWeight: 'bold'}}>Rp {userBalance.toLocaleString()}</span></p>
                </div>
                <button 
                  onClick={() => setEditMode(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#FF8C00',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(255, 140, 0, 0.3)'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#e67e00'}
                  onMouseOut={(e) => e.target.style.background = '#FF8C00'}
                >
                  Ubah Profile
                </button>
              </>
            ) : (
              <>
                <h2 style={{marginTop: '0', marginBottom: '25px', textAlign: 'center', color: '#333', fontSize: '22px', fontWeight: 'bold'}}>Ubah Data Profile</h2>
                <form onSubmit={handleUpdateProfile} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Username</label>
                    <input
                      type="text"
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '2px solid #f0f0f0',
                        borderRadius: '8px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#FF8C00'}
                      onBlur={(e) => e.target.style.borderColor = '#f0f0f0'}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Email</label>
                    <input
                      type="email"
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '2px solid #f0f0f0',
                        borderRadius: '8px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#FF8C00'}
                      onBlur={(e) => e.target.style.borderColor = '#f0f0f0'}
                    />
                  </div>
                  <div style={{display: 'flex', gap: '12px', marginTop: '16px'}}>
                    <button
                      type="submit"
                      disabled={updateLoading}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: updateLoading ? '#ccc' : '#FF8C00',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: updateLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        boxShadow: updateLoading ? 'none' : '0 2px 8px rgba(255, 140, 0, 0.3)'
                      }}
                      onMouseOver={(e) => !updateLoading && (e.target.style.background = '#e67e00')}
                      onMouseOut={(e) => !updateLoading && (e.target.style.background = '#FF8C00')}
                    >
                      {updateLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={updateLoading}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: '#f0f0f0',
                        color: '#666',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: updateLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => !updateLoading && (e.target.style.background = '#e8e8e8')}
                      onMouseOut={(e) => !updateLoading && (e.target.style.background = '#f0f0f0')}
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Keluar Akun"
        message="Apakah Anda yakin ingin keluar dari akun ini?"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
        isLoading={logoutLoading}
        confirmText="Ya, Keluar"
        cancelText="Batal"
        isDangerous={true}
      />
    </div>
  );
};

export default PembeliLayout;
