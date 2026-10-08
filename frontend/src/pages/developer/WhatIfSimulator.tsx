import React, { useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loader2, HelpCircle } from 'lucide-react';
import { predictionService } from '../../services/prediction.service';
import { useTranslation } from 'react-i18next';

// Same actionable factors (and bounds) the backend's counterfactual search
// treats as mutable — see PredictionService.MUTABLE_FEATURES. Sleep/work
// hours alone can't move the prediction when the other ~24 model inputs
// (stress, breaks, overtime, etc.) are left at a user's real, unhealthy
// values, so the simulator exposes this wider set.
const SLIDERS: Array<{
  key: string;
  labelKey: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
}> = [
  { key: 'sleepHours', labelKey: 'whatIf.sleepHours', unit: 'hrs', min: 4, max: 9, step: 0.5, default: 6 },
  { key: 'workHours', labelKey: 'whatIf.workHours', unit: 'hrs', min: 6, max: 12, step: 0.5, default: 9 },
  { key: 'stressLevel', labelKey: 'whatIf.stressLevel', unit: '/10', min: 1, max: 10, step: 1, default: 6 },
  { key: 'sleepQuality', labelKey: 'whatIf.sleepQuality', unit: '/5', min: 1, max: 5, step: 1, default: 3 },
  { key: 'overtimeHours', labelKey: 'whatIf.overtimeHours', unit: 'hrs/wk', min: 0, max: 8, step: 1, default: 2 },
  { key: 'breaksTaken', labelKey: 'whatIf.breaksTaken', unit: '/day', min: 0, max: 8, step: 1, default: 3 },
];

const WhatIfSimulator: React.FC = () => {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(SLIDERS.map((s) => [s.key, s.default]))
  );
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [riskLevel, setRiskLevel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setIsError(false);

      try {
        const result = await predictionService.whatIf(values);

        if (cancelled) return;

        setRiskScore(result.riskScore);
        setRiskLevel(result.riskLevel);
      } catch {
        if (cancelled) return;

        setIsError(true);
        setRiskScore(null);
        setRiskLevel(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  // riskScore is the model's confidence in whichever risk level it predicted,
  // not a severity score — a confident "Low" prediction has a high riskScore
  // too. Color/badge must come from riskLevel, never from riskScore directly.
  const calculatedRisk = riskScore !== null ? `${Math.round(riskScore * 100)}%` : '—';
  const displayRiskLevel = riskLevel ?? 'Unknown';
  const isElevatedRisk = displayRiskLevel === 'High' || displayRiskLevel === 'Critical';

  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>{t('whatIf.title')}</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('whatIf.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <Card>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{t('whatIf.adjustVariables')}</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            {t('whatIf.adjustVariablesNote')}
          </p>

          {SLIDERS.map((s) => (
            <div key={s.key} style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                <span>{t(s.labelKey)}</span>
                <span>{values[s.key]} {s.unit}</span>
              </label>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={values[s.key]}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [s.key]: parseFloat(e.target.value) }))
                }
                style={{ width: '100%' }}
              />
            </div>
          ))}
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="animate-spin text-primary" size={40} />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('whatIf.calculating')}</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <HelpCircle size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('whatIf.errorMessage')}</span>
            </div>
          ) : (
            <>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('whatIf.predictedRisk')}</span>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: isElevatedRisk ? 'var(--danger)' : 'var(--success)' }}>
                {displayRiskLevel}
              </div>
              <div style={{ marginTop: '12px' }}>
                <Badge variant={isElevatedRisk ? 'danger' : 'success'}>
                  {calculatedRisk} {t('whatIf.modelConfidence')}
                </Badge>
              </div>
            </>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
};

export default WhatIfSimulator;
