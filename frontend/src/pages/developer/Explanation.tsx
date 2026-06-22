import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const SHAPRow: React.FC<{ label: string, value: number, color: string, align: 'left' | 'right' }> = ({ label, value, color, align }) => {
  const width = Math.abs(value) * 100 + '%';
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '32px', marginBottom: '4px' }}>
      <div style={{ width: '130px', textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)', paddingRight: '12px' }}>
        {label}
      </div>
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: '50%', height: '100%', width: '1px', backgroundColor: 'var(--border-color)', zIndex: 1 }} />
        <div style={{ 
          position: 'absolute', 
          left: align === 'left' ? `calc(50% - ${width})` : '50%',
          width: width,
          height: '24px',
          backgroundColor: color,
          opacity: 0.85,
          borderRadius: align === 'left' ? '4px 0 0 4px' : '0 4px 4px 0',
          zIndex: 2
        }} />
      </div>
      <div style={{ width: '40px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: color, paddingLeft: '8px' }}>
        {value > 0 ? '+' : ''}{value}
      </div>
    </div>
  );
};

const Explanation: React.FC = () => {
  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Why am I at risk?</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>SHAP-based explanation for your latest prediction · 1 April 2026</p>
      </div>

      <div style={{ 
        backgroundColor: 'var(--soft-fill)', 
        borderRadius: '14px', 
        padding: '16px 18px', 
        fontSize: '13px', 
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        marginBottom: '20px'
      }}>
        Your risk score of <span style={{ fontWeight: 'bold' }}>0.62 (Moderate)</span> was calculated from your last 7 check-ins. The chart below shows which factors increased or decreased your risk, and by how much.
      </div>

      <Card style={{ padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Feature contributions (SHAP waterfall)</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <SHAPRow label="Sleep quality" value={0.18} color="var(--danger)" align="left" />
          <SHAPRow label="Work hours" value={0.14} color="var(--danger)" align="left" />
          <SHAPRow label="Exercise" value={0.09} color="var(--warning)" align="left" />
          <SHAPRow label="Stress level" value={0.06} color="var(--warning)" align="left" />
          
          <div style={{ height: '1px', borderTop: '1px dashed var(--border-color)', margin: '12px 0 12px 140px' }} />
          
          <SHAPRow label="Mood score" value={-0.08} color="var(--success)" align="right" />
          <SHAPRow label="Work-life balance" value={-0.04} color="var(--success)" align="right" />
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

      <div style={{ 
        backgroundColor: '#F0F4FF', 
        border: '1px solid #C7D5FA', 
        borderRadius: '14px', 
        padding: '16px 18px', 
        fontSize: '13px', 
        color: '#1E3A8A',
        lineHeight: 1.6
      }}>
        <span style={{ fontWeight: 'bold' }}>In plain language:</span> Your poor sleep quality is the biggest driver of your burnout risk right now. Working more than 9 hours daily combined with little exercise is amplifying it. Your mood is helping buffer the risk — keep that up.
      </div>
      
      <Button variant="primary" style={{ marginTop: '20px', width: '100%' }}>
        Get recommendations →
      </Button>
    </PageWrapper>
  );
};

export default Explanation;
