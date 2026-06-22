import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';

const FairnessReport: React.FC = () => {
  return (
    <PageWrapper>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>Fairness and Bias Report</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Evaluating model behaviour across demographic groups · Model v1.1 Active</p>
      </div>

      <div style={{ backgroundColor: 'var(--primary-light)', border: '1px solid #C7D5FA', borderRadius: '14px', padding: '14px 18px', marginBottom: '24px', color: 'var(--primary)', fontSize: '13px' }}>
        ℹ Fairness is measured as the difference in predicted high-risk rates between groups. A gap above 5% warrants investigation.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Gender', metric: '2.3%', color: 'var(--success)', status: 'Within threshold' },
          { label: 'Experience Level', metric: '4.8%', color: 'var(--warning)', status: 'Approaching threshold' },
          { label: 'Work Mode', metric: '6.7%', color: 'var(--danger)', status: 'Above threshold' },
          { label: 'Job Role', metric: '3.1%', color: 'var(--success)', status: 'Within threshold' },
        ].map((card, idx) => (
          <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 18px', backgroundColor: 'var(--background)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>{card.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 600, color: card.color, marginBottom: '4px', lineHeight: 1 }}>{card.metric}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Prediction gap</div>
            <div style={{ fontSize: '12px', color: card.color }}>{card.status}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Fairness metrics detail</h2>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ borderBottom: '1px solid var(--border-color)' }}>
            <tr>
              {['Group', 'Sub-group A', 'Sub-group B', 'Predicted High Risk A', 'Predicted High Risk B', 'Gap', 'Status'].map(th => (
                <th key={th} style={{ padding: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{th}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { group: 'Gender', a: 'Male', b: 'Female', valA: '22.4%', valB: '20.1%', gap: '2.3%', status: 'Fair', color: 'var(--success)' },
              { group: 'Experience', a: 'Junior', b: 'Senior', valA: '31.2%', valB: '26.4%', gap: '4.8%', status: 'Monitor', color: 'var(--warning)' },
              { group: 'Work Mode', a: 'Remote', b: 'Onsite', valA: '29.8%', valB: '23.1%', gap: '6.7%', status: 'Investigate', color: 'var(--danger)' },
              { group: 'Job Role', a: 'Dev', b: 'QA', valA: '24.6%', valB: '21.5%', gap: '3.1%', status: 'Fair', color: 'var(--success)' },
            ].map((row, idx) => (
              <tr key={idx} style={{ height: '48px', borderBottom: idx === 3 ? 'none' : '1px solid var(--border-color)' }}>
                <td style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{row.group}</td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{row.a}</td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{row.b}</td>
                <td style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{row.valA}</td>
                <td style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{row.valB}</td>
                <td style={{ fontSize: '12px', fontWeight: 600, color: row.color }}>{row.gap}</td>
                <td style={{ fontSize: '12px', color: row.color }}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ backgroundColor: '#FFF9F9', border: '1px solid var(--danger-light)', borderRadius: '14px', padding: '16px 18px', color: 'var(--text-secondary)', fontSize: '13px' }}>
        ⚠ Recommendation: The Work Mode group shows a prediction gap above the 5% threshold. Consider collecting additional features related to remote work environment quality to reduce this disparity.
      </div>
    </PageWrapper>
  );
};

export default FairnessReport;
