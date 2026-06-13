const express = require('express');
const router  = express.Router();
const midtransController = require('../controllers/midtransController');
const { verifyToken } = require('../middleware/auth');

// 1. Buat transaksi — user harus login
// Mengarah ke: POST http://localhost:5000/api/topup/create-transaction
router.post('/create-transaction', verifyToken, midtransController.createTopupTransaction);

// 2. Webhook Midtrans — TANPA verifyToken karena dipanggil oleh server Midtrans dari luar internet
// Mengarah ke: POST http://localhost:5000/api/topup/notification
router.post('/notification', midtransController.handleMidtransNotification);

// 3. Cek status transaksi — user harus login
// Mengarah ke: GET http://localhost:5000/api/topup/check-status/:orderId
router.get('/check-status/:orderId', verifyToken, midtransController.checkTransactionStatus);

module.exports = router;