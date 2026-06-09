// backend/config/config.js
module.exports = {
  HOST: "localhost",     // Server database kamu
  USER: "root",          // User MySQL (default: root)
  PASSWORD: "",          // Password MySQL kamu
  DB: "kantin_db",       // Nama database yang kamu buat[cite: 1]
  dialect: "mysql",      // Jenis database yang digunakan[cite: 1]
  pool: {                // Pengaturan performa koneksi[cite: 1]
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};