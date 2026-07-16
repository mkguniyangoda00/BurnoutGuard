import React from 'react';

interface ModalProps {
  children: React.ReactNode;
  open?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ children, open = true, className = '' }) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,17,23,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 50,
      }}
    >
      <div
        className={className}
        style={{
          background: 'var(--bg)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-dropdown)',
          width: '100%',
          maxWidth: '480px',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
