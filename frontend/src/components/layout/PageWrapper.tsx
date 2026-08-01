import React, { useMemo, useState } from 'react';
import Navbar from './Navbar';
import ChatWidget from '../chat/ChatWidget';
import { useQuery } from '@tanstack/react-query';
import { resourceService } from '../../services/resource.service';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { HeartHandshake, X } from 'lucide-react';

interface PageWrapperProps {
  children: React.ReactNode;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  const [helpOpen, setHelpOpen] = useState(false);

  const { data: resources } = useQuery({
    queryKey: ['resources', 'counseling-quick-help'],
    queryFn: resourceService.getActive,
  });

  const counselingResources = useMemo(() => {
    const list = Array.isArray(resources) ? resources : [];
    return list.filter((resource: any) => resource.category === 'Counseling').slice(0, 3);
  }, [resources]);

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: 'var(--surface)' }}>
      <ChatWidget />
      <Navbar />
      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        style={{
          position: 'fixed',
          top: '76px',
          right: '20px',
          zIndex: 45,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: '999px',
          border: '1px solid var(--danger)',
          background: 'var(--danger-light)',
          color: 'var(--danger)',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <HeartHandshake size={16} />
        Need help now?
      </button>
      {helpOpen && (
        <Modal>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Immediate support</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Counseling and crisis resources available now</p>
              </div>
              <button type="button" onClick={() => setHelpOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
              {counselingResources.length > 0 ? counselingResources.map((resource: any) => (
                <Card key={resource.resourceId} style={{ padding: '14px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{resource.title}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{resource.description}</p>
                  {resource.contentUrl && (
                    <a href={resource.contentUrl} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                      Open resource
                    </a>
                  )}
                </Card>
              )) : (
                <Card style={{ padding: '14px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No counseling resources are configured yet.</p>
                </Card>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={() => setHelpOpen(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
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