const request = require('supertest');
const app = require('../index'); 
const { sequelize } = require('../config/db'); 
const User = require('../models/User'); 

describe('Unit Testing: Endpoint Register KantinITH', () => {
    
    // Gunakan username dan email unik untuk setiap test run agar tidak ada duplikat
    const uniqueUsername = `akun_tester_${Date.now()}`;
    const newUser = {
        username: uniqueUsername,
        email: `tester_${Date.now()}@kantin.test`,
        password: 'password123',
        role: 'pembeli'
    };

    it('Harus berhasil mendaftarkan akun baru (200 OK)', async () => {
        // Pastikan user tidak ada sebelum test
        await User.destroy({ where: { username: newUser.username } });

        const response = await request(app)
            .post('/api/register')
            .send(newUser);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toHaveProperty('success', true);
    });

    it('Harus gagal jika mencoba mendaftar dengan username yang sama', async () => {
        const response = await request(app)
            .post('/api/register')
            .send(newUser);

        expect(response.statusCode).toBe(400); 
        expect(response.body).toHaveProperty('success', false);
    });

    afterAll(async () => {
        await User.destroy({ where: { username: newUser.username } });
        await sequelize.close();
    });
});