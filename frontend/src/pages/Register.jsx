import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('pembeli');
  const [errorMsg, setErrorMsg] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username || !email || !password) {
      setErrorMsg('Semua field harus diisi!');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMsg('Email tidak valid!');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password minimal 6 karakter!');
      return;
    }
    
    console.log("Data yang dikirim:", { username, email, password, role });

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/register', {
        username: username,
        email: email,
        password: password,
        role: role
      });

      console.log("Respon dari server:", response.data);

      if (response.data.success) {
        alert(`Akun ${role} berhasil dibuat! Silakan login.`);
        navigate('/login');
      }
    } catch (err) {
      console.error("Detail Error Lengkap:", err);

      if (!err.response) {
        alert("Server tidak merespon. Pastikan terminal Backend (Node.js) masih menyala!");
      } else {
        setErrorMsg(err.response.data.message || "Registrasi Gagal, silakan coba lagi.");
      }
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#FDF5E6', fontFamily: '"Plus Jakarta Sans", sans-serif', padding: '40px 20px', boxSizing: 'border-box' }}>
      <div style={{ background: 'white', padding: '50px', borderRadius: '35px', boxShadow: '0 25px 50px rgba(255,140,0,0.08)', width: '100%', maxWidth: '450px', textAlign: 'center', border: '1px solid #fff' }}>
        <div style={{ fontSize: '38px', fontWeight: '800', color: '#333', marginBottom: '5px' }}>
          Kantin<span style={{ color: '#FF8C00' }}>ITH</span>
        </div>
        <p style={{ color: '#888', fontSize: '15px', marginBottom: '35px', fontWeight: '500' }}>
          Buat akun baru untuk memulai
        </p>

        {errorMsg && (
          <div style={{ 
            background: '#fee2e2', color: '#c53030', padding: '12px', 
            borderRadius: '8px', marginBottom: '20px', fontSize: '14px' 
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '14px', color: '#555' }}>Username</label>
            <input 
              type="text" required placeholder="Pilih username Anda" 
              value={username} onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #f0f0f0', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '15px', transition: '0.3s', backgroundColor: '#fafafa' }} 
              onFocus={(e) => { e.target.style.borderColor = '#FF8C00'; e.target.style.backgroundColor = 'white'; }}
              onBlur={(e) => { e.target.style.borderColor = '#f0f0f0'; e.target.style.backgroundColor = '#fafafa'; }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '14px', color: '#555' }}>Email</label>
            <input 
              type="email" required placeholder="Masukkan email yang aktif" 
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #f0f0f0', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '15px', transition: '0.3s', backgroundColor: '#fafafa' }} 
              onFocus={(e) => { e.target.style.borderColor = '#FF8C00'; e.target.style.backgroundColor = 'white'; }}
              onBlur={(e) => { e.target.style.borderColor = '#f0f0f0'; e.target.style.backgroundColor = '#fafafa'; }}
            />
            <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>📧 Email akan digunakan untuk reset password</p>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '14px', color: '#555' }}>Kata Sandi</label>
            <input 
              type="password" required placeholder="Buat kata sandi yang kuat" 
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #f0f0f0', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '15px', transition: '0.3s', backgroundColor: '#fafafa' }} 
              onFocus={(e) => { e.target.style.borderColor = '#FF8C00'; e.target.style.backgroundColor = 'white'; }}
              onBlur={(e) => { e.target.style.borderColor = '#f0f0f0'; e.target.style.backgroundColor = '#fafafa'; }}
            />
          </div>

          <div style={{ marginBottom: '35px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '14px', color: '#555' }}>Daftar Sebagai:</label>
            <div style={{ display: 'flex', background: '#f4f5f7', padding: '6px', borderRadius: '16px', gap: '5px' }}>
              <button type="button" onClick={() => setRole('pembeli')} style={{ flex: 1, padding: '12px 0', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit', fontSize: '14px', transition: '0.3s', background: role === 'pembeli' ? 'white' : 'transparent', color: role === 'pembeli' ? '#FF8C00' : '#888', boxShadow: role === 'pembeli' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}>
                Pembeli
              </button>
              <button type="button" onClick={() => setRole('penjual')} style={{ flex: 1, padding: '12px 0', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit', fontSize: '14px', transition: '0.3s', background: role === 'penjual' ? 'white' : 'transparent', color: role === 'penjual' ? '#FF8C00' : '#888', boxShadow: role === 'penjual' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}>
                Penjual
              </button>
            </div>
          </div>

          <button type="submit" style={{ width: '100%', background: '#FF8C00', color: 'white', padding: '18px', borderRadius: '16px', fontWeight: '800', fontSize: '16px', cursor: 'pointer', border: 'none', fontFamily: 'inherit', boxShadow: '0 10px 25px rgba(255,140,0,0.3)', transition: 'transform 0.2s' }} onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.target.style.transform = 'translateY(0)'} >
            Daftar Sekarang
          </button>
        </form>

        <div style={{ marginTop: '35px', color: '#888', fontSize: '15px', fontWeight: '500' }}>
          Sudah punya akun?{' '}
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#FF8C00', fontWeight: '800', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
            Masuk di sini
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;