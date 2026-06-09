const { Sequelize } = require('sequelize');
require('dotenv').config();

// 1. Inisialisasi Objek Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,     // Nama database (kantin_db)
  process.env.DB_USER,     // Username (root)
  process.env.DB_PASSWORD, // Password
  {
    host: process.env.DB_HOST, // localhost
    dialect: 'mysql',          // Kita pakai MySQL
    logging: false,            // Agar terminal tidak penuh log SQL
  }
);

// 2. Fungsi Tes Koneksi dengan Async/Await
const connectDB = async () => {
  try {
    await sequelize.authenticate(); // Mencoba terhubung
    console.log('✅ Database MySQL Terhubung melalui Sequelize!');
    
    // Sync database dengan model - jangan alter untuk hindari foreign key conflict
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Database tables synchronized!');
  } catch (error) {
    console.error('❌ Gagal koneksi database:', error.message);
    // Lanjutkan meski sync gagal
  }
};

// 3. Export agar bisa dipakai di index.js
module.exports = { sequelize, connectDB };