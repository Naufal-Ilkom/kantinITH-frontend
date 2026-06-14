const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken'); 
const crypto = require('crypto');
const nodemailer = require('nodemailer'); 

// IMPORT LIBRARY KEAMANAN (TETAP DIIMPORT TAPI TIDAK DIPAKAI DULU)
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const { sequelize, connectDB } = require('./config/db'); 
const User = require('./models/User');
const Order = require('./models/Order');
const Menu = require('./models/Menu');
const Topup = require('./models/Topup');

const { verifyToken } = require('./middleware/auth');

const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes'); 
const topupRoutes = require('./routes/topupRoutes'); 
const midtransRoutes = require('./routes/midtransRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Panggil koneksi database
connectDB();

// ==========================================
// SETUP RATE LIMITER (DIMATIKAN SEMENTARA UNTUK TESTING)
// ==========================================
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, 
    message: { 
        success: false, 
        message: "Terlalu banyak request. Coba lagi dalam 15 menit." 
    }
});

// app.use('/api/', apiLimiter); // <--- INI SAYA MATIKAN AGAR KAMU BISA LOGIN BEBAS


// ==========================================
// REGISTER (VALIDATOR DIMATIKAN SEMENTARA)
// ==========================================
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        
        // Pengecekan manual standar (tanpa express-validator)
        if (!username || !email || !password || !role) {
            return res.status(400).json({ success: false, message: "Username, email, password, dan role harus diisi!" });
        }

        const existingUsername = await User.findOne({ where: { username } });
        if (existingUsername) {
            return res.status(400).json({ success: false, message: "Username sudah dipakai!" });
        }

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ success: false, message: "Email sudah terdaftar!" });
        }

        await User.create({ 
            username, 
            email,
            password, 
            role, 
            status: 'Aktif', 
            saldo: 0 
        });
        
        res.json({ success: true, message: "Registrasi Berhasil! Silakan login dengan akun Anda." });
    } catch (err) {
        console.error("Error registrasi:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// LOGIN (TELAH DIPERBAIKI UNTUK REGRESSION TESTING)
// ==========================================
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. TAMBAHKAN VALIDASI INPUT BERIKUT AGAR TIDAK MEMICU ERROR UNDEFINED PADA JEST
        if (!username || !password) {
            return res.status(401).json({ success: false, message: 'Username dan password wajib diisi' });
        }

        const user = await User.findOne({ where: { username, password } });

        if (user) {
            if (user.status === 'Nonaktif') {
                return res.status(403).json({ success: false, message: 'Akun Anda diblokir.' });
            }

            // Access token berlaku 15 menit
            const accessToken = jwt.sign(
                { id: user.id, username: user.username, role: user.role }, 
                process.env.JWT_SECRET || 'rahasia_negara', 
                { expiresIn: '15m' } 
            );

            // Refresh token berlaku 7 hari
            const refreshToken = jwt.sign(
                { id: user.id }, 
                process.env.JWT_REFRESH_SECRET || 'rahasia_refresh', 
                { expiresIn: '7d' } 
            );

            // Simpan refresh token ke database
            await User.update(
                { refresh_token: refreshToken },
                { where: { id: user.id } }
            );

            res.json({
                success: true,
                message: 'Login berhasil',
                accessToken: accessToken,
                refreshToken: refreshToken,
                user: { id: user.id, username: user.username, email: user.email, role: user.role, saldo: user.saldo }
            });
        } else {
            res.status(401).json({ success: false, message: 'Username atau password salah' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==========================================
// REFRESH TOKEN ENDPOINT
// ==========================================
app.post('/api/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: "Refresh token tidak ditemukan" });
        }

        // Verifikasi refresh token
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'rahasia_refresh', async (err, decoded) => {
            if (err) {
                return res.status(403).json({ success: false, message: "Refresh token tidak valid atau kadaluarsa" });
            }

            // Cek apakah refresh token cocok dengan yang ada di database
            const user = await User.findByPk(decoded.id);

            if (!user || user.refresh_token !== refreshToken) {
                return res.status(403).json({ success: false, message: "Refresh token tidak sesuai" });
            }

            // Generate access token baru (15 menit)
            const newAccessToken = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET || 'rahasia_negara',
                { expiresIn: '15m' }
            );

            res.json({
                success: true,
                message: "Access token berhasil diperbarui",
                accessToken: newAccessToken
            });
        });
    } catch (err) {
        console.error("Error refresh token:", err);
        res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
    }
});

// ==========================================
// LOGOUT ENDPOINT
// ==========================================
app.post('/api/logout', verifyToken, async (req, res) => {
    try {
        // Hapus refresh token dari database
        await User.update(
            { refresh_token: null },
            { where: { id: req.user.id } }
        );

        res.json({ success: true, message: "Logout berhasil" });
    } catch (err) {
        console.error("Error logout:", err);
        res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
    }
});

// ==========================================
// RESET PASSWORD ENDPOINTS (PUBLIC)
// ==========================================

// STEP 1: Request reset password
app.post('/api/lupa-password', async (req, res) => {
    try {
        const { username } = req.body;
        
        if (!username) {
            return res.status(400).json({ success: false, message: "Username harus diisi" });
        }

        const user = await User.findOne({ where: { username } });
        
        if (!user) {
            return res.status(404).json({ success: false, message: "Username tidak ditemukan atau email belum terdaftar" });
        }

        if (!user.email) {
            return res.status(400).json({ success: false, message: "Email belum terdaftar untuk akun ini. Hubungi admin." });
        }

        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenExpires = new Date(Date.now() + 15 * 60 * 1000); 

        await User.update(
            { reset_token: resetToken, reset_token_expires: tokenExpires },
            { where: { id: user.id } }
        );

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS  
            }
        });

        const mailOptions = {
            from: `"KantinITH Support" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Kode Verifikasi Reset Password - KantinITH',
            text: `Halo ${username},\n\nBerikut adalah kode verifikasi untuk reset password Anda:\n\n🔐 KODE: ${resetToken}\n\nKode ini berlaku selama 15 menit. Jangan bagikan kode ini ke siapa pun.\n\nJika Anda tidak melakukan permintaan ini, abaikan email ini.\n\nRegards,\nTim KantinITH`
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email verifikasi berhasil dikirim ke: ${user.email}`);

        res.json({ 
            success: true, 
            message: "Kode verifikasi 6 digit telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam."
        });
    } catch (err) {
        console.error("Error lupa password:", err);
        res.status(500).json({ success: false, message: "Gagal memproses permintaan reset password. Pastikan konfigurasi email di .env sudah benar." });
    }
});

// STEP 1.5: Verifikasi Token saja
app.post('/api/verify-reset-token', async (req, res) => {
    try {
        const { username, resetToken } = req.body;
        
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan" });
        }

        if (!user.reset_token || String(user.reset_token) !== String(resetToken)) {
            return res.status(401).json({ success: false, message: "Kode verifikasi salah!" });
        }

        if (new Date() > new Date(user.reset_token_expires)) {
            return res.status(401).json({ success: false, message: "Kode sudah kadaluarsa. Silakan request ulang." });
        }

        res.json({ success: true, message: "Kode benar! Lanjut ke halaman ganti password." });
    } catch (err) {
        console.error("Error verify token:", err);
        res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
    }
});

// STEP 2: Verifikasi token dan update password di DB
app.put('/api/reset-password', async (req, res) => {
    try {
        const { username, resetToken, passwordBaru } = req.body;

        if (!username || !resetToken || !passwordBaru) {
            return res.status(400).json({ success: false, message: "Username, token, dan password baru harus diisi" });
        }

        if (passwordBaru.length < 6) {
            return res.status(400).json({ success: false, message: "Password minimal 6 karakter" });
        }

        const user = await User.findOne({ where: { username } });
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan" });
        }

        if (!user.reset_token || String(user.reset_token) !== String(resetToken)) {
            return res.status(401).json({ success: false, message: "Token tidak valid atau sudah kadaluarsa" });
        }

        if (new Date() > new Date(user.reset_token_expires)) {
            return res.status(401).json({ success: false, message: "Token sudah expired. Silakan request token baru." });
        }

        await User.update(
            { password: passwordBaru, reset_token: null, reset_token_expires: null },
            { where: { id: user.id } }
        );
        
        res.json({ success: true, message: "Password berhasil direset! Silakan login dengan password baru." });
    } catch (err) {
        console.error("Error reset password:", err);
        res.status(500).json({ success: false, message: "Gagal mereset password" });
    }
});

app.use('/api/menu', menuRoutes);
app.use('/api', orderRoutes); 
app.use('/api', topupRoutes); 
app.use('/api/topup', midtransRoutes);

app.get('/api/users/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, { attributes: ['id', 'username', 'email', 'role', 'saldo'] });
        if (user) res.json(user);
        else res.status(404).json({ message: 'User tidak ditemukan' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ==========================================
// UPDATE PROFILE (Username & Email)
// ==========================================
app.put('/api/users/:id/profile', verifyToken, async (req, res) => {
    try {
        // Validasi akses - user hanya bisa update profile sendiri
        if (req.user.id !== parseInt(req.params.id)) {
            return res.status(403).json({ success: false, message: "Akses ditolak! Anda hanya bisa mengubah profile Anda sendiri." });
        }

        const { username, email } = req.body;
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan" });
        }

        // Validasi username
        if (username && username !== user.username) {
            const existingUsername = await User.findOne({ where: { username } });
            if (existingUsername) {
                return res.status(400).json({ success: false, message: "Username sudah dipakai!" });
            }
        }

        // Validasi email
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ success: false, message: "Format email tidak valid!" });
            }
            
            if (email !== user.email) {
                const existingEmail = await User.findOne({ where: { email } });
                if (existingEmail) {
                    return res.status(400).json({ success: false, message: "Email sudah terdaftar!" });
                }
            }
        }

        // Update data
        const updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;

        await User.update(updateData, { where: { id: req.params.id } });

        // Ambil data updated
        const updatedUser = await User.findByPk(req.params.id, { attributes: ['id', 'username', 'email', 'role', 'saldo'] });

        res.json({
            success: true,
            message: "Profile berhasil diperbarui!",
            user: updatedUser
        });
    } catch (err) {
        console.error("Error update profile:", err);
        res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
    }
});

app.post('/api/users/withdraw/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.id !== parseInt(req.params.id)) {
            return res.status(403).json({ success: false, message: "Akses ilegal! Anda tidak berhak menarik saldo ini." });
        }

        const { amount } = req.body;
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

        const saldoBaru = Number(user.saldo || 0) + Number(amount);
        await User.update({ saldo: saldoBaru }, { where: { id: req.params.id } });

        res.json({ success: true, message: "Dana berhasil dipindahkan ke Saldo Utama!", saldo: saldoBaru });
    } catch (err) {
        console.error("Error withdraw:", err);
        res.status(500).json({ success: false, message: "Gagal memproses penarikan" });
    }
});

app.put('/api/users/update-saldo/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { saldo } = req.body;
        await User.update({ saldo }, { where: { id } });
        res.json({ success: true, message: "Saldo berhasil diperbarui!", saldo });
    } catch (err) {
        res.status(500).json({ success: false, message: "Gagal mengupdate saldo" });
    }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================
app.get('/api/admin/users', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Akses ditolak! Hanya admin yang bisa mengakses." });
        }

        const users = await User.findAll({
            attributes: ['id', 'username', 'role', 'status', 'saldo']
        });
        res.json(users);
    } catch (err) {
        console.error("Error get all users:", err);
        res.status(500).json({ success: false, message: "Gagal mengambil data pengguna" });
    }
});

app.patch('/api/admin/users/:id/status', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Akses ditolak! Hanya admin yang bisa mengakses." });
        }

        const { status } = req.body;
        const user = await User.findByPk(req.params.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan" });
        }

        await User.update({ status }, { where: { id: req.params.id } });
        res.json({ success: true, message: "Status user berhasil diubah!" });
    } catch (err) {
        console.error("Error update status:", err);
        res.status(500).json({ success: false, message: "Gagal mengubah status user" });
    }
});

app.patch('/api/admin/users/:id/saldo', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Akses ditolak! Hanya admin yang bisa mengakses." });
        }

        const { saldo } = req.body;
        const user = await User.findByPk(req.params.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan" });
        }

        await User.update({ saldo }, { where: { id: req.params.id } });
        res.json({ success: true, message: "Saldo user berhasil diubah!" });
    } catch (err) {
        console.error("Error update saldo:", err);
        res.status(500).json({ success: false, message: "Gagal mengubah saldo user" });
    }
});

app.delete('/api/admin/users/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Akses ditolak! Hanya admin yang bisa mengakses." });
        }

        const user = await User.findByPk(req.params.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan" });
        }

        await User.destroy({ where: { id: req.params.id } });
        res.json({ success: true, message: "User berhasil dihapus!" });
    } catch (err) {
        console.error("Error delete user:", err);
        res.status(500).json({ success: false, message: "Gagal menghapus user" });
    }
});

// ========================================================
// DATABASE SYNC
// ========================================================
if (require.main === module) {
    sequelize.sync({ alter: true })
      .then(() => console.log('✅ Semua model telah disinkronkan ke database.'))
      .catch(err => console.error('❌ Gagal sinkronisasi model:', err));

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server jalan di http://localhost:${PORT}`);
    });
}

module.exports = app;