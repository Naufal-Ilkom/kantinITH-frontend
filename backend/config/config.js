// backend/config/config.js
module.exports = {
  HOST: process.env.DB_HOST || "localhost",
  USER: process.env.DB_USER || "root",
  PASSWORD: process.env.DB_PASSWORD || "",
  DB: process.env.DB_NAME || "kantin_db",
  dialect: "postgres",   // Ganti jenis database ke PostgreSQL
  pool: {                // Pengaturan performa koneksi[cite: 1]
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};