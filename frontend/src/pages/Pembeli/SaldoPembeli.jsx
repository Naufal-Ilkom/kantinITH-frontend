import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SaldoPembeli.css';

const SaldoPembeli = ({ userBalance, setUserBalance }) => {
  const [topUpAmount, setTopUpAmount]   = useState('');
  const [topupHistory, setTopupHistory] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const user   = JSON.parse(localStorage.getItem('user')) || { id: null };
  const token  = localStorage.getItem('accessToken');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // ── Inject Snap.js Midtrans ke <head> sekali saat mount (Dari Codingan 2) ──
  useEffect(() => {
    if (!document.getElementById('midtrans-snap')) {
      const script = document.createElement('script');
      script.id  = 'midtrans-snap';
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute(
        'data-client-key',
        process.env.REACT_APP_MIDTRANS_CLIENT_KEY || ''
      );
      document.head.appendChild(script);
    }
    fetchTopupHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mengambil Riwayat Top Up dari Server ──
  const fetchTopupHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/topup-request/user/${user.id}`,
        config
      );
      setTopupHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetch topup history:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Refresh saldo dari server (Dari Codingan 2) ──
  const refreshSaldo = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${user.id}`, config);
      if (setUserBalance) setUserBalance(res.data.saldo);
      const updated = { ...user, saldo: res.data.saldo };
      localStorage.setItem('user', JSON.stringify(updated));
    } catch (err) {
      console.error('Error refresh saldo:', err);
    }
  };

  // ── Handler klik tombol "Lanjut Bayar" (Menggunakan Integrasi Midtrans) ──
  const handleTopUpRequest = async (e) => {
    e.preventDefault();
    const nominal = Number(topUpAmount);

    if (!nominal || nominal < 10000) {
      alert('Minimal top up adalah Rp 10.000!');
      return;
    }

    setPaymentLoading(true);

    try {
      // 1. Minta snapToken dari backend
      const res = await axios.post(
        'http://localhost:5000/api/topup/create-transaction',
        { id_user: user.id, jumlah: nominal },
        config
      );

      if (!res.data.success) throw new Error(res.data.message);

      const { snapToken } = res.data;

      setShowModal(false);
      setTopUpAmount('');
      setPaymentLoading(false);

      // 2. Buka popup Midtrans Snap
      window.snap.pay(snapToken, {
        onSuccess: async () => {
          alert('✅ Pembayaran berhasil! Saldo sedang diperbarui...');
          // Tunggu 2 detik agar webhook sempat bekerja, lalu refresh data
          setTimeout(async () => {
            await refreshSaldo();
            await fetchTopupHistory();
          }, 2000);
        },
        onPending: () => {
          alert('⏳ Pembayaran menunggu konfirmasi. Cek riwayat untuk update status.');
          fetchTopupHistory();
        },
        onError: () => {
          alert('❌ Pembayaran gagal. Silakan coba lagi.');
          fetchTopupHistory();
        },
        onClose: () => {
          // User menutup popup tanpa bayar
          fetchTopupHistory();
        },
      });

    } catch (err) {
      console.error('Error memulai pembayaran:', err);
      alert('Gagal memulai pembayaran: ' + (err.response?.data?.message || err.message));
      setPaymentLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'menunggu': return 'menunggu';
      case 'disetujui': return 'disetujui';
      case 'ditolak': return 'ditolak';
      default: return 'menunggu';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'menunggu': return '⏳ Menunggu';
      case 'disetujui': return '✓ Berhasil';
      case 'ditolak': return '✗ Gagal';
      default: return status;
    }
  };

  return (
    <div className="content-container-full">
      <div className="balance-full-width-wrapper">
        <h2 className="page-title" style={{ marginBottom: '20px', color: '#1e293b', fontWeight: 800 }}>
          Saldo
        </h2>

        {/* Hero Saldo */}
        <div className="balance-card-hero">
          <p>Sisa Saldo Anda</p>
          <h1>Rp {(userBalance || 0).toLocaleString('id-ID')}</h1>
        </div>

        {/* Card Top Up */}
        <div className="topup-form-full">
          <div
            className="topup-form-full-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <h3>Isi Ulang Saldo</h3>
              <p>Bayar via Transfer Bank, QRIS, GoPay, OVO, dan lainnya.</p>
            </div>
            <button className="btn-buat-request" onClick={() => setShowModal(true)}>
              + Top Up Sekarang
            </button>
          </div>
        </div>

        {/* Info Sandbox */}
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: '12px', padding: '14px 18px',
          marginBottom: '24px', fontSize: '13px', color: '#92400e',
          fontWeight: 600,
        }}>
          <strong>Mode Sandbox (Testing)</strong> — Tidak ada uang nyata yang diproses.
          {/* Gunakan kartu uji Midtrans:{' '}
          <strong>4811 1111 1111 1114</strong> | CVV: <strong>123</strong> | Exp: <strong>01/25</strong> */}
        </div>

        {/* Riwayat Top Up */}
        <div style={{ marginTop: '8px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
            Riwayat Top Up
          </h3>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              Memuat riwayat...
            </div>
          ) : topupHistory.length > 0 ? (
            <>
              {/* Desktop — tabel */}
              <div className="topup-table-wrapper">
                <table className="topup-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nominal</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topupHistory.map((t) => (
                      <tr key={t.id}>
                        <td><strong>REQ-{String(t.id).padStart(4, '0')}</strong></td>
                        <td>
                          <strong style={{ color: '#FF8C00' }}>
                            Rp {Number(t.jumlah).toLocaleString('id-ID')}
                          </strong>
                        </td>
                        <td style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {new Date(t.createdAt).toLocaleString('id-ID')}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`topup-status-badge ${getStatusClass(t.status)}`}>
                            {getStatusLabel(t.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile — card list */}
              <div className="topup-card-list">
                {topupHistory.map((t) => (
                  <div key={t.id} className="topup-card">
                    <div className="topup-card-header">
                      <span className="topup-card-id">REQ-{String(t.id).padStart(4, '0')}</span>
                      <span className={`topup-status-badge ${getStatusClass(t.status)}`}>
                        {getStatusLabel(t.status)}
                      </span>
                    </div>
                    <div className="topup-card-body">
                      <div className="topup-card-row">
                        <span className="topup-card-label">Nominal</span>
                        <span className="topup-card-value nominal">
                          Rp {Number(t.jumlah).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="topup-card-row">
                        <span className="topup-card-label">Tanggal</span>
                        <span className="topup-card-value" style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {new Date(t.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="topup-empty">Belum ada riwayat top up.</div>
          )}
        </div>
      </div>

      {/* ── Modal Input Nominal ──────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay-topup">
          <div className="modal-box-topup">
            <h3>Top Up Saldo</h3>
            <p>Pilih atau masukkan nominal. Kamu akan diarahkan ke halaman pembayaran.</p>

            {/* Pilihan nominal cepat */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '16px',
            }}>
              {[10000, 20000, 50000, 100000, 200000, 500000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTopUpAmount(String(val))}
                  style={{
                    padding: '10px 6px',
                    border: topUpAmount === String(val)
                      ? '2px solid #FF8C00'
                      : '1px solid #e2e8f0',
                    borderRadius: '10px',
                    background: topUpAmount === String(val) ? '#fff8f0' : 'white',
                    color: topUpAmount === String(val) ? '#FF8C00' : '#334155',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: '0.15s',
                  }}
                >
                  Rp {val.toLocaleString('id-ID')}
                </button>
              ))}
            </div>

            <form onSubmit={handleTopUpRequest}>
              <input
                type="number"
                placeholder="Atau ketik nominal lain (min. Rp 10.000)"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                min="10000"
                required
                className="modal-input-topup"
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => { setShowModal(false); setTopUpAmount(''); }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={paymentLoading}
                >
                  {paymentLoading ? 'Memproses...' : 'Lanjut Bayar →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaldoPembeli;