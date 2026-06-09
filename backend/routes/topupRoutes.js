const express = require('express');
const router = express.Router();
const topupController = require('../controllers/topupController');
const { verifyToken } = require('../middleware/auth');

// POST: Buat request topup - PROTECTED
router.post('/topup-request', verifyToken, topupController.createTopupRequest);

// GET: Ambil topup requests milik user - PROTECTED
router.get('/topup-request/user/:id_user', verifyToken, topupController.getTopupByUserId);

// PATCH: Edit topup request (hanya jika masih menunggu) - PROTECTED
router.patch('/topup-request/:id', verifyToken, topupController.updateTopupRequest);

// DELETE: Hapus topup request (hanya jika masih menunggu) - PROTECTED
router.delete('/topup-request/:id', verifyToken, topupController.deleteTopupRequest);

// GET: Ambil semua topup requests - PROTECTED
router.get('/topup-requests', verifyToken, topupController.getAllTopupRequests);

// GET: Ambil topup requests berdasarkan status - PROTECTED
router.get('/topup-requests/status/:status', verifyToken, topupController.getTopupByStatus);

// PATCH: Approve topup request - PROTECTED
router.patch('/topup-approve/:id', verifyToken, topupController.approveTopup);

// PATCH: Reject topup request - PROTECTED
router.patch('/topup-reject/:id', verifyToken, topupController.rejectTopup);

module.exports = router;
