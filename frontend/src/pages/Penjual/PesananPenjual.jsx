import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ConfirmationModal from '../../components/ConfirmationModal';
import './PesananPenjual.css';

const PesananPenjual = () => {
    const [pesanan, setPesanan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('baru');
    const [actionLoading, setActionLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [modalAction, setModalAction] = useState(null); // 'selesaikan' atau 'tolak'
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const fetchPesanan = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get('http://localhost:5000/api/penjual/pesanan', config);
            
            setPesanan(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Gagal mengambil data pesanan", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPesanan();
    }, []);

    // Clear messages setelah 3 detik
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => setErrorMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    // Buka modal konfirmasi
    const openConfirmationModal = (orderId, action) => {
        setSelectedOrderId(orderId);
        setModalAction(action);
        setModalOpen(true);
    };

    // Tutup modal
    const closeConfirmationModal = () => {
        setModalOpen(false);
        setSelectedOrderId(null);
        setModalAction(null);
    };

    // Execute action setelah konfirmasi
    const executeAction = async () => {
        if (!selectedOrderId || !modalAction) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            let response;
            if (modalAction === 'selesaikan') {
                response = await axios.patch(
                    `http://localhost:5000/api/pesanan/${selectedOrderId}`,
                    { status: 'selesai' },
                    config
                );
            } else if (modalAction === 'tolak') {
                response = await axios.put(
                    `http://localhost:5000/api/pesanan/${selectedOrderId}/tolak`,
                    {},
                    config
                );
            }

            if (response.data.success || response.data.message) {
                setSuccessMessage(response.data.message);
                await fetchPesanan();
                closeConfirmationModal();
            }
        } catch (err) {
            setErrorMessage(err.response?.data?.message || "Gagal memproses pesanan. Terjadi kesalahan.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '20px', color: '#94a3b8' }}>Memuat pesanan...</div>;

    // Memisahkan data berdasarkan status
    const pesananMenunggu = pesanan.filter(p => p.status === 'menunggu' || p.status === 'diproses');
    const pesananSelesai = pesanan.filter(p => p.status !== 'menunggu' && p.status !== 'diproses');
    
    const dataTampil = activeTab === 'baru' ? pesananMenunggu : pesananSelesai;

    return (
        <div className="content-container">
            <h2 className="page-title">Pesanan Kantin</h2>

            {/* NOTIFIKASI SUKSES */}
            {successMessage && (
                <div className="notification-success">✓ {successMessage}</div>
            )}

            {/* NOTIFIKASI ERROR */}
            {errorMessage && (
                <div className="notification-error">✕ {errorMessage}</div>
            )}

            {/* TAB NAVIGASI (Model Tombol Solid seperti Pembeli) */}
            <div className="tab-container">
                <button
                    className={`tab-button ${activeTab === 'baru' ? 'active' : ''}`}
                    onClick={() => setActiveTab('baru')}
                >
                    Pesanan Masuk ({pesananMenunggu.length})
                </button>
                <button
                    className={`tab-button ${activeTab === 'selesai' ? 'active' : ''}`}
                    onClick={() => setActiveTab('selesai')}
                >
                    Riwayat Selesai ({pesananSelesai.length})
                </button>
            </div>

            {/* ========== TABEL — DESKTOP ========== */}
            <div className="riwayat-table-wrapper">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>ID Pesanan</th>
                            <th>Nama Pembeli</th>
                            <th>Detail Menu</th>
                            <th>Total Harga</th>
                            <th>Waktu Pesanan</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataTampil.length > 0 ? (
                            dataTampil.map((item) => (
                                <tr key={item.id}>
                                    <td><strong>ORD-{item.id}</strong></td>
                                    <td style={{ fontWeight: '600' }}>{item.Pembeli?.username || 'Guest'}</td>
                                    <td>{item.detail_item}</td>
                                    <td style={{ fontWeight: 'bold' }}>
                                        Rp {Number(item.total_harga).toLocaleString()}
                                    </td>
                                    <td style={{ fontSize: '12px', color: '#94a3b8' }}>
                                        {new Date(item.createdAt).toLocaleString('id-ID')}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${item.status?.toLowerCase() || 'menunggu'}`}>
                                            {item.status === 'ditolak' ? 'Ditolak' : item.status === 'dibatalkan' ? 'Dibatalkan' : item.status === 'selesai' ? 'Selesai' : item.status}
                                        </span>
                                    </td>
                                    <td>
                                        {activeTab === 'baru' ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    className="btn-aksi btn-selesaikan"
                                                    onClick={() => openConfirmationModal(item.id, 'selesaikan')}
                                                    disabled={actionLoading}
                                                >
                                                    {actionLoading ? 'Proses...' : 'Selesaikan'}
                                                </button>
                                                <button 
                                                    className="btn-aksi btn-tolak"
                                                    onClick={() => openConfirmationModal(item.id, 'tolak')}
                                                    disabled={actionLoading}
                                                >
                                                    Tolak
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '12px', color: '#cbd5e1' }}>—</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="empty-state">
                                    {activeTab === 'baru' ? 'Belum ada pesanan masuk.' : 'Belum ada riwayat pesanan selesai/ditolak.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ========== CARD LIST — MOBILE ========== */}
            <div className="riwayat-card-list">
                {dataTampil.length > 0 ? (
                    dataTampil.map((item) => (
                        <div key={item.id} className="riwayat-card">
                            <div className="riwayat-card-header">
                                <span className="riwayat-card-id">ORD-{item.id}</span>
                                <span className={`status-badge ${item.status?.toLowerCase() || 'menunggu'}`}>
                                    {item.status === 'ditolak' ? 'Ditolak' : item.status === 'dibatalkan' ? 'Dibatalkan' : item.status === 'selesai' ? 'Selesai' : item.status}
                                </span>
                            </div>

                            <div className="riwayat-card-body">
                                <div className="riwayat-card-row">
                                    <span className="riwayat-card-label">Pembeli</span>
                                    <span className="riwayat-card-value">{item.Pembeli?.username || 'Guest'}</span>
                                </div>
                                <div className="riwayat-card-row">
                                    <span className="riwayat-card-label">Detail</span>
                                    <span className="riwayat-card-value">{item.detail_item}</span>
                                </div>
                                <div className="riwayat-card-row">
                                    <span className="riwayat-card-label">Total</span>
                                    <span className="riwayat-card-value harga">
                                        Rp {Number(item.total_harga).toLocaleString()}
                                    </span>
                                </div>
                                <div className="riwayat-card-row">
                                    <span className="riwayat-card-label">Waktu</span>
                                    <span className="riwayat-card-value" style={{ fontSize: '12px', color: '#94a3b8' }}>
                                        {new Date(item.createdAt).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            {activeTab === 'baru' && (
                                <div className="riwayat-card-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <button 
                                        className="btn-aksi btn-selesaikan"
                                        style={{ width: '100%' }}
                                        onClick={() => openConfirmationModal(item.id, 'selesaikan')}
                                        disabled={actionLoading}
                                    >
                                        Selesaikan Pesanan
                                    </button>
                                    <button 
                                        className="btn-aksi btn-tolak"
                                        style={{ width: '100%' }}
                                        onClick={() => openConfirmationModal(item.id, 'tolak')}
                                        disabled={actionLoading}
                                    >
                                        Tolak Pesanan
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '14px' }}>
                        {activeTab === 'baru' ? 'Belum ada pesanan masuk.' : 'Belum ada riwayat pesanan selesai/ditolak.'}
                    </div>
                )}
            </div>

            {/* CONFIRMATION MODAL */}
            <ConfirmationModal
                isOpen={modalOpen}
                title={modalAction === 'selesaikan' ? 'Selesaikan Pesanan' : 'Tolak Pesanan'}
                message={
                    modalAction === 'selesaikan' 
                        ? 'Pesanan sudah siap? Uang akan langsung masuk ke Saldo Anda.'
                        : 'Yakin ingin menolak pesanan ini? Saldo pembeli akan dikembalikan secara penuh.'
                }
                onConfirm={executeAction}
                onCancel={closeConfirmationModal}
                isLoading={actionLoading}
                confirmText={modalAction === 'selesaikan' ? 'Ya, Selesaikan' : 'Ya, Tolak'}
                cancelText="Batal"
                isDangerous={modalAction === 'tolak'}
            />
        </div>
    );
};

export default PesananPenjual;