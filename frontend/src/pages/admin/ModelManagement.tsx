import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service';
import { useState } from 'react';

const ModelManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [retrainMessage, setRetrainMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [thresholdDrafts, setThresholdDrafts] = useState<Record<string, { value: string; description: string }>>({});

  const { data: models } = useQuery({
    queryKey: ['admin', 'models'],
    queryFn: adminService.getModels, // verify this already exists in admin.service.ts; add if missing:
    // getModels: async () => { const res = await client.get('/admin/models'); return res.data.metrics; }
  });

  const { data: thresholds } = useQuery({
    queryKey: ['admin', 'alert-thresholds'],
    queryFn: adminService.getAlertThresholds,
  });

  const globalFeatureImportance = Array.isArray(models?.[0]?.globalFeatureImportance)
    ? models[0].globalFeatureImportance
    : [];

  const retrainMutation = useMutation({
    mutationFn: adminService.retrainModel,
    onSuccess: (data) => {
      setRetrainMessage(
        data.success
          ? { type: 'success', text: 'Model retrained successfully. New version is now active.' }
          : { type: 'error', text: `Retrain failed: ${data.log?.slice(-500) || 'check backend logs'}` }
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'models'] });
    },
    onError: () => {
      setRetrainMessage({ type: 'error', text: 'Failed to trigger retrain. Is ml-service running?' });
    },
  });

  const thresholdUpdateMutation = useMutation({
    mutationFn: ({ thresholdKey, value, description }: { thresholdKey: string; value: string; description: string }) =>
      adminService.updateAlertThreshold(thresholdKey, {
        value: Number(value),
        description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'alert-thresholds'] });
    },
  });

  const thresholdRows = Array.isArray(thresholds) ? thresholds : [];
  return (
    <PageWrapper>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>ML Model Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Manage prediction models, compare performance, and trigger retraining</p>
        </div>
        <button
          onClick={() => { setRetrainMessage(null); retrainMutation.mutate(); }}
          disabled={retrainMutation.isPending}
          style={{ backgroundColor: 'var(--primary)', color: 'white', fontSize: '13px', fontWeight: 500, padding: '9px 16px', borderRadius: '8px', border: 'none', opacity: retrainMutation.isPending ? 0.6 : 1 }}
        >
          {retrainMutation.isPending ? 'Retraining… (may take a few minutes)' : 'Retrain Model'}
        </button>
        {retrainMessage && (
          <p style={{ fontSize: '12px', marginTop: '8px', color: retrainMessage.type === 'success' ? 'var(--success)' : 'var(--danger)' }}>
            {retrainMessage.text}
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(models?.length ?? 1, 1)}, 1fr)`, gap: '16px', marginBottom: '24px' }}>
        {(models ?? []).map((mod: any) => (
          <div
            key={mod.algorithm}
            style={{
              border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px',
              backgroundColor: 'var(--background)',
              borderLeft: mod.status === 'Active' ? '3px solid var(--success)' : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{mod.version}</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{mod.algorithm}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Trained: {new Date(mod.trainedAt).toLocaleDateString()}
                </div>
              </div>
              <span className={`badge ${mod.status === 'Active' ? 'badge-success' : 'badge-muted'}`} style={{ borderRadius: '20px', padding: '3px 10px' }}>
                {mod.status}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Accuracy</span><span style={{ fontSize: '13px', fontWeight: 600 }}>{mod.accuracy}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>F1 Score</span><span style={{ fontSize: '13px', fontWeight: 600 }}>{mod.f1Score}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AUC</span><span style={{ fontSize: '13px', fontWeight: 600 }}>{mod.auc}</span></div>
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

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)', marginTop: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>Global feature importance</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Mean absolute SHAP contribution across the training sample</p>
        {globalFeatureImportance.length > 0 ? (
          <div style={{ display: 'grid', gap: '10px' }}>
            {globalFeatureImportance.slice(0, 10).map((row: any, idx: number) => {
              const maxImportance = globalFeatureImportance[0]?.meanAbsShap || 1;
              const width = Math.max((row.meanAbsShap / maxImportance) * 100, 4);
              const featureLabel = row.featureName.replace(/([A-Z])/g, ' $1').trim();
              return (
                <div key={row.featureName} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 72px', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{idx + 1}. {featureLabel}</span>
                  <div style={{ height: '8px', borderRadius: '999px', backgroundColor: 'var(--soft-fill)', overflow: 'hidden' }}>
                    <div style={{ width: `${width}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '999px' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>{row.meanAbsShap.toFixed(4)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No global SHAP summary is available for the current model yet.</p>
        )}
      </div>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', backgroundColor: 'var(--background)', marginTop: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>Alert threshold settings</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Edit the stored thresholds that drive alerts and prediction trend detection.</p>
        <div style={{ display: 'grid', gap: '14px' }}>
          {thresholdRows.map((threshold: any) => {
            const draft = thresholdDrafts[threshold.thresholdKey] ?? {
              value: String(threshold.value),
              description: threshold.description,
            };

            return (
              <div key={threshold.thresholdKey} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', display: 'grid', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{threshold.thresholdKey}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{threshold.description}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={draft.value}
                    onChange={(e) => setThresholdDrafts((current) => ({
                      ...current,
                      [threshold.thresholdKey]: { ...draft, value: e.target.value },
                    }))}
                    style={{ padding: '9px 10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                  <input
                    type="text"
                    value={draft.description}
                    onChange={(e) => setThresholdDrafts((current) => ({
                      ...current,
                      [threshold.thresholdKey]: { ...draft, description: e.target.value },
                    }))}
                    style={{ padding: '9px 10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                  <button
                    type="button"
                    onClick={() => thresholdUpdateMutation.mutate({ thresholdKey: threshold.thresholdKey, value: draft.value, description: draft.description })}
                    style={{ padding: '9px 14px', borderRadius: '8px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontSize: '13px', fontWeight: 500 }}
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageWrapper>
  );
};

export default ModelManagement;
