import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'purple' | 'primary' | 'muted';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'muted', className = '' }) => {
  const palette: Record<string, React.CSSProperties> = {
    success: { background: 'var(--success-light)', color: 'var(--success)' },
    warning: { background: 'var(--warning-light)', color: 'var(--warning)' },
    danger: { background: 'var(--danger-light)', color: 'var(--danger)' },
    purple: { background: 'var(--purple-light)', color: 'var(--purple)' },
    primary: { background: 'var(--primary-light)', color: 'var(--primary)' },
    muted: { background: 'var(--soft-fill)', color: 'var(--text-muted)' },
  };

  return (
    <span
      className={`badge ${className}`}
      style={{
        ...palette[variant] ,
        borderRadius: 'var(--radius-pill)',
        padding: '3px 10px',
        fontSize: '11px',
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
};
