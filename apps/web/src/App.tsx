import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { fetchMe } from './features/auth/authSlice';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleFormPage from './pages/VehicleFormPage';
import BookingsPage from './pages/BookingsPage';
import BookingDetailPage from './pages/BookingDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import BranchesPage from './pages/BranchesPage';
import DiscountsPage from './pages/DiscountsPage';
import NotificationsPage from './pages/NotificationsPage';
import CustomersPage from './pages/CustomersPage';
import AdminPage from './pages/AdminPage';
import StaffPage from './pages/StaffPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);

  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, [token, dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/new" element={<VehicleFormPage />} />
        <Route path="/vehicles/:id/edit" element={<VehicleFormPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/bookings/:id" element={<BookingDetailPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/branches" element={<BranchesPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/discounts" element={<DiscountsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['provider', 'staff']}>
              <StaffPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['provider', 'staff']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
