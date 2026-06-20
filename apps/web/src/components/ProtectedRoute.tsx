import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAppSelector } from '../app/hooks';
import type { Role } from '../types';

interface Props {
  children: ReactNode;
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);

  if (!token) return <Navigate to="/login" replace />;

  // Token present but the profile hasn't hydrated yet — wait before deciding so
  // the role guard can't be bypassed during the fetchMe window. A failed fetchMe
  // clears the token (see authSlice), which re-renders this to the !token branch.
  if (!user) {
    return (
      <div className="muted" style={{ padding: 24 }}>
        Loading…
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
