import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';

const TeamDashboard: React.FC = () => {
  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Team Burnout Overview</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Week 13 · Software Engineering Department · All data is anonymised</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <select style={{ fontFamily: 'var(--font-body)', fontSize: '13px', padding: '8px 12px', paddingBottom: '9px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}>
          <option>Department: Engineering</option>
        </select>
        <select style={{ fontFamily: 'var(--font-body)', fontSize: '13px', padding: '8px 12px', paddingBottom: '9px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}>
          <option>Work Mode: All</option>
        </select>
        <select style={{ fontFamily: 'var(--font-body)', fontSize: '13px', padding: '8px 12px', paddingBottom: '9px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}>
          <option>Risk Period: This Week</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { num: '3', label: 'High Risk', color: 'var(--danger)' },
          { num: '5', label: 'Moderate Risk', color: 'var(--warning)' },
          { num: '12', label: 'Low Risk', color: 'var(--success)' },
          { num: '4', label: 'No Data', color: 'var(--text-muted)' },
        ].map((chip, idx) => (
          <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px 16px', textAlign: 'center', backgroundColor: 'var(--background)' }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: chip.color, marginBottom: '4px', lineHeight: 1 }}>{chip.num}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{chip.label}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Team Burnout Heatmap</h2>
        
        <div style={{ display: 'flex' }}>
          <div style={{ width: '60px', marginRight: '16px' }}>
            <div style={{ height: '20px', marginBottom: '8px' }}></div>
            {['Dev 01', 'Dev 02', 'Dev 03', 'Dev 04', 'Dev 05', 'Dev 06', 'Dev 07', 'Dev 08'].map(dev => (
              <div key={dev} style={{ height: '28px', marginBottom: '6px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{dev}</div>
            ))}
          </div>

          <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
            {[
              { label: 'Wk 10', cells: ['green', 'green', 'amber', 'green', 'gray', 'red', 'green', 'amber'] },
              { label: 'Wk 11', cells: ['green', 'green', 'amber', 'amber', 'green', 'red', 'green', 'red'] },
              { label: 'Wk 12', cells: ['amber', 'green', 'red', 'amber', 'green', 'red', 'green', 'red'] },
              { label: 'Wk 13', cells: ['red', 'amber', 'red', 'amber', 'green', 'red', 'green', 'red'] },
            ].map((col, cIdx) => (
              <div key={cIdx} style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '8px', height: '20px' }}>{col.label}</div>
                {col.cells.map((cell, rIdx) => {
                  let bgColor = 'var(--soft-fill)';
                  if (cell === 'green') bgColor = 'var(--success)';
                  if (cell === 'amber') bgColor = 'var(--warning)';
                  if (cell === 'red') bgColor = 'var(--danger)';
                  
                  return (
                    <div key={rIdx} style={{ height: '28px', backgroundColor: bgColor, borderRadius: '6px', marginBottom: '6px', width: '100%' }}></div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--success)' }}></div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Low Risk</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--warning)' }}></div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Moderate Risk</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--danger)' }}></div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>High Risk</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--soft-fill)' }}></div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No Data</span>
          </div>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)' }}>
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Top burnout drivers across team this week</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'Poor sleep quality', pct: 78, color: 'var(--danger)' },
            { label: 'High work hours', pct: 65, color: 'var(--warning)' },
            { label: 'Sprint pressure', pct: 54, color: 'var(--warning)' },
            { label: 'Low exercise', pct: 48, color: 'var(--primary)' },
            { label: 'Meeting overload', pct: 35, color: 'var(--primary)' },
          ].map((bar, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '130px', fontSize: '12px', color: 'var(--text-secondary)' }}>{bar.label}</div>
              <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--soft-fill)', borderRadius: '4px', margin: '0 12px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${bar.pct}%`, backgroundColor: bar.color, borderRadius: '4px' }}></div>
              </div>
              <div style={{ width: '32px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>{bar.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
};

export default TeamDashboard;
