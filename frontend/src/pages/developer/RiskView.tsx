import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';

const RiskView: React.FC = () => {
  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>My Burnout Risk</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Detailed breakdown of your risk score over time</p>
      </div>

      <Card style={{ marginBottom: '20px', padding: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Risk Trend (Last 6 Months)</h3>
        <div style={{ height: '220px', position: 'relative', width: '100%' }}>
          <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
            {/* Grid lines */}
            <line x1="0" y1="0" x2="100" y2="0" stroke="var(--border-color)" strokeWidth="0.5" />
            <line x1="0" y1="25" x2="100" y2="25" stroke="var(--border-color)" strokeWidth="0.5" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="var(--border-color)" strokeWidth="0.5" />
            <line x1="0" y1="75" x2="100" y2="75" stroke="var(--border-color)" strokeWidth="0.5" />
            <line x1="0" y1="100" x2="100" y2="100" stroke="var(--border-color)" strokeWidth="0.5" />
            
            {/* Chart line and points */}
            <polyline points="0,80 20,70 40,50 60,30 80,45 100,20" fill="none" stroke="var(--primary)" strokeWidth="2.5" />
            <circle cx="0" cy="80" r="3" fill="var(--primary)" />
            <circle cx="20" cy="70" r="3" fill="var(--primary)" />
            <circle cx="40" cy="50" r="3" fill="var(--primary)" />
            <circle cx="60" cy="30" r="3" fill="var(--warning)" />
            <circle cx="80" cy="45" r="3" fill="var(--success)" />
            <circle cx="100" cy="20" r="3" fill="var(--success)" />
            
            {/* Safe Zone Highlighting */}
            <rect x="0" y="0" width="100" height="30" fill="var(--success)" opacity="0.05" />
          </svg>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ transform: 'translateX(0)' }}>Oct</span>
            <span style={{ transform: 'translateX(-50%)' }}>Nov</span>
            <span style={{ transform: 'translateX(-50%)' }}>Dec</span>
            <span style={{ transform: 'translateX(-50%)' }}>Jan</span>
            <span style={{ transform: 'translateX(-50%)' }}>Feb</span>
            <span style={{ transform: 'translateX(-100%)' }}>Mar</span>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Positive Factors</h3>
          <ul style={{ paddingLeft: '20px', color: 'var(--success)', fontSize: '13px' }}>
            <li>Took 2 days off last month</li>
            <li>Consistent 1:1s with manager</li>
          </ul>
        </Card>
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Risk Areas</h3>
          <ul style={{ paddingLeft: '20px', color: 'var(--danger)', fontSize: '13px' }}>
            <li>Low sleep quality reported</li>
            <li>High working hours (10h/day avg)</li>
          </ul>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default RiskView;
