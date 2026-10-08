import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { analyticsService } from '../../services/analytics.service';
import { AlertCircle, TrendingUp, Moon, Activity, Flame, Clock } from 'lucide-react';

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
  backgroundColor: isActive ? 'var(--primary)' : 'var(--surface)',
  color: isActive ? 'white' : 'var(--text-muted)',
  borderRadius: '20px',
  padding: '7px 16px',
  fontSize: '13px',
  fontWeight: isActive ? 600 : 500,
  border: isActive ? 'none' : '1px solid var(--border)',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
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
    <Card style={{ padding: '24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Risk trend
        </h2>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>Weekly risk-level mix across the organisation</p>
      {riskLoading ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading...</p>
      ) : riskTrend.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3" style={{ color: 'var(--text-muted)' }}>
          <AlertCircle size={24} />
          <span style={{ fontSize: '13px', textAlign: 'center' }}>Not enough data available.</span>
        </div>
      ) : (
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px',
            backgroundColor: 'var(--surface)',
          }}
        >
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
                  strokeDasharray="4 4"
                />
              ))}
              {riskBars.map((bar, index) => {
                const x = 22 + index * 80;
                let currentY = chartHeight - 12;
                return (
                  <g key={bar.week}>
                    <title>{bar.week}</title>
                    {bar.segments.map((segment) => {
                      const y = currentY - segment.height;
                      const rect = segment.height > 0 ? (
                        <rect
                          key={segment.label}
                          x={x}
                          y={y}
                          width="24"
                          height={Math.max(segment.height - 1, 0)}
                          rx="2"
                          fill={segment.color}
                        />
                      ) : null;
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
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            {[
              { label: 'Low', color: 'var(--success)' },
              { label: 'Moderate', color: 'var(--warning)' },
              { label: 'High', color: '#EA580C' },
              { label: 'Critical', color: 'var(--danger)' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color }} />
                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );

  const renderLifestyleTrend = () => (
    <Card style={{ padding: '24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        <Moon size={18} style={{ color: 'var(--success)' }} />
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Sleep & lifestyle trend
        </h2>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>Weekly averages for sleep, exercise, and stress</p>
      {lifestyleLoading ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading...</p>
      ) : lifestyleTrend.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3" style={{ color: 'var(--text-muted)' }}>
          <AlertCircle size={24} />
          <span style={{ fontSize: '13px', textAlign: 'center' }}>Not enough data available.</span>
        </div>
      ) : (
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px',
            backgroundColor: 'var(--surface)',
          }}
        >
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
                  strokeDasharray="4 4"
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
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            {[
              { label: 'Sleep', color: 'var(--success)', icon: Moon },
              { label: 'Exercise', color: 'var(--primary)', icon: Activity },
              { label: 'Stress', color: 'var(--danger)', icon: Flame },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <item.icon size={13} style={{ color: item.color }} />
                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>{item.label}</span>
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
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Clock size={18} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Overtime trend
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>Average overtime hours per week, organisation-wide</p>
          {overtimeLoading ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading...</p>
          ) : overtimeTrend.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3" style={{ color: 'var(--text-muted)' }}>
              <AlertCircle size={24} />
              <span style={{ fontSize: '13px', textAlign: 'center' }}>Not enough data available.</span>
            </div>
          ) : (
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                backgroundColor: 'var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {(() => {
                const maxOvertime = Math.max(...overtimeTrend.map((r: any) => r.avgOvertimeHours ?? 0), 1);
                return overtimeTrend.map((row: any, idx: number) => {
                  const widthPct = Math.max(((row.avgOvertimeHours ?? 0) / maxOvertime) * 100, 4);
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 }}>{row.week}</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '12px' }}>{row.avgOvertimeHours}h avg</span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--soft-fill)', border: '1px solid var(--border)' }}>
                        <div style={{ width: `${widthPct}%`, height: '100%', background: 'var(--primary)', borderRadius: '999px' }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </Card>
      )}
    </PageWrapper>
  );
};

export default Trends;
