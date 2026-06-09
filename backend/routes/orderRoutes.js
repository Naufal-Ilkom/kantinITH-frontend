const express = require('express');
const router = express.Router();

// Import controller pesanan yang sudah dibuat
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/auth');

// Menerima request POST ke http://localhost:5000/api/pesan
router.post('/pesan', verifyToken, orderController.createOrder); 

// Menerima request GET ke http://localhost:5000/api/pesan
router.get('/pesan', verifyToken, orderController.getRiwayatPembeli); 

router.get('/penjual/pesanan', verifyToken, orderController.getPenjualOrders); 
router.patch('/pesanan/:id', verifyToken, orderController.updateOrderStatus); 
router.get('/admin/laporan', verifyToken, orderController.getAdminLaporan); 

// ==========================================
// ROUTE BARU: Batalkan pesanan oleh pembeli
// ==========================================
router.put('/pesanan/:id/cancel', verifyToken, orderController.cancelOrder);

// ==========================================
// ROUTE BARU: Tolak pesanan oleh penjual
// ==========================================
router.put('/pesanan/:id/tolak', verifyToken, orderController.rejectOrder);

module.exports = router;