// frontend/src/pages/hr/Trends.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { analyticsService } from '../../services/analytics.service';

const Trends: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'risk' | 'sleep' | 'work'>('risk');

  const { data: overtimeData, isLoading: overtimeLoading } = useQuery({
    queryKey: ['analytics', 'overtime-patterns'],
    queryFn: analyticsService.getOvertimePatterns,
    enabled: activeTab === 'work',
  });
  const overtimeTrend = Array.isArray(overtimeData) ? overtimeData : [];

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'risk', label: 'Risk Trend' },
    { key: 'sleep', label: 'Sleep & Lifestyle' },
    { key: 'work', label: 'Work Patterns' },
  ];

  return (
    <PageWrapper>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Wellbeing Trends</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Last 12 weeks · Organisation-wide · Minimum group size: 5</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              backgroundColor: activeTab === tab.key ? '#0F1117' : 'white',
              color: activeTab === tab.key ? 'white' : '#7B7E8C',
              borderRadius: '20px', padding: '7px 16px', fontSize: '13px',
              border: activeTab === tab.key ? 'none' : '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'risk' && (
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)', marginBottom: '24px' }}>
          {/* your existing risk trend SVG block — unchanged, just wrapped in this condition */}
        </div>
      )}

      {activeTab === 'sleep' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* your existing "Avg sleep hours trend" + "Avg stress level trend" cards — unchanged, just wrapped */}
        </div>
      )}

      {activeTab === 'work' && (
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Overtime trend (recent weeks)</h2>
          {overtimeLoading ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading...</p>
          ) : overtimeTrend.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Not enough data available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {overtimeTrend.map((row: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{row.week}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.avgOvertimeHours}h avg</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
};

export default Trends;