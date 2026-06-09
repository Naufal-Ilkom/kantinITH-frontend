const Topup = require('../models/Topup');
const User = require('../models/User');

exports.createTopupRequest = async (req, res) => {
    try {
        const { id_user, jumlah, tipe, bukti } = req.body;

        if (!id_user || !jumlah || jumlah <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID User dan Jumlah harus diisi dengan benar' 
            });
        }

        const user = await User.findByPk(id_user);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User tidak ditemukan' 
            });
        }

        const topupRequest = await Topup.create({
            id_user: id_user,
            jumlah: jumlah,
            tipe: tipe || 'topup_saldo',
            bukti: bukti || null,
            status: 'menunggu'
        });

        res.json({ 
            success: true, 
            message: 'Request topup berhasil dibuat', 
            data: topupRequest 
        });
    } catch (err) {
        console.error('Error createTopupRequest:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error Server', 
            error: err.message 
        });
    }
};

exports.getAllTopupRequests = async (req, res) => {
    try {
        const topupRequests = await Topup.findAll({
            include: [{ model: User, as: 'User', attributes: ['id', 'username', 'role'] }],
            order: [['createdAt', 'DESC']]
        });

        res.json(topupRequests);
    } catch (err) {
        console.error('Error getAllTopupRequests:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error Server', 
            error: err.message 
        });
    }
};


exports.getTopupByUserId = async (req, res) => {
    try {
        const { id_user } = req.params;

        const topupRequests = await Topup.findAll({
            where: { id_user: id_user },
            include: [{ model: User, as: 'User', attributes: ['username'] }],
            order: [['createdAt', 'DESC']]
        });

        res.json(topupRequests);
    } catch (err) {
        console.error('Error getTopupByUserId:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error Server', 
            error: err.message 
        });
    }
};

exports.getTopupByStatus = async (req, res) => {
    try {
        const { status } = req.params;

        const topupRequests = await Topup.findAll({
            where: { status: status },
            include: [{ model: User, as: 'User', attributes: ['id', 'username', 'role'] }],
            order: [['createdAt', 'DESC']]
        });

        res.json(topupRequests);
    } catch (err) {
        console.error('Error getTopupByStatus:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error Server', 
            error: err.message 
        });
    }
};

exports.approveTopup = async (req, res) => {
    try {
        const { id } = req.params;
        const { catatan_admin } = req.body;

        const topupRequest = await Topup.findByPk(id);
        if (!topupRequest) {
            return res.status(404).json({ 
                success: false, 
                message: 'Topup request tidak ditemukan' 
            });
        }

        const user = await User.findByPk(topupRequest.id_user);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User tidak ditemukan' 
            });
        }

        // Kalkulasi saldo baru berdasarkan tipe topup
        let saldoBaru;
        if (topupRequest.tipe === 'topup_saldo') {
            // Tambah saldo
            saldoBaru = Number(user.saldo || 0) + Number(topupRequest.jumlah);
        } else if (topupRequest.tipe === 'tarik_saldo') {
            // Kurangi saldo
            saldoBaru = Number(user.saldo || 0) - Number(topupRequest.jumlah);
            if (saldoBaru < 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Saldo tidak mencukupi untuk tarik' 
                });
            }
        }

        // Update saldo user
        await User.update({ saldo: saldoBaru }, { where: { id: user.id } });

        // Update status topup request
        await Topup.update({ 
            status: 'disetujui',
            catatan_admin: catatan_admin || ''
        }, { where: { id: id } });

        res.json({ 
            success: true, 
            message: 'Topup berhasil disetujui, saldo user telah diupdate',
            saldoBaru: saldoBaru
        });
    } catch (err) {
        console.error('Error approveTopup:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error Server', 
            error: err.message 
        });
    }
};


exports.rejectTopup = async (req, res) => {
    try {
        const { id } = req.params;
        const { catatan_admin } = req.body;

        const topupRequest = await Topup.findByPk(id);
        if (!topupRequest) {
            return res.status(404).json({ 
                success: false, 
                message: 'Topup request tidak ditemukan' 
            });
        }

        // Update status topup request
        await Topup.update({ 
            status: 'ditolak',
            catatan_admin: catatan_admin || ''
        }, { where: { id: id } });

        res.json({ 
            success: true, 
            message: 'Topup berhasil ditolak'
        });
    } catch (err) {
        console.error('Error rejectTopup:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error Server', 
            error: err.message 
        });
    }
};

exports.updateTopupRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { jumlah, bukti } = req.body;

        const topupRequest = await Topup.findByPk(id);
        if (!topupRequest) {
            return res.status(404).json({ 
                success: false, 
                message: 'Topup request tidak ditemukan' 
            });
        }

        if (topupRequest.status !== 'menunggu') {
            return res.status(400).json({ 
                success: false, 
                message: 'Hanya topup dengan status "menunggu" yang bisa diedit' 
            });
        }

        const updateData = {};
        if (jumlah) updateData.jumlah = jumlah;
        if (bukti) updateData.bukti = bukti;

        await Topup.update(updateData, { where: { id: id } });

        res.json({ 
            success: true, 
            message: 'Topup request berhasil diupdate'
        });
    } catch (err) {
        console.error('Error updateTopupRequest:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error Server', 
            error: err.message 
        });
    }
};

exports.deleteTopupRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const topupRequest = await Topup.findByPk(id);
        if (!topupRequest) {
            return res.status(404).json({ 
                success: false, 
                message: 'Topup request tidak ditemukan' 
            });
        }

        if (topupRequest.status !== 'menunggu') {
            return res.status(400).json({ 
                success: false, 
                message: 'Hanya topup dengan status "menunggu" yang bisa dihapus' 
            });
        }

        await Topup.destroy({ where: { id: id } });

        res.json({ 
            success: true, 
            message: 'Topup request berhasil dihapus'
        });
    } catch (err) {
        console.error('Error deleteTopupRequest:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error Server', 
            error: err.message 
        });
    }
};
