const midtransClient = require('midtrans-client');
const crypto = require('crypto');
const User = require('../models/User');
const Topup = require('../models/Topup');

// Inisialisasi Midtrans Snap
const snap = new midtransClient.Snap({
  isProduction: false,  // false = Sandbox
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// ============================================================
// POST /api/topup/create-transaction
// Dipanggil frontend saat user klik tombol "Top Up"
// Mengembalikan snapToken untuk membuka popup Midtrans
// ============================================================
exports.createTopupTransaction = async (req, res) => {
  try {
    const { id_user, jumlah } = req.body;

    if (!id_user || !jumlah || jumlah < 10000) {
      return res.status(400).json({
        success: false,
        message: 'Minimal top up adalah Rp 10.000',
      });
    }

    const user = await User.findByPk(id_user);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Buat record topup di database dengan status 'menunggu'
    const topupRecord = await Topup.create({
      id_user,
      jumlah,
      tipe: 'topup_saldo',
      status: 'menunggu',
    });

    // Buat order_id yang unik untuk Midtrans
    const orderId = `TOPUP-${topupRecord.id}-${Date.now()}`;

    // Parameter yang dikirim ke Midtrans
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: jumlah,
      },
      customer_details: {
        first_name: user.username,
        email: user.email || `${user.username}@kantinith.com`,
      },
      item_details: [
        {
          id: 'TOPUP_SALDO',
          price: jumlah,
          quantity: 1,
          name: 'Top Up Saldo KantinITH',
        },
      ],
      // Simpan id topup sebagai referensi saat webhook masuk
      custom_field1: String(topupRecord.id),
      custom_field2: String(id_user),
    };

    // Kirim ke Midtrans, dapatkan snapToken
    const transaction = await snap.createTransaction(parameter);

    // Simpan order_id ke kolom 'bukti' untuk dicocokkan saat webhook
    await Topup.update(
      { bukti: orderId },
      { where: { id: topupRecord.id } }
    );

    res.json({
      success: true,
      snapToken: transaction.token,
      orderId: orderId,
      topupId: topupRecord.id,
    });

  } catch (err) {
    console.error('Error createTopupTransaction:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat transaksi pembayaran',
      error: err.message,
    });
  }
};

// ============================================================
// POST /api/topup/notification
// Webhook — dipanggil OTOMATIS oleh server Midtrans
// setelah user selesai bayar (berhasil/gagal/expire)
// ============================================================
exports.handleMidtransNotification = async (req, res) => {
  try {
    const notification = req.body;

    const orderId            = notification.order_id;
    const transactionStatus  = notification.transaction_status;
    const fraudStatus        = notification.fraud_status;
    const statusCode         = notification.status_code;
    const grossAmount        = notification.gross_amount;
    const signatureKey       = notification.signature_key;

    // 1. Verifikasi Signature secara Manual (Sangat penting di Vercel agar tidak Timeout/502)
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const hashInput = orderId + statusCode + grossAmount + serverKey;
    const expectedHash = crypto.createHash('sha512').update(hashInput).digest('hex');

    if (signatureKey !== expectedHash) {
      console.error('🚨 Invalid Midtrans Signature!');
      return res.status(403).json({ message: 'Invalid signature' });
    }

    console.log(`📩 Notifikasi Midtrans: order=${orderId} | status=${transactionStatus} | fraud=${fraudStatus}`);

    // Cari record topup berdasarkan order_id
    const topupRecord = await Topup.findOne({ where: { bukti: orderId } });

    if (!topupRecord) {
      console.warn(`⚠️  Record tidak ditemukan untuk order_id: ${orderId}`);
      return res.status(200).json({ message: 'Order not found, ignored' });
    }

    // Jika sudah diproses sebelumnya, skip (cegah double kredit saldo)
    if (topupRecord.status !== 'menunggu') {
      return res.status(200).json({ message: 'Already processed' });
    }

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept' || !fraudStatus) {
        // ✅ PEMBAYARAN BERHASIL — tambah saldo user
        const user = await User.findByPk(topupRecord.id_user);
        if (user) {
          const saldoBaru = Number(user.saldo || 0) + Number(topupRecord.jumlah);
          
          // Update saldo user ke database
          await User.update({ saldo: saldoBaru }, { where: { id: user.id } });
          
          // Ubah status order dari 'menunggu' menjadi 'disetujui' otomatis
          await Topup.update(
            {
              status: 'disetujui',
              catatan_admin: `Dibayar via Midtrans (${transactionStatus})`,
            },
            { where: { id: topupRecord.id } }
          );
          console.log(`✅ Saldo ${user.username} bertambah Rp ${topupRecord.jumlah}`);
        }
      }
    } else if (
      transactionStatus === 'cancel' ||
      transactionStatus === 'deny'   ||
      transactionStatus === 'expire'
    ) {
      // ❌ PEMBAYARAN GAGAL / DIBATALKAN / KADALUARSA
      await Topup.update(
        {
          status: 'ditolak',
          catatan_admin: `Transaksi ${transactionStatus} oleh Midtrans`,
        },
        { where: { id: topupRecord.id } }
      );
      console.log(`❌ Transaksi ${orderId} ${transactionStatus}`);
    }
    // Status 'pending' → tidak perlu aksi, tunggu notifikasi settlement berikutnya

    // Response 200 OK wajib dikembalikan ke Midtrans agar webhook berhenti me-retry
    res.status(200).json({ message: 'OK' });

  } catch (err) {
    console.error('Error handleMidtransNotification:', err);
    res.status(500).json({ success: false, message: 'Notification processing failed' });
  }
};

// ============================================================
// GET /api/topup/check-status/:orderId
// Dipanggil frontend untuk cek apakah saldo sudah masuk
// setelah user menutup popup Midtrans
// ============================================================
exports.checkTransactionStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const statusResponse = await snap.transaction.status(orderId);
    const topupRecord    = await Topup.findOne({ where: { bukti: orderId } });

    res.json({
      success: true,
      transactionStatus: statusResponse.transaction_status,
      topupStatus: topupRecord?.status || 'unknown',
    });

  } catch (err) {
    console.error('Error checkTransactionStatus:', err);
    res.status(500).json({ success: false, message: 'Gagal cek status transaksi' });
  }
};