import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '',
  style,
  ...props 
}) => {
  const baseStyle: React.CSSProperties = {
    borderRadius: 'var(--radius-btn)',
    padding: '9px 16px',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'background 0.15s',
  };

  const variantStyle: React.CSSProperties =
    variant === 'secondary' || variant === 'outline'
      ? {
          background: 'white',
          color: 'var(--primary)',
          border: '1px solid var(--primary)',
        }
      : variant === 'ghost'
      ? {
          background: 'transparent',
          color: 'var(--text-muted)',
          border: '1px solid var(--border)',
        }
      : {
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
        };

  return (
    <button
      className={`btn btn-${variant} ${className}`}
      style={{ ...baseStyle, ...variantStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
};
