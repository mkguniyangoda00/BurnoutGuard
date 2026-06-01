import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Good morning, Malithi</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Wednesday, 1 April 2026 · Week 14 of your tracking journey</p>
        </div>
        {/* Action Button: Routes the user to the Check-In form */}
        <Button variant="primary" onClick={() => navigate('/check-in')}>
          + Daily Check-in
        </Button>
      </div>

      {/* Hero Risk Card */}
      <Card className="hero-card" style={{
        background: 'linear-gradient(135deg, #0F1117 0%, #1E2236 100%)',
        padding: '24px 28px',
        marginBottom: '20px',
        color: 'white',
        border: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{ fontSize: '11px', letterSpacing: '0.1em', opacity: 0.55, textTransform: 'uppercase' }}>
            Current Burnout Risk
          </span>
          <h2 style={{ fontSize: '36px', color: '#F59E0B', margin: '8px 0' }}>Moderate</h2>
          <p style={{ fontSize: '13px', opacity: 0.65, marginBottom: '16px' }}>
            ↑ Slightly elevated from last week · 3 key factors identified
          </p>
          <button style={{
            padding: '4px 12px',
            borderRadius: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '12px',
            border: 'none'
          }}>
            View explanation →
          </button>
        </div>
        
        <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
            <circle cx="40" cy="40" r="34" fill="none" stroke="#F59E0B" strokeWidth="6" 
                    strokeDasharray="213.6" strokeDashoffset={213.6 * (1 - 0.62)} 
                    strokeLinecap="round" transform="rotate(-90 40 40)" />
          </svg>
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#F59E0B' }}>0.62</span>
          </div>
          <span style={{ position: 'absolute', bottom: '-20px', fontSize: '11px', opacity: 0.5 }}>Risk score</span>
        </div>
      </Card>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <Card>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg. sleep this week</span>
          <div style={{ fontSize: '24px', fontWeight: 600, margin: '4px 0' }}>5.8h</div>
          <span style={{ fontSize: '12px', color: 'var(--danger)' }}>↓ 0.6h below target</span>
        </Card>
        <Card>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg. stress level</span>
          <div style={{ fontSize: '24px', fontWeight: 600, margin: '4px 0' }}>7.2 / 10</div>
          <span style={{ fontSize: '12px', color: 'var(--danger)' }}>↑ Higher than baseline</span>
        </Card>
        <Card>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Check-ins completed</span>
          <div style={{ fontSize: '24px', fontWeight: 600, margin: '4px 0' }}>5 / 7</div>
          <span style={{ fontSize: '12px', color: 'var(--success)' }}>↗ Good consistency</span>
        </Card>
      </div>

      {/* Risk Factors Panel */}
      <Card>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Top risk factors this week</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { color: 'var(--danger)', text: 'Low sleep quality (avg. 2.1/5) — strongest contributor', shap: '+0.18 SHAP', badge: 'danger' },
            { color: 'var(--warning)', text: 'High working hours (avg. 10.3h/day)', shap: '+0.14 SHAP', badge: 'warning' },
            { color: 'var(--warning)', text: 'No exercise on 5 of 7 days', shap: '+0.09 SHAP', badge: 'warning' },
          ].map((factor, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--border-color)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: factor.color }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{factor.text}</span>
              </div>
              <Badge variant={factor.badge as any}>{factor.shap}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </PageWrapper>
  );
};

export default Dashboard;
