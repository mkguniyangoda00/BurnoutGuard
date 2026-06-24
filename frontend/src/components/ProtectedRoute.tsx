import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';

/**
 * ProtectedRoute component that blocks unauthenticated users from accessing internal routes.
 * It also automatically fetches the user's profile on mount to hydrate the Zustand store if they refreshed the page.
 */
export const ProtectedRoute = () => {
  const { isAuthenticated, user, setUser, logout } = useAuthStore();

  useEffect(() => {
    // If we have a token but no user object (e.g. after a page refresh), fetch the user profile
    if (isAuthenticated && !user) {
      authService.getMe()
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          // If token is invalid/expired, the interceptor will clear it, but we can also manually trigger logout here
          logout();
        });
    }
  }, [isAuthenticated, user, setUser, logout]);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the child routes (the dashboard layout)
  return <Outlet />;
};
