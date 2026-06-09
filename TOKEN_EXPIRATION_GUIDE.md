# Panduan Token Session 15 Menit

## Ringkasan Perubahan

Token session telah diimplementasikan dengan masa berlaku **15 menit**, dan menambahkan fitur **refresh token** untuk user experience yang lebih baik.

### Token yang Dibuat:
- **Access Token**: Berlaku 15 menit (untuk akses resource)
- **Refresh Token**: Berlaku 7 hari (untuk mendapatkan access token baru tanpa login ulang)

---

## Endpoint Backend

### 1. Login `/api/login` (POST)
**Request:**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "role": "pembeli",
    "saldo": 50000
  }
}
```

---

### 2. Refresh Token `/api/refresh-token` (POST)
Gunakan endpoint ini ketika access token kadaluarsa (error 401 dengan code `TOKEN_EXPIRED`).

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Access token berhasil diperbarui",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. Logout `/api/logout` (POST)
Gunakan untuk menghapus refresh token dari database (logout pengguna).

**Request Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

---

## Implementasi di Frontend (React)

### 1. Menyimpan Token
```javascript
// Setelah login berhasil
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);
localStorage.setItem('user', JSON.stringify(response.user));
```

### 2. Menambahkan Token ke Request
Buat helper function untuk API calls:
```javascript
const apiCall = async (url, options = {}) => {
    let token = localStorage.getItem('accessToken');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, {
        ...options,
        headers
    });

    // Jika token expired (401)
    if (response.status === 401) {
        const data = await response.json();
        
        if (data.code === 'TOKEN_EXPIRED') {
            // Coba refresh token
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (refreshToken) {
                const refreshResponse = await fetch('/api/refresh-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });

                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    localStorage.setItem('accessToken', refreshData.accessToken);
                    
                    // Retry original request dengan token baru
                    headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
                    response = await fetch(url, {
                        ...options,
                        headers
                    });
                } else {
                    // Refresh gagal, user perlu login ulang
                    localStorage.clear();
                    window.location.href = '/login';
                    return;
                }
            } else {
                // Tidak ada refresh token, user perlu login ulang
                window.location.href = '/login';
                return;
            }
        } else {
            // Unauthorized (bukan karena expired)
            localStorage.clear();
            window.location.href = '/login';
            return;
        }
    }

    return response;
};
```

### 3. Menggunakan API Call
```javascript
// Contoh panggilan API
const getMenu = async () => {
    try {
        const response = await apiCall('/api/menu', {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch menu');
        }

        const data = await response.json();
        console.log('Menu:', data);
    } catch (error) {
        console.error('Error:', error);
    }
};
```

### 4. Setup Axios Interceptor (Alternatif)
Jika menggunakan Axios:
```javascript
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000',
});

// Request interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const response = await axios.post('/api/refresh-token', {
                    refreshToken
                });

                localStorage.setItem('accessToken', response.data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                localStorage.clear();
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
```

---

## Environment Variables (Backend)

Pastikan di file `.env` backend Anda memiliki:
```
JWT_SECRET=rahasia_negara
JWT_REFRESH_SECRET=rahasia_refresh
```

Atau gunakan default di kode (sudah ada).

---

## Alur Singkat

1. **Login** → Dapatkan `accessToken` (15 menit) dan `refreshToken` (7 hari)
2. **Gunakan API** → Attach `accessToken` di header Authorization
3. **Token Expired (error 401)** → Gunakan `refreshToken` untuk dapatkan `accessToken` baru
4. **Refresh Token Expired** → User harus login ulang
5. **Logout** → Hapus `refreshToken` dari database

---

## Catatan Penting

- Token disimpan di `localStorage` (pastikan aplikasi HTTPS di production)
- Untuk keamanan lebih baik, gunakan `httpOnly` cookie untuk refresh token
- Setiap refresh token yang dihasilkan menimpa token lama di database
- Session timeout otomatis setelah 15 menit tidak ada aktivitas

---

## Testing

Untuk test di Postman:
1. **Login** → Copy `accessToken` dan `refreshToken`
2. **Buat request** → Tambahkan header `Authorization: Bearer {accessToken}`
3. **Tunggu/Simulasi 15 menit** → Gunakan endpoint refresh-token
4. **Verifikasi** → Access token baru berhasil diperoleh

---

## Pertanyaan yang Sering Diajukan

**Q: Bagaimana jika user menutup browser, apakah perlu login ulang?**
A: Tidak, selama `refreshToken` ada di localStorage, user bisa refresh dengan automatic.

**Q: Bagaimana keamanan token di localStorage?**
A: localStorage rentan terhadap XSS. Untuk production, gunakan httpOnly cookies di refresh token.

**Q: Dapatkah saya ubah durasi expiration?**
A: Ya, ubah nilai `expiresIn` di backend pada login dan refresh-token endpoint.
