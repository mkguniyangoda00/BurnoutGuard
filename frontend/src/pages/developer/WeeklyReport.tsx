import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
      borderRadius: '10px',
      padding: '16px 12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: 'var(--bg)',
    }}
  >
    <span style={{ fontSize: '20px', fontWeight: 600, color: color }}>{value}</span>
    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
  </div>
);

const WeeklyReport: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch weekly reports
  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports'],
    queryFn: reportService.getAll,
  });

  const generateMutation = useMutation({
    mutationFn: reportService.generate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const reports = data ?? [];
  const latestReport = reports[0]; // Reports are sorted desc

  const handleDownloadPdf = async () => {
    if (!latestReport?.reportId || isDownloading) {
      return;
    }

    setIsDownloading(true);
    try {
      const blob = await reportService.downloadPdf(latestReport.reportId);
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `burnoutguard-report-${latestReport.reportId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
    } finally {
      setIsDownloading(false);
    }
  };

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
          <Button
            variant="primary"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            style={{ padding: '10px 16px', fontSize: '13px' }}
          >
            {generateMutation.isPending ? 'Generating…' : "Generate This Week's Report"}
          </Button>
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

  // ISO 8601 week number
  const getIsoWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  };

  // Get trend points (last 4 weeks max)
  const trendReports = [...reports].slice(0, 4).reverse();
  const points = trendReports.map((r) => {
    const label = `Wk ${getIsoWeek(r.weekStart)}`;
    const value = r.riskScoreAtEndOfWeek ?? 0;
    const color = value < 0.4 ? 'var(--primary)' : value < 0.7 ? 'var(--warning)' : 'var(--danger)';
    return { label, value, color };
  });

  return (
    <PageWrapper>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 600, marginBottom: '6px' }}>
            Week {getIsoWeek(latestReport.weekStart)} Wellness Report
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {formatWeekRange(latestReport.weekStart, latestReport.weekEnd)} · {latestReport.totalCheckIns} check-ins submitted
          </p>
        </div>
        <Button variant="primary" onClick={handleDownloadPdf} disabled={isDownloading} style={{ padding: '10px 18px', fontSize: '13px' }}>{isDownloading ? 'Downloading…' : 'Export PDF'}</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
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
        <Card style={{ marginBottom: '16px', padding: '24px 28px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>
            Risk score trend {points.length > 1 ? `(last ${points.length} weeks)` : ''}
          </h3>

          <div style={{ position: 'relative', marginBottom: '24px', padding: '0 20px' }}>
            <div style={{ height: '140px', width: '100%', display: 'flex' }}>
              {/* Y-axis labels */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: '8px', paddingBottom: '10px' }}>
                {[1, 0.75, 0.5, 0.25, 0].map((tick) => (
                  <span key={tick} style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1 }}>{tick}</span>
                ))}
              </div>
              <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none" style={{ flex: 1 }}>
                {/* Gridlines */}
                {[0, 25, 50, 75, 100].map((tick) => {
                  const y = 120 - (tick / 100) * 100 - 10;
                  return (
                    <line
                      key={tick}
                      x1="0" x2="400" y1={y} y2={y}
                      stroke="var(--border-color)"
                      strokeWidth={tick === 0 ? 1.5 : 1}
                      strokeDasharray={tick === 0 ? undefined : '4 4'}
                    />
                  );
                })}
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
            {/* X-axis week labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', padding: '0 10px' }}>
              {points.map((p, i) => (
                <span key={i} style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.label}</span>
              ))}
            </div>
          </div>

          {points.length === 1 && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '4px', fontStyle: 'italic' }}>
              Not enough history yet to show a trend line — check back after next week's report.
            </p>
          )}

          <p style={{ fontSize: '13px', color: latestReport.overallTrend === 'Worsening' ? 'var(--danger)' : latestReport.overallTrend === 'Improving' ? 'var(--success)' : 'var(--text-muted)', marginTop: '20px' }}>
            {latestReport.overallTrend === 'Worsening'
              ? `↑ Risk is trending upward${points.length > 1 ? ` over ${points.length} weeks` : ' compared to last week'}. Intervention recommended.`
              : latestReport.overallTrend === 'Improving'
              ? `↓ Wellness metrics are improving${points.length > 1 ? ` over ${points.length} weeks` : ' compared to last week'}. Great job!`
              : `→ Wellness metrics are stable compared to last week.`}
          </p>
        </Card>
      )}

      {latestReport.insightSummary && (
        <div style={{ 
          backgroundColor: latestReport.overallTrend === 'Worsening' ? '#FFF9F9' : '#F6FBF9', 
          border: latestReport.overallTrend === 'Worsening' ? '1px solid #FEE2E2' : '1px solid #E6F5EE', 
          borderRadius: '10px', 
          padding: '16px 18px', 
          fontSize: '13px', 
          color: 'var(--text-secondary)',
          lineHeight: 1.6
        }}>
          <span style={{ fontWeight: 600, color: latestReport.overallTrend === 'Worsening' ? 'var(--danger)' : 'var(--success)' }}>
            {latestReport.overallTrend === 'Worsening' ? '⚠️ Weekly summary: ' : '✓ Weekly summary: '}
          </span>
          {latestReport.insightSummary}
        </div>
      )}
    </PageWrapper>
  );
};

export default WeeklyReport;
