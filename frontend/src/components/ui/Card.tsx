import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', style }) => {
  return (
    <div
      className={`card ${className}`}
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '18px',
        boxShadow: 'var(--shadow-card)',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
