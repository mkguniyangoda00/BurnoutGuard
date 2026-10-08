import React from 'react';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { analyticsService } from '../../services/analytics.service';
import { Loader2, AlertCircle, CheckCircle2, AlertTriangle, OctagonAlert, Building2, Clock } from 'lucide-react';
import { researchService } from '../../services/research.service';

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

  const { data: factorData, isLoading: factorLoading, isError: factorError } = useQuery({
    queryKey: ['research', 'factors', 'department-overview'],
    queryFn: async () => {
      const [jobRole, workMode] = await Promise.all([
        researchService.getDemographicBreakdown('jobTitle'),
        researchService.getDemographicBreakdown('workModel'),
      ]);
      return { jobRole, workMode };
    },
  });

  const factorRows = [
    { label: 'Job Role', rows: Array.isArray(factorData?.jobRole) ? factorData.jobRole : [] },
    { label: 'Work Mode', rows: Array.isArray(factorData?.workMode) ? factorData.workMode : [] },
  ];

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
              <Card key={idx} style={{ textAlign: 'center', padding: '18px 16px', borderTop: `3px solid ${chip.color}` }}>
                <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px', color: chip.color, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {chip.num}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {chip.label}
                </div>
              </Card>
            ))}
          </div>

          <Card style={{ padding: '24px', marginBottom: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                Burnout Risk Distribution by Department
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Share of each risk level within every department</p>
            </div>

            <div className="flex flex-col gap-3">
              {deptData.map((row: any, idx: number) => {
                const low = Math.round(row.lowPct);
                const mod = Math.round(row.moderatePct);
                const high = Math.round(row.highPct);

                return (
                  <div
                    key={idx}
                    style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px', backgroundColor: 'var(--surface)' }}
                  >
                    <div className="text-sm font-semibold truncate mb-2" style={{ color: 'var(--text-primary)' }} title={row.department}>
                      {row.department}
                    </div>
                    <div className="flex h-5 rounded-full overflow-hidden" style={{ background: 'var(--soft-fill)', border: '1px solid var(--border)' }}>
                      {low > 0 && (
                        <div
                          style={{ width: `${low}%`, background: 'var(--success)', borderRight: mod > 0 || high > 0 ? '2px solid var(--surface)' : undefined }}
                          className="flex items-center justify-center text-[10px] text-white font-bold transition-all"
                          title={`Low Risk: ${low}%`}
                        >
                          {low > 8 ? `${low}%` : ''}
                        </div>
                      )}
                      {mod > 0 && (
                        <div
                          style={{ width: `${mod}%`, background: 'var(--warning)', borderRight: high > 0 ? '2px solid var(--surface)' : undefined }}
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

            <div className="flex gap-6 mt-6 pt-4 justify-center flex-wrap" style={{ borderTop: '1px solid var(--border)' }}>
              {[
                { color: 'var(--success)', label: 'Low Risk', icon: CheckCircle2 },
                { color: 'var(--warning)', label: 'Moderate Risk', icon: AlertTriangle },
                { color: 'var(--danger)', label: 'High/Critical Risk', icon: OctagonAlert },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <item.icon size={14} style={{ color: item.color }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding: '20px', marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Factor Insights
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Compact comparisons for department-scoped job role and work mode patterns
            </p>

            {factorLoading ? (
              <div className="flex items-center justify-center py-8 gap-2" style={{ color: 'var(--text-muted)' }}>
                <Loader2 className="animate-spin" size={20} />
                <span style={{ fontSize: '13px' }}>Loading factor insights...</span>
              </div>
            ) : factorError ? (
              <div className="flex items-center justify-center py-8 gap-2" style={{ color: 'var(--danger)' }}>
                <AlertCircle size={20} />
                <span style={{ fontSize: '13px' }}>Unable to load factor insights.</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {factorRows.map((section) => {
                  const maxValue = Math.max(...section.rows.map((row: any) => row.highRiskPct ?? 0), 1);
                  return (
                    <div key={section.label}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {section.label}
                      </div>
                      <div className="flex flex-col gap-3">
                        {section.rows.map((row: any) => {
                          const totalWidth = Math.max(((row.highRiskPct ?? 0) / maxValue) * 100, 8);
                          return (
                            <div key={row.group} className="flex items-center">
                              <div className="w-32 text-sm font-medium truncate pr-2" style={{ color: 'var(--text-secondary)' }} title={row.group}>
                                {row.group}
                              </div>
                              <div className="flex-1 flex h-4 rounded-full overflow-hidden" style={{ background: 'var(--soft-fill)', border: '1px solid var(--border)' }}>
                                <div
                                  style={{ width: `${totalWidth}%`, background: 'var(--primary)' }}
                                  className="flex items-center justify-center text-[10px] text-white font-bold transition-all"
                                  title={`${row.highRiskPct}% high-risk`}
                                >
                                  {row.highRiskPct > 8 ? `${Math.round(row.highRiskPct)}%` : ''}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card style={{ padding: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <Building2 size={18} style={{ color: 'var(--danger)' }} />
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Highest-Risk Departments
              </h2>
            </div>
            {highRiskRanking.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3" style={{ color: 'var(--text-muted)' }}>
                <AlertCircle size={24} />
                <span style={{ fontSize: '13px' }}>Not enough data available.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {highRiskRanking.map((row: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between"
                    style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', backgroundColor: idx === 0 ? 'var(--danger-light)' : 'var(--surface)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: idx === 0 ? 'var(--danger)' : 'var(--soft-fill)',
                          color: idx === 0 ? 'white' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {row.department}
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--danger)' }}>
                      {row.combinedHighRisk.toFixed(0)}% High/Critical
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <Clock size={18} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Overtime Trend (Recent Weeks)
              </h2>
            </div>
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
              <div className="flex flex-col gap-3">
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
        </>
      )}
    </PageWrapper>
  );
};

export default DepartmentOverview;
