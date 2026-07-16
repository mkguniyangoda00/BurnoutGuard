import React from 'react';
import Navbar from './Navbar';

interface PageWrapperProps {
  children: React.ReactNode;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface)' }}>
      <Navbar />
      <main style={{ padding: '28px', backgroundColor: 'var(--surface)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: 'var(--surface)' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default PageWrapper;
