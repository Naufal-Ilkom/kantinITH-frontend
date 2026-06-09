import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import LupaPassword from './pages/LupaPassword.jsx';
import DashboardPenjual from './pages/Penjual/DashboardPenjual.jsx';
import DashboardPembeli from './pages/Pembeli/DashboardPembeli.jsx';
import MenuDetail from './pages/Pembeli/MenuDetail.jsx';
import RiwayatPembeli from './pages/Pembeli/RiwayatPembeli.jsx';
import SaldoPembeli from './pages/Pembeli/SaldoPembeli.jsx';
import LaporanAdmin from './pages/Admin/LaporanAdmin.jsx';
import PenggunaAdmin from './pages/Admin/PenggunaAdmin.jsx';
import TopupAdmin from './pages/Admin/TopupAdmin.jsx';
import TransaksiAdmin from './pages/Admin/TransaksiAdmin.jsx';
import PesananPenjual from './pages/Penjual/PesananPenjual.jsx';
import PendapatanPenjual from './pages/Penjual/PendapatanPenjual.jsx';
import AppLayout from './layouts/AppLayout.jsx';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
};

const pembeliNavigationItems = [
  { label: 'Daftar Menu', path: '/pembeli/dashboard' },
  { label: 'Riwayat', path: '/pembeli/riwayat' },
  { label: 'Saldo', path: '/pembeli/saldo' }
];

const penjualNavigationItems = [
  { label: 'Dashboard', path: '/penjual/dashboard' },
  { label: 'Pesanan', path: '/penjual/pesanan' },
  { label: 'Pendapatan', path: '/penjual/pendapatan' }
];

const adminNavigationItems = [
  { label: 'Pengguna', path: '/admin/pengguna' },
  { label: 'Transaksi', path: '/admin/transaksi' },
  { label: 'Top Up', path: '/admin/topup' },
  { label: 'Laporan', path: '/admin/laporan' }
];

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman Publik */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lupa-password" element={<LupaPassword onGoToLogin={() => <Navigate to="/login" />} />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ===== RUTE PEMBELI ===== */}
        <Route path="/pembeli/dashboard" element={
          <ProtectedRoute allowedRoles={['pembeli']}>
            <AppLayout role="pembeli" navigationItems={pembeliNavigationItems}>
              <DashboardPembeli />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Route Detail Menu — tetap pakai AppLayout pembeli */}
        <Route path="/pembeli/menu/:id" element={
          <ProtectedRoute allowedRoles={['pembeli']}>
            <AppLayout role="pembeli" navigationItems={pembeliNavigationItems}>
              <MenuDetail />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/pembeli/riwayat" element={
          <ProtectedRoute allowedRoles={['pembeli']}>
            <AppLayout role="pembeli" navigationItems={pembeliNavigationItems}>
              <RiwayatPembeli />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/pembeli/saldo" element={
          <ProtectedRoute allowedRoles={['pembeli']}>
            <AppLayout role="pembeli" navigationItems={pembeliNavigationItems}>
              <SaldoPembeli />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* ===== RUTE PENJUAL ===== */}
        <Route path="/penjual/dashboard" element={
          <ProtectedRoute allowedRoles={['penjual']}>
            <AppLayout role="penjual" navigationItems={penjualNavigationItems}>
              <DashboardPenjual />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/penjual/pesanan" element={
          <ProtectedRoute allowedRoles={['penjual']}>
            <AppLayout role="penjual" navigationItems={penjualNavigationItems}>
              <PesananPenjual />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/penjual/pendapatan" element={
          <ProtectedRoute allowedRoles={['penjual']}>
            <AppLayout role="penjual" navigationItems={penjualNavigationItems}>
              <PendapatanPenjual />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* ===== RUTE ADMIN ===== */}
        <Route path="/admin/pengguna" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout role="admin" navigationItems={adminNavigationItems}>
              <PenggunaAdmin />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/transaksi" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout role="admin" navigationItems={adminNavigationItems}>
              <TransaksiAdmin />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/topup" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout role="admin" navigationItems={adminNavigationItems}>
              <TopupAdmin />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/laporan" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout role="admin" navigationItems={adminNavigationItems}>
              <LaporanAdmin />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={<Navigate to="/admin/pengguna" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;