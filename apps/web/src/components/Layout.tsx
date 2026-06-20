import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import { api } from '../lib/api';
import { useT } from '../i18n/useT';

export default function Layout() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t, lang, setLang } = useT();
  const [unread, setUnread] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    function pollUnread() {
      api.get('/notifications').then((res) => {
        if (!cancelled) {
          const meta = res.data.meta as { unread: number } | undefined;
          setUnread(meta?.unread ?? 0);
        }
      }).catch(() => {});
    }

    pollUnread();
    intervalRef.current = setInterval(pollUnread, 60_000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const isProvider = user?.role === 'provider';
  const isProviderOrStaff = user?.role === 'provider' || user?.role === 'staff';

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1 className="brand">Car Rental</h1>
        <nav>
          <NavLink to="/">{t('nav_dashboard')}</NavLink>
          {isProviderOrStaff && (
            <NavLink to="/vehicles">{t('nav_fleet')}</NavLink>
          )}
          {isProviderOrStaff && (
            <NavLink to="/categories">{t('nav_categories')}</NavLink>
          )}
          {isProviderOrStaff && (
            <NavLink to="/branches">{t('nav_branches')}</NavLink>
          )}
          {isProviderOrStaff && (
            <NavLink to="/bookings">{t('nav_bookings')}</NavLink>
          )}
          {isProviderOrStaff && (
            <NavLink to="/customers">{t('nav_customers')}</NavLink>
          )}
          {isProvider && (
            <NavLink to="/discounts">{t('nav_discounts')}</NavLink>
          )}
          <NavLink to="/notifications" className="notif-nav-link">
            {t('nav_notifications')}
            {unread > 0 && (
              <span className="notif-nav-badge">{unread > 99 ? '99+' : unread}</span>
            )}
          </NavLink>
          {isProviderOrStaff && (
            <NavLink to="/staff">{t('nav_staff')}</NavLink>
          )}
          {isProviderOrStaff && (
            <NavLink to="/settings">{t('nav_settings')}</NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin">{t('nav_admin')}</NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <span>{user?.name}</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className="btn-ghost"
              style={{ padding: '4px 10px', fontSize: 12, flex: 1 }}
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              title="Switch language"
            >
              {lang === 'en' ? 'عربي' : 'EN'}
            </button>
          </div>
          <button onClick={handleLogout}>{t('nav_logout')}</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
