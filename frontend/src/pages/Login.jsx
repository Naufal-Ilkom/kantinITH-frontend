import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('pembeli');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/login', {
        username: username,
        password: password
      });

      if (response.data.success) {
        const user = response.data.user;

        if (user.role !== role) {
          alert(`Akun Anda terdaftar sebagai ${user.role}, bukan ${role}.`);
          return;
        }

        localStorage.clear();
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);

        alert('Login Berhasil!');

        // Navigate sesuai role
        if (user.role === 'pembeli') {
          navigate('/pembeli/dashboard');
        } else if (user.role === 'penjual') {
          navigate('/penjual/dashboard');
        } else if (user.role === 'admin') {
          navigate('/admin/pengguna');
        }
      }
    } catch (err) {
      console.error("Detail Error Login:", err);
      if (!err.response) {
        alert("Server backend tidak merespon. Pastikan backend sudah jalan!");
      } else {
        alert(err.response?.data?.message || 'Terjadi kesalahan pada server');
      }
    }
  };

  return (
    <div style={{ 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      height: '100vh', 
      background: '#FDF5E6', 
      fontFamily: '"Plus Jakarta Sans", sans-serif' 
    }}>
      <div style={{ 
        background: 'white', padding: '50px', borderRadius: '35px', 
        boxShadow: '0 25px 50px rgba(255,140,0,0.08)', 
        width: '100%', maxWidth: '450px', textAlign: 'center', border: '1px solid #fff'
      }}>
        
        <div style={{ fontSize: '38px', fontWeight: '800', color: '#333', marginBottom: '5px' }}>
          Kantin<span style={{ color: '#FF8C00' }}>ITH</span>
        </div>
        <p style={{ color: '#888', fontSize: '15px', marginBottom: '35px', fontWeight: '500' }}>
          Silakan masuk ke akun Anda
        </p>

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '14px', color: '#555' }}>Username</label>
            <input 
              type="text" required placeholder="Masukkan username Anda" 
              value={username} onChange={(e) => setUsername(e.target.value)}
              style={{ 
                width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #f0f0f0', 
                boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '15px', transition: '0.3s',
                backgroundColor: '#fafafa'
              }} 
              onFocus={(e) => { e.target.style.borderColor = '#FF8C00'; e.target.style.backgroundColor = 'white'; }}
              onBlur={(e) => { e.target.style.borderColor = '#f0f0f0'; e.target.style.backgroundColor = '#fafafa'; }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '14px', color: '#555' }}>Kata Sandi</label>
            <input 
              type="password" required placeholder="Masukkan kata sandi" 
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={{ 
                width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #f0f0f0', 
                boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '15px', transition: '0.3s',
                backgroundColor: '#fafafa'
              }} 
              onFocus={(e) => { e.target.style.borderColor = '#FF8C00'; e.target.style.backgroundColor = 'white'; }}
              onBlur={(e) => { e.target.style.borderColor = '#f0f0f0'; e.target.style.backgroundColor = '#fafafa'; }}
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '25px' }}>
            <button type="button" onClick={() => navigate('/lupa-password')} style={{ 
              background: 'none', border: 'none', color: '#FF8C00', 
              fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' 
            }}>
              Lupa Password?
            </button>
          </div>

          <div style={{ marginBottom: '35px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '14px', color: '#555' }}>Masuk Sebagai:</label>
            <div style={{ 
              display: 'flex', background: '#f4f5f7', padding: '6px', borderRadius: '16px', gap: '5px' 
            }}>
              {['pembeli', 'penjual', 'admin'].map((r) => (
                <button 
                  key={r}
                  type="button" 
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: '12px 0', border: 'none', borderRadius: '12px', cursor: 'pointer', 
                    fontWeight: '700', fontFamily: 'inherit', fontSize: '14px', transition: '0.3s',
                    background: role === r ? 'white' : 'transparent',
                    color: role === r ? '#FF8C00' : '#888',
                    boxShadow: role === r ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
                    textTransform: 'capitalize'
                  }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" style={{ 
            width: '100%', background: '#FF8C00', color: 'white', padding: '18px', 
            borderRadius: '16px', fontWeight: '800', fontSize: '16px', cursor: 'pointer', 
            border: 'none', fontFamily: 'inherit', boxShadow: '0 10px 25px rgba(255,140,0,0.3)',
            transition: '0.2s'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Masuk Sekarang
          </button>
        </form>

        <div style={{ marginTop: '35px', color: '#888', fontSize: '15px', fontWeight: '500' }}>
          Belum punya akun?{' '}
          <button onClick={() => navigate('/register')} style={{ 
            background: 'none', border: 'none', color: '#FF8C00', 
            fontWeight: '800', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit', padding: 0 
          }}>
            Daftar di sini
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;