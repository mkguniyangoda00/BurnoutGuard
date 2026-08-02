import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { useCounterfactual } from '../../hooks/useCounterfactual';

const formatFeatureName = (name: string) => name.replace(/([A-Z])/g, ' $1').trim().toLowerCase();

const formatValue = (value: number) => (Number.isInteger(value) ? value : value.toFixed(1));

const formatChange = (f: { featureName: string; from: number; to: number }) =>
  `${formatFeatureName(f.featureName)} moved from ${formatValue(f.from)} to ${formatValue(f.to)}`;

const RISK_COLORS: Record<string, string> = {
  Low: 'var(--success)',
  Moderate: 'var(--warning)',
  High: '#EA580C',
  Critical: 'var(--danger)',
};

/**
 * Shows a "what would need to change for your risk to improve" insight,
 * driven by the /predictions/counterfactual endpoint. Renders nothing if
 * there's no prediction yet, no improvable risk-increasing factors were
 * found, or the request fails — this is a supplementary insight, not a
 * critical-path element, so it should fail silently rather than showing
 * an error state on top of the rest of the page.
 */
export const CounterfactualCard: React.FC = () => {
  const { counterfactual, isLoading, isError } = useCounterfactual();

  if (isLoading) {
    return (
      <Card style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Loader2 className="animate-spin" size={16} style={{ color: 'var(--primary)' }} />
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Checking what could change your risk...
        </span>
      </Card>
    );
  }

  if (isError || !counterfactual || counterfactual.changedFactors.length === 0) {
    return null;
  }

  const { currentRiskLevel, simulatedRiskLevel, changedFactors } = counterfactual;
  const sameLevel = currentRiskLevel === simulatedRiskLevel;

  return (
    <Card style={{ padding: '20px', backgroundColor: 'var(--primary-light)', border: '1px solid #C7D5FA' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
        💡 What could change your risk
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        If {changedFactors.map(formatChange).join(' and ')},{' '}
        {sameLevel ? (
          <>
            your risk level would likely stay at{' '}
            <strong style={{ color: RISK_COLORS[currentRiskLevel] ?? 'var(--primary)' }}>{currentRiskLevel}</strong>,
            though your underlying risk score may still improve.
          </>
        ) : (
          <>
            your risk could shift from{' '}
            <strong style={{ color: RISK_COLORS[currentRiskLevel] ?? 'var(--primary)' }}>{currentRiskLevel}</strong>{' '}
            to{' '}
            <strong style={{ color: RISK_COLORS[simulatedRiskLevel] ?? 'var(--primary)' }}>{simulatedRiskLevel}</strong>.
          </>
        )}
      </p>
    </Card>
  );
};

export default CounterfactualCard;