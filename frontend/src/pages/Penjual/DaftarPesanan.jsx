import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DaftarPesanan = () => {
  const [pesanan, setPesanan] = useState([]);

  useEffect(() => {
    ambilPesanan();
    const interval = setInterval(ambilPesanan, 5000); // Auto-refresh setiap 5 detik
    return () => clearInterval(interval);
  }, []);

  const ambilPesanan = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/penjual/pesanan');
      setPesanan(res.data);
    } catch (err) {
      console.error("Gagal ambil pesanan");
    }
  };

  const updateStatus = async (id, statusBaru, items) => {
    try {
      await axios.patch(`http://localhost:5000/api/pesanan/${id}`, { 
        status: statusBaru,
        items: items // Kirim daftar item agar stok bisa dikurangi di backend
      });
      ambilPesanan();
    } catch (err) {
      alert("Gagal update status");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Daftar Pesanan Masuk</h2>
      <div style={{ display: 'grid', gap: '15px' }}>
        {pesanan.length === 0 ? <p>Belum ada pesanan baru...</p> : pesanan.map((p) => (
          <div key={p.id} style={{ 
            border: '1px solid #ddd', 
            padding: '15px', 
            borderRadius: '10px',
            background: p.status === 'menunggu' ? '#fff4e6' : '#e6fffa'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Pesanan #{p.id}</strong>
              <span style={{ 
                padding: '5px 10px', 
                borderRadius: '5px', 
                background: p.status === 'menunggu' ? '#ff8c00' : '#27ae60',
                color: 'white',
                fontSize: '12px'
              }}>
                {p.status.toUpperCase()}
              </span>
            </div>
            
            <p style={{ margin: '10px 0' }}>Total: <strong>Rp {p.total_harga.toLocaleString()}</strong></p>
            
            {p.status === 'menunggu' && (
              <button 
                onClick={() => updateStatus(p.id, 'siap diambil', p.items)}
                style={{ 
                  background: '#27ae60', 
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 15px', 
                  borderRadius: '5px', 
                  cursor: 'pointer' 
                }}
              >
                Tandai Siap Diambil
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DaftarPesanan;