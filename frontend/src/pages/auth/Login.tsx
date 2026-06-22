import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, type Role } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // State variables for form inputs and error handling
  const [emailAddress, setEmailAddress] = useState<string>('malithi@company.com');
  const [userPassword, setUserPassword] = useState<string>('password123');
  const [authenticationError, setAuthenticationError] = useState<string | null>(null);

  // Handles the submission of the login form
  const handleAuthenticationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticationError(null);

    // Attempt to log in with the provided email
    // In our mock setup, the password doesn't actually matter, but we require it to be filled
    if (!emailAddress || !userPassword) {
      setAuthenticationError('Please enter both email and password.');
      return;
    }

    const isLoginSuccessful = login(emailAddress);
    
    if (isLoginSuccessful) {
      // If successful, the ProtectedRoute in App.tsx will route them to their correct dashboard
      navigate('/');
    } else {
      setAuthenticationError('Invalid email address or password.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface)' }}>
      <Card style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', fontSize: '28px', marginBottom: '8px' }}>BurnoutGuard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Sign in to continue to your dashboard</p>
        </div>

        <form onSubmit={handleAuthenticationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Display authentication errors if any exist */}
          {authenticationError && (
            <div style={{ padding: '10px 12px', backgroundColor: 'var(--danger-light, #fee2e2)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '13px', border: '1px solid var(--danger)' }}>
              {authenticationError}
            </div>
          )}

          <div>
            <label htmlFor="emailInput" style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Email Address
            </label>
            <input 
              id="emailInput"
              type="email" 
              value={emailAddress} 
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="e.g. malithi@company.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--background)',
                fontSize: '14px',
                color: 'var(--text-primary)'
              }}
              required
            />
          </div>

          <div>
            <label htmlFor="passwordInput" style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Password
            </label>
            <input 
              id="passwordInput"
              type="password" 
              value={userPassword} 
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--background)',
                fontSize: '14px',
                color: 'var(--text-primary)'
              }}
              required
            />
          </div>

          <Button variant="primary" style={{ marginTop: '8px', padding: '12px' }}>
            Sign In
          </Button>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 500 }}>Register</Link>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Login;
