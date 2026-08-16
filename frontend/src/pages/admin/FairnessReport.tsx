import React from 'react';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { analyticsService } from '../../services/analytics.service';
import { Loader2, AlertCircle } from 'lucide-react';

type FairnessGroupRow = {
  group: string;      // sample size, filtered for privacy (>=5)
  sampleSize: number;
  highRiskRate: number;
  lowConfidenceHighRiskRate: number;
};

type FairnessReportData = {
  byWorkMode: FairnessGroupRow[];
  byExperience: FairnessGroupRow[];
  gaps: {
    workMode: number;
    experience: number;
  };
};

/** Same thresholds used elsewhere in the app (see AlertThresholds.ts pattern):
 * >5% gap = investigate, 3-5% = monitor, <3% = fair. */
const getStatus = (gap: number): { label: string; color: string } => {
  if (gap > 5) return { label: 'Above threshold', color: 'var(--danger)' };
  if (gap >= 3) return { label: 'Approaching threshold', color: 'var(--warning)' };
  return { label: 'Within threshold', color: 'var(--success)' };
};

const getRowStatus = (gap: number): { label: string; color: string } => {
  if (gap > 5) return { label: 'Investigate', color: 'var(--danger)' };
  if (gap >= 3) return { label: 'Monitor', color: 'var(--warning)' };
  return { label: 'Fair', color: 'var(--success)' };
};

const findMinMax = (rows: FairnessGroupRow[]) => {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => b.highRiskRate - a.highRiskRate);
  return { highest: sorted[0], lowest: sorted[sorted.length - 1] };
};

const FairnessReport: React.FC = () => {
  const { data, isLoading, isError } = useQuery<FairnessReportData>({
    queryKey: ['analytics', 'fairness'],
    queryFn: analyticsService.getFairnessReport,
  });

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin mb-4" size={32} />
          <span>Loading fairness metrics...</span>
        </div>
      </PageWrapper>
    );
  }

  if (isError || !data) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-20 text-red-500">
          <AlertCircle className="mb-4" size={32} />
          <span>Failed to load fairness report.</span>
        </div>
      </PageWrapper>
    );
  }

  const summaryCards = [
    { label: 'Work Mode', gap: data.gaps.workMode, rows: data.byWorkMode },
    { label: 'Experience Level', gap: data.gaps.experience, rows: data.byExperience },
  ].filter((card) => card.rows.length > 0);

  const detailGroups = [
    { label: 'Work Mode', rows: data.byWorkMode, gap: data.gaps.workMode },
    { label: 'Experience', rows: data.byExperience, gap: data.gaps.experience },
  ].filter((group) => group.rows.length >= 2); // need at least 2 sub-groups to show a comparison

  // Pick whichever dimension currently has the worst gap, to drive the
  // recommendation banner at the bottom.
  const worstDimension = [...summaryCards].sort((a, b) => b.gap - a.gap)[0];

  return (
    <PageWrapper>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Fairness and Bias Report</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Evaluating model behaviour across available demographic groups · Groups under 5 members are hidden for privacy</p>
      </div>

      <div style={{ backgroundColor: 'var(--primary-light)', border: '1px solid #C7D5FA', borderRadius: '14px', padding: '14px 18px', marginBottom: '24px', color: 'var(--primary)', fontSize: '13px' }}>
        ℹ Fairness is measured as the difference in predicted high-risk rates between groups. A gap above 5% warrants investigation.
      </div>

      {summaryCards.length === 0 ? (
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
          Not enough data available yet — each sub-group needs at least 5 active developers with a latest prediction.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${summaryCards.length}, 1fr)`, gap: '12px', marginBottom: '24px' }}>
          {summaryCards.map((card) => {
            const status = getStatus(card.gap);
            return (
              <div key={card.label} style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 18px', backgroundColor: 'var(--background)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>{card.label}</div>
                <div style={{ fontSize: '28px', fontWeight: 600, color: status.color, marginBottom: '4px', lineHeight: 1 }}>{card.gap}%</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Prediction gap</div>
                <div style={{ fontSize: '12px', color: status.color }}>{status.label}</div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Fairness metrics detail</h2>

        {detailGroups.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
            Not enough sub-groups with sufficient sample size to compare yet.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                {['Group', 'Highest-risk sub-group', 'Lowest-risk sub-group', 'Predicted High Risk (highest)', 'Predicted High Risk (lowest)', 'Gap', 'Borderline High-Risk Rate (highest)', 'Status'].map((th) => (
                  <th key={th} style={{ padding: '0 12px 12px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{th}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detailGroups.map((group, idx) => {
                const minMax = findMinMax(group.rows);
                if (!minMax) return null;
                const status = getRowStatus(group.gap);
                return (
                  <tr key={group.label} style={{ height: '48px', borderBottom: idx === detailGroups.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                    <td style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{group.label}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {minMax.highest.group} <span style={{ color: 'var(--text-muted)' }}>(n={minMax.highest.sampleSize})</span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {minMax.lowest.group} <span style={{ color: 'var(--text-muted)' }}>(n={minMax.lowest.sampleSize})</span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{minMax.highest.highRiskRate}%</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{minMax.lowest.highRiskRate}%</td>
                    <td style={{ fontSize: '12px', fontWeight: 600, color: status.color }}>{group.gap}%</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {minMax.highest.lowConfidenceHighRiskRate}%
                    </td>
                    <td style={{ fontSize: '12px', color: status.color }}>{status.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', fontStyle: 'italic' }}>
          Borderline High-Risk Rate is a proxy for prediction instability (High/Critical calls with
          probability under 60%) — not a ground-truth false-negative rate, since no clinically
          labeled outcomes are available for validation.
        </p>
      </div>

      {worstDimension && worstDimension.gap > 5 ? (
        <div style={{ backgroundColor: '#FFF9F9', border: '1px solid var(--danger-light)', borderRadius: '14px', padding: '16px 18px', color: 'var(--text-secondary)', fontSize: '13px' }}>
          ⚠ Recommendation: The <strong>{worstDimension.label}</strong> group shows a prediction gap of {worstDimension.gap}%, above the 5% threshold.
          Consider collecting additional context (e.g. workload or environment-quality signals) specific to that group to reduce this disparity.
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: '14px', padding: '16px 18px', color: 'var(--success)', fontSize: '13px' }}>
          ✓ No fairness gap currently exceeds the 5% threshold across the available groups.
        </div>
      )}
    </PageWrapper>
  );
};

export default FairnessReport;