import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';

const DepartmentOverview: React.FC = () => {
  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Organisation Burnout Overview</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>April 2026 · All data anonymised and aggregated · Minimum 5 members per group shown</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { num: '23%', label: 'High Risk Rate', color: 'var(--danger)' },
          { num: '41%', label: 'Moderate Risk Rate', color: 'var(--warning)' },
          { num: '36%', label: 'Low Risk Rate', color: 'var(--success)' },
          { num: '8.7', label: 'Avg Stress Score', color: 'var(--text-muted)' },
        ].map((chip, idx) => (
          <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px 16px', textAlign: 'center', backgroundColor: 'var(--background)' }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: chip.color, marginBottom: '4px', lineHeight: 1 }}>{chip.num}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{chip.label}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Risk by department</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { dept: 'Engineering', green: 30, amber: 45, red: 25 },
            { dept: 'QA', green: 50, amber: 35, red: 15 },
            { dept: 'DevOps', green: 25, amber: 40, red: 35 },
            { dept: 'Product', green: 55, amber: 35, red: 10 },
            { dept: 'Support', green: 45, amber: 40, red: 15 },
          ].map((row, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100px', fontSize: '13px', color: 'var(--text-secondary)' }}>{row.dept}</div>
              <div style={{ flex: 1, display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${row.green}%`, backgroundColor: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white', fontWeight: 600 }}>{row.green > 10 ? `${row.green}%` : ''}</div>
                <div style={{ width: `${row.amber}%`, backgroundColor: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white', fontWeight: 600 }}>{row.amber > 10 ? `${row.amber}%` : ''}</div>
                <div style={{ width: `${row.red}%`, backgroundColor: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white', fontWeight: 600 }}>{row.red > 10 ? `${row.red}%` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)' }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Departments needing attention</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { name: 'DevOps', highRisk: '35%', desc: 'High on-call frequency and overtime' },
              { name: 'Engineering', highRisk: '25%', desc: 'Sprint pressure and requirement changes' },
              { name: 'QA', highRisk: '15%', desc: 'Deadline pressure and meeting overload' },
            ].map((dept, idx) => (
              <div key={idx} style={{ display: 'flex', paddingLeft: '12px', borderLeft: '3px solid var(--danger)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{dept.name}</span>
                    <span style={{ fontSize: '11px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '2px 8px', borderRadius: '10px', fontWeight: 500 }}>{dept.highRisk} high risk</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{dept.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)' }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Organisation-wide top risk factors</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Overtime frequency', pct: 71, color: 'var(--danger)' },
              { label: 'Poor sleep', pct: 65, color: 'var(--danger)' },
              { label: 'Sprint pressure', pct: 58, color: 'var(--warning)' },
              { label: 'Low exercise', pct: 51, color: 'var(--warning)' },
              { label: 'Meeting overload', pct: 44, color: 'var(--primary)' },
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
      </div>
    </PageWrapper>
  );
};

export default DepartmentOverview;
