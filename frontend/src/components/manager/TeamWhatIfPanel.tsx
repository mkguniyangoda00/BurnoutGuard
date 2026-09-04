import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Loader2 } from 'lucide-react';
import { analyticsService } from '../../services/analytics.service';

type RiskCounts = {
  Low: number;
  Moderate: number;
  High: number;
  Critical: number;
};

const defaultCounts = { Low: 0, Moderate: 0, High: 0, Critical: 0 };

const TeamWhatIfPanel: React.FC = () => {
  const [overtimeHours, setOvertimeHours] = useState(-2);
  const [meetingsCount, setMeetingsCount] = useState(-3);
  const [sprintPressureRating, setSprintPressureRating] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    teamSize: number;
    before: RiskCounts;
    after: RiskCounts;
  } | null>(null);

  const simulate = async () => {
    setIsLoading(true);
    try {
      const res = await analyticsService.teamWhatIf({
        overtimeHours,
        meetingsCount,
        sprintPressureRating,
      });
      setResult(res);
    } finally {
      setIsLoading(false);
    }
  };

  const teamSize = result?.teamSize ?? 0;
  const before = result?.before ?? defaultCounts;
  const after = result?.after ?? defaultCounts;
  const totalBefore = Object.values(before).reduce((a, b) => a + b, 0) || 1;
  const totalAfter = Object.values(after).reduce((a, b) => a + b, 0) || 1;

  const stackSegments = (counts: RiskCounts, total: number) => [
    { label: 'Low', value: counts.Low, color: 'var(--success)' },
    { label: 'Moderate', value: counts.Moderate, color: 'var(--warning)' },
    { label: 'High', value: counts.High, color: '#EA580C' },
    { label: 'Critical', value: counts.Critical, color: 'var(--danger)' },
  ].map((segment) => ({
    ...segment,
    width: `${Math.max((segment.value / total) * 100, segment.value > 0 ? 4 : 0)}%`,
  }));

  const renderStack = (counts: RiskCounts, total: number, label: string) => (
    <div style={{ display: 'grid', gap: '8px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ display: 'flex', height: '18px', overflow: 'hidden', borderRadius: '999px', backgroundColor: 'var(--soft-fill)' }}>
        {stackSegments(counts, total).map((segment) => (
          <div
            key={segment.label}
            style={{ width: segment.width, backgroundColor: segment.color }}
            title={`${segment.label}: ${segment.value}`}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '11px', color: 'var(--text-muted)' }}>
        {(['Low', 'Moderate', 'High', 'Critical'] as const).map((key) => (
          <span key={key}>{key}: {counts[key]}</span>
        ))}
      </div>
    </div>
  );

  return (
    <Card style={{ padding: '20px', marginBottom: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Team What-If Simulation
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Simulation only, not a guarantee. This applies a proposed change to the team&apos;s current feature vectors and estimates the distribution shift.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', marginBottom: '16px' }}>
        {[
          { label: 'Overtime hours', value: overtimeHours, min: -4, max: 4, step: 0.5, setValue: setOvertimeHours },
          { label: 'Meetings count', value: meetingsCount, min: -8, max: 4, step: 1, setValue: setMeetingsCount },
          { label: 'Sprint pressure', value: sprintPressureRating, min: -2, max: 2, step: 1, setValue: setSprintPressureRating },
        ].map((control) => (
          <div key={control.label}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <span>{control.label}</span>
              <span>{control.value > 0 ? `+${control.value}` : control.value}</span>
            </label>
            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={control.value}
              onChange={(e) => control.setValue(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
        <button
          onClick={simulate}
          disabled={isLoading}
          style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 600 }}
        >
          {isLoading ? 'Simulating...' : 'Simulate'}
        </button>
        <Badge variant="muted">Simulation only</Badge>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
        The panel updates team-level counts only. Individual outcomes may vary.
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={18} />
          <span style={{ fontSize: '13px' }}>Running team simulation...</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {renderStack(before, totalBefore, `Before (${teamSize} developers)`)}
            {renderStack(after, totalAfter, `After (${teamSize} developers)`)}
          </div>

          {result && (
            <div />
          )}
        </div>
      )}
    </Card>
  );
};

export default TeamWhatIfPanel;
