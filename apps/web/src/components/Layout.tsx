import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import { api } from '../lib/api';

export default function Layout() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
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

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1 className="brand">Car Rental</h1>
        <nav>
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/vehicles">Fleet</NavLink>
          <NavLink to="/categories">Categories</NavLink>
          <NavLink to="/branches">Branches</NavLink>
          <NavLink to="/bookings">Bookings</NavLink>
          <NavLink to="/customers">Customers</NavLink>
          <NavLink to="/discounts">Discounts</NavLink>
          <NavLink to="/notifications" className="notif-nav-link">
            Notifications
            {unread > 0 && (
              <span className="notif-nav-badge">{unread > 99 ? '99+' : unread}</span>
            )}
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <span>{user?.name}</span>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
