import React from 'react';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { analyticsService } from '../../services/analytics.service';
import { Loader2, AlertCircle } from 'lucide-react';

const SprintRisk: React.FC = () => {
  const { data: rawData, isLoading, isError } = useQuery({
    queryKey: ['analytics', 'sprint'],
    queryFn: analyticsService.getSprintRisk,
  });

  const sprintData = rawData ? [...rawData].reverse() : [];

  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Sprint Risk Analysis
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Historical trend of burnout risk levels across recent weeks.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading sprint analytics...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle size={32} style={{ color: 'var(--danger)' }} />
          <span style={{ fontSize: '13px', color: 'var(--danger)' }}>Failed to load sprint data.</span>
        </div>
      ) : sprintData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Not enough historical data available.</span>
        </div>
      ) : (
        <Card style={{ padding: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '18px' }}>
            Burnout Risk Trend (Weekly)
          </h2>

          <div className="flex flex-col gap-6">
            {sprintData.map((weekData: any, idx: number) => {
              const total = weekData.highCount + weekData.moderateCount + weekData.lowCount;
              const highPct = total > 0 ? (weekData.highCount / total) * 100 : 0;
              const modPct = total > 0 ? (weekData.moderateCount / total) * 100 : 0;
              const lowPct = total > 0 ? (weekData.lowCount / total) * 100 : 0;

              return (
                <div key={idx}>
                  <div className="flex justify-between text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    <span>{weekData.week}</span>
                    <span>Total Predictions: {total}</span>
                  </div>
                  {total === 0 ? (
                    <div
                      className="w-full h-6 flex items-center justify-center text-xs"
                      style={{ background: 'var(--soft-fill)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-muted)' }}
                    >
                      No data this week
                    </div>
                  ) : (
                    <div
                      className="flex w-full h-6 rounded-md overflow-hidden"
                      style={{ background: 'var(--soft-fill)' }}
                    >
                      {lowPct > 0 && (
                        <div
                          style={{ width: `${lowPct}%` }}
                          className="flex items-center justify-center text-[10px] text-white font-bold"
                          title={`Low Risk: ${weekData.lowCount}`}
                        >
                          {lowPct > 10 ? weekData.lowCount : ''}
                        </div>
                      )}
                      {modPct > 0 && (
                        <div
                          style={{ width: `${modPct}%`, background: 'var(--warning)' }}
                          className="flex items-center justify-center text-[10px] text-white font-bold"
                          title={`Moderate Risk: ${weekData.moderateCount}`}
                        >
                          {modPct > 10 ? weekData.moderateCount : ''}
                        </div>
                      )}
                      {highPct > 0 && (
                        <div
                          style={{ width: `${highPct}%`, background: 'var(--danger)' }}
                          className="flex items-center justify-center text-[10px] text-white font-bold"
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

          <div className="flex gap-6 mt-8 pt-4 justify-center" style={{ borderTop: '1px solid var(--border)' }}>
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
      )}
    </PageWrapper>
  );
};

export default SprintRisk;
