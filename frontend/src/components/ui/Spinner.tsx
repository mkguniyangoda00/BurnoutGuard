import React from 'react';

export const Spinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-spin rounded-full border-2 border-solid ${className}`}
    style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
  />
);

export default Spinner;
