const Order = require('../models/Order');
const User = require('../models/User');
const Menu = require('../models/Menu');
const Review = require('../models/Review'); // 1. IMPORT MODEL REVIEW DI SINI

exports.getRiwayatPembeli = async (req, res) => {
    try {
        const id_pembeli = req.user?.id;
        if (!id_pembeli) return res.status(400).json({ success: false, message: "ID Pembeli tidak valid" });

        const riwayat = await Order.findAll({
            where: { id_pembeli: id_pembeli },
            order: [['id', 'DESC']],
            include: [
                { model: User, as: 'Pembeli', attributes: ['username'] },
                { model: User, as: 'Penjual', attributes: ['username'] },
                { model: Review, as: 'Review' } // 2. SERTAKAN DATA REVIEW AGAR TOMBOL FRONTEND BISA TERKUNCI
            ]
        });
        res.json(riwayat);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const { id_pembeli, total_harga, items_raw } = req.body;

        const pembeli = await User.findByPk(id_pembeli);
        if (!pembeli) return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
        if (pembeli.saldo < total_harga) return res.status(400).json({ success: false, message: 'Saldo tidak mencukupi' });
        if (!items_raw || items_raw.length === 0) return res.status(400).json({ success: false, message: 'Keranjang kosong' });

        const pesananPerPenjual = {};
        
        for (let item of items_raw) {
            // Tangkap id_penjual secara akurat
            const id_penjual = item.id_penjual || item.id_user || item.User?.id || item.user?.id;

            if (!id_penjual) {
                return res.status(400).json({ success: false, message: `Gagal: Produk "${item.nama_produk}" tidak memiliki ID Penjual yang valid.` });
            }

            if (!pesananPerPenjual[id_penjual]) {
                pesananPerPenjual[id_penjual] = { items: [], subTotal: 0 };
            }
            pesananPerPenjual[id_penjual].items.push(item);
            
            // Konversi ke Number agar perhitungannya pas
            pesananPerPenjual[id_penjual].subTotal += (Number(item.harga) * Number(item.qty));
        }

        // Potong Saldo Pembeli
        const sisaSaldoPembeli = Number(pembeli.saldo) - Number(total_harga);
        await User.update({ saldo: sisaSaldoPembeli }, { where: { id: id_pembeli } });

        // Simpan setiap sub-order berdasarkan Penjualnya
        for (let id_penjual in pesananPerPenjual) {
            const dataPenjual = pesananPerPenjual[id_penjual];
            const detailString = dataPenjual.items.map(item => `${item.nama_produk} (${item.qty})`).join(", ");

            // Ambil ID menu item pertama yang dibeli penjual ini untuk direkam di kolom id_menu tabel pesanan
            const primaryMenuId = dataPenjual.items[0]?.id || null;

            await Order.create({
                id_pembeli: id_pembeli,
                id_penjual: id_penjual, 
                id_menu: primaryMenuId, // 3. REKAM ID MENU KE TABEL PESANAN SAAT CHECKOUT
                total_harga: dataPenjual.subTotal,
                detail_item: detailString, 
                status: 'menunggu' 
            });

            // Kurangi Stok Menu
            for (let itemCart of dataPenjual.items) {
                const menuToUpdate = await Menu.findByPk(itemCart.id);
                if (menuToUpdate) {
                    const sisaStok = parseInt(menuToUpdate.stok) - parseInt(itemCart.qty);
                    await Menu.update({ stok: sisaStok >= 0 ? sisaStok : 0 }, { where: { id: itemCart.id } });
                }
            }
        }

        res.json({ success: true, message: "Pembayaran berhasil!", sisaSaldo: sisaSaldoPembeli });
    } catch (err) {
        console.error("Error Checkout:", err);
        res.status(500).json({ success: false, message: "Gagal memproses pesanan" });
    }
};

exports.getPenjualOrders = async (req, res) => {
    try {
        const id_penjual = req.user?.id || req.query.id_penjual;
        if (!id_penjual) return res.status(400).json({ success: false, message: "ID Penjual tidak valid" });

        const pesananSaya = await Order.findAll({
            where: { id_penjual: id_penjual },
            include: [
                { model: User, as: 'Pembeli', attributes: ['username'] }
            ],
            order: [['id', 'DESC']]
        });

        res.json(pesananSaya);
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const pesanan = await Order.findByPk(id);
        if (!pesanan) return res.status(404).json({ success: false, message: "Pesanan tidak ditemukan" });

        // Proses pencairan dana: uang pindah ke penjual
        if (status === 'selesai' && pesanan.status !== 'selesai') {
            const penjual = await User.findByPk(pesanan.id_penjual);
            if (penjual) {
                // Konversi menggunakan Number agar matematisnya tidak error
                const saldoLama = Number(penjual.saldo || 0);
                const tambahan = Number(pesanan.total_harga || 0);
                const saldoBaru = saldoLama + tambahan;

                // Update saldo penjual ke DB
                await User.update({ saldo: saldoBaru }, { where: { id: penjual.id } });
            }
        }

        // Ubah status pesanan
        await Order.update({ status: status }, { where: { id: id } });

        res.json({ success: true, message: "Berhasil! Dana telah dicairkan ke Pendapatan Anda." });
    } catch (err) {
        console.error("Error Cairkan Dana:", err);
        res.status(500).json({ success: false, message: "Gagal memproses pencairan dana." });
    }
};

exports.getAdminLaporan = async (req, res) => {
    try {
        const laporan = await Order.findAll({
            include: [
                { model: User, as: 'Pembeli', attributes: ['id', 'username'] },
                { model: User, as: 'Penjual', attributes: ['id', 'username'] }
            ],
            order: [['id', 'DESC']]
        });
        res.json(laporan);
    } catch (err) {
        console.error("Error get laporan:", err);
        res.status(500).json({ success: false, message: "Gagal mengambil laporan" });
    }
};

// ==============================================================
// FUNGSI BARU: Batalkan Pesanan oleh Pembeli (Beserta Refund)
// ==============================================================
exports.cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        
        // 1. Cari pesanan
        const order = await Order.findByPk(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan!' });

        // 2. Cek status
        if (order.status.toLowerCase() !== 'menunggu') {
            return res.status(400).json({ success: false, message: `Pesanan gagal dibatalkan karena status saat ini: ${order.status}` });
        }

        // 3. Kembalikan saldo pembeli (Refund)
        const pembeli = await User.findByPk(order.id_pembeli);
        if (pembeli) {
            const saldoBaru = Number(pembeli.saldo || 0) + Number(order.total_harga);
            await pembeli.update({ saldo: saldoBaru });
            
            // 4. Ubah status pesanan
            await order.update({ status: 'dibatalkan' });

            return res.json({ 
                success: true, 
                message: 'Pesanan berhasil dibatalkan. Saldo telah dikembalikan ke akun Anda.',
                saldoBaru: saldoBaru
            });
        } else {
            return res.status(404).json({ success: false, message: 'Data pembeli tidak ditemukan.' });
        }
    } catch (error) {
        console.error('Error membatalkan pesanan:', error);
        res.status(500).json({ success: false, message: 'Gagal membatalkan pesanan. Terjadi kesalahan server.' });
    }
};

// ==============================================================
// FUNGSI BARU: Tolak Pesanan oleh Penjual (Beserta Refund)
// ==============================================================
exports.rejectOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        
        // 1. Cari pesanan
        const order = await Order.findByPk(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan!' });

        // 2. Cek status
        if (order.status.toLowerCase() !== 'menunggu') {
            return res.status(400).json({ success: false, message: `Tidak bisa ditolak. Status pesanan saat ini: ${order.status}` });
        }

        // 3. Kembalikan saldo pembeli (Refund)
        const pembeli = await User.findByPk(order.id_pembeli);
        if (pembeli) {
            const saldoBaru = Number(pembeli.saldo || 0) + Number(order.total_harga);
            await pembeli.update({ saldo: saldoBaru });
            
            // 4. Ubah status pesanan
            await order.update({ status: 'ditolak' });

            return res.json({ success: true, message: 'Pesanan berhasil ditolak. Uang pembeli telah dikembalikan secara otomatis.' });
        } else {
            return res.status(404).json({ success: false, message: 'Data pembeli tidak ditemukan untuk proses refund.' });
        }
    } catch (error) {
        console.error('Error menolak pesanan:', error);
        res.status(500).json({ success: false, message: 'Gagal menolak pesanan. Terjadi kesalahan server.' });
    }
};