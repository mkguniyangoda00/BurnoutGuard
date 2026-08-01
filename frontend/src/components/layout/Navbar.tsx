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
import { Bell, LogOut, Languages, Moon, Sun, User } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import client from '../../services/client';
import { Dropdown } from '../ui/Dropdown';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [openDropdown, setOpenDropdown] = useState<'notifications' | 'profile' | 'language' | null>(null);

  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => client.get('/alerts').then((response) => response.data),
    enabled: !!user,
    refetchInterval: 20_000,
  });

  const alerts = alertsData?.alerts ?? [];
  const unreadCount = alerts.filter((alert: any) => !alert.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: (alertId: string) => client.put(`/alerts/${alertId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const navLinks = (() => {
    switch (role) {
      case 'Manager':
        return [
          { name: t('navbar.teamOverview'), path: '/manager/dashboard' },
          { name: t('navbar.sprintRisk'), path: '/manager/sprint-risk' },
          { name: t('navbar.wellnessResources'), path: '/wellness-resources' },
        ];
      case 'HRofficer':
        return [
          { name: t('navbar.departmentOverview'), path: '/hr/department-overview' },
          { name: t('navbar.trends'), path: '/hr/trends' },
          { name: t('navbar.wellnessResources'), path: '/wellness-resources' },
        ];
      case 'Admin':
      case 'ResearchAdmin':
        return [
          { name: t('navbar.users'), path: '/admin/users' },
          { name: t('navbar.modelMetrics'), path: '/admin/models' },
          { name: t('navbar.auditLogs'), path: '/admin/audit-logs' },
        ];
      case 'Developer':
      default:
        return [
          { name: t('navbar.dashboard'), path: '/developer/dashboard' },
          { name: t('navbar.checkIn'), path: '/developer/check-in' },
          { name: t('navbar.myRisk'), path: '/developer/my-risk' },
          { name: t('navbar.recommendations'), path: '/developer/recommendations' },
          { name: t('navbar.reports'), path: '/developer/reports' },
          { name: t('navbar.journal'), path: '/developer/journal' },
          { name: t('navbar.wellnessResources'), path: '/wellness-resources' },
        ];
    }
  })();

  const profilePath = (() => {
    switch (role) {
      case 'Manager':
        return '/manager/profile';
      case 'HRofficer':
        return '/hr/profile';
      case 'Admin':
      case 'ResearchAdmin':
        return '/admin/profile';
      case 'Developer':
      default:
        return '/developer/profile';
    }
  })();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between h-14"
      style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', paddingLeft: '40px', paddingRight: '40px' }}
    >
      <div className="flex items-center gap-8">
        <Link to="/" style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px', color: 'var(--primary)', fontWeight: 600 }}>
          BurnoutGuard
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
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

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
          aria-label="Toggle dark mode"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

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
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
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
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--surface)] border-b border-[var(--border)] ${alert.isRead ? 'opacity-60' : ''}`}
                    onClick={() => {
                      if (!alert.isRead) markReadMutation.mutate(alert.alertId);
                      setOpenDropdown(null);
                    }}
                  >
                    <div
                      className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        alert.severity === 'Critical' ? 'bg-red-500' : alert.severity === 'Warning' ? 'bg-yellow-500' : 'bg-blue-400'
                      }`}
                    />
                    <div>
                      <p className="text-sm text-[var(--text-primary)]">{alert.message}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{new Date(alert.sentAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Dropdown>

        <Dropdown
          isOpen={openDropdown === 'language'}
          onClose={() => setOpenDropdown(null)}
          width="180px"
          trigger={
            <button
              onClick={() => setOpenDropdown((current) => (current === 'language' ? null : 'language'))}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
              aria-label={t('navbar.language')}
              title={t('navbar.language')}
            >
              <Languages size={18} />
            </button>
          }
        >
          <div className="overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] font-semibold text-sm text-[var(--text-primary)]">
              {t('navbar.language')}
            </div>
            {[
              { code: 'en', label: 'English' },
              { code: 'si', label: 'සිංහල' },
              { code: 'ta', label: 'தமிழ்' },
            ].map((language) => (
              <button
                key={language.code}
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--surface)]"
                style={{ color: i18n.language === language.code ? 'var(--primary)' : 'var(--text-secondary)' }}
                onClick={() => {
                  i18n.changeLanguage(language.code);
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem('bg_language', language.code);
                  }
                  setOpenDropdown(null);
                }}
              >
                {language.label}
              </button>
            ))}
          </div>
        </Dropdown>

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
              <User size={14} /> {t('navbar.myProfile')}
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
