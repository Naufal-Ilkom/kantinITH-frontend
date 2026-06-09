const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Menu = sequelize.define('Menu', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nama_produk: {
        type: DataTypes.STRING,
        allowNull: false
    },
    kategori: {
        type: DataTypes.STRING,
        allowNull: false
    },
    harga: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    stok: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    gambar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_penjual: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'menu', 
    
    timestamps: false 

});


const User = require('./User'); 

// Menu dimiliki oleh satu User (Penjual)
Menu.belongsTo(User, { foreignKey: 'id_penjual' });

// User (Penjual) memiliki banyak Menu
User.hasMany(Menu, { foreignKey: 'id_penjual' });

module.exports = Menu;