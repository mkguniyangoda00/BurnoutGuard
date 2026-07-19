import React, { useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loader2, HelpCircle } from 'lucide-react';
import { predictionService } from '../../services/prediction.service';

const WhatIfSimulator: React.FC = () => {
  const [sleep, setSleep] = useState(6);
  const [hours, setHours] = useState(9);
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
        const result = await predictionService.whatIf({
          sleepHours: sleep,
          workHours: hours,
        });

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
  }, [sleep, hours]);

  const calculatedRisk = riskScore !== null ? riskScore.toFixed(2) : '0.00';
  const displayRiskScore = riskScore ?? 0;
  const displayRiskLevel = riskLevel ?? 'Unknown';

  return (
    <PageWrapper>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>What-If Simulator</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Adjust factors to see how they impact your predicted burnout risk</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <Card>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Adjust Variables</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              <span>Average Sleep (hours)</span>
              <span>{sleep} hrs</span>
            </label>
            <input 
              type="range" min="4" max="10" step="0.5" 
              value={sleep} onChange={(e) => setSleep(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              <span>Daily Work Hours</span>
              <span>{hours} hrs</span>
            </label>
            <input 
              type="range" min="4" max="14" step="0.5" 
              value={hours} onChange={(e) => setHours(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="animate-spin text-primary" size={40} />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Calculating your what-if result...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <HelpCircle size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Unable to load what-if results right now.</span>
            </div>
          ) : (
            <>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Predicted Risk Score</span>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: displayRiskScore > 0.6 ? 'var(--danger)' : 'var(--success)' }}>
                {calculatedRisk}
              </div>
              <div style={{ marginTop: '12px' }}>
                <Badge variant={displayRiskScore > 0.6 ? 'danger' : 'success'}>
                  {displayRiskScore > 0.6 ? displayRiskLevel || 'High Risk' : displayRiskLevel || 'Low Risk'}
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
