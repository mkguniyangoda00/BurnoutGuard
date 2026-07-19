import React from 'react';
import Navbar from './Navbar';
import ChatWidget from '../chat/ChatWidget';

interface PageWrapperProps {
  children: React.ReactNode;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: 'var(--surface)' }}>
      <ChatWidget />
      <Navbar />
      <main
        style={{
          width: '100%',
          padding: '32px 40px',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',   // was 900px — this was the main squeeze
            width: '100%',
            margin: '0 auto',
            backgroundColor: 'var(--surface)',
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
};

export default PageWrapper;