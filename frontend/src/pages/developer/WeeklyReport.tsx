import React from 'react';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { reportService } from '../../services/report.service';
import { Loader2, Calendar } from 'lucide-react';

const MetricChip: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div
    style={{
      flex: 1,
      border: '1px solid var(--border-color)',
      borderRadius: '14px',
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
    }}
  >
    <span style={{ fontSize: '22px', fontWeight: 600, color: color }}>{value}</span>
    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
  </div>
);

const WeeklyReport: React.FC = () => {
  // Fetch weekly reports
  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports'],
    queryFn: reportService.getAll,
  });

  const reports = data?.reports ?? [];
  const latestReport = reports[0]; // Reports are sorted desc

  if (isLoading) {
    return (
      <PageWrapper>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      </PageWrapper>
    );
  }

  if (isError || reports.length === 0) {
    return (
      <PageWrapper>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Calendar size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>No Wellness Reports Yet</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px' }}>
            Wellness reports are generated weekly. Complete your daily check-in to see your averages and trends here.
          </p>
        </div>
      </PageWrapper>
    );
  }

  // Format dates
  const formatWeekRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
    const yearOptions: Intl.DateTimeFormatOptions = { year: 'numeric' };
    return `${start.toLocaleDateString('en-GB', options)} – ${end.toLocaleDateString('en-GB', options)} ${end.toLocaleDateString('en-GB', yearOptions)}`;
  };

  // Get trend points (last 4 weeks max)
  const trendReports = [...reports].slice(0, 4).reverse();
  const points = trendReports.map((r) => {
    const start = new Date(r.weekStart);
    const label = `Wk ${start.getDate()}/${start.getMonth() + 1}`;
    const value = r.riskScoreAtEndOfWeek ?? 0;
    const color = value < 0.4 ? 'var(--success)' : value < 0.7 ? 'var(--warning)' : 'var(--danger)';
    return { label, value, color };
  });

  return (
    <PageWrapper>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Weekly Wellness Report
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {formatWeekRange(latestReport.weekStart, latestReport.weekEnd)} · {latestReport.totalCheckIns} check-ins submitted
          </p>
        </div>
        <Button variant="primary" onClick={() => window.print()}>Print / Export</Button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
        <MetricChip 
          label="Avg stress / 10" 
          value={latestReport.avgStress.toFixed(1)} 
          color={latestReport.avgStress > 7 ? 'var(--danger)' : latestReport.avgStress > 4 ? 'var(--warning)' : 'var(--success)'} 
        />
        <MetricChip 
          label="Avg sleep" 
          value={`${latestReport.avgSleep.toFixed(1)}h`} 
          color={latestReport.avgSleep < 6 ? 'var(--danger)' : latestReport.avgSleep < 7.5 ? 'var(--warning)' : 'var(--success)'} 
        />
        <MetricChip 
          label="Avg mood / 10" 
          value={latestReport.avgMood.toFixed(1)} 
          color={latestReport.avgMood < 4 ? 'var(--danger)' : latestReport.avgMood < 7 ? 'var(--warning)' : 'var(--success)'} 
        />
        <MetricChip 
          label="Avg work hours" 
          value={`${latestReport.avgWorkHours.toFixed(1)}h`} 
          color={latestReport.avgWorkHours > 9 ? 'var(--danger)' : latestReport.avgWorkHours > 8.5 ? 'var(--warning)' : 'var(--success)'} 
        />
      </div>

      {points.length > 0 && (
        <Card style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '24px' }}>Risk score trend</h3>
          
          <div style={{ position: 'relative', marginBottom: '24px', padding: '0 20px' }}>
            <div style={{ height: '140px', width: '100%' }}>
              <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none">
                {/* Line path */}
                {points.length > 1 && (
                  <path 
                    d={points.map((p, i) => {
                      const x = 50 + (i * (300 / (points.length - 1)));
                      const y = 120 - (p.value * 100) - 10;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none" 
                    stroke="var(--primary)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                )}
                {/* Points */}
                {points.map((p, i) => {
                  const x = points.length > 1 ? 50 + (i * (300 / (points.length - 1))) : 200;
                  const y = 120 - (p.value * 100) - 10;
                  return (
                    <circle 
                      key={i} 
                      cx={x} 
                      cy={y} 
                      r="5" 
                      fill={p.color} 
                    />
                  );
                })}
              </svg>
            </div>
            {/* Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', padding: '0 10px' }}>
              {points.map((p, i) => (
                <div key={i} style={{ textAlign: 'center', width: '60px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>{p.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{(p.value * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
          
          <p style={{ fontSize: '12px', color: latestReport.overallTrend === 'Worsening' ? 'var(--danger)' : latestReport.overallTrend === 'Improving' ? 'var(--success)' : 'var(--text-muted)', marginTop: '20px' }}>
            {latestReport.overallTrend === 'Worsening' 
              ? `↑ Risk is trending upward compared to last week. Intervention recommended.` 
              : latestReport.overallTrend === 'Improving'
              ? `↓ Wellness metrics are improving compared to last week. Great job!`
              : `→ Wellness metrics are stable compared to last week.`}
          </p>
        </Card>
      )}

      {latestReport.insightSummary && (
        <div style={{ 
          backgroundColor: latestReport.overallTrend === 'Worsening' ? '#FFF9F9' : '#F6FBF9', 
          border: latestReport.overallTrend === 'Worsening' ? '1px solid #FEE2E2' : '1px solid #E6F5EE', 
          borderRadius: '14px', 
          padding: '16px 18px', 
          fontSize: '13px', 
          color: 'var(--text-secondary)',
          lineHeight: 1.6
        }}>
          <span style={{ fontWeight: 'bold', color: latestReport.overallTrend === 'Worsening' ? 'var(--danger)' : 'var(--success)' }}>
            {latestReport.overallTrend === 'Worsening' ? '⚠ Weekly summary: ' : '✓ Weekly summary: '}
          </span> 
          {latestReport.insightSummary}
        </div>
      )}
    </PageWrapper>
  );
};

export default WeeklyReport;
