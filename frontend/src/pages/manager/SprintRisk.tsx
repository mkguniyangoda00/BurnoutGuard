/**
 * SprintRisk.tsx (pages/manager/SprintRisk.tsx)
 * 
 * Manager view showing risk trends over sprints/weeks.
 * 
 * DATA FLOW:
 * Fetches from /api/analytics/sprint.
 * Backend groups historical predictions by week and counts the number
 * of High, Moderate, and Low risk occurrences.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { analyticsService } from '../../services/analytics.service';
import { Loader2, AlertCircle } from 'lucide-react';

const SprintRisk: React.FC = () => {
  // ── Fetch Sprint Analytics ───────────────────────────────────────────
  const { data: rawData, isLoading, isError } = useQuery({
    queryKey: ['analytics', 'sprint'],
    queryFn: analyticsService.getSprintRisk,
  });

  // The backend returns an array of objects: { week: string, highCount: number, moderateCount: number, lowCount: number }
  // We reverse it so the oldest week is on the left of the chart, newest on the right.
  const sprintData = rawData ? [...rawData].reverse() : [];

  return (
    <PageWrapper>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Sprint Risk Analysis</h1>
          <p className="text-sm text-gray-500">
            Historical trend of burnout risk levels across recent weeks.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white border border-gray-200 rounded-xl">
          <Loader2 className="animate-spin mb-4" size={32} />
          <span>Loading sprint analytics...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-500 bg-white border border-gray-200 rounded-xl">
          <AlertCircle className="mb-4" size={32} />
          <span>Failed to load sprint data.</span>
        </div>
      ) : sprintData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white border border-gray-200 rounded-xl">
          <p>Not enough historical data available.</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl p-5 bg-white mb-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-6">Burnout Risk Trend (Weekly)</h2>
          
          <div className="flex flex-col gap-6">
            {sprintData.map((weekData: any, idx: number) => {
              const total = weekData.highCount + weekData.moderateCount + weekData.lowCount;
              // Avoid division by zero
              const highPct = total > 0 ? (weekData.highCount / total) * 100 : 0;
              const modPct = total > 0 ? (weekData.moderateCount / total) * 100 : 0;
              const lowPct = total > 0 ? (weekData.lowCount / total) * 100 : 0;

              return (
                <div key={idx}>
                  <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                    <span>{weekData.week}</span>
                    <span>Total Predictions: {total}</span>
                  </div>
                  {total === 0 ? (
                    <div className="w-full h-6 bg-gray-50 border border-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400">
                      No data this week
                    </div>
                  ) : (
                    <div className="flex w-full h-6 rounded-md overflow-hidden bg-gray-100">
                      {lowPct > 0 && (
                        <div 
                          style={{ width: `${lowPct}%` }} 
                          className="bg-green-500 flex items-center justify-center text-[10px] text-white font-bold"
                          title={`Low Risk: ${weekData.lowCount}`}
                        >
                          {lowPct > 10 ? weekData.lowCount : ''}
                        </div>
                      )}
                      {modPct > 0 && (
                        <div 
                          style={{ width: `${modPct}%` }} 
                          className="bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold"
                          title={`Moderate Risk: ${weekData.moderateCount}`}
                        >
                          {modPct > 10 ? weekData.moderateCount : ''}
                        </div>
                      )}
                      {highPct > 0 && (
                        <div 
                          style={{ width: `${highPct}%` }} 
                          className="bg-red-500 flex items-center justify-center text-[10px] text-white font-bold"
                          title={`High/Critical Risk: ${weekData.highCount}`}
                        >
                          {highPct > 10 ? weekData.highCount : ''}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-8 pt-4 border-t border-gray-100 justify-center">
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
      )}
    </PageWrapper>
  );
};

export default SprintRisk;
