// backend/tests/auth.test.js
// Regression Test Suite — Endpoint Auth (Register & Login)
// Menggunakan Jest + Supertest

const request = require('supertest');
const app = require('../index');

// ============================================================
// TEST SUITE: REGISTER
// ============================================================
describe('POST /api/register — Regression Tests', () => {

  // ── Happy Path ───────────────────────────────────────────
  test('should_return_201_when_registering_with_valid_data', async () => {
    // Arrange
    const newUser = {
      username: `testuser_${Date.now()}`, // unik setiap run
      email: `test_${Date.now()}@kantinith.com`,
      password: 'password123',
      role: 'pembeli',
    };

    // Act
    const res = await request(app)
      .post('/api/register')
      .send(newUser);

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/berhasil/i);
  });

  // ── Error Scenario: Field kosong ─────────────────────────
  test('should_return_400_when_username_is_missing', async () => {
    // Arrange
    const incompleteData = {
      email: 'test@kantinith.com',
      password: 'password123',
      role: 'pembeli',
      // username sengaja tidak diisi
    };

    // Act
    const res = await request(app)
      .post('/api/register')
      .send(incompleteData);

    // Assert
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should_return_400_when_all_fields_are_empty', async () => {
    // Act
    const res = await request(app)
      .post('/api/register')
      .send({});

    // Assert
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ── Error Scenario: Username duplikat ────────────────────
  test('should_return_400_when_username_already_exists', async () => {
    // Arrange — gunakan username yang pasti sudah ada di DB
    const duplicateUser = {
      username: 'pembeli', // sesuaikan dengan user yang ada di DB-mu
      email: `baru_${Date.now()}@kantinith.com`,
      password: '123',
      role: 'pembeli',
    };

    // Act
    const res = await request(app)
      .post('/api/register')
      .send(duplicateUser);

    // Assert
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/sudah dipakai/i);
  });
});

// ============================================================
// TEST SUITE: LOGIN
// ============================================================
describe('POST /api/login — Regression Tests', () => {

  // ── Happy Path ───────────────────────────────────────────
  test('should_return_200_with_token_when_credentials_are_valid', async () => {
    // Arrange — sesuaikan dengan akun yang ada di DB-mu
    const validCredentials = {
      username: 'buy',
      password: '123',
    };

    // Act
    const res = await request(app)
      .post('/api/login')
      .send(validCredentials);

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('role');
  });

  // ── Error Scenario: Password salah ───────────────────────
  test('should_return_401_when_password_is_wrong', async () => {
    // Arrange
    const wrongPassword = {
      username: 'admin1',
      password: 'passwordSalah999',
    };

    // Act
    const res = await request(app)
      .post('/api/login')
      .send(wrongPassword);

    // Assert
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // ── Error Scenario: Username tidak ada ───────────────────
  test('should_return_401_when_username_does_not_exist', async () => {
    // Arrange
    const nonExistentUser = {
      username: 'user_tidak_ada_sama_sekali',
      password: 'password123',
    };

    // Act
    const res = await request(app)
      .post('/api/login')
      .send(nonExistentUser);

    // Assert
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // ── Edge Case: Body kosong ────────────────────────────────
  test('should_return_401_when_body_is_empty', async () => {
    // Act
    const res = await request(app)
      .post('/api/login')
      .send({});

    // Assert
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
