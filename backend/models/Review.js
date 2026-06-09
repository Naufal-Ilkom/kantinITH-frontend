const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); 
const User = require('./User'); // 1. TAMBAHKAN IMPORT USER DI SINI

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  id_pesanan: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_menu: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'menu', 
      key: 'id'
    }
  },
  id_pembeli: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users', 
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  komentar: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'reviews', 
  timestamps: true      
});

// 2. TAMBAHKAN DEFINISI RELASI DI SINI (AGAR SELALU TERDAFTAR DI SEQUELIZE)
Review.belongsTo(User, { foreignKey: 'id_pembeli', as: 'Pembeli' });

module.exports = Review;