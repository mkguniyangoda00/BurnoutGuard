import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { analyticsService } from '../../services/analytics.service';
import { AlertCircle } from 'lucide-react';

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

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    backgroundColor: isActive ? '#0F1117' : 'white',
    color: isActive ? 'white' : 'var(--text-muted)',
    borderRadius: '20px',
    padding: '7px 16px',
    fontSize: '13px',
    border: isActive ? 'none' : '1px solid var(--border)',
    cursor: 'pointer',
  });

  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Wellbeing Trends
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Last 12 weeks · Organisation-wide · Minimum group size: 5</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={tabButtonStyle(activeTab === tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'risk' && (
        <Card style={{ padding: '20px', marginBottom: '20px' }}>
          <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: 'var(--text-muted)' }}>
            <AlertCircle size={28} />
            <span style={{ fontSize: '13px', textAlign: 'center' }}>
              Risk Trend content is not available in this page yet.
            </span>
          </div>
        </Card>
      )}

      {activeTab === 'sleep' && (
        <Card style={{ padding: '20px', marginBottom: '20px' }}>
          <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: 'var(--text-muted)' }}>
            <AlertCircle size={28} />
            <span style={{ fontSize: '13px', textAlign: 'center' }}>
              Sleep &amp; Lifestyle content is not available in this page yet.
            </span>
          </div>
        </Card>
      )}

      {activeTab === 'work' && (
        <Card style={{ padding: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '18px' }}>
            Overtime trend (recent weeks)
          </h2>
          {overtimeLoading ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading...</p>
          ) : overtimeTrend.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3" style={{ color: 'var(--text-muted)' }}>
              <AlertCircle size={24} />
              <span style={{ fontSize: '13px', textAlign: 'center' }}>Not enough data available.</span>
            </div>
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
        </Card>
      )}
    </PageWrapper>
  );
};

export default Trends;
