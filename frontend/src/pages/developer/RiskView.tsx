import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Loader2, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { usePrediction } from '../../hooks/usePrediction';

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

      <Card style={{ padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Risk Trend (Latest Prediction)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <Card style={{ padding: '20px', backgroundColor: '#F0FDF4', border: '1px solid #BBFBBC' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Risk level</h3>
            <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary)' }}>{prediction.riskLevel}</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>{(prediction.riskScore * 100).toFixed(0)}% risk score</p>
          </Card>
          <Card style={{ padding: '20px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Trend</h3>
            <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {prediction.trendDirection === 'Improving'
                ? 'Improving'
                : prediction.trendDirection === 'Worsening'
                ? 'Worsening'
                : 'Stable'}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>Latest comparison against the previous prediction</p>
          </Card>
        </div>
      </Card>

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
    </PageWrapper>
  );
};

export default RiskView;
