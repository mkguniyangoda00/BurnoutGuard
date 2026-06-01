import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const WhatIfSimulator: React.FC = () => {
  const [sleep, setSleep] = useState(6);
  const [hours, setHours] = useState(9);

  // Simple mock calculation: base risk 0.6, -0.08 per hour of sleep over 6, +0.06 per work hour over 8
  const calculatedRisk = Math.max(0.1, Math.min(0.99, 0.6 - ((sleep - 6) * 0.08) + ((hours - 8) * 0.06))).toFixed(2);

  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>What-If Simulator</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Adjust factors to see how they impact your predicted burnout risk</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <Card>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Adjust Variables</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              <span>Average Sleep (hours)</span>
              <span>{sleep} hrs</span>
            </label>
            <input 
              type="range" min="4" max="10" step="0.5" 
              value={sleep} onChange={(e) => setSleep(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              <span>Daily Work Hours</span>
              <span>{hours} hrs</span>
            </label>
            <input 
              type="range" min="4" max="14" step="0.5" 
              value={hours} onChange={(e) => setHours(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Predicted Risk Score</span>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: parseFloat(calculatedRisk) > 0.6 ? 'var(--danger)' : 'var(--success)' }}>
            {calculatedRisk}
          </div>
          <div style={{ marginTop: '12px' }}>
            <Badge variant={parseFloat(calculatedRisk) > 0.6 ? 'danger' : 'success'}>
              {parseFloat(calculatedRisk) > 0.6 ? 'High Risk' : 'Low Risk'}
            </Badge>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default WhatIfSimulator;
