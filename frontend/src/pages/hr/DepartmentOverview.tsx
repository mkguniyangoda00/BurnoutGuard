import React from 'react';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { analyticsService } from '../../services/analytics.service';
import { Loader2, AlertCircle } from 'lucide-react';

const DepartmentOverview: React.FC = () => {
  const { data: rawData, isLoading, isError } = useQuery({
    queryKey: ['analytics', 'department'],
    queryFn: analyticsService.getDepartmentOverview,
  });

  const deptData = Array.isArray(rawData) ? rawData : [];

  let totalHigh = 0;
  let totalMod = 0;
  let totalLow = 0;

  if (deptData.length > 0) {
    deptData.forEach((d: any) => {
      totalHigh += d.highPct;
      totalMod += d.moderatePct;
      totalLow += d.lowPct;
    });
    totalHigh = Math.round(totalHigh / deptData.length);
    totalMod = Math.round(totalMod / deptData.length);
    totalLow = Math.round(totalLow / deptData.length);
  }

  const { data: overtimeData, isLoading: overtimeLoading } = useQuery({
    queryKey: ['analytics', 'overtime-patterns'],
    queryFn: analyticsService.getOvertimePatterns,
  });

  const overtimeTrend = Array.isArray(overtimeData) ? overtimeData : [];

  const highRiskRanking = [...deptData]
    .map((d: any) => ({
      department: d.department,
      combinedHighRisk: (d.highPct ?? 0) + (d.criticalPct ?? 0),
    }))
    .sort((a, b) => b.combinedHighRisk - a.combinedHighRisk);

  const highestRiskDept = deptData.length > 0
    ? [...deptData].sort((a, b) => b.highPct - a.highPct)[0]
    : null;

  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Organisation Burnout Overview
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          All data anonymised and aggregated · Minimum 5 members per group shown
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={32} />
          <span style={{ fontSize: '13px' }}>Loading department analytics...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--danger)' }}>
          <AlertCircle size={32} />
          <span style={{ fontSize: '13px' }}>Failed to load organisation data.</span>
        </div>
      ) : deptData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--text-muted)' }}>
          <AlertCircle size={32} />
          <span style={{ fontSize: '13px', textAlign: 'center' }}>Not enough data available.</span>
          <span style={{ fontSize: '13px', textAlign: 'center' }}>Departments must have at least 5 active users with predictions to be shown.</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { num: `${totalHigh}%`, label: 'Avg High Risk Rate', color: 'var(--danger)' },
              { num: `${totalMod}%`, label: 'Avg Moderate Risk Rate', color: 'var(--warning)' },
              { num: `${totalLow}%`, label: 'Avg Low Risk Rate', color: 'var(--success)' },
              { num: highestRiskDept ? highestRiskDept.department : '—', label: 'Most Stressed Dept', color: 'var(--text-primary)' },
            ].map((chip, idx) => (
              <Card key={idx} style={{ textAlign: 'center', padding: '18px 16px' }}>
                <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px', color: chip.color, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {chip.num}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {chip.label}
                </div>
              </Card>
            ))}
          </div>

          <Card style={{ padding: '20px', marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '18px' }}>
              Burnout Risk Distribution by Department
            </h2>

            <div className="flex flex-col gap-4">
              {deptData.map((row: any, idx: number) => {
                const low = Math.round(row.lowPct);
                const mod = Math.round(row.moderatePct);
                const high = Math.round(row.highPct);

                return (
                  <div key={idx} className="flex items-center">
                    <div className="w-32 text-sm font-medium truncate pr-2" style={{ color: 'var(--text-secondary)' }} title={row.department}>
                      {row.department}
                    </div>
                    <div className="flex-1 flex h-4 rounded-full overflow-hidden" style={{ background: 'var(--soft-fill)', border: '1px solid var(--border)' }}>
                      {low > 0 && (
                        <div
                          style={{ width: `${low}%`, background: 'var(--success)' }}
                          className="flex items-center justify-center text-[10px] text-white font-bold transition-all"
                          title={`Low Risk: ${low}%`}
                        >
                          {low > 8 ? `${low}%` : ''}
                        </div>
                      )}
                      {mod > 0 && (
                        <div
                          style={{ width: `${mod}%`, background: 'var(--warning)' }}
                          className="flex items-center justify-center text-[10px] text-white font-bold transition-all"
                          title={`Moderate Risk: ${mod}%`}
                        >
                          {mod > 8 ? `${mod}%` : ''}
                        </div>
                      )}
                      {high > 0 && (
                        <div
                          style={{ width: `${high}%`, background: 'var(--danger)' }}
                          className="flex items-center justify-center text-[10px] text-white font-bold transition-all"
                          title={`High/Critical Risk: ${high}%`}
                        >
                          {high > 8 ? `${high}%` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 mt-6 pt-4 justify-center" style={{ borderTop: '1px solid var(--border)' }}>
              {[
                { color: 'var(--success)', label: 'Low Risk' },
                { color: 'var(--warning)', label: 'Moderate Risk' },
                { color: 'var(--danger)', label: 'High/Critical Risk' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: item.color }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding: '20px', marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '18px' }}>
              Highest-Risk Departments
            </h2>
            {highRiskRanking.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3" style={{ color: 'var(--text-muted)' }}>
                <AlertCircle size={24} />
                <span style={{ fontSize: '13px' }}>Not enough data available.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {highRiskRanking.map((row: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {idx + 1}. {row.department}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--danger)' }}>
                      {row.combinedHighRisk.toFixed(0)}% High/Critical
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card style={{ padding: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '18px' }}>
              Overtime Trend (Recent Weeks)
            </h2>
            {overtimeLoading ? (
              <div className="flex items-center justify-center py-8 gap-2" style={{ color: 'var(--text-muted)' }}>
                <Loader2 className="animate-spin" size={20} />
                <span style={{ fontSize: '13px' }}>Loading overtime data...</span>
              </div>
            ) : overtimeTrend.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3" style={{ color: 'var(--text-muted)' }}>
                <AlertCircle size={24} />
                <span style={{ fontSize: '13px' }}>Not enough data available.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {overtimeTrend.map((row: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{row.week}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>{row.avgOvertimeHours}h avg</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </PageWrapper>
  );
};

export default DepartmentOverview;
