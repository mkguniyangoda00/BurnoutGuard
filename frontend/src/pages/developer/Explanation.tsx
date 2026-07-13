import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { predictionService } from '../../services/prediction.service';
import { Loader2, AlertTriangle, HelpCircle } from 'lucide-react';

const SHAPRow: React.FC<{ label: string; value: number; color: string; align: 'left' | 'right' }> = ({
  label,
  value,
  color,
  align,
}) => {
  // Normalize SHAP value to percentage of bar width (max SHAP value is typically around 0.5)
  const maxVal = 0.4;
  const percentage = Math.min(100, (Math.abs(value) / maxVal) * 100);
  const width = percentage + '%';

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '32px', marginBottom: '8px' }}>
      <div
        style={{
          width: '140px',
          textAlign: 'right',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          paddingRight: '12px',
          textTransform: 'capitalize',
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', height: '100%' }}>
        {/* Center line dividing positive and negative SHAP */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            height: '100%',
            width: '1px',
            backgroundColor: 'var(--border-color)',
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: align === 'left' ? `calc(50% - ${width})` : '50%',
            width: width,
            height: '20px',
            backgroundColor: color,
            opacity: 0.85,
            borderRadius: align === 'left' ? '4px 0 0 4px' : '0 4px 4px 0',
            zIndex: 2,
          }}
        />
      </div>
      <div
        style={{
          width: '50px',
          textAlign: 'left',
          fontSize: '11px',
          fontWeight: 600,
          color: color,
          paddingLeft: '12px',
        }}
      >
        {value > 0 ? '+' : ''}
        {value.toFixed(3)}
      </div>
    </div>
  );
};

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

  const formattedDate = new Date(prediction.predictionDate).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Why am I at risk?</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          SHAP-based explanation for your latest prediction · {formattedDate}
        </p>
      </div>

      <div
        style={{
          backgroundColor: 'var(--soft-fill)',
          borderRadius: '14px',
          padding: '16px 18px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: '20px',
        }}
      >
        Your risk score of{' '}
        <span style={{ fontWeight: 'bold' }}>
          {(prediction.riskScore * 100).toFixed(0)}% ({prediction.riskLevel})
        </span>{' '}
        was calculated from your check-in history. The chart below shows which factors increased or decreased your
        risk, and by how much.
      </div>

      <Card style={{ padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>
          Feature contributions (SHAP waterfall)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {riskDrivers.map((s: any) => (
            <SHAPRow
              key={s.shapId}
              label={s.featureName.replace(/([A-Z])/g, ' $1')}
              value={s.shapValue}
              color="var(--danger)"
              align="left"
            />
          ))}

          {riskDrivers.length > 0 && riskMitigators.length > 0 && (
            <div
              style={{
                height: '1px',
                borderTop: '1px dashed var(--border-color)',
                margin: '12px 0 12px 140px',
              }}
            />
          )}

          {riskMitigators.map((s: any) => (
            <SHAPRow
              key={s.shapId}
              label={s.featureName.replace(/([A-Z])/g, ' $1')}
              value={s.shapValue}
              color="var(--success)"
              align="right"
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '24px', marginLeft: '140px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--danger)', borderRadius: '2px' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Increases risk</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--success)', borderRadius: '2px' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Decreases risk</span>
          </div>
        </div>
      </Card>

      <div
        style={{
          backgroundColor: '#F0F4FF',
          border: '1px solid #C7D5FA',
          borderRadius: '14px',
          padding: '16px 18px',
          fontSize: '13px',
          color: '#1E3A8A',
          lineHeight: 1.6,
        }}
      >
        <span style={{ fontWeight: 'bold' }}>In plain language:</span> {getPlainLanguageExplanation()}
      </div>

      <Button
        variant="primary"
        style={{ marginTop: '20px', width: '100%' }}
        onClick={() => navigate('/developer/recommendations')}
      >
        Get recommendations →
      </Button>
    </PageWrapper>
  );
};

export default Explanation;
