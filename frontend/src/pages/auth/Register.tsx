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
import { GoogleLogin } from '@react-oauth/google';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { useTranslation } from 'react-i18next';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Developer',
    company: '',
    consentGiven: false,
    researchParticipation: true,
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!formData.consentGiven) {
      setError('Please confirm consent before creating your account.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.register(formData);
      navigate('/login');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed. Please check your details.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
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
      <Card style={{ width: '100%', maxWidth: '400px', padding: 0, overflow: 'hidden' }}>
        {/* ── Dark navy banner (matches dashboard hero card) ── */}
        <div
          style={{
            background: 'var(--navy-gradient)',
            padding: '32px 32px 28px',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'var(--orange)',
            }}
          />
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              color: '#FFFFFF',
              fontSize: '26px',
              marginBottom: '8px',
            }}
          >
            {t('auth.registerTitle')}<span style={{ color: 'var(--orange)' }}>Guard</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>
            {t('auth.registerSubtitle')}
          </p>
        </div>

        {/* ── Form ── */}
        <div style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            <div>
              <label htmlFor="regFullName" style={labelStyle}>{t('auth.fullName')}</label>
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

            <div>
              <label htmlFor="regEmail" style={labelStyle}>{t('auth.email')}</label>
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

            <div>
              <label htmlFor="regPassword" style={labelStyle}>{t('auth.password')}</label>
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

            <div>
              <label htmlFor="regRole" style={labelStyle}>{t('auth.role')}</label>
              <select
                id="regRole"
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="Developer">Developer</option>
                <option value="Manager">Manager</option>
                <option value="HRofficer">HR Officer</option>
                <option value="Admin">Admin</option>
                <option value="ResearchAdmin">Research Admin</option>
              </select>
            </div>

            <div>
              <label htmlFor="regCompany" style={labelStyle}>
                {t('auth.company')} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({t('auth.optional')})</span>
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

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={formData.consentGiven}
                onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
                style={{ marginTop: '3px' }}
              />
              <span>{t('auth.consent')}</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={formData.researchParticipation}
                onChange={(e) => setFormData({ ...formData, researchParticipation: e.target.checked })}
                style={{ marginTop: '3px' }}
              />
              <span>{t('auth.researchOptIn')}</span>
            </label>

            <Button
              variant="primary"
              type="submit"
              disabled={isLoading}
              style={{ marginTop: '8px', padding: '12px', opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? 'Creating Account…' : t('auth.registerButton')}
            </Button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0', gap: '8px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    setIsLoading(true);
                    setError(null);
                    try {
                      const data = await authService.googleLogin(credentialResponse.credential);
                      login(data.user, data.token);
                      navigate('/');
                    } catch (err: any) {
                      const message = err.response?.data?.error || 'Google registration failed. Please try again.';
                      setError(message);
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
                onError={() => {
                  setError('Google Authentication failed.');
                }}
                useOneTap
              />
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
              {t('auth.registerPrompt')} {' '}
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                {t('auth.loginLink')}
              </Link>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default Register;