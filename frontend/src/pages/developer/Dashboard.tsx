  /**
 * Developer Dashboard (pages/developer/Dashboard.tsx)
 * 
 * The main homepage for Developer-role users.
 * 
 * DATA FLOW:
 * 1. Fetches the latest burnout prediction from /api/predictions/latest
 *    — This includes the riskScore, riskLevel, and SHAP explanations
 * 2. Fetches the check-in streak from /api/checkins/streak
 *    — Shows how many consecutive days the user has checked in
 * 
 * WHY server-driven data here (not mocked):
 * For a research publication, all displayed data must be traceable back to
 * real user inputs. Using live database-backed data ensures reproducibility
 * and validates that our ML pipeline is functioning end-to-end.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { Loader2, AlertTriangle, TrendingUp } from 'lucide-react';
import { usePrediction } from '../../hooks/usePrediction';
import { useCheckin } from '../../hooks/useCheckin';

/** Maps backend RiskLevel enum values to display colours */
const RISK_COLORS: Record<string, string> = {
  Low: '#10B981',       // green
  Moderate: '#F59E0B',  // amber
  High: '#EF4444',      // red
  Critical: '#7C2D12',  // dark red
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { prediction, isLoading: predLoading, isError: predError, isEmpty } = usePrediction();
  const { streak } = useCheckin();
  const riskColor = prediction ? RISK_COLORS[prediction.riskLevel] ?? '#6B7280' : '#6B7280';
  const riskScore = prediction?.riskScore ?? 0;

  // ── Get top 3 SHAP features that are increasing risk ─────────────
  // SHAP values are sorted by magnitude; we filter to show only risk-increasing ones
  const topRiskFactors = prediction?.shapExplanations
    ?.filter((s: any) => s.direction === 'IncreasesRisk')
    ?.sort((a: any, b: any) => b.shapValue - a.shapValue)
    ?.slice(0, 3) ?? [];

  // Greeting based on time of day — a small but impactful UX detail
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <PageWrapper>
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 600, marginBottom: '6px' }}>
            {getGreeting()}, {user?.fullName?.split(' ')[0] ?? 'there'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
            {streak > 0 && ` · 🔥 ${streak}-day streak`}
          </p>
        </div>
        {/* Clicking this navigates to the Check-In form */}
        <Button variant="primary" onClick={() => navigate('/developer/check-in')}>
          + Daily Check-in
        </Button>
      </div>

      {/* ── Hero Risk Card ────────────────────────────────────────────── */}
      <Card
        className="hero-card"
        style={{
          background: 'linear-gradient(135deg, #0F1117 0%, #1E2236 100%)',
          padding: '32px 40px',
          marginBottom: '28px',
          color: 'white',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: '16px',
        }}
      >
        {predLoading ? (
          // Show a spinner while data is loading
          <div className="flex items-center gap-3 text-white/70">
            <Loader2 className="animate-spin" size={20} />
            <span>Loading your latest prediction...</span>
          </div>
        ) : predError || isEmpty ? (
          // Friendly message when no prediction exists yet
          <div className="flex flex-col gap-2">
            <span className="text-xs text-white/50 uppercase tracking-wider">Burnout Risk</span>
            <p className="text-white/70 text-sm">
              No check-ins yet. Submit your first check-in to see your burnout risk.
            </p>
            <button
              className="text-xs bg-white/10 text-white/80 px-4 py-1.5 rounded-full w-fit hover:bg-white/20 transition-colors mt-1"
              onClick={() => navigate('/developer/check-in')}
            >
              Start Check-in →
            </button>
          </div>
        ) : (
          // Real prediction data from the backend
          <>
            <div>
              <span className="text-xs text-white/50 uppercase tracking-wider">
                Current Burnout Risk
              </span>
              <h2 className="text-4xl font-bold mt-2" style={{ color: riskColor }}>
                {prediction.riskLevel}
              </h2>
              <p className="text-sm text-white/60 mt-1 mb-4">
                {prediction.trendDirection === 'Improving'
                  ? '↓ Improving from last prediction'
                  : prediction.trendDirection === 'Worsening'
                  ? '↑ Slightly elevated from last prediction'
                  : '→ Stable compared to last prediction'}
                &nbsp;·&nbsp;
                {prediction.shapExplanations?.length ?? 0} key factors identified
              </p>
              <button
                className="text-xs bg-white/10 text-white/80 px-4 py-1.5 rounded-full hover:bg-white/20 transition-colors"
                onClick={() => navigate('/developer/explanation')}
              >
                View explanation →
              </button>
            </div>

            {/* Risk Score Donut ─────────────────────────────────────── */}
            <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
              <svg width="96" height="96" viewBox="0 0 96 96">
                {/* Background track */}
                <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
                {/* Progress arc — strokeDashoffset controls the fill percentage */}
                <circle
                  cx="48" cy="48" r="40"
                  fill="none"
                  stroke={riskColor}
                  strokeWidth="7"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - riskScore)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 48 48)"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-lg font-bold" style={{ color: riskColor }}>
                  {(riskScore * 100).toFixed(0)}%
                </span>
                <span className="text-xs text-white/40">risk</span>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* ── Metric Chips ──────────────────────────────────────────────── */}
      {prediction && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
          <div style={{ padding: '16px 14px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', backgroundColor: 'var(--bg)' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {prediction.shapExplanations?.filter((s: any) => s.direction === 'IncreasesRisk').length ?? 0}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Risk factors</div>
          </div>
          <div style={{ padding: '16px 14px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', backgroundColor: 'var(--bg)' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--success)', marginBottom: '4px' }}>
              {prediction.shapExplanations?.filter((s: any) => s.direction === 'DecreasesRisk').length ?? 0}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Protective factors</div>
          </div>
          <div style={{ padding: '16px 14px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', backgroundColor: 'var(--bg)' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>
              {streak}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Day streak</div>
          </div>
          <div style={{ padding: '16px 14px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', backgroundColor: 'var(--bg)' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>
              {(prediction.riskScore * 100).toFixed(0)}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Risk score</div>
          </div>
        </div>
      )}

      {/* ── Top Risk Factors (from SHAP) ──────────────────────────────── */}
      {topRiskFactors.length > 0 && (
        <Card style={{ marginBottom: '20px', padding: '20px' }}>
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 600 }}>
            <AlertTriangle size={15} className="text-amber-500" />
            Top risk factors this week
          </h3>
          <div className="flex flex-col gap-3">
            {topRiskFactors.map((factor: any, i: number) => (
              <div
                key={factor.shapId ?? i}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  {/* Coloured dot indicates severity */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: factor.shapValue > 0.15 ? '#EF4444' : '#F59E0B',
                    }}
                  />
                  <span className="text-sm text-gray-600">{factor.plainLanguageText}</span>
                </div>
                <Badge variant={factor.shapValue > 0.15 ? 'danger' : 'warning'}>
                  +{factor.shapValue.toFixed(2)} SHAP
                </Badge>
              </div>
            ))}
          </div>
          <button
            className="mt-3 text-xs text-primary font-medium flex items-center gap-1 hover:underline"
            onClick={() => navigate('/developer/explanation')}
          >
            <TrendingUp size={12} /> See full SHAP waterfall chart
          </button>
        </Card>
      )}
    </PageWrapper>
  );
};

export default Dashboard;
