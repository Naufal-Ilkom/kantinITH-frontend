const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Menu = require('./Menu');
const Review = require('./Review'); // Import model Review

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_pembeli: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_penjual: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_menu: {
        type: DataTypes.INTEGER,
        allowNull: true 
    },
    total_harga: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    detail_item: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('menunggu', 'diproses', 'selesai', 'dibatalkan', 'ditolak'),
        defaultValue: 'menunggu'
    }
}, {
    tableName: 'pesanan',
    timestamps: true
});

// Asosiasi Relasi Database
Order.belongsTo(User, { as: 'Pembeli', foreignKey: 'id_pembeli' });
Order.belongsTo(User, { as: 'Penjual', foreignKey: 'id_penjual' });
Order.belongsTo(Menu, { as: 'Menu', foreignKey: 'id_menu' });

// 1 PESANAN HANYA BISA MEMILIKI 1 REVIEW (KUNCI UTAMA)
Order.hasOne(Review, { as: 'Review', foreignKey: 'id_pesanan' });

module.exports = Order;