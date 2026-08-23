import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import RiskDisclaimer from '../../components/ui/RiskDisclaimer';
import { researchService, DemographicDimension } from '../../services/research.service';

type DemographicRow = {
  group: string;
  sampleSize: number;
  avgRiskScore: number;
  riskLevelCounts: { Low: number; Moderate: number; High: number; Critical: number };
  highRiskPct: number;
};

type FactorDistribution = {
  factorName: string;
  factorLabel: string;
  pearsonCorrelation: number | null;
  bins: Array<{ range: string; sampleSize: number; avgRiskScore: number | null; highRiskPct: number | null }>;
};

type InteractionGridCell = {
  binA: string;
  binB: string;
  sampleSize: number;
  avgRiskScore: number | null;
  highRiskPct: number | null;
};

const dimensionOptions: { value: DemographicDimension; label: string }[] = [
  { value: 'ageGroup', label: 'Age Group' },
  { value: 'experienceBand', label: 'Experience' },
  { value: 'jobTitle', label: 'Job Role' },
  { value: 'workModel', label: 'Work Mode' },
];

const riskScale = (score: number) => {
  const min = 0.1;
  const max = 1;
  const clamped = Math.max(min, Math.min(max, score));
  return 240 - ((clamped - min) / (max - min)) * 120;
};

const confidenceLabel = (value: number | null) => {
  if (value === null) return 'unavailable';
  const abs = Math.abs(value);
  if (abs < 0.2) return 'weak';
  if (abs < 0.5) return 'moderate';
  return 'strong';
};

const barChart = (
  title: string,
  rows: Array<{ label: string; value: number; subtitle?: string }>,
  height = 220
) => {
  const maxValue = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(rows.length, 1)}, minmax(0, 1fr))`, gap: '10px', alignItems: 'end', minHeight: `${height}px` }}>
        {rows.map((row) => {
          const pct = (row.value / maxValue) * 100;
          return (
            <div key={row.label} style={{ display: 'grid', gap: '8px', alignItems: 'end', height: '100%' }}>
              <div style={{ height: `${pct}%`, minHeight: '12px', borderRadius: '12px 12px 4px 4px', background: 'linear-gradient(180deg, var(--primary) 0%, var(--success) 100%)', alignSelf: 'end' }} />
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>{row.value.toFixed(2)}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', minHeight: '28px' }}>
                <div>{row.label}</div>
                {row.subtitle ? <div>{row.subtitle}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FactorAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'demographics' | 'explorer' | 'interaction'>('demographics');
  const [dimension, setDimension] = useState<DemographicDimension>('ageGroup');
  const [selectedFactor, setSelectedFactor] = useState('sleepHours');
  const [factorA, setFactorA] = useState('sleepHours');
  const [factorB, setFactorB] = useState('overtimeHours');

  const insightsQuery = useQuery({ queryKey: ['research', 'insights'], queryFn: researchService.getInsights });
  const demographicsQuery = useQuery({
    queryKey: ['research', 'demographics', dimension],
    queryFn: () => researchService.getDemographicBreakdown(dimension),
  });
  const factorsQuery = useQuery({ queryKey: ['research', 'available-factors'], queryFn: researchService.getAvailableFactors });
  const distributionQuery = useQuery({
    queryKey: ['research', 'distribution', selectedFactor],
    queryFn: () => researchService.getFactorDistribution(selectedFactor),
    enabled: !!selectedFactor,
  });
  const interactionQuery = useQuery({
    queryKey: ['research', 'interaction', factorA, factorB],
    queryFn: () => researchService.getInteractionAnalysis(factorA, factorB),
    enabled: !!factorA && !!factorB && factorA !== factorB,
  });

  const factorOptions = Array.isArray(factorsQuery.data) ? factorsQuery.data : [];
  const demographicRows: DemographicRow[] = Array.isArray(demographicsQuery.data) ? demographicsQuery.data : [];
  const distribution: FactorDistribution | undefined = distributionQuery.data;
  const interaction = interactionQuery.data as { grid: InteractionGridCell[] } | undefined;

  const chartRows = useMemo(() => {
    return demographicRows.map((row) => ({
      label: row.group,
      value: row.avgRiskScore,
      subtitle: `n=${row.sampleSize}`,
    }));
  }, [demographicRows]);

  const interactionCells = interaction?.grid ?? [];
  const uniqueA = Array.from(new Set(interactionCells.map((cell) => cell.binA)));
  const uniqueB = Array.from(new Set(interactionCells.map((cell) => cell.binB)));

  const selectedDistributionRows = distribution?.bins.map((bin) => ({
    label: bin.range,
    value: bin.avgRiskScore ?? 0,
    subtitle: `n=${bin.sampleSize}`,
  })) ?? [];

  const selectedCorrelation = distribution?.pearsonCorrelation ?? null;

  const renderTabButton = (key: typeof activeTab, label: string) => (
    <button
      key={key}
      onClick={() => setActiveTab(key)}
      className={`badge ${activeTab === key ? 'badge-primary' : 'badge-muted'}`}
      style={{ border: 'none', cursor: 'pointer', padding: '8px 14px', fontSize: '13px' }}
    >
      {label}
    </button>
  );

  return (
    <PageWrapper>
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Factor Analysis
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Observed associations in the dataset, grouped for research review
        </p>
      </div>

      <div style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px 16px', marginBottom: '18px' }}>
        <RiskDisclaimer style={{ marginTop: 0, color: 'var(--text-secondary)' }} />
        <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          This shows statistical association in the observed dataset, not causation, and it is distinct from the model's SHAP feature importance shown on the Model Metrics page.
        </p>
      </div>

      <Card style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}>Auto-generated insights</h2>
        {insightsQuery.isLoading ? (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading insights...</div>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {(insightsQuery.data ?? []).map((insight: string, idx: number) => (
              <div key={`${idx}-${insight}`} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span className="badge badge-primary" style={{ flexShrink: 0 }}>{idx + 1}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{insight}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {renderTabButton('demographics', 'Demographics')}
        {renderTabButton('explorer', 'Factor Explorer')}
        {renderTabButton('interaction', 'Interaction Analysis')}
      </div>

      {activeTab === 'demographics' && (
        <div style={{ display: 'grid', gap: '18px' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Demographic breakdown</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Average risk score by group</p>
              </div>
              <select value={dimension} onChange={(e) => setDimension(e.target.value as DemographicDimension)} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--soft-fill)', fontSize: '13px' }}>
                {dimensionOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {demographicsQuery.isLoading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading demographic analysis...</div>
            ) : demographicRows.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Not enough sample data available yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: '18px' }}>
                {barChart('Average risk score', chartRows)}
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      {['Group', 'Sample size', 'High-risk %', 'Low', 'Moderate', 'High', 'Critical'].map((th) => (
                        <th key={th} style={{ padding: '0 12px 10px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{th}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {demographicRows.map((row) => (
                      <tr key={row.group} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 12px 12px 0', fontSize: '13px', fontWeight: 500 }}>{row.group}</td>
                        <td style={{ padding: '12px 12px 12px 0', fontSize: '13px' }}>{row.sampleSize}</td>
                        <td style={{ padding: '12px 12px 12px 0', fontSize: '13px' }}>{row.highRiskPct}%</td>
                        <td style={{ padding: '12px 12px 12px 0', fontSize: '13px' }}>{row.riskLevelCounts.Low}</td>
                        <td style={{ padding: '12px 12px 12px 0', fontSize: '13px' }}>{row.riskLevelCounts.Moderate}</td>
                        <td style={{ padding: '12px 12px 12px 0', fontSize: '13px' }}>{row.riskLevelCounts.High}</td>
                        <td style={{ padding: '12px 12px 12px 0', fontSize: '13px' }}>{row.riskLevelCounts.Critical}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'explorer' && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Factor explorer</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Quantile-style buckets and correlation with risk score</p>
            </div>
            <select value={selectedFactor} onChange={(e) => setSelectedFactor(e.target.value)} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--soft-fill)', fontSize: '13px' }}>
              {factorOptions.map((option: any) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {distributionQuery.isLoading || !distribution ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading factor distribution...</div>
          ) : (
            <div style={{ display: 'grid', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '34px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedCorrelation === null ? 'N/A' : selectedCorrelation.toFixed(3)}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {confidenceLabel(selectedCorrelation)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Pearson correlation with observed risk score
                  </div>
                </div>
              </div>
              {barChart(distribution.factorLabel, selectedDistributionRows, 200)}
              <div style={{ display: 'grid', gap: '10px' }}>
                {distribution.bins.map((bin, idx) => (
                  <div key={`${bin.range}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{bin.range}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {bin.sampleSize} developers · {bin.highRiskPct === null ? 'n/a' : `${bin.highRiskPct}% high-risk`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'interaction' && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Interaction analysis</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Two-factor tertile grid with small-sample suppression</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select value={factorA} onChange={(e) => setFactorA(e.target.value)} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--soft-fill)', fontSize: '13px' }}>
                {factorOptions.map((option: any) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select value={factorB} onChange={(e) => setFactorB(e.target.value)} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--soft-fill)', fontSize: '13px' }}>
                {factorOptions.map((option: any) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {interactionQuery.isLoading || !interaction ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading interaction analysis...</div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: `140px repeat(${Math.max(uniqueB.length, 1)}, minmax(0, 1fr))`, gap: '8px' }}>
                <div />
                {uniqueB.map((binB) => (
                  <div key={binB} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>{binB}</div>
                ))}
                {uniqueA.map((binA) => (
                  <React.Fragment key={binA}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>{binA}</div>
                    {uniqueB.map((binB) => {
                      const cell = interaction.grid.find((item) => item.binA === binA && item.binB === binB);
                      const score = cell?.avgRiskScore;
                      const background = score === null ? 'var(--soft-fill)' : `hsl(${riskScale(score)}, 75%, 92%)`;
                      const color = score === null ? 'var(--text-muted)' : `hsl(${riskScale(score)}, 55%, 28%)`;
                      return (
                        <div key={`${binA}-${binB}`} style={{ minHeight: '96px', borderRadius: '12px', border: '1px solid var(--border-color)', background, padding: '10px', display: 'grid', gap: '8px', alignContent: 'center', textAlign: 'center' }}>
                          {cell && cell.sampleSize >= 5 && cell.avgRiskScore !== null ? (
                            <>
                              <div style={{ fontSize: '18px', fontWeight: 700, color }}>{cell.avgRiskScore.toFixed(2)}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {cell.highRiskPct}% high-risk
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>n={cell.sampleSize}</div>
                            </>
                          ) : (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                              insufficient data
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </PageWrapper>
  );
};

export default FactorAnalysis;
