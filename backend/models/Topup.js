const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Topup = sequelize.define('Topup', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_user: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    jumlah: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'menunggu' // 'menunggu', 'disetujui', 'ditolak'
    },
    tipe: {
        type: DataTypes.STRING, // 'topup_saldo' atau 'tarik_saldo'
        defaultValue: 'topup_saldo'
    },
    bukti: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    catatan_admin: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'topup_requests',
    timestamps: true
});

// Relasi ke User
Topup.belongsTo(User, { as: 'User', foreignKey: 'id_user' });

module.exports = Topup;
