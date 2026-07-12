/**
 * Register.tsx (pages/auth/Register.tsx)
 *
 * Production registration page that creates new users via the backend API.
 *
 * DATA FLOW:
 * 1. User fills in fullName, email, password, role, and optionally company
 * 2. authService.register() → POST /api/auth/register
 * 3. Backend validates via Zod, hashes password with bcrypt, creates User
 *    (and DeveloperProfile if role is Developer) in the database
 * 4. On success, user is redirected to /login to sign in with their new account
 *
 * VALIDATION:
 * The backend AuthValidator.ts enforces:
 *   - email: valid email format
 *   - password: minimum 8 characters
 *   - fullName: minimum 2 characters
 *   - role: must be one of the UserRole enum values
 *   - company: optional string
 *
 * STYLING:
 * Uses the project's CSS variable design system defined in styles/index.css
 * with the shared Card and Button UI components for visual consistency.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth.service';

const Register: React.FC = () => {
  const navigate = useNavigate();

  // Form state — fields match the backend RegisterDto schema exactly
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Developer',
    company: '',
  });

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Generic input change handler.
   * Works for both <input> and <select> elements because the name
   * attribute on each field matches the key in formData.
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * Handles form submission.
   * Calls the real backend POST /api/auth/register endpoint.
   * On success, redirects to /login so the user can sign in.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.register(formData);

      // Registration successful — redirect to login
      navigate('/login');
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Registration failed. Please check your details.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Shared input style to keep the JSX clean
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--background)',
    fontSize: '14px',
    color: 'var(--text-primary)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '6px',
    color: 'var(--text-secondary)',
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
            Join BurnoutGuard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Create an account to start tracking
          </p>
        </div>

        {/* Registration Form */}
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

          {/* Full Name */}
          <div>
            <label htmlFor="regFullName" style={labelStyle}>
              Full Name
            </label>
            <input
              id="regFullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Jane Doe"
              style={inputStyle}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="regEmail" style={labelStyle}>
              Email Address
            </label>
            <input
              id="regEmail"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jane@company.com"
              style={inputStyle}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="regPassword" style={labelStyle}>
              Password
            </label>
            <input
              id="regPassword"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              style={inputStyle}
              required
            />
          </div>

          {/* Role Selector */}
          <div>
            <label htmlFor="regRole" style={labelStyle}>
              Role
            </label>
            <select
              id="regRole"
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                ...inputStyle,
                cursor: 'pointer',
              }}
            >
              <option value="Developer">Developer</option>
              <option value="Manager">Manager</option>
              <option value="HRofficer">HR Officer</option>
              <option value="Admin">Admin</option>
              <option value="ResearchAdmin">Research Admin</option>
            </select>
          </div>

          {/* Company (optional) */}
          <div>
            <label htmlFor="regCompany" style={labelStyle}>
              Company{' '}
              <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
                (optional)
              </span>
            </label>
            <input
              id="regCompany"
              name="company"
              type="text"
              value={formData.company}
              onChange={handleChange}
              placeholder="e.g. Acme Corp"
              style={inputStyle}
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
            {isLoading ? 'Creating Account…' : 'Create Account'}
          </Button>

          {/* Login Link */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '16px',
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}
          >
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: 'var(--primary)', fontWeight: 500 }}
            >
              Sign In
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Register;
