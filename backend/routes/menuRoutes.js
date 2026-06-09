const express = require('express');
const router = express.Router();

// Import controller menu
const menuController = require('../controllers/menuController');
const { verifyToken } = require('../middleware/auth');

// GET: Ambil semua menu (bisa filter by id_penjual) - PUBLIC
router.get('/', menuController.getAllMenu);

// ==========================================
// FITUR DETAIL MENU & ULASAN (BARU)
// ==========================================

// GET: Ambil detail 1 menu berdasarkan ID - PUBLIC
router.get('/:id', menuController.getMenuById);

// GET: Ambil semua daftar ulasan untuk 1 menu - PUBLIC
router.get('/:id/reviews', menuController.getReviewsByMenu);

// POST: Kirim ulasan baru untuk 1 menu (Pembeli) - PROTECTED
router.post('/:id/reviews', verifyToken, menuController.addReview);

// ==========================================
// FITUR MANAGEMENT MENU PENJUAL
// ==========================================

// POST: Tambah menu baru (Penjual) - PROTECTED
router.post('/', verifyToken, menuController.createMenu);

// PUT: Edit menu (Penjual) - PROTECTED
router.put('/:id', verifyToken, menuController.updateMenu);

// DELETE: Hapus menu (Penjual) - PROTECTED
router.delete('/:id', verifyToken, menuController.deleteMenu);

module.exports = router;