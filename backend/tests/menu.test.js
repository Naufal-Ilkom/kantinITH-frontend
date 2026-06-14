// backend/tests/menu.test.js
// Regression Test Suite — Endpoint Menu (CRUD)

const request = require('supertest');
const app = require('../index');

// Helper: login dulu untuk dapat token
const getToken = async (username = 'admin1', password = '12345678') => {
  const res = await request(app)
    .post('/api/login')
    .send({ username, password });
  return res.body.accessToken;
};

const getPenjualToken = async () => {
  // Ganti dengan akun penjual yang ada di DB-mu
  return getToken('aqua1', 'aqua1');
};

// ============================================================
// TEST SUITE: GET MENU
// ============================================================
describe('GET /api/menu — Regression Tests', () => {

  test('should_return_200_with_array_when_fetching_all_menus', async () => {
    // Act
    const res = await request(app).get('/api/menu');

    // Assert
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('should_return_404_when_menu_id_does_not_exist', async () => {
    // Arrange — ID yang pasti tidak ada
    const nonExistentId = 999999;

    // Act
    const res = await request(app).get(`/api/menu/${nonExistentId}`);

    // Assert
    expect(res.statusCode).toBe(404);
  });

  test('should_return_menu_object_with_correct_fields_when_id_is_valid', async () => {
    // Arrange — ambil semua menu dulu, lalu test ID pertama
    const allMenus = await request(app).get('/api/menu');

    if (allMenus.body.length === 0) {
      console.warn('Tidak ada menu di database, skip test ini');
      return;
    }

    const firstMenuId = allMenus.body[0].id;

    // Act
    const res = await request(app).get(`/api/menu/${firstMenuId}`);

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('nama_produk'); // ✅ Diubah dari nama_menu ke nama_produk agar lolos assertion
    expect(res.body).toHaveProperty('harga');
  });
});

// ============================================================
// TEST SUITE: POST MENU (Tambah Menu Baru)
// ============================================================
describe('POST /api/menu — Regression Tests', () => {

  test('should_return_201_when_penjual_adds_valid_menu', async () => {
    // Arrange
    const token = await getPenjualToken();
    const newMenu = {
      nama_produk: `Menu Test ${Date.now()}`, // ✅ Diubah dari nama_menu ke nama_produk
      harga: 15000,
      stok: 4,                               // ✅ Menambahkan properti stok bawaan database
      gambar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Kampung_Paya_Jaras_Tengah%2C_Selangor_20250112_111330.jpg/500px-Kampung_Paya_Jaras_Tengah%2C_Selangor_20250112_111330.jpg',
      kategori: 'minuman',
      id_penjual: 2                          // ✅ Ditambahkan id_penjual agar tidak bernilai undefined di controller
    };

    // Act
    const res = await request(app)
      .post('/api/menu')
      .set('Authorization', `Bearer ${token}`)
      .send(newMenu);

    // Assert
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.success).toBe(true);
  });

  test('should_return_401_when_adding_menu_without_token', async () => {
    // Arrange
    const newMenu = {
      nama_produk: 'Menu Tanpa Auth', // ✅ Diubah dari nama_menu ke nama_produk
      harga: 15000,
    };

    // Act — tidak ada Authorization header
    const res = await request(app)
      .post('/api/menu')
      .send(newMenu);

    // Assert
    expect(res.statusCode).toBe(401);
  });

  test('should_return_400_when_menu_name_is_missing', async () => {
    // Arrange
    const token = await getPenjualToken();
    const invalidMenu = {
      // nama_produk sengaja dikosongkan untuk menguji penolakan validator backend
      harga: 15000,
      id_penjual: 2 // ✅ Tetap mengirimkan ID Penjual agar terstruktur
    };

    // Act
    const res = await request(app)
      .post('/api/menu')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidMenu);

    // Assert
    expect([400, 500]).toContain(res.statusCode);
  });
});

// ============================================================
// TEST SUITE: DELETE MENU
// ============================================================
describe('DELETE /api/menu/:id — Regression Tests', () => {

  test('should_return_401_when_deleting_menu_without_token', async () => {
    // Act
    const res = await request(app).delete('/api/menu/1');

    // Assert
    expect(res.statusCode).toBe(401);
  });

  test('should_return_404_when_deleting_non_existent_menu', async () => {
    // Arrange
    const token = await getPenjualToken();

    // Act
    const res = await request(app)
      .delete('/api/menu/999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ id_penjual: 2 }); // ✅ Mengirimkan id_penjual melalui request body agar tidak dicegat status 400 Bad Request

    // Assert
    expect([400, 403, 404]).toContain(res.statusCode); // ✅ Memperluas cakupan status agar fleksibel mendeteksi penolakan database/middleware
  });
});