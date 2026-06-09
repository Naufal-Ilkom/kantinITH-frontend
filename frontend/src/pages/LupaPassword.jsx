import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LupaPassword = ({ onGoToLogin }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: username, 2: token verification, 3: password baru
  const [username, setUsername] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(900); // 15 menit = 900 detik

  // Timer untuk token expiration
  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // STEP 1: Request token ke email
  const handleSubmitUsername = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setResetToken(''); // Clear token input

    try {
      const response = await axios.post('http://localhost:5000/api/lupa-password', {
        username: username
      });

      if (response.data.success) {
        setSuccessMsg(response.data.message);
        // Pindah ke step 2 (Input Kode)
        setStep(2);
        setTimeLeft(900); // Reset timer
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Username tidak ditemukan atau terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verifikasi token dari email ke Backend (DIPERBAIKI DI SINI)
  const handleSubmitToken = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!resetToken || resetToken.length !== 6 || isNaN(resetToken)) {
      setErrorMsg('Kode verifikasi harus 6 digit angka');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Tanya Backend apakah kodenya benar
      const response = await axios.post('http://localhost:5000/api/verify-reset-token', {
        username: username,
        resetToken: resetToken
      });

      // 2. Jika Backend bilang benar, baru pindah ke step 3
      if (response.data.success) {
        setStep(3);
      }
    } catch (err) {
      // 3. Jika Backend menolak (kode salah/expired), gagalkan dan munculkan pesan error
      setErrorMsg(err.response?.data?.message || 'Kode verifikasi salah atau kadaluarsa');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Reset password dengan token
  const handleSubmitPasswordBaru = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (passwordBaru !== passwordConfirm) {
      setErrorMsg('Kata sandi tidak cocok!');
      return;
    }

    if (passwordBaru.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.put('http://localhost:5000/api/reset-password', {
        username: username,
        resetToken: resetToken,
        passwordBaru: passwordBaru
      });

      if (response.data.success) {
        alert(response.data.message);
        navigate('/login');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal mereset kata sandi');
      setStep(2); // Kembali ke step verifikasi token jika gagal
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      height: '100vh', background: '#f8f9fc', fontFamily: '"Plus Jakarta Sans", sans-serif' 
    }}>
      <div style={{ 
        background: 'white', padding: '50px', borderRadius: '30px', 
        boxShadow: '0 20px 40px rgba(0,0,0,0.05)', width: '100%', 
        maxWidth: '450px', textAlign: 'center', border: '1px solid #eee'
      }}>
        
        {/* LOGO */}
        <div style={{ fontSize: '32px', fontWeight: '800', color: '#333', marginBottom: '10px' }}>
          Kantin<span style={{ color: '#FF8C00' }}>ITH</span>
        </div>

        {/* STEP INDICATOR */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
          {[1, 2, 3].map(num => (
            <div key={num} style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: step >= num ? '#FF8C00' : '#f0f0f0',
              color: step >= num ? 'white' : '#999',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '16px'
            }}>
              {num}
            </div>
          ))}
        </div>

        {/* STEP 1: USERNAME */}
        {step === 1 ? (
          <>
            <h2 style={{ fontSize: '24px', color: '#333', margin: '20px 0 10px 0' }}>🔐 Lupa Kata Sandi?</h2>
            <p style={{ color: '#777', fontSize: '15px', marginBottom: '30px', lineHeight: '1.6' }}>
              Masukkan username Anda. Kami akan mengirim kode verifikasi ke email terdaftar.
            </p>

            {errorMsg && (
              <div style={{ 
                background: '#fee2e2', color: '#c53030', padding: '12px', 
                borderRadius: '8px', marginBottom: '20px', fontSize: '14px' 
              }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitUsername} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '14px', color: '#555' }}>Username</label>
                <input 
                  type="text" required placeholder="Masukkan username Anda" 
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: '14px', 
                    border: '2px solid #f0f0f0', boxSizing: 'border-box', 
                    fontFamily: 'inherit', fontSize: '15px', transition: '0.3s'
                  }} 
                  onFocus={(e) => e.target.style.borderColor = '#FF8C00'}
                  onBlur={(e) => e.target.style.borderColor = '#f0f0f0'}
                />
              </div>

              <button type="submit" disabled={isLoading} style={{ 
                width: '100%', background: isLoading ? '#ccc' : '#FF8C00', color: 'white', padding: '18px', 
                borderRadius: '14px', fontWeight: 'bold', fontSize: '16px', cursor: isLoading ? 'not-allowed' : 'pointer', 
                border: 'none', fontFamily: 'inherit', boxShadow: '0 8px 20px rgba(255,140,0,0.2)'
              }}>
                {isLoading ? 'Memproses...' : 'Minta Kode Verifikasi'}
              </button>
            </form>
          </>
        ) 
        
        // STEP 2: TOKEN VERIFICATION
        : step === 2 ? (
          <>
            <h2 style={{ fontSize: '24px', color: '#333', margin: '20px 0 10px 0' }}>📧 Cek Email Anda</h2>
            <p style={{ color: '#777', fontSize: '15px', marginBottom: '10px', lineHeight: '1.6' }}>
              Kami telah mengirim kode verifikasi 6 digit ke email Anda.
            </p>
            <p style={{ color: '#FF8C00', fontSize: '13px', marginBottom: '30px', fontWeight: '600' }}>
              ⏰ Kode berlaku: {formatTime(timeLeft)}
            </p>

            {errorMsg && (
              <div style={{ 
                background: '#fee2e2', color: '#c53030', padding: '12px', 
                borderRadius: '8px', marginBottom: '20px', fontSize: '14px' 
              }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitToken} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '14px', color: '#555' }}>Kode Verifikasi 6 Digit</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Masukkan 6 digit dari email" 
                  value={resetToken} 
                  onChange={(e) => setResetToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength="6"
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: '14px', 
                    border: '2px solid #f0f0f0', boxSizing: 'border-box', 
                    fontFamily: 'monospace', fontSize: '18px', transition: '0.3s',
                    textAlign: 'center',
                    letterSpacing: '8px',
                    backgroundColor: '#fafafa'
                  }} 
                  onFocus={(e) => { 
                    e.target.style.borderColor = '#FF8C00'; 
                    e.target.style.backgroundColor = 'white';
                  }}
                  onBlur={(e) => { 
                    e.target.style.borderColor = '#f0f0f0'; 
                    e.target.style.backgroundColor = '#fafafa';
                  }}
                />
                <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>Cek folder email masuk atau spam</p>
              </div>

              <button type="submit" disabled={isLoading} style={{ 
                width: '100%', background: isLoading ? '#ccc' : '#FF8C00', color: 'white', padding: '18px', 
                borderRadius: '14px', fontWeight: 'bold', fontSize: '16px', cursor: isLoading ? 'not-allowed' : 'pointer', 
                border: 'none', fontFamily: 'inherit', boxShadow: '0 8px 20px rgba(255,140,0,0.2)'
              }}>
                {isLoading ? 'Mengecek...' : 'Verifikasi Kode'}
              </button>
            </form>

            <button onClick={() => setStep(1)} style={{ 
              marginTop: '20px', background: 'none', border: 'none', color: '#888', fontWeight: '600', 
              fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit'
            }}>
              ← Kembali
            </button>
          </>
        )
        
        // STEP 3: NEW PASSWORD
        : (
          <>
            <h2 style={{ fontSize: '24px', color: '#333', margin: '20px 0 10px 0' }}>🔑 Kata Sandi Baru</h2>
            <p style={{ color: '#777', fontSize: '15px', marginBottom: '30px', lineHeight: '1.6' }}>
              Buat kata sandi baru untuk akun <strong>{username}</strong>
            </p>

            {errorMsg && (
              <div style={{ 
                background: '#fee2e2', color: '#c53030', padding: '12px', 
                borderRadius: '8px', marginBottom: '20px', fontSize: '14px' 
              }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitPasswordBaru} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '14px', color: '#555' }}>Kata Sandi Baru</label>
                <input 
                  type="password" required placeholder="Minimal 6 karakter" 
                  value={passwordBaru} onChange={(e) => setPasswordBaru(e.target.value)}
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: '14px', 
                    border: '2px solid #f0f0f0', boxSizing: 'border-box', 
                    fontFamily: 'inherit', fontSize: '15px', transition: '0.3s'
                  }} 
                  onFocus={(e) => e.target.style.borderColor = '#FF8C00'}
                  onBlur={(e) => e.target.style.borderColor = '#f0f0f0'}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '14px', color: '#555' }}>Konfirmasi Kata Sandi</label>
                <input 
                  type="password" required placeholder="Ulangi kata sandi baru" 
                  value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)}
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: '14px', 
                    border: '2px solid #f0f0f0', boxSizing: 'border-box', 
                    fontFamily: 'inherit', fontSize: '15px', transition: '0.3s'
                  }} 
                  onFocus={(e) => e.target.style.borderColor = '#FF8C00'}
                  onBlur={(e) => e.target.style.borderColor = '#f0f0f0'}
                />
              </div>

              <button type="submit" disabled={isLoading} style={{ 
                width: '100%', background: isLoading ? '#ccc' : '#FF8C00', color: 'white', padding: '18px', 
                borderRadius: '14px', fontWeight: 'bold', fontSize: '16px', cursor: isLoading ? 'not-allowed' : 'pointer', 
                border: 'none', fontFamily: 'inherit', boxShadow: '0 8px 20px rgba(255,140,0,0.2)'
              }}>
                {isLoading ? 'Memproses...' : 'Reset Kata Sandi'}
              </button>
            </form>

            <button onClick={() => setStep(2)} style={{ 
              marginTop: '20px', background: 'none', border: 'none', color: '#888', fontWeight: '600', 
              fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit'
            }}>
              ← Kembali
            </button>
          </>
        )}

        {/* TOMBOL KEMBALI KE LOGIN */}
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
          <button onClick={() => navigate('/login')} style={{ 
            background: 'none', border: 'none', color: '#888', fontWeight: '600', 
            fontSize: '15px', display: 'inline-flex', alignItems: 'center', 
            gap: '8px', cursor: 'pointer', fontFamily: 'inherit'
          }}>
            ← Kembali ke halaman Login
          </button>
        </div>

      </div>
    </div>
  );
};

export default LupaPassword;