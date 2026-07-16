import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { predictionService } from '../../services/prediction.service';
import { Loader2, HelpCircle, TrendingDown, TrendingUp } from 'lucide-react';

const Explanation: React.FC = () => {
  const navigate = useNavigate();

  // Fetch the latest prediction
  const { data: predictionData, isLoading, isError } = useQuery({
    queryKey: ['prediction', 'latest'],
    queryFn: predictionService.getLatest,
  });

  const prediction = predictionData?.prediction;

  if (isLoading) {
    return (
      <PageWrapper>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      </PageWrapper>
    );
  }

  if (isError || !prediction) {
    return (
      <PageWrapper>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <HelpCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>No Prediction Data</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px' }}>
            Complete your daily check-in to generate a risk score and view its SHAP analysis.
          </p>
          <Button variant="primary" onClick={() => navigate('/developer/check-in')}>
            Submit Check-in
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const riskDrivers = prediction.shapExplanations
    ?.filter((s: any) => s.direction === 'IncreasesRisk')
    ?.sort((a: any, b: any) => b.shapValue - a.shapValue) ?? [];

  const riskMitigators = prediction.shapExplanations
    ?.filter((s: any) => s.direction === 'DecreasesRisk')
    ?.sort((a: any, b: any) => a.shapValue - b.shapValue) ?? [];

  // Construct dynamic plain-language explanation
  const getPlainLanguageExplanation = () => {
    if (riskDrivers.length === 0 && riskMitigators.length === 0) {
      return 'Your metrics are currently in standard ranges, leading to a stable burnout risk profile.';
    }

    let text = '';
    if (riskDrivers.length > 0) {
      const topDriver = riskDrivers[0].featureName.replace(/([A-Z])/g, ' $1').toLowerCase();
      text += `Your ${topDriver} is the biggest driver of your burnout risk right now.`;
      if (riskDrivers[1]) {
        const secondDriver = riskDrivers[1].featureName.replace(/([A-Z])/g, ' $1').toLowerCase();
        text += ` Elevated ${secondDriver} is also increasing the pressure.`;
      }
    } else {
      text += 'Your daily habits show no major burnout risk factors.';
    }

    if (riskMitigators.length > 0) {
      const topMitigator = riskMitigators[0].featureName.replace(/([A-Z])/g, ' $1').toLowerCase();
      text += ` On the positive side, your ${topMitigator} is helping to buffer the risk — keep that up.`;
    }

    return text;
  };

  // Calculate max impact for scaling bars
  const allFactors = [...riskDrivers, ...riskMitigators];
  const maxImpact = allFactors.length > 0 ? Math.max(...allFactors.map((f: any) => Math.abs(f.shapValue))) : 1;

  // Get risk color based on level
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return '#DC2626';
      case 'High': return '#F97316';
      case 'Moderate': return '#EAB308';
      case 'Low': return '#1B8C6E';
      default: return 'var(--primary)';
    }
  };

  return (
    <PageWrapper>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 600, marginBottom: '8px' }}>
          My Burnout Risk
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Understand your risk factors and what's helping you stay resilient
        </p>
      </div>

      {/* ── Risk Score Hero Card ─────────────────────────────────────── */}
      <Card style={{ 
        padding: '32px 28px', 
        marginBottom: '32px', 
        background: `linear-gradient(135deg, ${getRiskColor(prediction.riskLevel)} 0%, ${getRiskColor(prediction.riskLevel)}22 100%)`,
        border: `2px solid ${getRiskColor(prediction.riskLevel)}33`
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '32px', alignItems: 'center' }}>
          {/* Risk Score Circle */}
          <div style={{ position: 'relative', width: '120px', height: '120px' }}>
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={getRiskColor(prediction.riskLevel)}
                strokeWidth="8"
                strokeDasharray={`${(prediction.riskScore * 100) * Math.PI} ${314.159}`}
                strokeLinecap="round"
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '24px', fontWeight: 700, color: getRiskColor(prediction.riskLevel) }}>
                {(prediction.riskScore * 100).toFixed(0)}%
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Risk</p>
            </div>
          </div>

          {/* Risk Details */}
          <div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>RISK LEVEL</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: getRiskColor(prediction.riskLevel) }}>
                {prediction.riskLevel}
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Trend</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {prediction.trendDirection === 'Improving' && (
                    <>
                      <TrendingDown size={18} style={{ color: 'var(--success)' }} />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--success)' }}>Improving</span>
                    </>
                  )}
                  {prediction.trendDirection === 'Worsening' && (
                    <>
                      <TrendingUp size={18} style={{ color: 'var(--danger)' }} />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--danger)' }}>Worsening</span>
                    </>
                  )}
                  {prediction.trendDirection === 'Stable' && (
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>→ Stable</span>
                  )}
                </div>
              </div>
              
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Data Points</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {prediction.checkInsUsed || 1} check-in{prediction.checkInsUsed !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Risk Drivers (Red Bars) ────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '4px' }}>
            ⚠ Risk Areas
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Factors increasing your burnout risk
          </p>
        </div>

        {riskDrivers.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {riskDrivers.slice(0, 5).map((factor: any, idx: number) => {
              const barWidth = (Math.abs(factor.shapValue) / maxImpact) * 100;
              const featureName = factor.featureName.replace(/([A-Z])/g, ' $1').trim();
              
              return (
                <Card key={factor.shapId} style={{ padding: '16px 20px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {idx + 1}. {featureName}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        +{factor.shapValue.toFixed(3)} impact
                      </p>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--danger)', backgroundColor: '#FEE2E2', padding: '4px 12px', borderRadius: '4px' }}>
                      {Math.round(barWidth)}%
                    </span>
                  </div>
                  
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#FECACA', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${barWidth}%`,
                        backgroundColor: 'var(--danger)',
                        borderRadius: '3px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F0FDF4', border: '1px solid #BBFBBC' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No major risk areas identified. Great work!</p>
          </Card>
        )}
      </div>

      {/* ── Protective Factors (Green Bars) ────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '4px' }}>
            ✓ Protective Factors
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            What's helping you stay resilient and healthy
          </p>
        </div>

        {riskMitigators.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {riskMitigators.slice(0, 5).map((factor: any, idx: number) => {
              const barWidth = (Math.abs(factor.shapValue) / maxImpact) * 100;
              const featureName = factor.featureName.replace(/([A-Z])/g, ' $1').trim();
              
              return (
                <Card key={factor.shapId} style={{ padding: '16px 20px', backgroundColor: '#F0FDF4', border: '1px solid #BBFBBC' }}>
                  <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {idx + 1}. {featureName}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        -{Math.abs(factor.shapValue).toFixed(3)} impact
                      </p>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success)', backgroundColor: '#DBEAFE', padding: '4px 12px', borderRadius: '4px' }}>
                      {Math.round(barWidth)}%
                    </span>
                  </div>
                  
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#BBFBBC', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${barWidth}%`,
                        backgroundColor: 'var(--success)',
                        borderRadius: '3px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F0FDF4', border: '1px solid #BBFBBC' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No protective factors identified yet.</p>
          </Card>
        )}
      </div>

      {/* ── Summary Insight ───────────────────────────────────────── */}
      <Card style={{ 
        padding: '24px 28px', 
        marginBottom: '32px', 
        backgroundColor: 'var(--primary-light)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid var(--primary)`
      }}>
        <p style={{ fontSize: '14px', color: 'var(--primary)', lineHeight: 1.7, fontWeight: 500 }}>
          {getPlainLanguageExplanation()}
        </p>
      </Card>

      {/* ── Action Buttons ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingBottom: '20px' }}>
        <Button variant="secondary" onClick={() => navigate('/developer/dashboard')}>
          Back to Dashboard
        </Button>
        <Button variant="primary" onClick={() => navigate('/developer/recommendations')}>
          View Recommendations →
        </Button>
      </div>
    </PageWrapper>
  );
};

export default Explanation;
