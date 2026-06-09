const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
    // Sesuaikan dengan kolom di database MySQL kamu
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    role: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.STRING
    },
    saldo: {
        type: DataTypes.INTEGER
    },
    reset_token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reset_token_expires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    refresh_token: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'users', // Nama tabel di MySQL
    timestamps: false   // Set true jika ada kolom createdAt & updatedAt
});

module.exports = User;  