import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';

const Survey: React.FC = () => {
  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Survey Management</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Manage organizational surveys and view telemetry data.</p>
      </div>

      <Card>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Active Surveys</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No active surveys at this time.</p>
      </Card>
    </PageWrapper>
  );
};

export default Survey;
