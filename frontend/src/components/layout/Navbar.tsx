import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, User } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Dynamic links based on user role
  const getNavLinks = () => {
    switch (role) {
      case 'manager':
        return [
          { name: 'Team Overview', path: '/manager/dashboard' },
          { name: 'Sprint Risk', path: '/manager/sprint-risk' },
          { name: 'Reports', path: '/manager/reports' },
        ];
      case 'hr':
        return [
          { name: 'Overview', path: '/hr/department-overview' },
          { name: 'Trends', path: '/hr/trends' },
          { name: 'Reports', path: '/hr/reports' },
        ];
      case 'admin':
        return [
          { name: 'Users', path: '/admin/users' },
          { name: 'Audit Logs', path: '/admin/audit-logs' },
          { name: 'Alert Rules', path: '/admin/alerts' },
          { name: 'System', path: '/admin/system' },
        ];
      case 'research_admin':
        return [
          { name: 'Models', path: '/admin/models' },
          { name: 'Datasets', path: '/admin/datasets' },
          { name: 'Fairness', path: '/admin/fairness-report' },
          { name: 'Survey', path: '/admin/survey' },
        ];
      case 'developer':
      default:
        return [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Check-in', path: '/check-in' },
          { name: 'My Risk', path: '/my-risk' },
          { name: 'Recommendations', path: '/recommendations' },
          { name: 'Reports', path: '/reports' },
        ];
    }
  };

  const navLinks = getNavLinks();

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate('/login');
  };

  // If no user is logged in, don't show the navbar
  if (!user) return null;

  // Mock Notification Data
  const notifications = [
    { id: 1, title: 'Weekly report ready', time: '10 mins ago', read: false },
    { id: 2, title: 'Burnout risk elevated', time: '2 hours ago', read: true },
    { id: 3, title: 'Check-in reminder', time: '1 day ago', read: true },
  ];

  const NotificationTrigger = (
    <button style={{
      width: '32px',
      height: '32px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border-color)',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-secondary)'
    }} onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
      <Bell size={18} />
      <span style={{
        position: 'absolute',
        top: '2px',
        right: '2px',
        width: '8px',
        height: '8px',
        backgroundColor: 'var(--danger)',
        borderRadius: '50%',
        border: '2px solid white'
      }} />
    </button>
  );

  const ProfileTrigger = (
    <div 
      className="avatar" 
      onClick={() => setIsProfileOpen(!isProfileOpen)}
    >
      {user.avatarInitials}
    </div>
  );

  return (
    <nav style={{
      height: 'var(--nav-height)',
      backgroundColor: 'var(--background)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ 
          fontFamily: 'var(--font-heading)', 
          fontSize: '18px', 
          color: 'var(--primary)',
          marginRight: '32px'
        }}>
          BurnoutGuard
        </Link>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link 
                key={link.name} 
                to={link.path}
                style={{
                  padding: '6px 12px',
                  borderRadius: '7px',
                  fontSize: '13px',
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Dropdown 
          isOpen={isNotificationsOpen} 
          onClose={() => setIsNotificationsOpen(false)}
          trigger={NotificationTrigger}
          width="320px"
        >
          <div className="dropdown-header">Notifications</div>
          <div>
            {notifications.map(notification => (
              <div key={notification.id} className="dropdown-item" style={{ opacity: notification.read ? 0.7 : 1 }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: notification.read ? 'transparent' : 'var(--primary)' 
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{notification.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{notification.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="dropdown-footer" onClick={() => setIsNotificationsOpen(false)}>Mark all as read</div>
        </Dropdown>
        
        <Dropdown
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          trigger={ProfileTrigger}
          width="200px"
        >
          <div className="dropdown-header">
            {user.name}
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, marginTop: '2px', textTransform: 'capitalize' }}>
              {user.role}
            </div>
          </div>
          <Link to="/profile" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
            <User size={16} /> My Profile
          </Link>
          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
          <div className="dropdown-item" style={{ color: 'var(--danger)' }} onClick={handleLogout}>
            <LogOut size={16} /> Log out
          </div>
        </Dropdown>
      </div>
    </nav>
  );
};

export default Navbar;
