import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './PendapatanPenjual.css';

const PendapatanPenjual = () => {
    const [saldo, setSaldo] = useState(0);
    const [riwayatPendapatan, setRiwayatPendapatan] = useState([]);
    const [withdrawHistory, setWithdrawHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const token = localStorage.getItem('accessToken');

    const fetchPendapatan = useCallback(async () => {
        if (!user.id || !token) return; 

        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            const userRes = await axios.get(`http://localhost:5000/api/users/${user.id}`, config);
            setSaldo(userRes.data.saldo);

            const pesananRes = await axios.get('http://localhost:5000/api/penjual/pesanan', config);
            const pesananSelesai = pesananRes.data.filter(p => p.status === 'selesai');
            // Urutkan riwayat pendapatan dari yang terbaru
            pesananSelesai.sort((a, b) => b.id - a.id);
            setRiwayatPendapatan(pesananSelesai);
            
            // Fetch withdraw history
            const withdrawRes = await axios.get(`http://localhost:5000/api/topup-request/user/${user.id}`, config);
            const withdrawRequests = Array.isArray(withdrawRes.data) 
                ? withdrawRes.data.filter(req => req.tipe === 'tarik_saldo')
                : [];
            // Urutkan riwayat penarikan dari yang terbaru
            withdrawRequests.sort((a, b) => b.id - a.id);
            setWithdrawHistory(withdrawRequests);
            
            setLoading(false);
        } catch (err) {
            console.error("Gagal menarik data pendapatan:", err);
            setLoading(false);
        }
    }, [user.id, token]); 

    useEffect(() => {
        fetchPendapatan();
    }, [fetchPendapatan]);

    const handleWithdrawRequest = async (e) => {
        e.preventDefault();
        const nominal = Number(withdrawAmount);

        if (!nominal || nominal <= 0) {
            alert('Masukkan nominal yang valid!');
            return;
        }

        if (nominal > saldo) {
            alert('Saldo tidak mencukupi untuk tarik!');
            return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            const response = await axios.post('http://localhost:5000/api/topup-request', {
                id_user: user.id,
                jumlah: nominal,
                tipe: 'tarik_saldo'
            }, config);

            if (response.data.success) {
                alert('Request tarik saldo berhasil dibuat! Menunggu persetujuan admin...');
                setWithdrawAmount('');
                fetchPendapatan();
                setShowWithdrawModal(false);
            }
        } catch (err) {
            console.error("Error creating withdraw request:", err);
            alert('Gagal membuat request tarik saldo');
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
            case 'disetujui': return '✓ Disetujui';
            case 'ditolak': return '✗ Ditolak';
            default: return status;
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Memuat data pendapatan...</div>;

    return (
        <div className="content-container-full">
            <div className="balance-full-width-wrapper">
                <h2 className="page-title" style={{ marginBottom: '20px', color: '#1e293b', fontWeight: 800 }}>Pendapatan & Saldo</h2>

                {/* HERO SALDO */}
                <div className="balance-card-hero">
                    <p>Total Saldo Anda Saat Ini</p>
                    <h1>Rp {(saldo || 0).toLocaleString('id-ID')}</h1>
                </div>

                {/* CARD TARIK SALDO */}
                <div className="finance-action-card">
                    <div className="finance-action-header">
                        <div>
                            <h3>Tarik Saldo</h3>
                            <p>Ajukan penarikan dana pendapatan ke rekening Anda.</p>
                        </div>
                        <button className="btn-buat-request" onClick={() => setShowWithdrawModal(true)}>
                            + Tarik Dana
                        </button>
                    </div>
                </div>

                {/* RIWAYAT TARIK SALDO */}
                <div style={{ marginTop: '28px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                        Riwayat Penarikan Dana
                    </h3>

                    {withdrawHistory.length > 0 ? (
                        <>
                            {/* TABEL — DESKTOP */}
                            <div className="finance-table-wrapper">
                                <table className="finance-table">
                                    <thead>
                                        <tr>
                                            <th>ID Permintaan</th>
                                            <th>Nominal</th>
                                            <th>Tanggal</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {withdrawHistory.map((withdraw) => (
                                            <tr key={withdraw.id}>
                                                <td><strong>REQ-{String(withdraw.id).padStart(4, '0')}</strong></td>
                                                <td><strong style={{ color: '#ef4444' }}>- Rp {Number(withdraw.jumlah).toLocaleString('id-ID')}</strong></td>
                                                <td style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                    {new Date(withdraw.createdAt).toLocaleString('id-ID')}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className={`finance-status-badge ${getStatusClass(withdraw.status)}`}>
                                                        {getStatusLabel(withdraw.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* CARD LIST — MOBILE */}
                            <div className="finance-card-list">
                                {withdrawHistory.map((withdraw) => (
                                    <div key={withdraw.id} className="finance-card">
                                        <div className="finance-card-header">
                                            <span className="finance-card-id">REQ-{String(withdraw.id).padStart(4, '0')}</span>
                                            <span className={`finance-status-badge ${getStatusClass(withdraw.status)}`}>
                                                {getStatusLabel(withdraw.status)}
                                            </span>
                                        </div>
                                        <div className="finance-card-body">
                                            <div className="finance-card-row">
                                                <span className="finance-card-label">Nominal</span>
                                                <span className="finance-card-value nominal" style={{ color: '#ef4444' }}>
                                                    - Rp {Number(withdraw.jumlah).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                            <div className="finance-card-row">
                                                <span className="finance-card-label">Tanggal</span>
                                                <span className="finance-card-value" style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                    {new Date(withdraw.createdAt).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="finance-empty">
                            Belum ada riwayat penarikan dana.
                        </div>
                    )}
                </div>

                {/* RIWAYAT PENDAPATAN (SALDO MASUK) */}
                <div style={{ marginTop: '36px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                        Riwayat Saldo Masuk (Dari Pesanan Selesai)
                    </h3>

                    {riwayatPendapatan.length > 0 ? (
                        <>
                            {/* TABEL — DESKTOP */}
                            <div className="finance-table-wrapper">
                                <table className="finance-table">
                                    <thead>
                                        <tr>
                                            <th>ID Pesanan</th>
                                            <th>Nama Pembeli</th>
                                            <th>Menu Terjual</th>
                                            <th>Waktu Selesai</th>
                                            <th>Pemasukan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {riwayatPendapatan.map((item) => (
                                            <tr key={item.id}>
                                                <td><strong>ORD-{item.id}</strong></td>
                                                <td><strong style={{ color: '#0284c7' }}>{item.Pembeli?.username || 'Guest'}</strong></td>
                                                <td style={{ color: '#64748b' }}>{item.detail_item}</td>
                                                <td style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                    {new Date(item.updatedAt).toLocaleString('id-ID')}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <strong style={{ color: '#10b981' }}>+ Rp {Number(item.total_harga).toLocaleString('id-ID')}</strong>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* CARD LIST — MOBILE */}
                            <div className="finance-card-list">
                                {riwayatPendapatan.map((item) => (
                                    <div key={item.id} className="finance-card">
                                        <div className="finance-card-header">
                                            <span className="finance-card-id">ORD-{item.id}</span>
                                            <strong style={{ color: '#10b981', fontSize: '15px' }}>
                                                + Rp {Number(item.total_harga).toLocaleString('id-ID')}
                                            </strong>
                                        </div>
                                        <div className="finance-card-body">
                                            <div className="finance-card-row">
                                                <span className="finance-card-label">Pembeli</span>
                                                <span className="finance-card-value" style={{ color: '#0284c7' }}>
                                                    {item.Pembeli?.username || 'Guest'}
                                                </span>
                                            </div>
                                            <div className="finance-card-row">
                                                <span className="finance-card-label">Menu Terjual</span>
                                                <span className="finance-card-value">{item.detail_item}</span>
                                            </div>
                                            <div className="finance-card-row">
                                                <span className="finance-card-label">Waktu</span>
                                                <span className="finance-card-value" style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                    {new Date(item.updatedAt).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="finance-empty">
                            Belum ada saldo masuk. Selesaikan pesanan untuk menambah pendapatan.
                        </div>
                    )}
                </div>

            </div>

            {/* MODAL TARIK SALDO */}
            {showWithdrawModal && (
                <div className="modal-overlay-finance">
                    <div className="modal-box-finance">
                        <h3>Tarik Saldo Pendapatan</h3>
                        <p>Masukkan nominal yang ingin Anda tarik ke rekening Anda.</p>

                        <div className="modal-info-box">
                            <p className="modal-info-label">Saldo yang bisa ditarik:</p>
                            <p className="modal-info-value">Rp {Number(saldo).toLocaleString()}</p>
                        </div>

                        <form onSubmit={handleWithdrawRequest}>
                            <input
                                type="number"
                                placeholder="Contoh: 50000"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                required
                                max={saldo}
                                className="modal-input-finance"
                            />
                            <div className="modal-actions">
                                <button type="button" className="btn-modal-cancel" onClick={() => setShowWithdrawModal(false)}>
                                    Batal
                                </button>
                                <button type="submit" className="btn-modal-submit">
                                    Ajukan Penarikan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendapatanPenjual;