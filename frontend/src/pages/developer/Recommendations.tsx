import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { CheckCircle, Circle, Loader2, HelpCircle, HeartHandshake } from 'lucide-react';
import { recommendationService } from '../../services/recommendation.service';
import { usePrediction } from '../../hooks/usePrediction';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_ICONS: Record<string, { icon: string; bg: string }> = {
  Sleep: { icon: '🌙', bg: 'var(--danger-light)' },
  WorkBoundary: { icon: '🕒', bg: 'var(--warning-light)' },
  Exercise: { icon: '🏃', bg: 'var(--success-light)' },
  ScreenTime: { icon: '📵', bg: 'var(--primary-light)' },
  Social: { icon: '🤝', bg: 'var(--purple-light)' },
  Workload: { icon: '📋', bg: 'var(--warning-light)' },
};

const PRIORITY_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: 'High priority', color: 'var(--danger)', bg: 'var(--danger-light)' },
  medium: { label: 'Medium priority', color: 'var(--warning)', bg: 'var(--warning-light)' },
  low: { label: 'Low priority', color: 'var(--success)', bg: 'var(--success-light)' },
};

const getPriorityBand = (priority: number, isRecoveryDay: boolean) => {
  if (isRecoveryDay) return PRIORITY_STYLE.high;
  if (priority <= 1) return PRIORITY_STYLE.high;
  if (priority === 2) return PRIORITY_STYLE.medium;
  return PRIORITY_STYLE.low;
};

const RecCard: React.FC<{
  rec: any;
  dayLabel?: string;
  onToggleComplete: (rec: any) => void;
  isPending: boolean;
}> = ({ rec, dayLabel, onToggleComplete, isPending }) => {
  const iconMeta = CATEGORY_ICONS[rec.category] ?? { icon: '💡', bg: 'var(--soft-fill)' };
  const priorityMeta = getPriorityBand(rec.priority, !!dayLabel);

  return (
    <Card
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '18px',
        cursor: 'pointer',
        transition: 'background-color 0.2s, border-color 0.2s',
        borderColor: rec.isCompleted ? 'var(--success)' : 'var(--border)',
        opacity: rec.isCompleted ? 0.7 : 1,
      }}
      className="rec-card"
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: iconMeta.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '20px',
          }}
        >
          {iconMeta.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <div>
              {dayLabel && (
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                  {dayLabel}
                </div>
              )}
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>{rec.title}</h3>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(rec);
              }}
              style={{ padding: '0', marginTop: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none' }}
            >
              {rec.isCompleted ? (
                <CheckCircle color="var(--success)" size={18} />
              ) : (
                <Circle style={{ opacity: 0.3 }} size={18} />
              )}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '10px' }}>{rec.description}</p>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '4px 10px',
              borderRadius: '12px',
              backgroundColor: priorityMeta.bg,
              color: priorityMeta.color,
            }}
          >
            {priorityMeta.label}
          </span>
        </div>
      </div>
    </Card>
  );
};

const Recommendations: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { prediction, isLoading: predLoading } = usePrediction();

  const predictionId = prediction?.predictionId;

  const { data: rawRecs, isLoading, isError } = useQuery({
    queryKey: ['recommendations', 'byPrediction', predictionId, user?.userId],
    queryFn: () => recommendationService.getByPrediction(predictionId!),
    enabled: !!predictionId,
  });

  const completeMutation = useMutation({
    mutationFn: (recId: string) => recommendationService.complete(recId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });

  const recommendations = Array.isArray(rawRecs) ? rawRecs : [];
  const isRecoveryPlan =
    (prediction?.riskLevel === 'High' || prediction?.riskLevel === 'Critical') &&
    recommendations.length >= 4;

  const handleToggle = (rec: any) => {
    if (rec.isCompleted) return; // no "un-complete" action for now — keep it simple
    completeMutation.mutate(rec.recId);
  };

  if (predLoading || isLoading) {
    return (
      <PageWrapper>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      </PageWrapper>
    );
  }

  if (!predictionId) {
    return (
      <PageWrapper>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <HelpCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>No Recommendations Yet</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
            Submit a check-in to generate your first burnout risk prediction and personalized recommendations.
          </p>
        </div>
      </PageWrapper>
    );
  }

  if (isError) {
    return (
      <PageWrapper>
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--danger)' }}>
          Failed to load recommendations. Please try again.
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 600, marginBottom: '6px' }}>
            {isRecoveryPlan ? 'Your 7-Day Recovery Plan' : 'Your Action Plan'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {isRecoveryPlan
              ? 'Your risk level is elevated — follow this sequenced plan, one focus area per day.'
              : `${recommendations.length} personalized recommendation${recommendations.length === 1 ? '' : 's'} based on your SHAP analysis`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/developer/wellness-resources')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid var(--primary)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <HeartHandshake size={16} />
          Counseling & Wellness Resources
        </button>
      </div>

      {recommendations.length === 0 ? (
        <Card style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            No active recommendations right now — your recent check-ins look stable. Keep it up!
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {recommendations.map((rec: any, idx: number) => (
            <RecCard
              key={rec.recId}
              rec={rec}
              dayLabel={isRecoveryPlan ? `Day ${idx + 1}` : undefined}
              onToggleComplete={handleToggle}
              isPending={completeMutation.isPending}
            />
          ))}
        </div>
      )}

      <style>{`
        .rec-card:hover {
          background-color: var(--surface) !important;
        }
      `}</style>
    </PageWrapper>
  );
};

export default Recommendations;