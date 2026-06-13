import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';

export default function Layout() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

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
          <NavLink to="/bookings">Bookings</NavLink>
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
