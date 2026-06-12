// frontend/src/hooks/useOrderNotification.js
// Hook ini dipasang di PesananPenjual dan AppLayout untuk polling pesanan baru
import { useEffect, useRef, useCallback } from 'react';

const POLL_INTERVAL = 30000; // 30 detik

// Bunyi notifikasi dibuat dari Web Audio API — tidak perlu file audio eksternal
const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Nada ding-dong simpel
    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(880, now, 0.3);       // Nada tinggi
    playTone(660, now + 0.2, 0.4); // Nada rendah
  } catch (e) {
    // Browser yang tidak support AudioContext — tidak masalah, tidak crash
    console.warn('Audio notification not supported:', e);
  }
};

// Update title tab browser dengan badge angka
const updateTabTitle = (count) => {
  if (count > 0) {
    document.title = `(${count}) Pesanan Baru — KantinITH`;
  } else {
    document.title = 'KantinITH';
  }
};

const useOrderNotification = ({ userId, role, onNewOrder }) => {
  const prevCountRef = useRef(null);
  const intervalRef = useRef(null);

  const checkNewOrders = useCallback(async () => {
    if (role !== 'penjual' || !userId) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/penjual/pesanan', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) return;

      const data = await response.json();
      const pendingOrders = data.filter(p => p.status === 'menunggu');
      const currentCount = pendingOrders.length;

      // Hanya notifikasi jika jumlah pesanan BERTAMBAH
      if (prevCountRef.current !== null && currentCount > prevCountRef.current) {
        const newCount = currentCount - prevCountRef.current;
        
        // 1. Bunyi notifikasi
        playNotificationSound();
        
        // 2. Update title tab
        updateTabTitle(currentCount);
        
        // 3. Callback ke komponen induk untuk update state
        if (onNewOrder) {
          onNewOrder(pendingOrders, newCount);
        }

        // 4. Browser Notification API (jika user sudah izinkan)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🍽️ Pesanan Baru Masuk!', {
            body: `${newCount} pesanan baru menunggu konfirmasi kamu.`,
            icon: '/favicon.ico',
          });
        }
      } else {
        // Update title sesuai jumlah pending saat ini
        updateTabTitle(currentCount);
      }

      prevCountRef.current = currentCount;
    } catch (err) {
      // Gagal fetch — bisa karena token expired, skip saja
    }
  }, [userId, role, onNewOrder]);

  // Minta izin browser notification saat pertama kali
  useEffect(() => {
    if (role === 'penjual' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [role]);

  useEffect(() => {
    if (role !== 'penjual' || !userId) return;

    // Cek langsung saat mount
    checkNewOrders();

    // Polling setiap 30 detik
    intervalRef.current = setInterval(checkNewOrders, POLL_INTERVAL);

    return () => {
      clearInterval(intervalRef.current);
      // Reset title saat komponen unmount
      document.title = 'KantinITH';
    };
  }, [checkNewOrders, role, userId]);

  return null;
};

export default useOrderNotification;