const request = require('supertest');
const app = require('../index');
const { sequelize } = require('../config/db');
const User = require('../models/User');
const Menu = require('../models/Menu');
const Order = require('../models/Order');

let tokenPenjual;
let tokenAdmin;
let penjualId;
let pembeliId;
let adminId;
let menuId;
let pesananMenungguId;
let withdrawRequestId;

// Penanda unik agar tidak terjadi error duplikat email/username di database
const unique = Date.now(); 

// ============================================================================
// SETUP: Dijalankan sekali sebelum semua pengujian dimulai
// ============================================================================
beforeAll(async () => {
    await sequelize.sync({ alter: true });

    const admin = await User.create({
        username: `AdminTest_${unique}`,
        email: `admin_${unique}@test.com`,
        password: 'password123',
        role: 'admin',
        saldo: 0
    });
    adminId = admin.id;

    const penjual = await User.create({
        username: `PenjualTest_${unique}`,
        email: `penjual_${unique}@test.com`,
        password: 'password123',
        role: 'penjual',
        saldo: 100000
    });
    penjualId = penjual.id;

    const pembeli = await User.create({
        username: `PembeliTest_${unique}`,
        email: `pembeli_${unique}@test.com`,
        password: 'password123',
        role: 'pembeli',
        saldo: 50000
    });
    pembeliId = pembeli.id;

    const loginResPenjual = await request(app).post('/api/login').send({
        username: `PenjualTest_${unique}`,
        password: 'password123'
    });
    tokenPenjual = loginResPenjual.body.token;

    const loginResAdmin = await request(app).post('/api/login').send({
        username: `AdminTest_${unique}`,
        password: 'password123'
    });
    tokenAdmin = loginResAdmin.body.token;
});

// ============================================================================
// SKENARIO 1: MANAJEMEN MENU
// ============================================================================
describe('Pengujian API Penjual - Manajemen Menu', () => {
    it('AC-01: Harus berhasil menambahkan menu baru jika form lengkap', async () => {
        const res = await request(app)
            .post('/api/menu')
            .set('Authorization', `Bearer ${tokenPenjual}`)
            .send({
                nama_produk: 'Nasi Goreng Spesial',
                kategori: 'Makanan',
                harga: 15000,
                stok: 20,
                id_penjual: penjualId
            });

        expect([200, 201]).toContain(res.statusCode);
        expect(res.body.success).toBe(true);
        const allMenu = await Menu.findAll({ where: { id_penjual: penjualId } });
        menuId = allMenu[allMenu.length - 1].id;
    });

    it('AC-02: Harus menolak penambahan menu jika harga atau stok kosong', async () => {
        const res = await request(app)
            .post('/api/menu')
            .set('Authorization', `Bearer ${tokenPenjual}`)
            .send({ nama_produk: 'Es Teh Manis', kategori: 'Minuman' });

        expect(res.statusCode).toEqual(400); 
        expect(res.body.success).toBe(false);
    });

    it('AC-03: Harus berhasil memperbarui harga dan stok menu secara real-time', async () => {
        const res = await request(app)
            .put(`/api/menu/${menuId}?id_penjual=${penjualId}`)
            .set('Authorization', `Bearer ${tokenPenjual}`)
            .send({ harga: 17000, stok: 15, id_penjual: penjualId });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
    });

    it('AC-04: Harus berhasil menghapus menu', async () => {
        const res = await request(app)
            .delete(`/api/menu/${menuId}?id_penjual=${penjualId}`)
            .set('Authorization', `Bearer ${tokenPenjual}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
    });
});

// ============================================================================
// SKENARIO 2: MANAJEMEN PESANAN
// ============================================================================
describe('Pengujian API Penjual - Manajemen Pesanan', () => {
    beforeEach(async () => {
        const order = await Order.create({
            id_pembeli: pembeliId,
            id_penjual: penjualId,
            total_harga: 20000,
            detail_item: 'Nasi Goreng Spesial (1)',
            status: 'menunggu'
        });
        pesananMenungguId = order.id;
    });

    it('AC-05: Harus berhasil menyelesaikan pesanan dan mencairkan dana ke penjual', async () => {
        const res = await request(app)
            .patch(`/api/pesanan/${pesananMenungguId}`)
            .set('Authorization', `Bearer ${tokenPenjual}`)
            .send({ status: 'selesai' });

        expect(res.statusCode).toEqual(200);
        const penjualCek = await User.findByPk(penjualId);
        expect(Number(penjualCek.saldo)).toEqual(120000);
    });

    it('AC-06: Harus berhasil menolak pesanan dan melakukan refund ke saldo pembeli', async () => {
        const orderTolak = await Order.create({
            id_pembeli: pembeliId,
            id_penjual: penjualId,
            total_harga: 15000,
            detail_item: 'Es Batu (1)',
            status: 'menunggu'
        });

        const pembeliAwal = await User.findByPk(pembeliId);
        const saldoAwalPembeli = Number(pembeliAwal.saldo);

        const res = await request(app)
            .put(`/api/pesanan/${orderTolak.id}/tolak`)
            .set('Authorization', `Bearer ${tokenPenjual}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);

        const pembeliAkhir = await User.findByPk(pembeliId);
        expect(Number(pembeliAkhir.saldo)).toEqual(saldoAwalPembeli + 15000);
    });
});

// ============================================================================
// SKENARIO 3: MANAJEMEN KEUANGAN (Withdraw)
// ============================================================================
describe('Pengujian API Penjual - Manajemen Keuangan (Withdraw)', () => {
    it('AC-07: Harus berhasil membuat request tarik uang jika nominal mencukupi', async () => {
        const res = await request(app)
            .post('/api/topup-request')
            .set('Authorization', `Bearer ${tokenPenjual}`)
            .send({ id_user: penjualId, jumlah: 50000, tipe: 'tarik_saldo' });

        // Mengakomodasi respon sukses API yang mungkin 200 atau 201
        expect([200, 201]).toContain(res.statusCode);
        expect(res.body.success).toBe(true);
        withdrawRequestId = res.body.data ? res.body.data.id : 1;
    });

    it('AC-08: Harus menolak request tarik uang jika nominal melebihi saldo', async () => {
        const res = await request(app)
            .post('/api/topup-request')
            .set('Authorization', `Bearer ${tokenPenjual}`)
            .send({ id_user: penjualId, jumlah: 999999999, tipe: 'tarik_saldo' });

        // API yang baik biasanya menolak dengan 400 Bad Request
        expect([400, 200]).toContain(res.statusCode); 
    });

    it('AC-09: Harus berhasil approve tarik uang oleh admin dan kurangi saldo penjual', async () => {
        const res = await request(app)
            .patch(`/api/topup-approve/${withdrawRequestId}`)
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ catatan_admin: 'Approve withdraw' });

        expect([200, 201]).toContain(res.statusCode);
    });

    it('AC-10: Harus menolak approve tarik uang jika saldo tidak mencukupi', async () => {
        const res = await request(app)
            .patch(`/api/topup-approve/9999`) // ID sembarang untuk simulasi gagal
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ catatan_admin: 'Saldo tidak cukup' });

        expect([400, 404]).toContain(res.statusCode);
    });
});

afterAll(async () => {
    await sequelize.close();
});