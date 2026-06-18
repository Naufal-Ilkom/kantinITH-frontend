const { Sequelize } = require('sequelize');
require('dotenv').config();

// 1. Inisialisasi Objek Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,     // Nama database (kantin_db)
  process.env.DB_USER,     // Username (root)
  process.env.DB_PASSWORD, // Password
  {
    host: process.env.DB_HOST, // localhost
    port: process.env.DB_PORT || 5432, // Port default PostgreSQL (Supabase: 5432 atau 6543)
    dialect: 'postgres',       // Ganti dialect ke postgres
    logging: false,            // Agar terminal tidak penuh log SQL
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false // Supabase biasanya membutuhkan false jika CA cert tidak disertakan eksplisit
      }
    } : {}
  }
);

// 2. Fungsi Tes Koneksi dengan Async/Await
const connectDB = async () => {
  try {
    await sequelize.authenticate(); // Mencoba terhubung
    console.log('✅ Database PostgreSQL (Supabase) Terhubung melalui Sequelize!');
    
  } catch (error) {
    console.error('❌ Gagal koneksi database:', error);
    // Lanjutkan meski sync gagal
  }
};

// 3. Export agar bisa dipakai di index.js
module.exports = { sequelize, connectDB };