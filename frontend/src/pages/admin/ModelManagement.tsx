import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';

const ModelManagement: React.FC = () => {
  return (
    <PageWrapper>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>ML Model Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Manage prediction models, compare performance, and trigger retraining</p>
        </div>
        <button style={{ backgroundColor: 'var(--primary)', color: 'white', fontSize: '13px', fontWeight: 500, padding: '9px 16px', borderRadius: '8px', border: 'none' }}>
          Retrain Model
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {[
          { v: 'v1.0', name: 'XGBoost Classifier', date: '01 Mar 2026', status: 'Retired', statusClass: 'badge-muted', acc: '87.3%', f1: '0.851', auc: '0.912', size: '1,240', border: 'none' },
          { v: 'v1.1', name: 'XGBoost Classifier', date: '20 Mar 2026', status: 'Active', statusClass: 'badge-success', acc: '89.7%', f1: '0.873', auc: '0.934', size: '1,580', border: '3px solid var(--success)' },
          { v: 'v1.2', name: 'LightGBM Classifier', date: '01 Apr 2026', status: 'Testing', statusClass: 'badge-warning', acc: '88.1%', f1: '0.862', auc: '0.921', size: '1,580', border: 'none' },
        ].map((mod, idx) => (
          <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', backgroundColor: 'var(--background)', borderLeft: mod.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{mod.v}</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{mod.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Trained: {mod.date}</div>
              </div>
              <span className={`badge ${mod.statusClass}`} style={{ borderRadius: '20px', padding: '3px 10px' }}>{mod.status}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Accuracy</span><span style={{ fontSize: '13px', fontWeight: 600 }}>{mod.acc}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>F1 Score</span><span style={{ fontSize: '13px', fontWeight: 600 }}>{mod.f1}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AUC</span><span style={{ fontSize: '13px', fontWeight: 600 }}>{mod.auc}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Training size</span><span style={{ fontSize: '13px', fontWeight: 600 }}>{mod.size} samples</span></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)' }}>
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Model performance comparison</h2>
        
        <div style={{ position: 'relative', height: '200px', width: '100%', marginBottom: '20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around' }}>
          {/* Y-axis 0.80 to 1.00 (visual representation only) */}
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', zIndex: 0 }}>
            <div style={{ height: '25%', borderTop: '1px solid var(--border-color)' }}></div>
            <div style={{ height: '25%', borderTop: '1px solid var(--border-color)' }}></div>
            <div style={{ height: '25%', borderTop: '1px solid var(--border-color)' }}></div>
            <div style={{ height: '25%', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}></div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', zIndex: 1, alignItems: 'flex-end', height: '100%', paddingBottom: '1px' }}>
            <div style={{ width: '24px', height: '36%', backgroundColor: 'var(--text-muted)', borderRadius: '4px 4px 0 0' }}></div>
            <div style={{ width: '24px', height: '48%', backgroundColor: 'var(--success)', borderRadius: '4px 4px 0 0' }}></div>
            <div style={{ width: '24px', height: '40%', backgroundColor: 'var(--warning)', borderRadius: '4px 4px 0 0' }}></div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', zIndex: 1, alignItems: 'flex-end', height: '100%', paddingBottom: '1px' }}>
            <div style={{ width: '24px', height: '25%', backgroundColor: 'var(--text-muted)', borderRadius: '4px 4px 0 0' }}></div>
            <div style={{ width: '24px', height: '36%', backgroundColor: 'var(--success)', borderRadius: '4px 4px 0 0' }}></div>
            <div style={{ width: '24px', height: '31%', backgroundColor: 'var(--warning)', borderRadius: '4px 4px 0 0' }}></div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', zIndex: 1, alignItems: 'flex-end', height: '100%', paddingBottom: '1px' }}>
            <div style={{ width: '24px', height: '56%', backgroundColor: 'var(--text-muted)', borderRadius: '4px 4px 0 0' }}></div>
            <div style={{ width: '24px', height: '67%', backgroundColor: 'var(--success)', borderRadius: '4px 4px 0 0' }}></div>
            <div style={{ width: '24px', height: '60%', backgroundColor: 'var(--warning)', borderRadius: '4px 4px 0 0' }}></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>Accuracy</span>
          <span>F1 Score</span>
          <span>AUC</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--text-muted)' }}></div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>v1.0</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--success)' }}></div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>v1.1</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--warning)' }}></div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>v1.2</span>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ModelManagement;
