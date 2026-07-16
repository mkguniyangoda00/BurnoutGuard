/**
 * TeamDashboard.tsx (pages/manager/TeamDashboard.tsx)
 * 
 * The main homepage for Manager-role users.
 * 
 * DATA FLOW:
 * Fetches the team heatmap data from /api/analytics/heatmap
 * This data is anonymised (e.g., "Dev 01") to preserve privacy while still
 * allowing the manager to identify team-wide stress patterns.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { analyticsService } from '../../services/analytics.service';
import { Loader2, AlertCircle } from 'lucide-react';

const TeamDashboard: React.FC = () => {
  // ── Fetch Heatmap Data from Backend ──────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics', 'heatmap'],
    queryFn: analyticsService.getTeamHeatmap,
  });

  const members = Array.isArray(data?.members) ? data.members : [];

  // Calculate aggregated stats for the top cards
  let highRiskCount = 0;
  let moderateRiskCount = 0;
  let lowRiskCount = 0;
  let noDataCount = 0;

  // We look at the most recent week (index 0) for the current snapshot counts
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

  return (
    <PageWrapper>
      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Team Burnout Overview</h1>
        <p className="text-sm text-gray-500">
          Software Engineering Department · All data is anonymised to protect privacy
        </p>
      </div>

      {/* ── Filter Controls (Mocked visually for now) ─────────────── */}
      <div className="flex gap-3 mb-6">
        <select className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none">
          <option>Department: Engineering</option>
        </select>
        <select className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none">
          <option>Work Mode: All</option>
        </select>
        <select className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none">
          <option>Risk Period: This Week</option>
        </select>
      </div>

      {/* ── Summary Stats Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { num: highRiskCount.toString(), label: 'High Risk', color: 'text-red-500' },
          { num: moderateRiskCount.toString(), label: 'Moderate Risk', color: 'text-amber-500' },
          { num: lowRiskCount.toString(), label: 'Low Risk', color: 'text-green-500' },
          { num: noDataCount.toString(), label: 'No Data', color: 'text-gray-400' },
        ].map((chip, idx) => (
          <div key={idx} className="border border-gray-200 rounded-xl p-4 text-center bg-white shadow-sm">
            <div className={`text-3xl font-bold mb-1 ${chip.color}`}>{chip.num}</div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{chip.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main Heatmap View ─────────────────────────────────────── */}
      <div className="border border-gray-200 rounded-xl p-5 bg-white mb-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-800 mb-5">Team Burnout Heatmap (Last 4 Weeks)</h2>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Loader2 className="animate-spin mb-2" size={24} />
            <span className="text-sm">Loading team analytics...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-500">
            <AlertCircle className="mb-2" size={24} />
            <span className="text-sm">Failed to load heatmap data.</span>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">
            No team data available for this department yet.
          </div>
        ) : (
          <div>
            <div className="flex">
              {/* Row Labels (Dev 01, Dev 02) */}
              <div className="w-16 mr-4">
                <div className="h-5 mb-2"></div>
                {members.map((member: any, idx: number) => (
                  <div key={idx} className="h-7 mb-1.5 text-xs text-gray-500 flex items-center justify-end font-medium">
                    {member.label}
                  </div>
                ))}
              </div>

              {/* Grid Columns */}
              <div className="flex-1 flex gap-2">
                {[0, 1, 2, 3].map((weekIndex) => {
                  // We map columns to weeks, assuming member.weeks[weekIndex] exists
                  const label = `Week -${weekIndex}`;
                  return (
                    <div key={weekIndex} className="flex-1">
                      <div className="text-xs text-gray-500 text-center mb-2 h-5 font-medium">{label}</div>
                      {members.map((member: any, mIdx: number) => {
                        const weekData = member.weeks?.[weekIndex];
                        let bgColor = 'bg-gray-100'; // No Data default
                        if (weekData) {
                          if (weekData.riskLevel === 'Low') bgColor = 'bg-green-500';
                          else if (weekData.riskLevel === 'Moderate') bgColor = 'bg-amber-500';
                          else if (weekData.riskLevel === 'High' || weekData.riskLevel === 'Critical') bgColor = 'bg-red-500';
                        }
                        return (
                          <div
                            key={mIdx}
                            className={`h-7 rounded-md mb-1.5 w-full ${bgColor} transition-colors hover:opacity-80`}
                            title={weekData ? `${member.label} Risk: ${weekData.riskLevel}` : 'No Data'}
                          ></div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Heatmap Legend */}
            <div className="flex gap-4 mt-6">
              {[
                { color: 'bg-green-500', label: 'Low Risk' },
                { color: 'bg-amber-500', label: 'Moderate Risk' },
                { color: 'bg-red-500', label: 'High/Critical Risk' },
                { color: 'bg-gray-100', label: 'No Data' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm ${item.color}`}></div>
                  <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </PageWrapper>
  );
};

export default TeamDashboard;
