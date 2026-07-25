/**
 * DepartmentOverview.tsx (pages/hr/DepartmentOverview.tsx)
 * 
 * Overview for HR Officer role. Shows risk distribution by department.
 * 
 * DATA FLOW:
 * Fetches data from /api/analytics/department
 * Backend aggregates the latest prediction for all users, grouped by company/department.
 * Only departments with 5+ members are returned to protect anonymity.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { analyticsService } from '../../services/analytics.service';
import { Loader2, AlertCircle } from 'lucide-react';

const DepartmentOverview: React.FC = () => {
  // ── Fetch Department Analytics ───────────────────────────────────────
  const { data: rawData, isLoading, isError } = useQuery({
    queryKey: ['analytics', 'department'],
    queryFn: analyticsService.getDepartmentOverview,
  });

  const deptData = Array.isArray(rawData) ? rawData : [];

  // Calculate overall averages across all valid departments
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

  // Client-side ranking — reuses the same deptData already fetched via
  // getDepartmentOverview(), sorted by combined High+Critical risk share.
  const highRiskRanking = [...deptData]
    .map((d: any) => ({
      department: d.department,
      combinedHighRisk: (d.highPct ?? 0) + (d.criticalPct ?? 0),
    }))
    .sort((a, b) => b.combinedHighRisk - a.combinedHighRisk); 
    
  // Find the department with the highest "high risk" percentage
  const highestRiskDept = deptData.length > 0 
    ? [...deptData].sort((a, b) => b.highPct - a.highPct)[0]
    : null;

  return (
    <PageWrapper>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Organisation Burnout Overview</h1>
        <p className="text-sm text-gray-500">
          All data anonymised and aggregated · Minimum 5 members per group shown
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin mb-4" size={32} />
          <span>Loading department analytics...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-500">
          <AlertCircle className="mb-4" size={32} />
          <span>Failed to load organisation data.</span>
        </div>
      ) : deptData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <p>Not enough data available.</p>
          <p className="text-sm text-gray-400 mt-2">Departments must have at least 5 active users with predictions to be shown.</p>
        </div>
      ) : (
        <>
          {/* ── Summary Stats ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { num: `${totalHigh}%`, label: 'Avg High Risk Rate', color: 'text-red-500' },
              { num: `${totalMod}%`, label: 'Avg Moderate Risk Rate', color: 'text-amber-500' },
              { num: `${totalLow}%`, label: 'Avg Low Risk Rate', color: 'text-green-500' },
              { num: highestRiskDept ? highestRiskDept.department : '—', label: 'Most Stressed Dept', color: 'text-gray-700' },
            ].map((chip, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-4 text-center bg-white shadow-sm">
                <div className={`text-2xl font-bold mb-1 truncate ${chip.color}`}>{chip.num}</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{chip.label}</div>
              </div>
            ))}
          </div>

          {/* ── Risk by Department Bar Chart ──────────────────────────────── */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white mb-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 mb-5">Burnout Risk Distribution by Department</h2>
            
            <div className="flex flex-col gap-4">
              {deptData.map((row: any, idx: number) => {
                // Formatting percentages
                const low = Math.round(row.lowPct);
                const mod = Math.round(row.moderatePct);
                const high = Math.round(row.highPct);

                return (
                  <div key={idx} className="flex items-center">
                    <div className="w-32 text-sm font-medium text-gray-700 truncate pr-2" title={row.department}>
                      {row.department}
                    </div>
                    {/* Stacked Progress Bar */}
                    <div className="flex-1 flex h-4 rounded-full overflow-hidden bg-gray-100 border border-gray-200/50">
                      {low > 0 && (
                        <div 
                          style={{ width: `${low}%` }} 
                          className="bg-green-500 flex items-center justify-center text-[10px] text-white font-bold transition-all"
                          title={`Low Risk: ${low}%`}
                        >
                          {low > 8 ? `${low}%` : ''}
                        </div>
                      )}
                      {mod > 0 && (
                        <div 
                          style={{ width: `${mod}%` }} 
                          className="bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold transition-all"
                          title={`Moderate Risk: ${mod}%`}
                        >
                          {mod > 8 ? `${mod}%` : ''}
                        </div>
                      )}
                      {high > 0 && (
                        <div 
                          style={{ width: `${high}%` }} 
                          className="bg-red-500 flex items-center justify-center text-[10px] text-white font-bold transition-all"
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

            {/* Legend */}
            <div className="flex gap-4 mt-6 pt-4 border-t border-gray-100 justify-center">
              {[
                { color: 'bg-green-500', label: 'Low Risk' },
                { color: 'bg-amber-500', label: 'Moderate Risk' },
                { color: 'bg-red-500', label: 'High/Critical Risk' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm ${item.color}`}></div>
                  <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {/* ── High-Risk Department Ranking ─────────────────────────── */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white mb-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 mb-5">Highest-Risk Departments</h2>
            {highRiskRanking.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Not enough data available.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {highRiskRanking.map((row: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {idx + 1}. {row.department}
                    </span>
                    <span className="text-sm font-semibold text-red-500">
                      {row.combinedHighRisk.toFixed(0)}% High/Critical
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Overtime Patterns ─────────────────────────────────────── */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white mb-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 mb-5">Overtime Trend (Recent Weeks)</h2>
            {overtimeLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                <Loader2 className="animate-spin" size={20} />
                Loading overtime data...
              </div>
            ) : overtimeTrend.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Not enough data available.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {overtimeTrend.map((row: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{row.week}</span>
                    <span className="font-medium text-gray-800">{row.avgOvertimeHours}h avg</span>
                  </div>
                ))}
              </div>
            )}
          </div>
    </PageWrapper>
  );
};

export default DepartmentOverview;
