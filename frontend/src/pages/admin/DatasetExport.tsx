import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';

const DatasetExport: React.FC = () => {
  return (
    <PageWrapper>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Dataset Export</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Export anonymised research data for analysis · All exports are logged in the audit trail</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', backgroundColor: 'var(--background)' }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Export configuration</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Date range</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value="01 Jan 2026" readOnly style={{ flex: 1, padding: '9px 12px 13px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px' }} />
                <input type="text" value="30 Apr 2026" readOnly style={{ flex: 1, padding: '9px 12px 13px', backgroundColor: 'var(--soft-fill)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px' }} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Include features</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['Sleep data', 'Work hours', 'Stress levels', 'Burnout predictions', 'SHAP values'].map(item => (
                  <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
                    <input type="checkbox" defaultChecked /> {item}
                  </label>
                ))}
                {['Journal entries', 'Personal notes', 'IP addresses'].map(item => (
                  <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
                    <input type="checkbox" /> {item}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Export format</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ flex: 1, backgroundColor: 'var(--primary)', color: 'white', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', border: 'none' }}>CSV</button>
                <button style={{ flex: 1, backgroundColor: 'var(--soft-fill)', color: 'var(--text-muted)', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', border: 'none' }}>JSON</button>
                <button style={{ flex: 1, backgroundColor: 'var(--soft-fill)', color: 'var(--text-muted)', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', border: 'none' }}>Excel</button>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Anonymisation level</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ flex: 1, backgroundColor: 'var(--primary)', color: 'white', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', border: 'none' }}>Full anonymisation</button>
                <button style={{ flex: 1, backgroundColor: 'var(--soft-fill)', color: 'var(--text-muted)', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', border: 'none' }}>Pseudonymised</button>
              </div>
            </div>

            <button style={{ width: '100%', backgroundColor: 'var(--primary)', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', marginTop: '8px' }}>
              Export Dataset
            </button>
          </div>
        </div>

        <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', backgroundColor: 'var(--background)' }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Recent exports</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { name: 'Full dataset Apr 2026', date: '30 Apr 2026', format: 'CSV', formatClass: 'badge-success', rows: '1,842' },
              { name: 'SHAP values export', date: '15 Apr 2026', format: 'JSON', formatClass: 'badge-primary', rows: '1,580' },
              { name: 'Weekly reports Q1', date: '31 Mar 2026', format: 'Excel', formatClass: 'badge-warning', rows: '156' },
              { name: 'Predictions Mar 2026', date: '31 Mar 2026', format: 'CSV', formatClass: 'badge-success', rows: '1,420' },
              { name: 'Training dataset v1.2', date: '01 Apr 2026', format: 'CSV', formatClass: 'badge-success', rows: '1,580' },
            ].map((row, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: idx === 4 ? 'none' : '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{row.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{row.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`badge ${row.formatClass}`} style={{ fontSize: '11px' }}>{row.format}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '65px', textAlign: 'right' }}>{row.rows} rows</span>
                  <button style={{ color: 'var(--text-secondary)' }}>⬇️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 18px', color: 'var(--text-muted)', fontSize: '13px' }}>
        🔒 All exports are stripped of personally identifiable information. Participant consent is verified before each export. Export activity is recorded in the audit log.
      </div>
    </PageWrapper>
  );
};

export default DatasetExport;
