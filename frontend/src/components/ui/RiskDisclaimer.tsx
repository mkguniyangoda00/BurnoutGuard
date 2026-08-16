import React from 'react';

interface RiskDisclaimerProps {
  style?: React.CSSProperties;
}

/**
 * Reusable disclaimer clarifying that risk levels are data-derived strata
 * (quantile bands within the training dataset), not a clinical diagnosis.
 * Used across RiskView, Explanation, and Dashboard wherever a risk level
 * or score is displayed prominently.
 */
export const RiskDisclaimer: React.FC<RiskDisclaimerProps> = ({ style }) => (
  <p
    style={{
      fontSize: '11px',
      color: 'var(--text-muted)',
      lineHeight: 1.5,
      fontStyle: 'italic',
      marginTop: '8px',
      ...style,
    }}
  >
    Risk levels are derived from your relative position within the training
    dataset, not a clinical or medical diagnosis.
  </p>
);

export default RiskDisclaimer;