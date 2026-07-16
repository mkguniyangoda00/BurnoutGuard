import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const fullName = user?.fullName ?? '';

  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>My Profile</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Manage your personal details and app preferences</p>
      </div>

      <Card style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Personal Information</h2>
        <div style={{ display: 'grid', gap: '16px', maxWidth: '400px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Full Name</label>
            <input type="text" value={fullName} readOnly style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--soft-fill)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Email</label>
            <input type="email" value={user?.email || ''} readOnly style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--soft-fill)' }} />
          </div>
        </div>
        <Button variant="primary" style={{ marginTop: '20px' }}>Save Changes</Button>
      </Card>
      
      <Card>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Notification Preferences</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <input type="checkbox" defaultChecked /> Daily check-in reminders
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <input type="checkbox" defaultChecked /> Weekly risk report emails
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <input type="checkbox" /> High-risk alerts to manager
          </label>
        </div>
      </Card>
    </PageWrapper>
  );
};

export default Profile;
