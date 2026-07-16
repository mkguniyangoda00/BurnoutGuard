import React from 'react';

interface ScaleInputProps {
  label: string;
  value?: number;
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const ScaleInput: React.FC<ScaleInputProps> = ({ label, active = false, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      background: active ? 'var(--primary)' : 'var(--soft-fill)',
      border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
      color: active ? 'white' : 'var(--text-muted)',
      borderRadius: '6px',
      padding: '8px 10px',
      fontWeight: active ? 500 : 400,
      fontSize: '12px',
      minWidth: '36px',
    }}
  >
    {children ?? label}
  </button>
);

export default ScaleInput;
