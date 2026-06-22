import React, { useRef, useEffect } from 'react';

/**
 * Reusable Dropdown component
 * Handles click-outside behavior to close the dropdown automatically
 */
interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ 
  isOpen, 
  onClose, 
  trigger, 
  children,
  width = '280px'
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Effect to handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      {/* The element that triggers the dropdown (e.g. Avatar or Bell icon) */}
      <div onClick={(e) => e.stopPropagation()}>
        {trigger}
      </div>

      {/* The actual dropdown content menu */}
      {isOpen && (
        <div className="dropdown-menu" style={{ width }}>
          {children}
        </div>
      )}
    </div>
  );
};
