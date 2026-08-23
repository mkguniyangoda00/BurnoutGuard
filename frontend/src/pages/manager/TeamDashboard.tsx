import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { analyticsService } from '../../services/analytics.service';
import { Loader2, AlertCircle } from 'lucide-react';
import TeamWhatIfPanel from '../../components/manager/TeamWhatIfPanel';

const TeamDashboard: React.FC = () => {
  const [workMode, setWorkMode] = useState('All');
  const [riskPeriod, setRiskPeriod] = useState('This Week');
  const [experienceBand, setExperienceBand] = useState('All');
  const [jobTitle, setJobTitle] = useState('All');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics', 'heatmap', workMode, riskPeriod, experienceBand, jobTitle],
    queryFn: () => analyticsService.getTeamHeatmap({ workMode, riskPeriod, experienceBand, jobTitle }),
  });

  const { data: filterOptions } = useQuery({
    queryKey: ['analytics', 'heatmap-filters'],
    queryFn: analyticsService.getHeatmapFilterOptions,
  });
  const jobTitles: string[] = filterOptions?.jobTitles ?? [];

  const members = Array.isArray(data?.members) ? data.members : [];

  let highRiskCount = 0;
  let moderateRiskCount = 0;
  let lowRiskCount = 0;
  let noDataCount = 0;

  const { data: hotspotsData, isLoading: hotspotsLoading } = useQuery({
    queryKey: ['analytics', 'workload-hotspots'],
    queryFn: analyticsService.getWorkloadHotspots,
  });

  const { data: recSummaryData, isLoading: recSummaryLoading } = useQuery({
    queryKey: ['analytics', 'manager-recommendations'],
    queryFn: analyticsService.getManagerRecommendationSummary,
  });

  const { data: shapSummaryData, isLoading: shapSummaryLoading } = useQuery({
    queryKey: ['analytics', 'team-shap-summary', workMode, experienceBand, jobTitle],
    queryFn: () => analyticsService.getTeamShapSummary({ workMode, experienceBand, jobTitle }),
  });

  const hotspots = Array.isArray(hotspotsData) ? hotspotsData : [];
  const recSummary = Array.isArray(recSummaryData) ? recSummaryData : [];
  const shapSummary = shapSummaryData ?? { teamSize: 0, totalDevelopers: 0, riskIncreasing: [], protective: [] };

  members.forEach((member: any) => {
    if (!member.weeks || member.weeks.length === 0) {
      noDataCount++;
      return;
    }
    const latestRisk = member.weeks[0].riskLevel;
    if (latestRisk === 'High' || latestRisk === 'Critical') highRiskCount++;
    else if (latestRisk === 'Moderate') moderateRiskCount++;
    else if (latestRisk === 'Low') lowRiskCount++;
    else noDataCount++;
  });

  const filterSelectStyle: React.CSSProperties = {
    background: 'var(--soft-fill)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-btn)',
    color: 'var(--text-primary)',
    padding: '10px 12px',
    fontSize: '13px',
    outline: 'none',
  };

  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Team Burnout Overview
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Software Engineering Department · All data is anonymised to protect privacy
        </p>
      </div>

      <Card style={{ marginBottom: '20px', padding: '16px' }}>
        <div className="flex gap-3 flex-wrap">
          <select style={filterSelectStyle}>
            <option>Department: Engineering</option>
          </select>
          <select value={workMode} onChange={(e) => setWorkMode(e.target.value)} style={filterSelectStyle}>
            <option value="All">Work Mode: All</option>
            <option value="Remote">Work Mode: Remote</option>
            <option value="Hybrid">Work Mode: Hybrid</option>
            <option value="Onsite">Work Mode: Onsite</option>
          </select>
          <select value={riskPeriod} onChange={(e) => setRiskPeriod(e.target.value)} style={filterSelectStyle}>
            <option value="This Week">Risk Period: This Week</option>
            <option value="Last 4 Weeks">Risk Period: Last 4 Weeks</option>
            <option value="Last 3 Months">Risk Period: Last 3 Months</option>
          </select>
          <select value={experienceBand} onChange={(e) => setExperienceBand(e.target.value)} style={filterSelectStyle}>
            <option value="All">Experience: All</option>
            <option value="Junior (<3y)">Junior (&lt;3y)</option>
            <option value="Senior (3y+)">Senior (3y+)</option>
          </select>
          <select value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} style={filterSelectStyle}>
            <option value="All">Job Title: All</option>
            {jobTitles.map((title) => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { num: highRiskCount.toString(), label: 'High Risk', color: 'var(--danger)' },
          { num: moderateRiskCount.toString(), label: 'Moderate Risk', color: 'var(--warning)' },
          { num: lowRiskCount.toString(), label: 'Low Risk', color: 'var(--success)' },
          { num: noDataCount.toString(), label: 'No Data', color: 'var(--text-muted)' },
        ].map((chip, idx) => (
          <Card key={idx} style={{ textAlign: 'center', padding: '18px 16px' }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: chip.color, marginBottom: '4px', lineHeight: 1 }}>{chip.num}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{chip.label}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '18px' }}>
          Team Burnout Heatmap (Last 4 Weeks)
        </h2>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin mb-2" size={24} />
            <span style={{ fontSize: '13px' }}>Loading team analytics...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--danger)' }}>
            <AlertCircle className="mb-2" size={24} />
            <span style={{ fontSize: '13px' }}>Failed to load heatmap data.</span>
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px' }}>No team data available for this department yet.</span>
          </div>
        ) : (
          <div>
            <div className="flex">
              <div className="w-16 mr-4">
                <div className="h-5 mb-2"></div>
                {members.map((member: any, idx: number) => (
                  <div key={idx} className="h-9 mb-2 text-xs flex items-center justify-end font-medium" style={{ color: 'var(--text-muted)' }}>
                    {member.label}
                  </div>
                ))}
              </div>

              <div className="flex-1 flex gap-2">
                {[0, 1, 2, 3].map((weekIndex) => {
                  const label = `Week -${weekIndex}`;
                  return (
                    <div key={weekIndex} className="flex-1">
                      <div className="text-xs text-center mb-2 h-5 font-medium" style={{ color: 'var(--text-muted)' }}>{label}</div>
                      {members.map((member: any, mIdx: number) => {
                        const weekData = member.weeks?.[weekIndex];
                        let bgColor = 'bg-gray-100';
                        if (weekData) {
                          if (weekData.riskLevel === 'Low') bgColor = 'bg-green-500';
                          else if (weekData.riskLevel === 'Moderate') bgColor = 'bg-amber-500';
                          else if (weekData.riskLevel === 'High' || weekData.riskLevel === 'Critical') bgColor = 'bg-red-500';
                        }
                        return (
                          <div
                            key={mIdx}
                            className={`h-9 rounded-md mb-2 w-full ${bgColor} transition-colors hover:opacity-80`}
                            title={weekData ? `${member.label} Risk: ${weekData.riskLevel}` : 'No Data'}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4 mt-6 flex-wrap">
              {[
                { color: 'bg-green-500', label: 'Low Risk' },
                { color: 'bg-amber-500', label: 'Moderate Risk' },
                { color: 'bg-red-500', label: 'High/Critical Risk' },
                { color: 'bg-gray-100', label: 'No Data' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm ${item.color}`}></div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <TeamWhatIfPanel />

      <Card style={{ padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '18px' }}>
          Workload Hotspots
        </h2>
        {hotspotsLoading ? (
          <div className="flex items-center justify-center py-8 gap-2" style={{ color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={20} />
            <span style={{ fontSize: '13px' }}>Loading workload data...</span>
          </div>
        ) : hotspots.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Not enough data available for this department.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead style={{ borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Department</th>
                <th style={{ padding: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Avg Meetings</th>
                <th style={{ padding: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Avg Urgent Tasks</th>
                <th style={{ padding: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Avg Overtime (hrs)</th>
              </tr>
            </thead>
            <tbody>
              {hotspots.map((row: any, idx: number) => (
                <tr key={idx} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{row.department}</td>
                  <td style={{ padding: '12px 0', fontSize: '13px', color: 'var(--text-muted)' }}>{row.avgMeetingsCount}</td>
                  <td style={{ padding: '12px 0', fontSize: '13px', color: 'var(--text-muted)' }}>{row.avgUrgentTasksCount}</td>
                  <td style={{ padding: '12px 0', fontSize: '13px', color: 'var(--text-muted)' }}>{row.avgOvertimeHours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card style={{ padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Team Risk Factors
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>
          Team-wide SHAP summary for the currently filtered manager view
        </p>

        {shapSummaryLoading ? (
          <div className="flex items-center justify-center py-8 gap-2" style={{ color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={20} />
            <span style={{ fontSize: '13px' }}>Loading team risk factors...</span>
          </div>
        ) : shapSummary.teamSize === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Not enough data available for this team yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ border: '1px solid #FECACA', backgroundColor: '#FEF2F2', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '10px' }}>Risk Increasing</div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {shapSummary.riskIncreasing.length === 0 ? (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No positive team-wide SHAP factors found.</div>
                  ) : (
                    shapSummary.riskIncreasing.map((row: any, idx: number) => (
                      <div key={row.featureName} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{idx + 1}. {row.featureName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.top3Count} of {shapSummary.totalDevelopers} developers in top 3</div>
                        </div>
                        <span className="badge badge-danger">+{row.meanShapValue.toFixed(3)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ border: '1px solid #BBFBBC', backgroundColor: '#F0FDF4', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', marginBottom: '10px' }}>Protective</div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {shapSummary.protective.length === 0 ? (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No protective team-wide SHAP factors found.</div>
                  ) : (
                    shapSummary.protective.map((row: any, idx: number) => (
                      <div key={row.featureName} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{idx + 1}. {row.featureName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.top3Count} of {shapSummary.totalDevelopers} developers in top 3</div>
                        </div>
                        <span className="badge badge-success">{row.meanShapValue.toFixed(3)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card style={{ padding: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '18px' }}>
          Team Recommendation Trends
        </h2>
        {recSummaryLoading ? (
          <div className="flex items-center justify-center py-8 gap-2" style={{ color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={20} />
            <span style={{ fontSize: '13px' }}>Loading recommendation data...</span>
          </div>
        ) : recSummary.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Not enough data available for this department.</p>
        ) : (
          recSummary.map((dept: any, idx: number) => (
            <div key={idx} style={{ marginBottom: idx === recSummary.length - 1 ? 0 : '18px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '8px' }}>
                {dept.department} · {dept.teamSize} developers
              </p>
              <div className="flex flex-col gap-2">
                {dept.categories.map((cat: any, cidx: number) => (
                  <div key={cidx} className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--text-primary)' }}>{cat.category}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {cat.affectedUserCount} of {dept.teamSize} developers · {cat.activeCount} active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </Card>
    </PageWrapper>
  );
};

export default TeamDashboard;
