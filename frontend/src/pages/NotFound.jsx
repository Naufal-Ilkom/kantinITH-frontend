// frontend/src/pages/NotFound.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleGoHome = () => {
    if (user) {
      if (user.role === 'pembeli') navigate('/pembeli/dashboard');
      else if (user.role === 'penjual') navigate('/penjual/dashboard');
      else if (user.role === 'admin') navigate('/admin/pengguna');
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FDF5E6',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      {/* Logo */}
      <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '40px' }}>
        Kantin<span style={{ color: '#FF8C00' }}>ITH</span>
      </div>

      {/* Ilustrasi piring kosong */}
      <div style={{
        width: '160px', height: '160px',
        background: 'white',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '72px', lineHeight: 1,
        boxShadow: '0 20px 40px rgba(255,140,0,0.12)',
        marginBottom: '32px',
        border: '3px dashed #fed7aa'
      }}>
        🍽️
      </div>

      {/* Kode error */}
      <div style={{
        fontSize: '96px', fontWeight: '800',
        color: '#FF8C00', lineHeight: 1, marginBottom: '8px',
        letterSpacing: '-4px'
      }}>
        404
      </div>

      {/* Pesan */}
      <h1 style={{
        fontSize: '24px', fontWeight: '800',
        color: '#0f172a', margin: '0 0 12px'
      }}>
        Halaman Tidak Ditemukan
      </h1>
      <p style={{
        color: '#64748b', fontSize: '16px',
        maxWidth: '380px', lineHeight: '1.6', margin: '0 0 40px'
      }}>
        Sepertinya menu yang kamu cari sudah habis atau tidak tersedia. Yuk balik ke halaman utama!
      </p>

      {/* Tombol aksi */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={handleGoHome}
          style={{
            background: '#FF8C00', color: 'white',
            padding: '14px 32px', borderRadius: '14px',
            fontWeight: '800', fontSize: '15px',
            border: 'none', cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 8px 20px rgba(255,140,0,0.3)',
            transition: '0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          🏠 Kembali ke Halaman Utama
        </button>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'white', color: '#475569',
            padding: '14px 32px', borderRadius: '14px',
            fontWeight: '700', fontSize: '15px',
            border: '2px solid #e2e8f0', cursor: 'pointer',
            fontFamily: 'inherit', transition: '0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = '#FF8C00'; e.currentTarget.style.color = '#FF8C00'; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
        >
          ← Halaman Sebelumnya
        </button>
      </div>

      {/* Tips kecil */}
      <p style={{ marginTop: '50px', fontSize: '13px', color: '#94a3b8' }}>
        Kalau masalah terus berlanjut, coba refresh halaman atau hubungi admin.
      </p>
    </div>
  );
};

export default NotFound;