import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';

const SprintRisk: React.FC = () => {
  return (
    <PageWrapper>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Sprint Risk Analysis</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Current sprint: Sprint 23 · 14 April – 28 April 2026</p>
        </div>
        <button style={{ backgroundColor: 'var(--primary)', color: 'white', fontSize: '13px', fontWeight: 500, padding: '9px 16px', borderRadius: '8px', border: 'none' }}>
          Export Report
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: '14px', padding: '14px 18px', marginBottom: '24px' }}>
        <p style={{ fontSize: '13px', color: 'var(--warning)', margin: 0 }}>⚠ 3 team members are showing elevated burnout risk during this sprint. Consider reviewing workload distribution.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)' }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Sprint pressure scores</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Dev 01', score: 8.2, color: 'var(--danger)' },
              { label: 'Dev 02', score: 6.5, color: 'var(--warning)' },
              { label: 'Dev 03', score: 9.1, color: 'var(--danger)' },
              { label: 'Dev 04', score: 4.3, color: 'var(--success)' },
              { label: 'Dev 05', score: 7.8, color: 'var(--warning)' },
            ].map((bar, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '60px', fontSize: '12px', color: 'var(--text-primary)' }}>{bar.label}</div>
                <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--soft-fill)', borderRadius: '4px', margin: '0 12px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${(bar.score / 10) * 100}%`, backgroundColor: bar.color, borderRadius: '4px' }}></div>
                </div>
                <div style={{ width: '40px', textAlign: 'right', fontSize: '13px', color: 'var(--text-primary)' }}>{bar.score}/10</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)' }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Risk factors this sprint</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { color: 'var(--danger)', text: 'Requirement changes increased by 40% this sprint' },
              { color: 'var(--danger)', text: 'Average overtime is 2.3 hours per day' },
              { color: 'var(--warning)', text: '3 developers on on-call duty simultaneously' },
              { color: 'var(--warning)', text: 'Daily standups average 45 minutes overrun' },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, marginTop: '4px', flexShrink: 0 }}></div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)' }}>
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Burnout risk trend across last 4 sprints</h2>
        
        {/* Abstracting the chart using simple SVG */}
        <div style={{ position: 'relative', height: '220px', width: '100%', marginBottom: '32px', paddingBottom: '20px' }}>
          <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 120" style={{ overflow: 'visible' }}>
            {/* Grid lines */}
            <line x1="0" y1="0" x2="100" y2="0" stroke="var(--border-color)" strokeWidth="0.5" />
            <line x1="0" y1="25" x2="100" y2="25" stroke="var(--border-color)" strokeWidth="0.5" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="var(--border-color)" strokeWidth="0.5" />
            <line x1="0" y1="75" x2="100" y2="75" stroke="var(--border-color)" strokeWidth="0.5" />
            <line x1="0" y1="100" x2="100" y2="100" stroke="var(--border-color)" strokeWidth="0.5" />
            
            {/* Red Line: 1, 2, 2, 3 mapped to max 10 => 10%, 20%, 20%, 30% from bottom => y=90, 80, 80, 70 */}
            <polyline points="0,90 33,80 66,80 100,70" fill="none" stroke="var(--danger)" strokeWidth="2" />
            <circle cx="0" cy="90" r="2" fill="var(--danger)" />
            <circle cx="33" cy="80" r="2" fill="var(--danger)" />
            <circle cx="66" cy="80" r="2" fill="var(--danger)" />
            <circle cx="100" cy="70" r="2" fill="var(--danger)" />

            {/* Amber Line: 3, 4, 5, 5 => y=70, 60, 50, 50 */}
            <polyline points="0,70 33,60 66,50 100,50" fill="none" stroke="var(--warning)" strokeWidth="2" />
            <circle cx="0" cy="70" r="2" fill="var(--warning)" />
            <circle cx="33" cy="60" r="2" fill="var(--warning)" />
            <circle cx="66" cy="50" r="2" fill="var(--warning)" />
            <circle cx="100" cy="50" r="2" fill="var(--warning)" />

            {/* Green Line: 8, 6, 5, 4 => y=20, 40, 50, 60 */}
            <polyline points="0,20 33,40 66,50 100,60" fill="none" stroke="var(--success)" strokeWidth="2" />
            <circle cx="0" cy="20" r="2" fill="var(--success)" />
            <circle cx="33" cy="40" r="2" fill="var(--success)" />
            <circle cx="66" cy="50" r="2" fill="var(--success)" />
            <circle cx="100" cy="60" r="2" fill="var(--success)" />
          </svg>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ transform: 'translateX(0)' }}>Sprint 20</span>
            <span style={{ transform: 'translateX(-50%)' }}>Sprint 21</span>
            <span style={{ transform: 'translateX(-50%)' }}>Sprint 22</span>
            <span style={{ transform: 'translateX(-100%)' }}>Sprint 23</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--danger)' }}></div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>High risk count</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--warning)' }}></div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Moderate risk count</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--success)' }}></div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Low risk count</span>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default SprintRisk;
