/**
 * Navbar.tsx
 * 
 * The top navigation bar, shown on every protected page.
 * 
 * WHY dynamic nav links:
 * Different roles see completely different navigation items. A Developer
 * has no need to see "User Management", and an HR Officer should not see
 * the "Daily Check-In" form. Building this dynamically from role prevents
 * accidental navigation and keeps the UI clean.
 * 
 * WHY real-time alerts from backend:
 * The bell icon fetches real unread alerts from /api/alerts so developers
 * get live notifications when their burnout risk reaches High/Critical.
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, User } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import client from '../../services/client';
import { Dropdown } from '../ui/Dropdown';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const queryClient = useQueryClient();
  const [openDropdown, setOpenDropdown] = useState<'notifications' | 'profile' | null>(null);

  // ── Fetch real alerts from backend (only for Developers) ─────────────
  // WHY React Query here: It automatically refetches every 60 seconds,
  // keeping the bell badge accurate without manual polling logic.
  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => client.get('/alerts').then(r => r.data),
    enabled: role === 'Developer', // Only developers have personal alerts
    refetchInterval: 60_000, // Auto-refresh every 60 seconds
  });

  const alerts = alertsData?.alerts ?? [];
  const unreadCount = alerts.filter((a: any) => !a.isRead).length;

  // Mutation to mark an alert as read when clicked
  const markReadMutation = useMutation({
    mutationFn: (alertId: string) => client.put(`/alerts/${alertId}/read`),
    onSuccess: () => {
      // Invalidate the query to refetch the alerts list immediately
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  // ── Dynamic navigation links by role ─────────────────────────────────
  // Role values come from the backend UserRole enum (PascalCase)
  const getNavLinks = () => {
    switch (role) {
      case 'Manager':
        return [
          { name: 'Team Overview', path: '/manager/dashboard' },
          { name: 'Sprint Risk', path: '/manager/sprint-risk' },
        ];
      case 'HRofficer':
        return [
          { name: 'Department Overview', path: '/hr/department-overview' },
          { name: 'Trends', path: '/hr/trends' },
        ];
      case 'Admin':
      case 'ResearchAdmin':
        return [
          { name: 'Users', path: '/admin/users' },
          { name: 'Model Metrics', path: '/admin/models' },
          { name: 'Audit Logs', path: '/admin/audit-logs' },
        ];
      case 'Developer':
        default:
          return [
            { name: 'Dashboard', path: '/developer/dashboard' },
            { name: 'Check-in', path: '/developer/check-in' },
            { name: 'My Risk', path: '/developer/my-risk' },
            { name: 'Recommendations', path: '/developer/recommendations' },
            { name: 'Reports', path: '/developer/reports' },
          ];
    }
  };

  const navLinks = getNavLinks();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // BUG 2 FIX: Derive profile path from user role instead of hardcoding.
  // Currently only /developer/profile is registered in App.tsx, so all roles
  // point there. When role-specific profile pages are added, extend this map.
  const getRolePrefix = (): string => {
    switch (role) {
      case 'Manager':     return '/manager';
      case 'HRofficer':  return '/hr';
      case 'Admin':
      case 'ResearchAdmin': return '/admin';
      case 'Developer':
      default:            return '/developer';
    }
  };
  const profilePath = `${getRolePrefix()}/profile`;

  // Don't render the navbar on public pages (login/register)
  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between h-14" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', paddingLeft: '40px', paddingRight: '40px' }}>
      {/* ── Left: Logo + Nav Links ─────────────────────────────────────── */}
      <div className="flex items-center gap-8">
        <Link to="/" style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px', color: 'var(--primary)', fontWeight: 600 }}>
          BurnoutGuard
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className="text-sm font-medium transition-colors"
                style={{
                  padding: '6px 12px',
                  borderRadius: '7px',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Right: Alerts Bell + Profile Avatar ───────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Alert Bell — only shown for Developers */}
        {role === 'Developer' && (
          <Dropdown
            isOpen={openDropdown === 'notifications'}
            onClose={() => setOpenDropdown(null)}
            width="320px"
            trigger={
              <button
                onClick={() => setOpenDropdown((current) => (current === 'notifications' ? null : 'notifications'))}
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100 relative"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>
            }
          >
            <div className="overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)] font-semibold text-sm text-[var(--text-primary)]">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-[var(--danger-light)] text-[var(--danger)] rounded-full text-xs">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] p-4 text-center">No new notifications</p>
                ) : (
                  alerts.slice(0, 5).map((alert: any) => (
                    <div
                      key={alert.alertId}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--surface)] border-b border-[var(--border)] ${
                        alert.isRead ? 'opacity-60' : ''
                      }`}
                      onClick={() => {
                        if (!alert.isRead) markReadMutation.mutate(alert.alertId);
                        setOpenDropdown(null);
                      }}
                    >
                      <div
                        className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                          alert.severity === 'Critical'
                            ? 'bg-red-500'
                            : alert.severity === 'Warning'
                            ? 'bg-yellow-500'
                            : 'bg-blue-400'
                        }`}
                      />
                      <div>
                        <p className="text-sm text-[var(--text-primary)]">{alert.message}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {new Date(alert.sentAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Dropdown>
        )}

        {/* Profile Avatar */}
        <Dropdown
          isOpen={openDropdown === 'profile'}
          onClose={() => setOpenDropdown(null)}
          width="240px"
          trigger={
            <button
              onClick={() => setOpenDropdown((current) => (current === 'profile' ? null : 'profile'))}
              className="flex items-center justify-center hover:opacity-90"
              style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', fontSize: '12px', fontWeight: 600 }}
              aria-label="Profile menu"
            >
              {user.avatarInitials}
            </button>
          }
        >
          <div className="overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{user.fullName}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 capitalize">{user.role}</p>
            </div>
            <Link
              to={profilePath}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface)]"
              onClick={() => setOpenDropdown(null)}
            >
              <User size={14} /> My Profile
            </Link>
            <div className="h-px bg-[var(--border)] mx-3" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[var(--danger)] hover:bg-[var(--danger-light)]"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </Dropdown>
      </div>
    </nav>
  );
};

export default Navbar;
