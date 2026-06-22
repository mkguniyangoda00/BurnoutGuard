import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';

const Trends: React.FC = () => {
  return (
    <PageWrapper>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Wellbeing Trends</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Last 12 weeks · Organisation-wide · Minimum group size: 5</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button style={{ backgroundColor: '#0F1117', color: 'white', borderRadius: '20px', padding: '7px 16px', fontSize: '13px', border: 'none' }}>Risk Trend</button>
        <button style={{ backgroundColor: 'white', color: '#7B7E8C', borderRadius: '20px', padding: '7px 16px', fontSize: '13px', border: '1px solid var(--border-color)' }}>Sleep & Lifestyle</button>
        <button style={{ backgroundColor: 'white', color: '#7B7E8C', borderRadius: '20px', padding: '7px 16px', fontSize: '13px', border: '1px solid var(--border-color)' }}>Work Patterns</button>
      </div>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Organisation burnout risk trend — last 12 weeks</h2>
        
        <div style={{ position: 'relative', height: '220px', width: '100%', marginBottom: '32px', paddingBottom: '20px' }}>
          <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 120" style={{ overflow: 'visible' }}>
            <line x1="0" y1="0" x2="100" y2="0" stroke="var(--border-color)" strokeWidth="0.5" />
            <line x1="0" y1="25" x2="100" y2="25" stroke="var(--border-color)" strokeWidth="0.5" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="var(--border-color)" strokeWidth="0.5" />
            <line x1="0" y1="75" x2="100" y2="75" stroke="var(--border-color)" strokeWidth="0.5" />
            <line x1="0" y1="100" x2="100" y2="100" stroke="var(--border-color)" strokeWidth="0.5" />
            
            <polyline points="0,70 20,68 40,64 60,56 80,48 100,44" fill="none" stroke="var(--danger)" strokeWidth="2" />
            <circle cx="0" cy="70" r="2" fill="var(--danger)" />
            <circle cx="100" cy="44" r="2" fill="var(--danger)" />

            <polyline points="0,24 20,20 40,24 60,18 80,16 100,20" fill="none" stroke="var(--warning)" strokeWidth="2" />
            <circle cx="0" cy="24" r="2" fill="var(--warning)" />
            <circle cx="100" cy="20" r="2" fill="var(--warning)" />

            <polyline points="0,6 20,12 40,16 60,26 80,34 100,40" fill="none" stroke="var(--success)" strokeWidth="2" />
            <circle cx="0" cy="6" r="2" fill="var(--success)" />
            <circle cx="100" cy="40" r="2" fill="var(--success)" />
          </svg>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ transform: 'translateX(0)' }}>Wk 1</span>
            <span style={{ transform: 'translateX(-50%)' }}>Wk 6</span>
            <span style={{ transform: 'translateX(-100%)' }}>Wk 12</span>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '8px' }}>
          ↑ High risk rate has increased 13 percentage points over 12 weeks. Recommend organisation-level intervention.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)' }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Avg sleep hours trend</h2>
          <div style={{ position: 'relative', height: '120px', width: '100%', marginBottom: '16px' }}>
            <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
              <polygon points="0,29 20,32 40,30 60,35 80,39 100,41 100,100 0,100" fill="var(--primary-light)" />
              <polyline points="0,29 20,32 40,30 60,35 80,39 100,41" fill="none" stroke="var(--primary)" strokeWidth="2" />
            </svg>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--danger)' }}>
            ↓ Average sleep has declined 1.2h over 12 weeks
          </div>
        </div>

        <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)' }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Avg stress level trend</h2>
          <div style={{ position: 'relative', height: '120px', width: '100%', marginBottom: '16px' }}>
            <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
              <polygon points="0,42 20,40 40,36 60,38 80,32 100,26 100,100 0,100" fill="var(--danger-light)" />
              <polyline points="0,42 20,40 40,36 60,38 80,32 100,26" fill="none" stroke="var(--danger)" strokeWidth="2" />
            </svg>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--danger)' }}>
            ↑ Average stress increased by 1.6 points
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Trends;
