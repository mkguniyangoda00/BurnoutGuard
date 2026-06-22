import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const MetricChip: React.FC<{ label: string, value: string, color: string }> = ({ label, value, color }) => (
  <div style={{ 
    flex: 1, 
    border: '1px solid var(--border-color)', 
    borderRadius: '14px', 
    padding: '14px 16px', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center',
    gap: '4px'
  }}>
    <span style={{ fontSize: '22px', fontWeight: 600, color: color }}>{value}</span>
    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
  </div>
);

const WeeklyReport: React.FC = () => {
  const points = [
    { label: 'Wk 10', value: 0.35, color: 'var(--primary)' },
    { label: 'Wk 11', value: 0.42, color: 'var(--primary)' },
    { label: 'Wk 12', value: 0.55, color: 'var(--warning)' },
    { label: 'Wk 13', value: 0.62, color: 'var(--danger)' },
  ];

  return (
    <PageWrapper>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Week 13 Wellness Report</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>24 March – 30 March 2026 · 5 check-ins submitted</p>
        </div>
        <Button variant="primary">Export PDF</Button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
        <MetricChip label="Avg stress / 10" value="7.2" color="var(--danger)" />
        <MetricChip label="Avg sleep" value="5.8h" color="var(--warning)" />
        <MetricChip label="Avg mood / 10" value="5.4" color="var(--success)" />
        <MetricChip label="Avg work hours" value="9.8h" color="var(--danger)" />
      </div>

      <Card style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '24px' }}>Risk score trend (last 4 weeks)</h3>
        
        <div style={{ position: 'relative', marginBottom: '24px', padding: '0 20px' }}>
          {/* Constrain the SVG height and remove overflow visible if it's there, adjust viewBox */}
          <div style={{ height: '140px', width: '100%' }}>
            <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none">
              {/* Line */}
              <path 
                d="M 50 85 L 150 75 L 250 55 L 350 45" 
                fill="none" 
                stroke="var(--primary)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {/* Points */}
              {points.map((p, i) => (
                <circle 
                  key={i} 
                  cx={50 + i * 100} 
                  cy={120 - p.value * 120 - 15} 
                  r="4" 
                  fill={p.color} 
                />
              ))}
            </svg>
          </div>
          {/* Labels - positioned below the SVG explicitly */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', padding: '0 10px' }}>
            {points.map((p, i) => (
              <div key={i} style={{ textAlign: 'center', width: '60px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>{p.label}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>
        
        <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '20px' }}>
          ↑ Risk is trending upward over 4 weeks. Intervention recommended.
        </p>
      </Card>

      <div style={{ 
        backgroundColor: '#FFF9F9', 
        border: '1px solid #FEE2E2', 
        borderRadius: '14px', 
        padding: '16px 18px', 
        fontSize: '13px', 
        color: 'var(--text-secondary)',
        lineHeight: 1.6
      }}>
        <span style={{ fontWeight: 'bold', color: 'var(--danger)' }}>⚠ Weekly summary:</span> Your burnout risk increased by 12.7% this week. The primary driver remains inadequate sleep. You completed 5 of 7 check-ins — good consistency. Focus on sleep and work-hour boundaries this coming week.
      </div>
    </PageWrapper>
  );
};

export default WeeklyReport;
