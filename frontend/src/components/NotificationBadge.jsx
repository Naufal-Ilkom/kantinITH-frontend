// frontend/src/components/NotificationBadge.jsx
// Komponen badge pesanan baru — ditempel di navbar penjual
import React from 'react';

const NotificationBadge = ({ count }) => {
  if (!count || count <= 0) return null;

  return (
    <div style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Ikon lonceng */}
      <span style={{ fontSize: '22px', cursor: 'default' }}>🔔</span>
      
      {/* Badge angka */}
      <span style={{
        position: 'absolute',
        top: '-6px',
        right: '-8px',
        background: '#ef4444',
        color: 'white',
        fontSize: '11px',
        fontWeight: '800',
        minWidth: '18px',
        height: '18px',
        borderRadius: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 4px',
        border: '2px solid white',
        fontFamily: 'inherit',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        {count > 9 ? '9+' : count}
      </span>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default NotificationBadge;