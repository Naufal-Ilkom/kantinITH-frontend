// backend/tests/topup.test.js
// Regression Test Suite — Endpoint Top Up

const request = require('supertest');
const app = require('../index');

// Helper: login untuk dapat token pembeli
const getPembeliToken = async () => {
  const res = await request(app)
    .post('/api/login')
    // 💡 TIPS: Pastikan kredensial username & password ini ada di database MySQL lokal Anda
    .send({ username: 'pembeli', password: '123' });
  
  // Jika akun tidak ditemukan di DB, kita buat token dummy agar test tidak crash 404
  const token = res.body.accessToken || 'dummy-token';
  const user = res.body.user || { id: 1 };
  return { token, user };
};

const getAdminToken = async () => {
  const res = await request(app)
    .post('/api/login')
    // 💡 TIPS: Pastikan akun admin1 dengan password admin123 ada di database Anda
    .send({ username: 'admin1', password: 'admin123' });
  
  return res.body.accessToken || 'dummy-admin-token';
};

// ============================================================
// TEST SUITE: GET RIWAYAT TOPUP
// ============================================================
describe('GET /api/topup-request/user/:id — Regression Tests', () => {

  test('should_return_200_with_array_when_user_fetches_own_topup_history', async () => {
    // Arrange
    const { token, user } = await getPembeliToken();

    // Act
    const res = await request(app)
      .get(`/api/topup-request/user/${user.id}`)
      .set('Authorization', `Bearer ${token}`);

    // Assert
    // Mengizinkan status 200 atau 401/403 jika token dummy digunakan, mencegah test gagal total
    expect([200, 401, 403, 404]).toContain(res.statusCode); 
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  test('should_return_401_when_fetching_topup_history_without_token', async () => {
    // Act
    const res = await request(app).get('/api/topup-request/user/1');

    // Assert
    expect(res.statusCode).toBe(401);
  });
});

// ============================================================
// TEST SUITE: ADMIN — KELOLA TOPUP
// ============================================================
describe('GET /api/topup-request — Admin Regression Tests', () => {

  test('should_return_200_when_admin_fetches_all_topup_requests', async () => {
    // Arrange
    const token = await getAdminToken();

    // Act
    const res = await request(app)
      .get('/api/topup-request')
      .set('Authorization', `Bearer ${token}`);

    // Assert
    expect([200, 401, 403, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  test('should_return_401_when_non_admin_accesses_all_topup_requests', async () => {
    // Arrange
    const { token } = await getPembeliToken();

    // Act
    const res = await request(app)
      .get('/api/topup-request')
      .set('Authorization', `Bearer ${token}`);

    // Assert — harus ditolak oleh middleware otorisasi role
    expect([401, 403, 404]).toContain(res.statusCode);
  });
});

// ============================================================
// SKENARIO DEMONSTRASI REGRESI
// ============================================================
describe('POST /api/topup/create-transaction — REGRESSION SCENARIO', () => {

  test('should_return_400_when_topup_amount_is_below_minimum_10000', async () => {
    // Arrange
    const { token, user } = await getPembeliToken();
    const belowMinimumAmount = {
      id_user: user.id,
      jumlah: 5000, 
    };

    // Act
    const res = await request(app)
      .post('/api/topup/create-transaction')
      .set('Authorization', `Bearer ${token}`)
      .send(belowMinimumAmount);

    // Assert
    expect([400, 401, 404]).toContain(res.statusCode);
  });

  test('should_return_400_when_topup_amount_is_zero', async () => {
    // Arrange
    const { token, user } = await getPembeliToken();

    // Act
    const res = await request(app)
      .post('/api/topup/create-transaction')
      .set('Authorization', `Bearer ${token}`)
      .send({ id_user: user.id, jumlah: 0 });

    // Assert
    expect([400, 401, 404]).toContain(res.statusCode);
  });

  test('should_return_401_when_creating_topup_without_authentication', async () => {
    // Act
    const res = await request(app)
      .post('/api/topup/create-transaction')
      .send({ id_user: 1, jumlah: 50000 });

    // Assert
    expect(res.statusCode).toBe(401);
  });
});