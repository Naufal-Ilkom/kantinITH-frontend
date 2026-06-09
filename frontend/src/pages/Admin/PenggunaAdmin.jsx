import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PenggunaAdmin.css';

const PenggunaAdmin = () => {
  const [pengguna, setPengguna] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newSaldo, setNewSaldo] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    fetchUsers();
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPengguna(response.data);
    } catch (err) {
      console.error("Gagal mengambil data user:", err);
      alert("Gagal mengambil data. Pastikan Anda login sebagai admin.");
    }
  };

  const handleRowClick = (user) => {
    if (!isEditMode) return;
    setSelectedUser(user);
    setNewSaldo(user.saldo || 0);
    setNewStatus(user.status || 'Aktif');
    setShowEditModal(true);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(
        `http://localhost:5000/api/admin/users/${selectedUser.id}/saldo`,
        { saldo: Number(newSaldo) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (newStatus !== selectedUser.status) {
        await axios.patch(
          `http://localhost:5000/api/admin/users/${selectedUser.id}/status`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setShowEditModal(false);
      fetchUsers();
      alert(`Data ${selectedUser.username} berhasil diperbarui!`);
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menyimpan perubahan");
    }
  };

  const hapusPengguna = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Apakah Anda yakin ingin menghapus permanen akun pengguna ini?")) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
      alert("User berhasil dihapus!");
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus user");
    }
  };

  const roleBadgeStyle = (role) => ({
    display: 'inline-block',
    padding: '5px 12px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '12px',
    textTransform: 'capitalize',
    background: role === 'penjual' ? '#e0f2fe' : '#fff1e6',
    color: role === 'penjual' ? '#0284c7' : '#ea580c',
  });

  const statusStyle = (status) => ({
    color: status === 'Aktif' ? '#10b981' : '#ef4444',
    fontWeight: 800,
    fontSize: '14px',
  });

  return (
    <div className="content-container-pengguna">

      {/* Header */}
      <div className="header-flex-between">
        <h2 className="page-title-pengguna">Kelola Pengguna & Saldo</h2>
        <button
          className={`btn-master-edit ${isEditMode ? 'active' : ''}`}
          onClick={() => setIsEditMode(!isEditMode)}
        >
          <span className="btn-dot" />
          {isEditMode ? 'Selesai Edit' : 'Mode Edit'}
        </button>
      </div>

      {isEditMode && (
        <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginBottom: '14px' }}>
          ✨ Klik baris pengguna untuk mengedit
        </p>
      )}

      {/* ===== DESKTOP: Tabel ===== */}
      {!isMobile && (
        <div className="table-wrapper-pengguna">
          <table className="table-pengguna">
            <thead>
              <tr>
                <th>Nama Pengguna</th>
                <th>Peran</th>
                <th>Saldo Saat Ini</th>
                <th>Status</th>
                {isEditMode && <th style={{ textAlign: 'center' }}>Hapus</th>}
              </tr>
            </thead>
            <tbody>
              {pengguna.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => handleRowClick(user)}
                  className={isEditMode ? 'row-edit-mode' : ''}
                  style={{ cursor: isEditMode ? 'pointer' : 'default' }}
                >
                  <td>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>{user.username}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>ID: {user.id}</div>
                  </td>
                  <td><span style={roleBadgeStyle(user.role)}>{user.role}</span></td>
                  <td><strong style={{ fontSize: '15px' }}>Rp {(user.saldo || 0).toLocaleString('id-ID')}</strong></td>
                  <td><span style={statusStyle(user.status)}>{user.status || 'Aktif'}</span></td>
                  {isEditMode && (
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={(e) => hapusPengguna(e, user.id)} className="btn-hapus-row">Hapus</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== MOBILE: Card List ===== */}
      {isMobile && (
        <div className="card-list-pengguna">
          {pengguna.map((user) => (
            <div
              key={user.id}
              className={`card-pengguna ${isEditMode ? 'card-edit-mode' : ''}`}
              onClick={() => handleRowClick(user)}
              style={{ cursor: isEditMode ? 'pointer' : 'default' }}
            >
              <div className="card-pengguna-header">
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>{user.username}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>ID: {user.id}</div>
                </div>
                <span style={roleBadgeStyle(user.role)}>{user.role}</span>
              </div>
              <div className="card-pengguna-body">
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: 3 }}>Saldo</div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                    Rp {(user.saldo || 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={statusStyle(user.status)}>{user.status || 'Aktif'}</span>
                  {isEditMode && (
                    <button onClick={(e) => hapusPengguna(e, user.id)} className="btn-hapus-row">Hapus</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Edit */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay-pengguna">
          <div className="modal-box-pengguna">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Edit Pengguna</h3>
              <button onClick={() => setShowEditModal(false)} className="btn-close-modal">✕</button>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, margin: '0 0 4px 0' }}>Pengguna yang diedit</p>
              <strong style={{ fontSize: '16px', color: '#0f172a' }}>
                {selectedUser.username}
                <span style={{ ...roleBadgeStyle(selectedUser.role), marginLeft: 8, fontSize: '11px' }}>
                  {selectedUser.role}
                </span>
              </strong>
            </div>

            <form onSubmit={handleSaveChanges}>
              <div className="form-group-pengguna">
                <label>Nominal Saldo Baru (Rp)</label>
                <input
                  type="number"
                  required
                  value={newSaldo}
                  onChange={(e) => setNewSaldo(e.target.value)}
                  className="input-pengguna"
                  style={{ fontSize: '18px', fontWeight: 800 }}
                />
              </div>
              <div className="form-group-pengguna">
                <label>Status Akun</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input-pengguna"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif (Blokir)</option>
                </select>
              </div>
              <div className="modal-actions-pengguna">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Batal</button>
                <button type="submit" className="btn-save">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenggunaAdmin;