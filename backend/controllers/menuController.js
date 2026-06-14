const Menu = require('../models/Menu');
const Review = require('../models/Review'); 
const User = require('../models/User'); // 1. TAMBAHKAN IMPORT USER DI SINI

// GET: Ambil semua menu (bisa filter by id_penjual) - PUBLIC
exports.getAllMenu = async (req, res) => {
    try {
        const { id_penjual } = req.query;
        let condition = {};
        
        // Jika ada id_penjual di URL, filter datanya
        if (id_penjual) {
            condition = { where: { id_penjual: id_penjual } };
        }

        // Include relasi User agar frontend bisa akses id_penjual
        const results = await Menu.findAll({
            ...condition,
            include: [{ 
                association: 'User',
                attributes: ['id', 'username']
            }]
        });
        res.json(results);
    } catch (err) {
        console.error("DEBUG ERROR GET MENU:", err);
        res.status(500).json({ message: "Gagal mengambil data menu" });
    }
};

// ==========================================================================
// FITUR DETAIL MENU & ULASAN BARU
// ==========================================================================

// GET: Ambil detail 1 menu berdasarkan ID - PUBLIC
exports.getMenuById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Menu.findByPk(id, {
            include: [{ 
                association: 'User',
                attributes: ['id', 'username']
            }]
        });

        if (!result) {
            return res.status(404).json({ message: "Menu tidak ditemukan" });
        }

        res.json(result);
    } catch (err) {
        console.error("DEBUG ERROR GET MENU BY ID:", err);
        res.status(500).json({ message: "Gagal mengambil detail menu" });
    }
};

// GET: Ambil semua daftar ulasan untuk 1 menu - PUBLIC
exports.getReviewsByMenu = async (req, res) => {
    try {
        const { id } = req.params; // Ini adalah id_menu dari URL

        // 2. SESUAIKAN INCLUDE AGAR MEMANGGIL MODEL USER SECARA EKSPLISIT
        const results = await Review.findAll({
            where: { id_menu: id },
            include: [{
                model: User,
                as: 'Pembeli', // Menyelaraskan dengan alias di Review.js
                attributes: ['id', 'username']
            }],
            order: [['id', 'DESC']] // Ulasan terbaru muncul di atas
        });

        res.json(results);
    } catch (err) {
        console.error("DEBUG ERROR GET REVIEWS BY MENU:", err);
        res.status(500).json({ message: "Gagal mengambil data ulasan" });
    }
};

// POST: Kirim ulasan baru untuk 1 menu (Pembeli) - PROTECTED
exports.addReview = async (req, res) => {
    try {
        const { id } = req.params; // id_menu
        const { id_pesanan, id_pembeli, rating, komentar } = req.body;
        
        if (!id_pesanan || !id_pembeli || !rating) {
            return res.status(400).json({ success: false, message: "Data ulasan tidak lengkap!" });
        }

        const newReview = await Review.create({ 
            id_pesanan, 
            id_menu: id, 
            id_pembeli, 
            rating, 
            komentar 
        });
        
        res.json({ success: true, message: "Ulasan berhasil dikirim!", data: newReview });
    } catch (err) {
        console.error("DEBUG ERROR ADD REVIEW:", err);
        res.status(500).json({ success: false, message: "Gagal mengirim ulasan" });
    }
};

// ==========================================================================
// FITUR MANAGEMENT MENU PENJUAL
// ==========================================================================

// POST: Tambah menu baru (Penjual) - PROTECTED
exports.createMenu = async (req, res) => {
    try {
        const { nama_produk, harga, stok, kategori, gambar, id_penjual } = req.body;
        
        // Validasi dasar
        if (!nama_produk || !id_penjual) {
            return res.status(400).json({ success: false, message: "Data tidak lengkap!" });
        }

        await Menu.create({ nama_produk, harga, stok, kategori, gambar, id_penjual });
        
        res.status(201).json({ success: true, message: "Menu berhasil ditambahkan!" });
    } catch (err) {
        console.error("DEBUG ERROR CREATE:", err);
        res.status(500).json({ success: false, message: "Gagal menambah menu" });
    }
};

// PUT: Edit menu (Penjual) - PROTECTED
exports.updateMenu = async (req, res) => {
    try {
        const { id_penjual, ...updateData } = req.body; 
        
        const [updatedRows] = await Menu.update(updateData, { 
            where: { 
                id: req.params.id,
                id_penjual: id_penjual 
            } 
        });

        if (updatedRows === 0) {
            return res.status(403).json({ success: false, message: "Akses ditolak atau menu tidak ditemukan!" });
        }

        res.json({ success: true, message: "Menu berhasil diperbarui!" });
    } catch (err) {
        console.error("DEBUG ERROR UPDATE:", err);
        res.status(500).json({ success: false, message: "Gagal update menu" });
    }
};

// DELETE: Hapus menu (Penjual) - PROTECTED
exports.deleteMenu = async (req, res) => {
    try {
        // GANTI req.query menjadi req.body
        const { id_penjual } = req.body; 

        if (!id_penjual) {
            return res.status(400).json({ success: false, message: "ID Penjual diperlukan!" });
        }

        const deletedRows = await Menu.destroy({ 
            where: { 
                id: req.params.id,
                id_penjual: id_penjual 
            } 
        });

        if (deletedRows === 0) {
            return res.status(404).json({ success: false, message: "Menu tidak ditemukan atau akses ditolak!" });
        }

        res.json({ success: true, message: "Menu berhasil dihapus!" });
    } catch (err) {
        console.error("DEBUG ERROR DELETE:", err);
        res.status(500).json({ success: false, message: "Gagal menghapus menu" });
    }
};