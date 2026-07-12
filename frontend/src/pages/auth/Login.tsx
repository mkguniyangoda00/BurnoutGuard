/**
 * Login.tsx (pages/auth/Login.tsx)
 *
 * Production login page that authenticates users against the real backend.
 *
 * DATA FLOW:
 * 1. User submits email + password
 * 2. authService.login() → POST /api/auth/login
 * 3. Backend validates credentials via bcrypt, returns { user, token }
 * 4. Zustand store saves the JWT token to localStorage
 * 5. ProtectedRoute redirects user to their role-based dashboard
 *
 * STYLING:
 * Uses the project's CSS variable design system defined in styles/index.css
 * (--surface, --primary, --border-color, etc.) with the shared Card and Button
 * UI components for visual consistency with the rest of the application.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  // Form state
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Handles form submission.
   * Calls the real backend /api/auth/login endpoint, then stores the
   * returned JWT token in the Zustand auth store (which persists it
   * to localStorage for session continuity across page refreshes).
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic client-side validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      // Call the real backend API
      const data = await authService.login({ email, password });

      // Store user + JWT in Zustand (persisted to localStorage)
      login(data.user, data.token);

      // Navigate to root — the RoleRouter in App.tsx will redirect
      // to the correct dashboard based on the user's role
      navigate('/');
    } catch (err: any) {
      // Show the backend error message if available, otherwise a generic message
      const message =
        err.response?.data?.message || 'Invalid email or password.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--surface)',
      }}
    >
      <Card style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--primary)',
              fontSize: '28px',
              marginBottom: '8px',
            }}
          >
            BurnoutGuard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Sign in to continue to your dashboard
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {/* Error Banner */}
          {error && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                border: '1px solid var(--danger)',
              }}
            >
              {error}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label
              htmlFor="loginEmail"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '6px',
                color: 'var(--text-secondary)',
              }}
            >
              Email Address
            </label>
            <input
              id="loginEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jane@company.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--background)',
                fontSize: '14px',
                color: 'var(--text-primary)',
              }}
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="loginPassword"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '6px',
                color: 'var(--text-secondary)',
              }}
            >
              Password
            </label>
            <input
              id="loginPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--background)',
                fontSize: '14px',
                color: 'var(--text-primary)',
              }}
              required
            />
          </div>

          {/* Submit Button */}
          <Button
            variant="primary"
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '8px',
              padding: '12px',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Signing in…' : 'Sign In'}
          </Button>

          {/* Register Link */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '16px',
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}
          >
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{ color: 'var(--primary)', fontWeight: 500 }}
            >
              Register
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Login;
