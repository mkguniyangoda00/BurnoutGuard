import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Loader2, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { usePrediction } from '../../hooks/usePrediction';
import { CounterfactualCard } from '../../components/predictions/CounterfactualCard';

const RiskView: React.FC = () => {
  const navigate = useNavigate();
  const { prediction, isLoading, isError, isEmpty } = usePrediction();

  if (isLoading) {
    return (
      <PageWrapper>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      </PageWrapper>
    );
  }

  if (isError || isEmpty) {
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

  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>My Burnout Risk</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Detailed breakdown of your risk score over time</p>
      </div>

      {prediction.dataCompletenessScore !== null && (
        <div
          style={{
            marginBottom: '20px',
            padding: '10px 16px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor: prediction.dataCompletenessScore >= 70 ? 'var(--success-light)' : 'var(--warning-light)',
            color: prediction.dataCompletenessScore >= 70 ? 'var(--success)' : 'var(--warning)',
            border: `1px solid ${prediction.dataCompletenessScore >= 70 ? 'var(--success)' : 'var(--warning)'}`,
          }}
        >
          {prediction.dataCompletenessScore >= 70
            ? `✓ ${prediction.dataCompletenessScore.toFixed(0)}% data completeness`
            : `⚠ Lower confidence prediction — ${prediction.dataCompletenessScore.toFixed(0)}% data completeness (some inputs estimated)`}
        </div>
      )}

      {(() => {
  const RISK_CARD_STYLES: Record<string, { bg: string; border: string; color: string }> = {
    Low: { bg: '#F0FDF4', border: '#BBFBBC', color: 'var(--success)' },
    Moderate: { bg: '#FFFBEB', border: '#FDE68A', color: 'var(--warning)' },
    High: { bg: '#FFF7ED', border: '#FDBA74', color: '#EA580C' },
    Critical: { bg: '#FEF2F2', border: '#FECACA', color: 'var(--danger)' },
  };
  const riskStyle = RISK_CARD_STYLES[prediction.riskLevel] ?? RISK_CARD_STYLES.Moderate;

  const TREND_STYLES: Record<string, { bg: string; border: string; color: string; label: string }> = {
    Improving: { bg: '#F0FDF4', border: '#BBFBBC', color: 'var(--success)', label: '↓ Improving' },
    Worsening: { bg: '#FEF2F2', border: '#FECACA', color: 'var(--danger)', label: '↑ Worsening' },
    Stable: { bg: 'var(--soft-fill)', border: 'var(--border)', color: 'var(--text-secondary)', label: '→ Stable' },
  };
  const trendStyle = TREND_STYLES[prediction.trendDirection] ?? TREND_STYLES.Stable;

  return (
    <>
      <Card style={{ padding: '20px', backgroundColor: riskStyle.bg, border: `1px solid ${riskStyle.border}` }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Risk level</h3>
        <p style={{ fontSize: '28px', fontWeight: 700, color: riskStyle.color }}>{prediction.riskLevel}</p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>{(prediction.riskScore * 100).toFixed(0)}% risk score</p>
      </Card>
      <Card style={{ padding: '20px', backgroundColor: trendStyle.bg, border: `1px solid ${trendStyle.border}` }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Trend</h3>
        <p style={{ fontSize: '18px', fontWeight: 600, color: trendStyle.color }}>{trendStyle.label}</p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>Latest comparison against the previous prediction</p>
      </Card>
    </>
  );
  })()}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Positive Factors</h3>
          <ul style={{ paddingLeft: '20px', color: 'var(--success)', fontSize: '13px' }}>
            {riskMitigators.slice(0, 2).map((factor: any) => (
              <li key={factor.shapId}>{factor.plainLanguageText}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Risk Areas</h3>
          <ul style={{ paddingLeft: '20px', color: 'var(--danger)', fontSize: '13px' }}>
            {riskDrivers.slice(0, 2).map((factor: any) => (
              <li key={factor.shapId}>{factor.plainLanguageText}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card style={{ padding: '24px', marginTop: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Summary</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{getPlainLanguageExplanation()}</p>
      </Card>
      {/* counterfactual insight */}
      <div style={{ marginTop: '16px' }}>
        <CounterfactualCard />
      </div>
    </PageWrapper>
  );
};

export default RiskView;
