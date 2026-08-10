import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [helpOpen, setHelpOpen] = useState(false);

  const { data: resources } = useQuery({
    queryKey: ['resources', 'counseling-quick-help'],
    queryFn: resourceService.getActive,
  });

  const counselingResources = useMemo(() => {
    const list = Array.isArray(resources) ? resources : [];

    return list
      .filter((resource: any) => resource.category === 'Counseling')
      .slice(0, 3);
  }, [resources]);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--surface)',
      }}
    >
      <Navbar />

      {/* Help Button */}
      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        style={{
          position: 'fixed',
          top: '66px',
          right: '40px',
          zIndex: 45,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 14px',
          borderRadius: '999px',
          border: '1px solid var(--danger)',
          background: 'var(--bg)',
          color: 'var(--danger)',
          fontSize: '12px',
          fontWeight: 600,
          boxShadow: 'var(--shadow-dropdown)',
        }}
      >
        <HeartHandshake size={15} />
        {t('common.needHelp')}
      </button>

      {/* Help Modal */}
      {helpOpen && (
        <Modal>
          <div style={{ padding: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    marginBottom: '4px',
                  }}
                >
                  {t('common.immediateSupport')}
                </h2>

                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                  }}
                >
                  {t('common.counselingAndCrisisResources')}
                </p>
              </div>

              {/* Close Icon */}
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                aria-label={t('common.close')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Counseling Resources */}
            <div
              style={{
                display: 'grid',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              {counselingResources.length > 0 ? (
                counselingResources.map((resource: any) => (
                  <Card
                    key={resource.resourceId}
                    style={{
                      padding: '14px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        marginBottom: '4px',
                      }}
                    >
                      {resource.title}
                    </h3>

                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        marginBottom: '8px',
                      }}
                    >
                      {resource.description}
                    </p>

                    {resource.contentUrl && (
                      <a
                        href={resource.contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '12px',
                          color: 'var(--primary)',
                          fontWeight: 600,
                        }}
                      >
                        {t('common.openResource')}
                      </a>
                    )}
                  </Card>
                ))
              ) : (
                <Card style={{ padding: '14px' }}>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {t('common.noCounselingResources')}
                  </p>
                </Card>
              )}
            </div>

            {/* Close Button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                variant="primary"
                onClick={() => setHelpOpen(false)}
              >
                {t('common.close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Main Content */}
      <main
        style={{
          width: '100%',
          padding: '32px 40px',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            width: '100%',
            margin: '0 auto',
            backgroundColor: 'var(--surface)',
          }}
        >
          {children}
        </div>
      </main>

      <ChatWidget />
    </div>
  );
};

export default PageWrapper;

