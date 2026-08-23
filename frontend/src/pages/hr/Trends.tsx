import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { analyticsService } from '../../services/analytics.service';
import { AlertCircle } from 'lucide-react';

type OrgRiskRow = {
  week: string;
  Low: number;
  Moderate: number;
  High: number;
  Critical: number;
};

type OrgLifestyleRow = {
  week: string;
  avgSleepHours: number;
  avgExerciseLevel: number;
  avgStressLevel: number;
};

const tabs: Array<{ key: 'risk' | 'sleep' | 'work'; label: string }> = [
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

const Trends: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'risk' | 'sleep' | 'work'>('risk');

  const { data: riskData, isLoading: riskLoading } = useQuery({
    queryKey: ['analytics', 'org-risk-trend'],
    queryFn: analyticsService.getOrgRiskTrend,
    enabled: activeTab === 'risk',
  });

  const { data: lifestyleData, isLoading: lifestyleLoading } = useQuery({
    queryKey: ['analytics', 'org-lifestyle-trend'],
    queryFn: analyticsService.getOrgLifestyleTrend,
    enabled: activeTab === 'sleep',
  });

  const { data: overtimeData, isLoading: overtimeLoading } = useQuery({
    queryKey: ['analytics', 'overtime-patterns'],
    queryFn: analyticsService.getOvertimePatterns,
    enabled: activeTab === 'work',
  });

  const riskTrend: OrgRiskRow[] = Array.isArray(riskData) ? riskData : [];
  const lifestyleTrend: OrgLifestyleRow[] = Array.isArray(lifestyleData) ? lifestyleData : [];
  const overtimeTrend = Array.isArray(overtimeData) ? overtimeData : [];

  const maxLifestyleValue = Math.max(
    1,
    ...lifestyleTrend.map((row) => Math.max(row.avgSleepHours, row.avgExerciseLevel, row.avgStressLevel))
  );

  const chartWidth = 420;
  const chartHeight = 140;

  const riskBars = useMemo(() => {
    return riskTrend.map((row) => {
      const total = row.Low + row.Moderate + row.High + row.Critical || 1;
      return {
        week: row.week,
        segments: [
          { label: 'Low', value: row.Low, color: 'var(--success)' },
          { label: 'Moderate', value: row.Moderate, color: 'var(--warning)' },
          { label: 'High', value: row.High, color: '#EA580C' },
          { label: 'Critical', value: row.Critical, color: 'var(--danger)' },
        ].map((segment) => ({
          ...segment,
          height: (segment.value / total) * (chartHeight - 18),
        })),
      };
    });
  }, [riskTrend]);

  const lifestyleSeries = useMemo(() => {
    const makePoints = (values: number[]) =>
      values.map((value, index) => {
        const x = riskTrend.length <= 1 ? chartWidth / 2 : 20 + (index * (chartWidth - 40)) / (riskTrend.length - 1);
        const y = chartHeight - 12 - (value / maxLifestyleValue) * (chartHeight - 24);
        return { x, y, value };
      });

    return {
      sleep: makePoints(lifestyleTrend.map((row) => row.avgSleepHours)),
      exercise: makePoints(lifestyleTrend.map((row) => row.avgExerciseLevel)),
      stress: makePoints(lifestyleTrend.map((row) => row.avgStressLevel)),
    };
  }, [chartWidth, chartHeight, lifestyleTrend, maxLifestyleValue, riskTrend.length]);

  const renderRiskTrend = () => (
    <Card style={{ padding: '20px', marginBottom: '20px' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '18px' }}>
        Risk trend
      </h2>
      {riskLoading ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading...</p>
      ) : riskTrend.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3" style={{ color: 'var(--text-muted)' }}>
          <AlertCircle size={24} />
          <span style={{ fontSize: '13px', textAlign: 'center' }}>Not enough data available.</span>
        </div>
      ) : (
        <div>
          <div style={{ overflowX: 'auto' }}>
            <svg width={Math.max(riskTrend.length * 80, chartWidth)} height={chartHeight} viewBox={`0 0 ${Math.max(riskTrend.length * 80, chartWidth)} ${chartHeight}`} preserveAspectRatio="none">
              {[0.25, 0.5, 0.75].map((ratio) => (
                <line
                  key={ratio}
                  x1="0"
                  x2={Math.max(riskTrend.length * 80, chartWidth)}
                  y1={chartHeight - 12 - ratio * (chartHeight - 24)}
                  y2={chartHeight - 12 - ratio * (chartHeight - 24)}
                  stroke="var(--border)"
                />
              ))}
              {riskBars.map((bar, index) => {
                const x = 22 + index * 80;
                let currentY = chartHeight - 12;
                return (
                  <g key={bar.week}>
                    {bar.segments.map((segment) => {
                      const y = currentY - segment.height;
                      const rect = <rect key={segment.label} x={x} y={y} width="24" height={segment.height} fill={segment.color} />;
                      currentY = y;
                      return rect;
                    })}
                    <text x={x + 12} y={chartHeight - 2} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
                      {index + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '8px' }}>
            {[
              { label: 'Low', color: 'var(--success)' },
              { label: 'Moderate', color: 'var(--warning)' },
              { label: 'High', color: '#EA580C' },
              { label: 'Critical', color: 'var(--danger)' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );

  const renderLifestyleTrend = () => (
    <Card style={{ padding: '20px', marginBottom: '20px' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '18px' }}>
        Sleep & lifestyle trend
      </h2>
      {lifestyleLoading ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading...</p>
      ) : lifestyleTrend.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3" style={{ color: 'var(--text-muted)' }}>
          <AlertCircle size={24} />
          <span style={{ fontSize: '13px', textAlign: 'center' }}>Not enough data available.</span>
        </div>
      ) : (
        <div>
          <div style={{ overflowX: 'auto' }}>
            <svg width={Math.max(lifestyleTrend.length * 80, chartWidth)} height={chartHeight} viewBox={`0 0 ${Math.max(lifestyleTrend.length * 80, chartWidth)} ${chartHeight}`} preserveAspectRatio="none">
              {[0.25, 0.5, 0.75].map((ratio) => (
                <line
                  key={ratio}
                  x1="0"
                  x2={Math.max(lifestyleTrend.length * 80, chartWidth)}
                  y1={chartHeight - 12 - ratio * (chartHeight - 24)}
                  y2={chartHeight - 12 - ratio * (chartHeight - 24)}
                  stroke="var(--border)"
                />
              ))}

              {([
                ['sleep', 'var(--success)'],
                ['exercise', 'var(--primary)'],
                ['stress', 'var(--danger)'],
              ] as const).map(([key, color]) => {
                const points = lifestyleSeries[key];
                const path = points
                  .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
                  .join(' ');
                return (
                  <g key={key}>
                    <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {points.map((point, index) => (
                      <circle key={`${key}-${index}`} cx={point.x} cy={point.y} r="4" fill={color} />
                    ))}
                  </g>
                );
              })}

              {lifestyleTrend.map((row, index) => (
                <text key={row.week} x={22 + index * 80} y={chartHeight - 2} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
                  {index + 1}
                </text>
              ))}
            </svg>
          </div>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '8px' }}>
            {[
              { label: 'Sleep', color: 'var(--success)' },
              { label: 'Exercise', color: 'var(--primary)' },
              { label: 'Stress', color: 'var(--danger)' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );

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
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={tabButtonStyle(activeTab === tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'risk' && renderRiskTrend()}
      {activeTab === 'sleep' && renderLifestyleTrend()}

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
